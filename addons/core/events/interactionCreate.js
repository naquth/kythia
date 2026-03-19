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
