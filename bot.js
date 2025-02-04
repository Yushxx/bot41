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









// Commande pour approuver en masse les utilisateurs de user.json
bot.onText(/\/oldaccepte/, async (msg) => {
    if (msg.from.id !== adminId) return bot.sendMessage(msg.chat.id, "⛔ Accès refusé.");

    let users;
    try {
        // Lire la liste des utilisateurs
        users = JSON.parse(fs.readFileSync('user.json', 'utf8'));
        if (!Array.isArray(users) || users.length === 0) {
            return bot.sendMessage(msg.chat.id, "⚠ Aucun utilisateur éligible à accepter.");
        }
    } catch (error) {
        console.error("❌ Erreur lecture user.json :", error);
        return bot.sendMessage(msg.chat.id, "🚨 Erreur lors de la lecture du fichier utilisateurs.");
    }

    let validUsers = [];

    for (const userId of users) {
        try {
            // Tester en envoyant un message
            await bot.sendMessage(userId, "✅ Test d'accès validé !");
            
            // Ajouter l'utilisateur validé à la base de données
            const db = await connectDB();
            await db.collection(collectionName).updateOne(
                { user_id: userId },
                { $set: { status: 'approved', approved_at: new Date() } },
                { upsert: true }
            );

            validUsers.push(userId);
            console.log(`🎉 Utilisateur ${userId} validé.`);
        } catch (error) {
            console.log(`🚫 Impossible d'envoyer un message à ${userId}, ignoré.`);
        }
    }

    if (validUsers.length > 0) {
        bot.sendMessage(msg.chat.id, `✅ ${validUsers.length} utilisateurs validés avec succès.`);
    } else {
        bot.sendMessage(msg.chat.id, "⚠ Aucun utilisateur éligible trouvé.");
    }
});









// 🌍 Serveur keep-alive
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('🤖 Bot opérationnel');
}).listen(8080, () => {
    console.log('🌍 Serveur keep-alive actif sur port 8080');
});
