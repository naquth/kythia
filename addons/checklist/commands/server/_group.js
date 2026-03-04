/**
 * @namespace: addons/checklist/commands/server/_group.js
 * @type: Subcommand Group Definition
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

module.exports = {
	subcommand: true,
	slashCommand: (group) =>
		group.setName('server').setDescription('Manage server checklist (public)'),
};
