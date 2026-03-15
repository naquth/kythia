/**
 * @namespace: addons/core/commands/utils/kyth/vote/_group.js
 * @type: Subcommand Group Definition
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

module.exports = {
	subcommandGroup: true,
	slashCommand: (group) =>
		group.setName('vote').setDescription('Manage user votes'),
};
