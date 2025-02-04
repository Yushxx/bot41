// Importation des modules nécessaires
const TelegramBot = require('node-telegram-bot-api');
const { MongoClient } = require('mongodb');
const fs = require('fs');
const http = require('http');


// ⚙️ Configuration
const token = '8075874480:AAFymYS-clEN1hfdcrV7e0ZfvX9MyQOJngY'; // Remplace par ton token
const channelId = '-1002017559099'; // Remplace par l'ID de ton canal
const mongoUri = 'mongodb+srv://josh:JcipLjQSbhxbruLU@cluster0.hn4lm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'; // Remplace par l'URI de ta base MongoDB
const dbName = 'telegramBotDB'; // Nom de la base de données
const collectionName = 'userLomy'; // Collection MongoDB
const userFile = 'user.json'; // Fichier contenant les IDs






// 🏗 Initialisation
const bot = new TelegramBot(token, { polling: true });
const client = new MongoClient(mongoUri);

// 🔗 Connexion MongoDB
async function connectDB() {
    try {
        await client.connect();
        console.log('✅ Connecté à MongoDB');
        return client.db('telegramBotDB');
    } catch (error) {
        console.error('❌ Erreur MongoDB:', error);
        process.exit(1);
    }
}

// 📌 Vérification des demandes d'adhésion
async function checkJoinRequest(userId) {
    try {
        const pendingRequests = await bot.getChatJoinRequests(channelId);
        return pendingRequests.some(req => req.user_id === userId);
    } catch (error) {
        console.error('❌ Erreur lors de la vérification des demandes:', error.message);
        return false;
    }
}

// ✅ Vérification pour TOUS les utilisateurs de user.json
async function checkAllUsers() {
    const db = await connectDB();
    const users = JSON.parse(fs.readFileSync(userFile, "utf8"));
    let validUsers = [];

    for (const userId of users) {
        if (await checkJoinRequest(userId)) {
            await db.collection('userVF').updateOne(
                { user_id: userId },
                { $set: { user_id: userId, status: 'pending', timestamp: new Date() } },
                { upsert: true }
            );
            validUsers.push(userId);
        }
    }

    console.log(`✅ ${validUsers.length} utilisateurs ont une demande en attente et sont enregistrés.`);
}

// ✅ Commande pour vérifier les utilisateurs du fichier
bot.onText(/\/check_all/, async (msg) => {
    const userId = msg.from.id;

    // Vérifier si l'utilisateur est administrateur
    if (userId !== 1613186921) {
        return bot.sendMessage(userId, "⛔ Vous n'avez pas accès à cette commande.");
    }

    await checkAllUsers();
    bot.sendMessage(userId, "✅ Vérification terminée. Consultez la console.");
});

// 🌍 Lancement du bot
console.log('🤖 Bot en cours d\'exécution...');
