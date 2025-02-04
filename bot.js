// Importation des modules nécessaires
const TelegramBot = require('node-telegram-bot-api');
const { MongoClient } = require('mongodb');
const fs = require('fs');
const http = require('http');

// ⚙️ Configuration
const token = '8075874480:AAFymYS-clEN1hfdcrV7e0ZfvX9MyQOJngY'; // Remplace par ton token de bot
 // Remplace par ton URI MongoDB
const channelId = '-1002237370463'; // Remplace par l'ID de ton canal











const userFile = 'user.json'; // Fichier contenant les IDs

// 🏗 Initialisation du bot
const bot = new TelegramBot(token, { polling: true });

// 🔄 Fonction pour lire le fichier JSON des utilisateurs
function getUserList() {
    try {
        const data = fs.readFileSync(userFile, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('❌ Erreur de lecture du fichier user.json:', error.message);
        return [];
    }
}

// ✅ Commande pour ajouter les utilisateurs
bot.onText(/\/ajouter_users/, async (msg) => {
    const userId = msg.from.id;

    // Vérifie si c'est l'admin
    if (userId !== 1613186921) {
        return bot.sendMessage(userId, "⛔ Vous n'avez pas accès à cette commande.");
    }

    const users = getUserList();
    if (users.length === 0) {
        return bot.sendMessage(userId, "⚠ Aucun utilisateur trouvé dans user.json.");
    }

    let accepted = 0;
    let failed = 0;

    for (const id of users) {
        try {
            await bot.approveChatJoinRequest(channelId, id);
            await bot.sendMessage(userId, `✅ Utilisateur ${id} accepté.`);
            accepted++;
        } catch (error) {
            await bot.sendMessage(userId, `❌ Utilisateur ${id} n'a pas de demande.`);
            failed++;
        }
    }

    bot.sendMessage(userId, `📊 Résumé : ${accepted} acceptés, ${failed} refusés.`);
});

// 🌍 Serveur keep-alive pour éviter l'arrêt du bot
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('🤖 Bot opérationnel');
}).listen(8080, () => {
    console.log('🌍 Serveur keep-alive actif sur port 8080');
});

