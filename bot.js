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

// ✅ Commande /accept pour approuver directement
bot.onText(/\/accept/, async (msg) => {
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
            // Approuver directement dans le canal
            await bot.approveChatJoinRequest(channelId, userId);
            
            // Mettre à jour MongoDB
            await db.collection(collectionName).updateOne(
                { user_id: userId },
                { 
                    $set: { 
                        status: 'approved',
                        approved_at: new Date(),
                        timestamp: new Date() 
                    } 
                },
                { upsert: true }
            );
            
            console.log(`✅ ${userId} approuvé avec succès`);
            successCount++;
        } catch (error) {
            console.error(`❌ Erreur avec ${userId}:`, error.message);
            errorCount++;
        }
    }

    // Rapport final
    await bot.sendMessage(
        adminId,
        `📊 Résultat final :\n\n` +
        `✅ ${successCount} utilisateurs approuvés\n` +
        `❌ ${errorCount} échecs`
    );
});

// 🌍 Serveur keep-alive
http.createServer((req, res) => {
    res.end('🤖 Bot actif');
}).listen(8080);

console.log('🚀 Bot démarré !');
