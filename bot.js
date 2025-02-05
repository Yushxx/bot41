const TelegramBot = require('node-telegram-bot-api');

// Remplace 'TON_TOKEN_BOT' par le token de ton bot
const token = '7822099207:AAGXIYMtIFkOz8p5xCRY3o_K6pK75rxp6Tg';
const bot = new TelegramBot(token, { polling: true });

// Réagir à un message avec un émoji
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;

    // Réagir avec un émoji 👍
    bot.setMessageReaction(chatId, messageId, [{ type: 'emoji', emoji: '👍' }])
        .then(() => {
            console.log('Réaction ajoutée avec succès !');
        })
        .catch((err) => {
            console.error('Erreur lors de l\'ajout de la réaction :', err);
        });
});

console.log('Bot en écoute...');
