/**
 * @namespace: addons/streak/events/messageCreate.js
 * @type: Event Handler
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

module.exports = async (bot, message) => {
	const container = bot.client.container;

	const { models } = container;
	const { ServerSetting } = models;
	const { claimStreak } = require('../helpers');
	if (
		!message ||
		message.author?.bot ||
		!message.guild ||
		!message.member ||
		message.system
	)
		return;

	const guildId = message.guild.id;

	const settings = await ServerSetting.getCache({ guildId: guildId });
	if (!settings || !settings.streakOn) return;

	await claimStreak(container, message.member, settings);
};
