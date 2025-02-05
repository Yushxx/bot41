const TelegramBot = require('node-telegram-bot-api');

// Remplace par ton token bot
const TOKEN = '7822099207:AAGXIYMtIFkOz8p5xCRY3o_K6pK75rxp6Tg';

// Remplace avec l'ID de ton canal (ex: -1001234567890)
const CHANNEL_ID = '-1002237370463';

// Initialisation du bot en mode polling
const bot = new TelegramBot(TOKEN, { polling: true });

console.log('🤖 Bot lancé et en écoute du canal...');

// Écoute les messages du canal
bot.on('message', async (msg) => {
    if (!msg.chat || msg.chat.id.toString() !== CHANNEL_ID) return;

    console.log(`📩 Nouveau message détecté : ${msg.text}`);

    try {
        // Ajoute une réaction emoji (ex: 👍)
        await bot.setMessageReaction(msg.chat.id, msg.message_id, ['👍']);
        console.log('✅ Réaction ajoutée avec succès !');

        // Envoie un message de confirmation dans le canal
        await bot.sendMessage(CHANNEL_ID, "🤖 J'ai réagi à ton message avec 👍 !");
    } catch (err) {
        console.error('❌ Erreur lors de l’ajout de la réaction :', err);

        // Envoie un message d'erreur pour comprendre le problème
        await bot.sendMessage(CHANNEL_ID, `⚠️ Erreur lors de la réaction : ${err.message}`);
    }
});
