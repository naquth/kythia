/**
 * @namespace: addons/core/commands/tools/nick-prefix/_command.js
 * @type: Command Group Definition
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

const {
	SlashCommandBuilder,
	PermissionFlagsBits,
	InteractionContextType,
} = require('discord.js');

module.exports = {
	slashCommand: new SlashCommandBuilder()
		.setName('nickprefix')
		.setDescription('📛 Adds or removes a prefix from member nicknames.')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames)
		.setContexts(InteractionContextType.Guild),
	guildOnly: true,
	permissions: PermissionFlagsBits.ManageNicknames,
	botPermissions: PermissionFlagsBits.ManageNicknames,
};
