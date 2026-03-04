/**
 * @namespace: addons/autoreact/events/messageCreate.js
 * @type: Event
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

const { Op } = require('sequelize');

module.exports = async (bot, message) => {
	const { models } = bot.client.container;
	const { AutoReact } = models;

	if (message.author.bot || !message.guild) return;

	const reactions = await AutoReact.getAllCache({
		where: {
			guildId: message.guild.id,
			[Op.or]: [
				{
					type: 'channel',
					trigger: message.channel.id,
				},
				{
					type: 'text',
					trigger: message.content,
				},
			],
		},
	});

	if (reactions.length === 0) return;

	for (const reaction of reactions) {
		try {
			await message.react(reaction.emoji);
		} catch (_e) {
			// Ignore failed reactions (e.g. invalid emoji, blocked, etc.)
		}
	}
};
