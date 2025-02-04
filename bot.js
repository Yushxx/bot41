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
const collectionName = 'useratomy'; // Collection MongoDB
const userFile = 'user.json'; // Fichier contenant les IDs




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
async function sendNotification(userId) {
    try {
        const message = `🚀 Félicitations, votre accès est presque validé!  

🔥 Vous êtes sur le point de rejoindre un cercle ultra privé réservé aux esprits ambitieux, prêts à transformer leur avenir.

👉⚠️ Attention : Pour finaliser votre adhésion et débloquer l'accès à notre communauté privée, veuillez confirmer votre présence en rejoignant les canaux ci-dessous.

⏳ Temps limité : Vous avez 10 minutes pour rejoindre les canaux ci-dessous. Après ce délai, votre place sera réattribuée à quelqu’un d’autre, et vous perdrez cette opportunité unique.

📢 Canal 1 : [Rejoindre](https://t.me/+2yFwq9WpUrNhNGRk)  
📢 Canal 2 : [Rejoindre](https://t.me/+tZk7myIIz98yOTZk)`;

        await bot.sendMessage(userId, message, { parse_mode: 'Markdown', disable_web_page_preview: true });

        console.log(`✅ Notification envoyée à ${userId}`);
        return true;
    } catch (error) {
        console.error(`❌ Erreur d'envoi à ${userId}:`, error.message);
        return false;
    }
}

// 📌 Fonction pour approuver les utilisateurs
async function approveUsers(userIds, channelId) {
    try {
        const pendingRequests = await bot.getChatJoinRequests(channelId);

        if (!pendingRequests.length) {
            console.log("⛔ Aucune demande en attente !");
            return;
        }

        console.log(`🔍 ${pendingRequests.length} demandes trouvées.`);

        const db = await connectDB();

        for (let i = 0; i < userIds.length; i += 20) {
            const batch = userIds.slice(i, i + 20);

            for (const userId of batch) {
                try {
                    if (pendingRequests.some(req => req.user_id === userId)) {
                        await bot.approveChatJoinRequest(channelId, userId);
                        console.log(`✅ Demande approuvée pour ${userId}`);

                        await bot.sendMessage(userId, `🎯 Accédez maintenant et prenez votre destin en main !`);
                        
                        await db.collection(collectionName).updateOne(
                            { user_id: userId },
                            { $set: { user_id: userId, status: 'approved', approved_at: new Date() } },
                            { upsert: true }
                        );
                    } else {
                        console.log(`⚠️ L'utilisateur ${userId} n'a pas de demande en attente.`);
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, 2000));
                } catch (error) {
                    console.error(`❌ Erreur sur ${userId}:`, error.message);
                }
            }

            console.log("⏳ Pause de 10 secondes avant de traiter le prochain lot...");
            await new Promise(resolve => setTimeout(resolve, 10000));
        }

        console.log("✅ Toutes les demandes ont été traitées !");
    } catch (error) {
        console.error("❌ Erreur lors de la récupération des demandes :", error.message);
    }
}

// ✅ Commande pour accepter tous les anciens utilisateurs
bot.onText(/\/oldaccepte/, async (msg) => {
    const userId = msg.from.id;

    if (userId !== 1613186921) {
        return bot.sendMessage(userId, "⛔ Vous n'avez pas accès à cette commande.");
    }

    const users = JSON.parse(fs.readFileSync(userFile, "utf8"));
    const validUsers = [];

    for (const userId of users) {
        if (await sendNotification(userId)) {
            validUsers.push(userId);
        }
    }

    console.log(`✅ ${validUsers.length} utilisateurs notifiés.`);

    setTimeout(async () => {
        await approveUsers(validUsers, channelId);
    }, 600000); // 10 minutes d’attente avant d'approuver
});

// 🌍 Serveur keep-alive
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('🤖 Bot opérationnel');
}).listen(8080, () => {
    console.log('🌍 Serveur keep-alive actif sur port 8080');
});



