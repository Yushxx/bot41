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
const collectionName = 'usenrVF';
const userFile = 'user.json'; // Fichier contenant les IDs des utilisateurs

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

// 📩 Fonction de notification en DM
async function notifyUser(userId) {
    try {
        const message = `🎉 Félicitations ! Vous avez été ajouté au canal VIP.`;
        await bot.sendMessage(userId, message);
        console.log(`✅ Notification envoyée à l'utilisateur ${userId}`);
        return true;
    } catch (error) {
        console.error(`❌ Impossible de notifier l'utilisateur ${userId}:`, error.message);
        return false;
    }
}

// ✅ Commande /add pour traiter les utilisateurs
bot.onText(/\/add/, async (msg) => {
    const adminId = msg.from.id;

    // Vérification admin
    if (adminId !== 1613186921) {
        return bot.sendMessage(adminId, "⛔ Accès refusé !");
    }

    const db = await connectDB();
    const users = JSON.parse(fs.readFileSync(userFile, "utf8"));

    let successCount = 0;
    let errorCount = 0;

    for (const userId of users) {
        try {
            // Essayer d'ajouter l'utilisateur au canal
            await bot.approveChatJoinRequest(channelId, userId);

            // Notifier l'utilisateur en DM
            await notifyUser(userId);

            // Mettre à jour MongoDB
            await db.collection(collectionName).updateOne(
                { user_id: userId },
                { 
                    $set: { 
                        user_id: userId,
                        status: 'approved',
                        timestamp: new Date() 
                    } 
                },
                { upsert: true }
            );

            console.log(`✅ ${userId} ajouté et notifié`);
            successCount++;
        } catch (error) {
            console.error(`❌ Échec pour ${userId}:`, error.message);
            errorCount++;
        }
    }

    // Rapport final à l'admin
    await bot.sendMessage(
        adminId,
        `📊 Résultat final :\n\n` +
        `✅ ${successCount} utilisateurs ajoutés et notifiés\n` +
        `❌ ${errorCount} utilisateurs ignorés`
    );
});

// 🌍 Serveur keep-alive
http.createServer((req, res) => {
    res.end('🤖 Bot actif');
}).listen(8080);

console.log('🚀 Bot démarré !');
