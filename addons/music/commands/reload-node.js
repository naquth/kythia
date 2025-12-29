/**
 * @namespace: addons/music/commands/reload-node.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

const {
	SlashCommandBuilder,
	InteractionContextType,
	PermissionFlagsBits,
} = require('discord.js');
const { reloadLavalinkNodes } = require('../helpers/reload-node');

module.exports = {
	slashCommand: new SlashCommandBuilder()
		.setName('reloadnode')
		.setDescription('🔄️ Reload Lavalink nodes and configuration')
		.setContexts(InteractionContextType.Guild)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	ownerOnly: true,
	mainGuildOnly: true,

	async execute(interaction, container) {
		const { logger } = container;
		await interaction.deferReply({ ephemeral: true });

		try {
			await reloadLavalinkNodes(interaction.client);

			await interaction.followUp({
				content: '✅ Config and Lavalink nodes have been reloaded!',
			});
		} catch (error) {
			logger.error('❌ Failed to reload nodes:', error);

			await interaction.followUp({
				content: `❌ Failed to reload nodes: ${error.message}`,
			});
		}
	},
};
