const TelegramBot = require('node-telegram-bot-api');
const { MongoClient } = require('mongodb');
const fs = require('fs');
const http = require('http');

// ⚙️ Configuration
const token = '8075874480:AAFymYS-clEN1hfdcrV7e0ZfvX9MyQOJngY';
const mongoUri = 'mongodb+srv://josh:JcipLjQSbhxbruLU@cluster0.hn4lm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const channelId = '-1002237370463';
const dbName = 'telegramBotDB';
const collectionName = 'userF';
const adminId = 1613186921;

// 🏗 Initialisation
const bot = new TelegramBot(token, { polling: true });
const client = new MongoClient(mongoUri);

// 🔗 Connexion MongoDB
async function connectDB() {
    try {
        await client.connect();
        console.log('✅ Connecté à MongoDB');
        return client.db(dbName);
    } catch (error) {
        console.error('❌ Erreur MongoDB:', error);
        process.exit(1);
    }
}

// 📩 Fonction d'envoi de message
async function sendWelcomeMessage(userId, userName) {
    try {
        const message = `*${userName}*, 🚀 *Votre accès est presque validé !*`;
        await bot.sendMessage(userId, message, { parse_mode: 'Markdown' });
        console.log(`✅ Message envoyé à ${userName} (ID: ${userId})`);
    } catch (error) {
        console.error(`❌ Erreur avec ${userName}:`, error.message);
    }
}

// 🚀 Lancement du bot
(async () => {
    const db = await connectDB();

    bot.on('chat_join_request', async (msg) => {
        const chatId = msg.chat.id.toString();
        const userId = msg.from.id;
        const userName = msg.from.first_name || msg.from.username || 'Utilisateur inconnu';

        if (chatId === channelId) {
            try {
                const existingUser = await db.collection(collectionName).findOne({ user_id: userId });
                if (!existingUser) {
                    await db.collection(collectionName).insertOne({
                        user_id: userId,
                        chat_id: chatId,
                        username: userName,
                        timestamp: new Date(),
                        status: 'pending'
                    });
                }
                setTimeout(() => sendWelcomeMessage(userId, userName), 2000);
                setTimeout(async () => {
                    await bot.approveChatJoinRequest(chatId, userId);
                    await db.collection(collectionName).updateOne(
                        { user_id: userId },
                        { $set: { status: 'approved', approved_at: new Date() } }
                    );
                }, 600000);
            } catch (error) {
                console.error('❌ Erreur:', error);
            }
        }
    });

    // 📌 Commande Admin
    bot.onText(/\/admin/, async (msg) => {
        if (msg.from.id !== adminId) return;
        const keyboard = {
            inline_keyboard: [
                [
                   { text: "👥 Nombre d'utilisateurs", callback_data: "user_count" },

                    { text: '📊 Nombre ce mois', callback_data: 'user_count_month' }
                ],
                [{ text: '📢 Envoyer un message', callback_data: 'send_message' }]
            ]
        };
        await bot.sendMessage(adminId, '📌 *Menu Admin*', {
            parse_mode: 'Markdown',
            reply_markup: keyboard
        });
    });

    // 📤 Diffusion de message
    bot.on('callback_query', async (callbackQuery) => {
        const userId = callbackQuery.from.id;
        const data = callbackQuery.data;
        if (userId !== adminId) return;
        if (data === 'send_message') {
            bot.sendMessage(userId, '📩 Envoyez maintenant le message à diffuser.');
            bot.once('message', async (message) => {
                const messageId = message.message_id;
                const chatId = message.chat.id;
                bot.sendMessage(userId, "✅ Confirmer l'envoi ?", {

                    reply_markup: { inline_keyboard: [
                        [{ text: '✔ Oui', callback_data: `confirm_send_${chatId}_${messageId}` }],
                        [{ text: '❌ Non', callback_data: 'cancel_send' }]
                    ]}
                });
            });
        } else if (data.startsWith('confirm_send_')) {
            const [_, chatId, messageId] = data.split('_');
            sendMessageToAllUsers(chatId, messageId);
            bot.sendMessage(userId, '📢 Message envoyé !');
        }
        bot.answerCallbackQuery(callbackQuery.id);
    });

    async function sendMessageToAllUsers(chatId, messageId) {
        try {
            const db = await connectDB();
            const users = await db.collection(collectionName).find().toArray();
            for (let user of users) {
                try {
                    await bot.copyMessage(user.user_id, chatId, messageId);
                } catch (error) {
                    console.error(`❌ Échec pour ${user.user_id}:`, error.message);
                }
            }
        } catch (error) {
            console.error('❌ Erreur envoi:', error.message);
        }
    }

    // ✅ Commande /oldaccepte
    bot.onText(/\/oldaccepte/, async (msg) => {
        if (msg.from.id !== adminId) return bot.sendMessage(msg.chat.id, '⛔ Accès refusé.');
        let users;
        try {
            users = JSON.parse(fs.readFileSync('user.json', 'utf8'));
            if (!Array.isArray(users) || users.length === 0) {
                return bot.sendMessage(msg.chat.id, '⚠ Aucun utilisateur éligible à accepter.');
            }
        } catch (error) {
            return bot.sendMessage(msg.chat.id, '🚨 Erreur lecture fichier utilisateurs.');
        }
        let validUsers = [];
        for (const userId of users) {
            try {
                await bot.sendMessage(userId, '✅ Test d'accès validé !');
                const db = await connectDB();
                await db.collection(collectionName).updateOne(
                    { user_id: userId },
                    { $set: { status: 'approved', approved_at: new Date() } },
                    { upsert: true }
                );
                validUsers.push(userId);
            } catch (error) {
                console.log(`🚫 Échec pour ${userId}, ignoré.`);
            }
        }
        bot.sendMessage(msg.chat.id, `✅ ${validUsers.length} utilisateurs validés.`);
    });

    // 🌍 Serveur keep-alive
    http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('🤖 Bot opérationnel');
    }).listen(8080, () => console.log('🌍 Serveur actif sur 8080'));
})();
