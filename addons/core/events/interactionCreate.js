/**
 * @namespace: addons/core/events/interactionCreate.js
 * @type: Event Handler
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const { MessageFlags } = require('discord.js');

module.exports = async (bot, interaction) => {
	const container = bot.client.container;
	const { models, logger } = container;
	const { KythiaBlacklist } = models;

	// Silently ignore interactions from blacklisted users
	const userBlacklisted = await KythiaBlacklist.getCache({
		where: { type: 'user', targetId: interaction.user?.id },
	}).catch(() => null);

	if (userBlacklisted) {
		logger.info(
			`Blocked interaction from blacklisted user: ${interaction.user?.tag} (${interaction.user?.id})`,
			{ label: 'interactionCreate:blacklist' },
		);
		// Silently acknowledge and discard so the user sees no response
		if (
			interaction.isRepliable() &&
			!interaction.replied &&
			!interaction.deferred
		) {
			try {
				await interaction.deferReply({ ephemeral: true });
				await interaction.deleteReply();
			} catch (_e) {}
		}
		return;
	}

	// Silently ignore interactions from blacklisted guilds
	if (interaction.guildId) {
		const guildBlacklisted = await KythiaBlacklist.getCache({
			where: { type: 'guild', targetId: interaction.guildId },
		}).catch(() => null);

		if (guildBlacklisted) {
			logger.info(
				`Blocked interaction from blacklisted guild: ${interaction.guildId}`,
				{ label: 'interactionCreate:blacklist' },
			);
			if (
				interaction.isRepliable() &&
				!interaction.replied &&
				!interaction.deferred
			) {
				try {
					await interaction.deferReply({ ephemeral: true });
					await interaction.deleteReply();
				} catch (_e) {}
			}
			return;
		}
	}

	// Global Maintenance Mode check
	const { redis, t, helpers } = container;
	const { simpleContainer, isOwner } = helpers.discord;
	const maintenanceReason = await redis.get('system:maintenance_mode');

	if (maintenanceReason && interaction.user) {
		// Allow owners to bypass
		// const isOwner = kythiaConfig.bot.owners.includes(interaction.user.id);
		if (!isOwner(interaction.user.id)) {
			if (
				interaction.isRepliable() &&
				!interaction.replied &&
				!interaction.deferred
			) {
				try {
					const desc = await t(interaction, 'system.maintenance.active', {
						reason: maintenanceReason,
					});
					const components = await simpleContainer(interaction, desc, {
						color: 'Red',
					});

					await interaction.reply({
						components,
						flags: MessageFlags.IsComponentsV2,
					});
				} catch (_e) {}
			}
			return;
		}
	}
};
