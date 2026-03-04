/**
 * @namespace: addons/economy/commands/account/_group.js
 * @type: Subcommand Group Definition
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

module.exports = {
	subcommand: true,
	slashCommand: (group) =>
		group.setName('account').setDescription('Manage your kythia bank account.'),
};
