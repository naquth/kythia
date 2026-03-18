/**
 * @namespace: addons/modmail/modals/mm-close-reason-submit.js
 * @type: Module
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const { closeModmail } = require('../helpers');

module.exports = {
	execute: (interaction, container) => {
		const reason = interaction.fields.getTextInputValue('reason');
		return closeModmail(interaction, container, reason);
	},
};
