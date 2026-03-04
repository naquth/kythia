/**
 * @namespace: addons/tempvoice/commands/_command.js
 * @type: Command Group Definition
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */
const {
	InteractionContextType,
	SlashCommandBuilder,
	PermissionFlagsBits,
} = require('discord.js');

module.exports = {
	slashCommand: new SlashCommandBuilder()
		.setName('tempvoice')
		.setDescription('🎧 Manage and customize the Kythia TempVoice system')
		.setContexts(InteractionContextType.Guild)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
};
