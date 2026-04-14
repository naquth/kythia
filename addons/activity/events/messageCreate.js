/**
 * @namespace: addons/activity/events/messageCreate.js
 * @type: Event Handler
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

/**
 * Increments totalMessages for a guild member on every non-bot message.
 * Uses findOrCreate to avoid a separate existence check.
 *
 * @param {import('kythia-core').Kythia} bot
 * @param {import('discord.js').Message} message
 */
module.exports = async (bot, message) => {
	if (message.author.bot || !message.guild) return;

	const { models } = bot.client.container;
	const { ServerSetting, ActivityStat } = models;

	const guildId = message.guild.id;
	const userId = message.author.id;

	// Feature flag check
	const serverSetting = await ServerSetting.getCache({ guildId });
	if (!serverSetting || !serverSetting.activityOn) return;

	try {
		let stat = await ActivityStat.getCache({ guildId, userId });

		if (!stat) {
			stat = await ActivityStat.create({
				guildId,
				userId,
				totalMessages: 1,
				totalVoiceTime: 0,
			});
		} else {
			stat.totalMessages = BigInt(stat.totalMessages) + 1n;
			stat.changed('totalMessages', true);
			await stat.save();
		}
	} catch (err) {
		bot.client.container.logger.error(
			`Failed to track message activity for ${userId} in ${guildId}: ${err.message}`,
			{ label: 'activity:messageCreate' },
		);
	}
};
