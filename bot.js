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
const collectionName = 'useraomy'; // Collection MongoDB
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

// 🔍 Vérifier les demandes en attente pour un utilisateur
async function checkUserPendingRequest(userId) {
    try {
        // Récupérer les demandes en attente pour le canal
        const pendingRequests = await bot.getChatJoinRequests(channelId);

        // Vérifier si l'utilisateur a une demande en attente
        const userHasPendingRequest = pendingRequests.some(request => request.user.id === userId);

        return userHasPendingRequest;
    } catch (error) {
        console.error(`❌ Erreur lors de la vérification pour l'utilisateur ${userId}:`, error.message);
        return false;
    }
}

// ✅ Traiter les utilisateurs du fichier user.json
async function processUsers() {
    const db = await connectDB();
    const collection = db.collection(collectionName);

    // Lire les IDs des utilisateurs depuis le fichier user.json
    const users = JSON.parse(fs.readFileSync(userFile, "utf8"));

    let pendingCount = 0;
    let ignoredCount = 0;

    for (const userId of users) {
        try {
            // Vérifier si l'utilisateur a une demande en attente
            const hasPendingRequest = await checkUserPendingRequest(userId);

            if (hasPendingRequest) {
                // Enregistrer l'utilisateur dans MongoDB
                await collection.updateOne(
                    { user_id: userId },
                    { 
                        $set: { 
                            user_id: userId,
                            status: 'pending',
                            timestamp: new Date() 
                        } 
                    },
                    { upsert: true }
                );

                console.log(`✅ Utilisateur ${userId} a une demande en attente et a été enregistré.`);
                pendingCount++;
            } else {
                console.log(`⏩ Utilisateur ${userId} n'a pas de demande en attente. Ignoré.`);
                ignoredCount++;
            }
        } catch (error) {
            console.error(`❌ Erreur lors du traitement de l'utilisateur ${userId}:`, error.message);
        }
    }

    // Retourner les résultats
    return { pendingCount, ignoredCount };
}

// 🎛 Commande /startcheck pour démarrer la vérification
bot.onText(/\/startcheck/, async (msg) => {
    const chatId = msg.chat.id;

    // Vérifier si c'est l'admin
    if (msg.from.id !== 1613186921) {
        return bot.sendMessage(chatId, "⛔ Vous n'avez pas la permission d'utiliser cette commande.");
    }

    // Démarrer la vérification
    bot.sendMessage(chatId, "🔍 Démarrage de la vérification des utilisateurs...");

    const { pendingCount, ignoredCount } = await processUsers();

    // Envoyer un rapport à l'admin
    bot.sendMessage(
        chatId,
        `📊 Résultat de la vérification :\n\n` +
        `✅ ${pendingCount} utilisateurs avec une demande en attente enregistrés.\n` +
        `⏩ ${ignoredCount} utilisateurs ignorés (pas de demande en attente).`
    );
});

// 🌍 Démarrer le bot
console.log('🤖 Bot démarré. En attente de la commande /startcheck...');
