/**
 * @namespace: addons/pet/commands/admin/_group.js
 * @type: Subcommand Group Definition
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
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
