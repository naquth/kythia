/**
 * @namespace: addons/globalchat/events/messageCreate.js
 * @type: Event Handler
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const { handleGlobalChat } = require('../helpers/handleGlobalChat');
const GlobalChat = require('../database/models/GlobalChat');

module.exports = async (bot, message) => {
	if (!message.guild) return;
	const registeredChannel = await GlobalChat.getCache({
		globalChannelId: message.channel.id,
	});

	if (!registeredChannel || registeredChannel.guildId !== message.guild.id) {
		return;
	}

	await handleGlobalChat(message, bot.container);
};
