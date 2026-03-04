/**
 * @namespace: addons/welcomer/commands/_command.js
 * @type: Command Group Definition
 * @copyright © 2026 kenndeclouv
 * @assistant chaa & graa
 * @version 1.0.0
 */

const {
	InteractionContextType,
	PermissionFlagsBits,
	SlashCommandBuilder,
} = require('discord.js');

module.exports = {
	slashCommand: new SlashCommandBuilder()
		.setName('welcomer')
		.setDescription('👋 Configure the welcome & farewell system')
		.setContexts(InteractionContextType.Guild)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
	guildOnly: true,
	permissions: [PermissionFlagsBits.ManageGuild],
};
