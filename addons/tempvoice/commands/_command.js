/**
 * @namespace: addons/tempvoice/commands/_command.js
 * @type: Command Group Definition
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
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
