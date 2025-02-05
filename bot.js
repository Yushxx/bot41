const TelegramBot = require('node-telegram-bot-api');

// Remplace avec ton token bot
const TOKEN = '7822099207:AAGXIYMtIFkOz8p5xCRY3o_K6pK75rxp6Tg';

// Remplace avec l'ID de ton canal (ex: -1001234567890)
const CHANNEL_ID = '-100XXXXXXXXXX';

// Initialisation du bot
const bot = new TelegramBot(TOKEN, { polling: true });

console.log('🤖 Bot lancé et en écoute du canal...');

// Écoute les messages du canal
bot.on('message', (msg) => {
    if (msg.chat.id.toString() === CHANNEL_ID) {
        console.log(`📩 Nouveau message du canal : ${msg.text}`);

        // Réponse automatique (personnalise ton message)
        bot.sendMessage(CHANNEL_ID, "👀 J'ai vu ton message !")
            .then(() => console.log('✅ Réponse envoyée'))
            .catch(err => console.error('❌ Erreur d’envoi :', err));
    }
});
