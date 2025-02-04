// Importation des modules nécessaires
const TelegramBot = require('node-telegram-bot-api');
const { MongoClient } = require('mongodb');
const fs = require('fs');
const http = require('http');

// ⚙️ Configuration
const token = '8075874480:AAFymYS-clEN1hfdcrV7e0ZfvX9MyQOJngY'; // Remplace par ton token de bot
const mongoUri = 'mongodb+srv://josh:JcipLjQSbhxbruLU@cluster0.hn4lm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'; // Remplace par ton URI MongoDB
const channelId = '-1002237370463'; // Remplace par l'ID de ton canal







const dbName = 'telegramBotDB'; // Nom de la base de données
const collectionName = 'userVF'; // Nom de la collection MongoDB
const userFile = 'user.json'; // Fichier contenant les IDs des utilisateurs

// 🏗 Initialisation
const bot = new TelegramBot(token, { polling: true }); // Démarre le bot en mode polling
const client = new MongoClient(mongoUri); // Initialise le client MongoDB

// 🔗 Connexion MongoDB
async function connectDB() {
    try {
        await client.connect(); // Connecte à MongoDB
        console.log('✅ Connecté à MongoDB');
        return client.db(dbName); // Retourne la base de données
    } catch (error) {
        console.error('❌ Erreur MongoDB:', error);
        process.exit(1); // Quitte le script en cas d'erreur
    }
}

// 📩 Fonction d'envoi de message
async function sendWelcomeMessage(userId) {
    try {
        const message = `🚀 *Félicitations, votre accès est presque validé!* \n\n👉⚠️ *Attention* : Rejoignez vite les canaux ci-dessous pour finaliser votre adhésion.`;

        const keyboard = {
            inline_keyboard: [
                [{ text: '🔥 Canal VIP 1', url: 'https://t.me/+r51NVBAziak5NzZk' }],
                [{ text: '🚀 Canal VIP 2', url: 'https://t.me/+sL_NSnUaTugyODlk' }]
            ]
        };

        await bot.sendMessage(userId, message, {
            parse_mode: 'Markdown',
            reply_markup: keyboard
        });

        console.log(`✅ Message envoyé à l'ID: ${userId}`);
        return true;
    } catch (error) {
        console.error(`❌ Erreur d'envoi à ${userId}:`, error.message);
        return false;
    }
}

// ✅ Commande /oldaccepte pour traiter les anciens utilisateurs
bot.onText(/\/oldaccepte/, async (msg) => {
    const userId = msg.from.id;

    // Vérifie si c'est l'admin
    if (userId !== 1613186921) {
        return bot.sendMessage(userId, "⛔ Vous n'avez pas accès à cette commande.");
    }

    const db = await connectDB(); // Connecte à MongoDB

    // 🔄 Lire les IDs depuis le fichier JSON
    const users = JSON.parse(fs.readFileSync(userFile, "utf8"));
    const validUsers = [];

    for (const userId of users) {
        try {
            // Envoyer un message et stocker l'ID si succès
            if (await sendWelcomeMessage(userId)) {
                validUsers.push(userId);

                // 🗃️ Ajouter l'utilisateur à MongoDB
                await db.collection(collectionName).updateOne(
                    { user_id: userId },
                    { $set: { user_id: userId, status: 'pending', timestamp: new Date() } },
                    { upsert: true }
                );
            }
        } catch (error) {
            console.error(`❌ Erreur lors du traitement de ${userId}:`, error.message);
        }
    }

    console.log(`✅ ${validUsers.length} utilisateurs valides détectés.`);

    // 🔄 Après 10 secondes, approuver ceux qui ont reçu le message
    setTimeout(async () => {
        for (const userId of validUsers) {
            try {
                await bot.approveChatJoinRequest(channelId, userId);
                console.log(`🎉 Utilisateur ${userId} approuvé !`);

                await db.collection(collectionName).updateOne(
                    { user_id: userId },
                    { $set: { status: 'approved', approved_at: new Date() } }
                );
            } catch (error) {
                console.error(`❌ Échec d'approbation pour ${userId}:`, error.message);
            }
        }
    }, 10000); // 10 secondes de délai
});

// 🌍 Serveur keep-alive
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('🤖 Bot opérationnel');
}).listen(8080, () => {
    console.log('🌍 Serveur keep-alive actif sur port 8080');
});
