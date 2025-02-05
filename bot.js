const TelegramBot = require('node-telegram-bot-api');

// Remplace avec ton token bot
const TOKEN = '7822099207:AAGXIYMtIFkOz8p5xCRY3o_K6pK75rxp6Tg';

// Remplace avec l'ID de ton canal (ex: -1001234567890)
const CHANNEL_ID = '-1002237370463';
const TelegramBot = require('node-telegram-bot-api');



// Initialisation du bot
const bot = new TelegramBot(TOKEN, { polling: true });

console.log('🤖 Bot en écoute...');

// Écoute les messages du canal
bot.on('message', (msg) => {
    if (msg.chat.id.toString() === CHANNEL_ID) {
        console.log(`📩 Message détecté : ${msg.text}`);

        // Ajoute une réaction emoji (ex: 👍)
        bot.sendReaction(msg.chat.id, msg.message_id, ['👍'])
            .then(() => console.log('✅ Réaction ajoutée'))
            .catch(err => console.error('❌ Erreur :', err));
    }
});
