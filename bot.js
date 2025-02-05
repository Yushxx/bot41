const TelegramBot = require('node-telegram-bot-api');
const token = '7716709396:AAH4CpyfwN-EtdzFqpIbKolZz8OwiEla6qw';
const bot = new TelegramBot(token, { polling: true });

// Réagir à un message dans un canal
bot.on('channel_post', (msg) => {
    const chatId = msg.chat.id; // ID du canal
    const messageId = msg.message_id; // ID du message

    // Réagir avec un émoji
    bot.setMessageReaction(chatId, messageId, [{ type: 'emoji', emoji: '🚀' }])
        .then(() => console.log('Réaction ajoutée dans le canal !'))
        .catch((err) => console.error('Erreur :', err));
});
