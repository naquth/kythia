/**
 * @namespace: addons/activity/commands/stats.js
 * @type: Command
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const { MessageFlags } = require('discord.js');

/**
 * Formats a duration in seconds to a human-readable string (Xh Ym Zs).
 *
 * @param {bigint|number} totalSeconds
 * @returns {string}
 */
const formatDuration = (totalSeconds) => {
	const secs = Number(totalSeconds);
	if (secs <= 0) return '0s';

	const h = Math.floor(secs / 3600);
	const m = Math.floor((secs % 3600) / 60);
	const s = secs % 60;

	const parts = [];
	if (h > 0) parts.push(`${h}h`);
	if (m > 0) parts.push(`${m}m`);
	if (s > 0 || parts.length === 0) parts.push(`${s}s`);
	return parts.join(' ');
};

module.exports = {
	subcommand: true,
	slashCommand: (subcommand) =>
		subcommand
			.setName('stats')
			.setDescription(
				'Check your activity stats (total messages & voice time).',
			)
			.addUserOption((option) =>
				option
					.setName('user')
					.setDescription(
						'The user whose stats you want to see. Defaults to yourself.',
					),
			),

	/**
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 * @param {KythiaDI.Container} container
	 */
	async execute(interaction, container) {
		const { t, models, helpers, kythiaConfig } = container;
		const { simpleContainer } = helpers.discord;
		const { ActivityStat } = models;

		await interaction.deferReply();

		const targetUser = interaction.options.getUser('user') || interaction.user;
		const guildId = interaction.guild.id;

		const stat = await ActivityStat.getCache({
			guildId,
			userId: targetUser.id,
		});

		// No record yet — show zeroed stats rather than an error
		const totalMessages = stat ? Number(BigInt(stat.totalMessages)) : 0;
		const totalVoiceTime = stat ? BigInt(stat.totalVoiceTime) : 0n;

		const title = `## ${await t(interaction, 'activity.stats.activity.stats.title')}`;
		const desc = await t(interaction, 'activity.stats.activity.stats.desc', {
			username: targetUser.username,
			messages: totalMessages.toLocaleString(),
			voiceTime: formatDuration(totalVoiceTime),
		});

		const components = await simpleContainer(interaction, `${title}\n${desc}`, {
			color: kythiaConfig.bot.color,
		});

		await interaction.editReply({
			components,
			flags: MessageFlags.IsComponentsV2,
			allowedMentions: { parse: [] },
		});
	},
};
