/**
 * @namespace: addons/verification/buttons/verify-math.js
 * @type: Button Handler
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 *
 * CustomId format: verify-math:{userId}:{correct|wrong_VALUE}
 */

const { getSession, incrementAttempts } = require('../helpers/session');
const {
	handleSuccess,
	handleFail,
	buildCaptchaPayload,
} = require('../helpers/verify');
const { MessageFlags } = require('discord.js');

module.exports = {
	customId: 'verify-math',

	async execute(interaction, bot) {
		const { models, logger } = bot.client.container;
		const { VerificationConfig } = models;

		try {
			const parts = interaction.customId.split(':');
			const targetUserId = parts[1];
			const result = parts[2]; // 'correct' or 'wrong_VALUE'

			// Only the right user can click
			if (interaction.user.id !== targetUserId) {
				return interaction.reply({
					content: '❌ This captcha is not for you!',
					ephemeral: true,
				});
			}

			if (!getSession(interaction.guild.id, interaction.user.id)) {
				return interaction.reply({
					content:
						'⏰ This captcha has expired. Please wait for a new one to be sent.',
					ephemeral: true,
				});
			}

			await interaction.deferUpdate();

			const config = await VerificationConfig.findOne({
				where: { guildId: interaction.guild.id },
			});
			if (!config) return;

			const member = await interaction.guild.members
				.fetch(interaction.user.id)
				.catch(() => null);
			if (!member) return;

			if (result === 'correct') {
				await handleSuccess(member, config);
				await interaction
					.editReply({
						content: `✅ <@${interaction.user.id}> Correct! You're now verified. Welcome to **${interaction.guild.name}**! 🎉`,
						components: [],
						files: [],
						flags: MessageFlags.IsComponentsV2,
					})
					.catch(() =>
						interaction.channel
							?.send(`✅ <@${interaction.user.id}> Verified successfully!`)
							.catch(() => null),
					);
			} else {
				const attempts = incrementAttempts(
					interaction.guild.id,
					interaction.user.id,
				);
				await handleFail(member, config, attempts, async (remaining) => {
					const payload = buildCaptchaPayload(member, config);
					await interaction
						.editReply({
							content: `❌ Wrong answer! **${remaining}** attempt(s) remaining. New challenge:`,
							...payload,
						})
						.catch(() => null);
				});

				if (config.maxAttempts - attempts <= 0) {
					await interaction
						.editReply({
							content: config.kickOnFail
								? `❌ Too many wrong answers. You have been kicked.`
								: `❌ Too many wrong answers. Please contact a moderator.`,
							components: [],
						})
						.catch(() => null);
				}
			}
		} catch (err) {
			logger.error('[Verification] verify-math button error:', err);
		}
	},
};
