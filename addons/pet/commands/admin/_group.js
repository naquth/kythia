/**
 * @namespace: addons/pet/commands/admin/_group.js
 * @type: Subcommand Group Definition
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

module.exports = {
	subcommand: true,
	slashCommand: (group) =>
		group
			.setName('admin')
			.setDescription('Administrative pet management commands.'),
	mainGuild: true,
	teamOnly: true,
};
