/**
 * @namespace: addons/autoreact/events/messageCreate.js
 * @type: Event
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

module.exports = async (bot, message) => {
	const { models } = bot.client.container;
	const { AutoReact } = models;
	const { Op } = require('sequelize');

	if (message.author.bot || !message.guild) return;

	// Optimization: We could cache per guild, but for now we query.
	// We need to check for two things:
	// 1. Channel match (type = 'channel', trigger = message.channel.id)
	// 2. Text match (type = 'text', trigger = message.content)

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
					trigger: message.content, // Case-sensitive or DB collation dependent
				},
			],
		},
	});

	if (reactions.length === 0) return;

	// In case there are multiple reactions for the same message (e.g. channel + text match), react with all keys.
	for (const reaction of reactions) {
		try {
			await message.react(reaction.emoji);
		} catch (_e) {
			// Ignore failed reactions (e.g. invalid emoji, blocked, etc.)
		}
	}
};
