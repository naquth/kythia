/**
 * @namespace: addons/ticket/buttons/ticket-confirm-close.js
 * @type: Module
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */
const { closeTicket } = require('../helpers');

module.exports = {
	execute: async (interaction, container) => {
		await closeTicket(interaction, container);
	},
};
