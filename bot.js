const TelegramBot = require('node-telegram-bot-api');

// Remplace 'TON_TOKEN_BOT' par le token de ton bot
const token = '7822099207:AAGXIYMtIFkOz8p5xCRY3o_K6pK75rxp6Tg';
const bot = new TelegramBot(token, { polling: true });

bot.on('message', (msg) => {
    console.log('Message reçu :', msg.text);
    const chatId = msg.chat.id;
    const messageId = msg.message_id;

    console.log('chatId:', chatId);
    console.log('messageId:', messageId);

    bot.setMessageReaction(chatId, messageId, [{ type: 'emoji', emoji: '👍' }])
        .then(() => {
            console.log('Réaction ajoutée avec succès !');
        })
        .catch((err) => {
            console.error('Erreur lors de l\'ajout de la réaction :', err);
        });
});

console.log('Bot en écoute...');
