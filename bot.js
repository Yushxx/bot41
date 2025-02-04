const TelegramBot = require('node-telegram-bot-api');
const { MongoClient } = require('mongodb');
const fs = require('fs');
const http = require('http');

// ⚙️ Configuration
const token = '8075874480:AAFymYS-clEN1hfdcrV7e0ZfvX9MyQOJngY';
const mongoUri = 'mongodb+srv://josh:JcipLjQSbhxbruLU@cluster0.hn4lm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const channelId = '-1002237370463';

const dbName = 'telegramBotDB';
const collectionName = 'useVF';

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
        const message = `*${userName}*, 🚀 *Votre accès est en cours de validation !*`;
        
        await bot.sendMessage(userId, message, { parse_mode: 'Markdown' });

        console.log(`✅ Message envoyé à ${userName} (ID: ${userId})`);
        return true;
    } catch (error) {
        console.error(`❌ Impossible d'envoyer un message à ${userName}:`, error.message);
        return false;
    }
}

// 📂 Lecture des IDs depuis `user.json`
function readUserIDs() {
    try {
        const data = fs.readFileSync('user.json');
        return JSON.parse(data);
    } catch (error) {
        console.error('❌ Erreur de lecture du fichier user.json:', error.message);
        return [];
    }
}

// 🏁 Commande /oldaccepte pour valider les anciennes demandes
bot.onText(/\/oldaccepte/, async (msg) => {
    const userId = msg.from.id;
    const db = await connectDB();

    // Vérifier si l'utilisateur est admin
    const adminId = 1613186921;
    if (userId !== adminId) {
        return bot.sendMessage(userId, "⛔ Vous n'avez pas l'autorisation d'utiliser cette commande.");
    }

    bot.sendMessage(userId, "🔄 Vérification des utilisateurs...");

    const users = readUserIDs();
    let validUsers = [];

    for (const user of users) {
        const userId = user.user_id;
        const userName = user.username || "Utilisateur inconnu";

        // Essayer d'envoyer un message
        const success = await sendWelcomeMessage(userId, userName);

        if (success) {
            // Enregistrer dans MongoDB
            await db.collection(collectionName).updateOne(
                { user_id: userId },
                { $set: { username: userName, status: 'pending', timestamp: new Date() } },
                { upsert: true }
            );

            validUsers.push(userId);
        }
    }

    if (validUsers.length > 0) {
        bot.sendMessage(userId, `✅ ${validUsers.length} utilisateurs validés, approbation dans 10 secondes...`);

        // ⏳ Attendre 10 secondes avant approbation
        setTimeout(async () => {
            for (const userId of validUsers) {
                try {
                    await bot.approveChatJoinRequest(channelId, userId);
                    console.log(`🎉 Utilisateur ${userId} approuvé avec succès !`);

                    await db.collection(collectionName).updateOne(
                        { user_id: userId },
                        { $set: { status: 'approved', approved_at: new Date() } }
                    );
                } catch (error) {
                    console.error(`❌ Erreur lors de l'approbation de ${userId}:`, error.message);
                }
            }
        }, 10000);
    } else {
        bot.sendMessage(userId, "⚠️ Aucun utilisateur éligible à approuver.");
    }
});

// 🌍 Serveur keep-alive
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('🤖 Bot opérationnel');
}).listen(8080, () => {
    console.log('🌍 Serveur keep-alive actif sur port 8080');
});
