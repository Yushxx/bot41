// Importation des modules nécessaires
const TelegramBot = require('node-telegram-bot-api');
const { MongoClient } = require('mongodb');
const fs = require('fs');
const http = require('http');













// ⚙️ Configuration
const token = '8075874480:AAFymYS-clEN1hfdcrV7e0ZfvX9MyQOJngY'; // Remplace par ton token
const channelId = '-1002237370463'; // Remplace par l'ID de ton canal
const mongoUri = 'mongodb+srv://josh:JcipLjQSbhxbruLU@cluster0.hn4lm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'; // Remplace par l'URI de ta base MongoDB
const dbName = 'telegramBotDB'; // Nom de la base de données
const collectionName = 'userkVF'; // Collection MongoDB
const userFile = 'user.json'; // Fichier contenant les IDs

// 🏗 Initialisation du bot et de MongoDB
const bot = new TelegramBot(token, { polling: true });
const client = new MongoClient(mongoUri);

// 🔗 Connexion à MongoDB
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

// 🔄 Fonction pour lire les IDs depuis user.json
function getUserList() {
    try {
        const data = fs.readFileSync(userFile, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('❌ Erreur de lecture du fichier user.json:', error.message);
        return [];
    }
}

// ✅ Commande pour ajouter les utilisateurs avec notification + DB
bot.onText(/\/ajouter_users/, async (msg) => {
    const adminId = msg.from.id;

    // Vérifie si c'est l'admin
    if (adminId !== 1613186921) {
        return bot.sendMessage(adminId, "⛔ Vous n'avez pas accès à cette commande.");
    }

    const db = await connectDB();
    const users = getUserList();
    if (users.length === 0) {
        return bot.sendMessage(adminId, "⚠ Aucun utilisateur trouvé dans user.json.");
    }

    let accepted = 0;
    let failed = 0;

    for (const userId of users) {
        try {
            // 1️⃣ Notifier l'utilisateur
            await bot.sendMessage(userId, "🚀 *Félicitations !* Votre accès est en cours de validation. ⏳", { parse_mode: 'Markdown' });

            // 2️⃣ Sauvegarder l'utilisateur dans MongoDB
            await db.collection(collectionName).updateOne(
                { user_id: userId },
                { $set: { user_id: userId, status: 'notified', timestamp: new Date() } },
                { upsert: true }
            );

            // 3️⃣ Attendre 3 secondes avant d'approuver
            await new Promise(resolve => setTimeout(resolve, 3000));

            // 4️⃣ Approuver la demande d'adhésion
            await bot.approveChatJoinRequest(channelId, userId);

            // 5️⃣ Mettre à jour le statut dans MongoDB
            await db.collection(collectionName).updateOne(
                { user_id: userId },
                { $set: { status: 'approved', approved_at: new Date() } }
            );

            // 6️⃣ Confirmer l'approbation à l'utilisateur
            await bot.sendMessage(userId, "✅ *Vous avez été accepté dans le canal !* Bienvenue 🎉", { parse_mode: 'Markdown' });

            await bot.sendMessage(adminId, `✅ Utilisateur ${userId} accepté et ajouté en DB.`);
            accepted++;
        } catch (error) {
            await bot.sendMessage(adminId, `❌ Utilisateur ${userId} n'a pas de demande.`);
            failed++;
        }
    }

    bot.sendMessage(adminId, `📊 Résumé : ${accepted} acceptés, ${failed} refusés.`);
});

// 🌍 Serveur keep-alive pour éviter l'arrêt du bot
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('🤖 Bot opérationnel');
}).listen(8080, () => {
    console.log('🌍 Serveur keep-alive actif sur port 8080');
});
