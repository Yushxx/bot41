// Importation des modules nécessaires
const TelegramBot = require('node-telegram-bot-api');
const { MongoClient } = require('mongodb');
const fs = require('fs');
const http = require('http');

// ⚙️ Configuration
const token = '8075874480:AAFymYS-clEN1hfdcrV7e0ZfvX9MyQOJngY'; // Remplace par ton token de bot
const mongoUri = 'mongodb+srv://josh:JcipLjQSbhxbruLU@cluster0.hn4lm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'; // Remplace par ton URI MongoDB
const channelId = '-1002237370463'; // Remplace par l'ID de ton canal









const dbName = 'telegramBotDB';
const collectionName = 'userVF';
const userFile = 'user.json';

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
async function sendWelcomeMessage(userId) {
    try {
        await bot.sendMessage(userId, '🚀 Bienvenue !');
        console.log(`✅ Message envoyé à l'ID: ${userId}`);
        return true;
    } catch (error) {
        console.error(`❌ Erreur d'envoi à ${userId}:`, error.message);
        return false;
    }
}

// ✅ Commande /oldaccepte
bot.onText(/\/oldaccepte/, async (msg) => {
    const userId = msg.from.id;

    if (userId !== 1613186921) {
        return bot.sendMessage(userId, "⛔ Accès refusé.");
    }

    const db = await connectDB();
    const users = JSON.parse(fs.readFileSync(userFile, "utf8"));
    const validUsers = [];

    for (const userId of users) {
        if (await sendWelcomeMessage(userId)) {
            validUsers.push(userId);
            await db.collection(collectionName).updateOne(
                { user_id: userId },
                { $set: { user_id: userId, status: 'pending', timestamp: new Date() } },
                { upsert: true }
            );
        }
    }

    console.log(`✅ ${validUsers.length} utilisateurs valides.`);

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
    }, 10000);
});

// 🌍 Serveur keep-alive
require('http').createServer((req, res) => {
    res.end('🤖 Bot opérationnel');
}).listen(8080);
