/**
 * @namespace: addons/modmail/buttons/mm-confirm-close.js
 * @type: Module
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0
 *
 * Confirms the close action. The reason is encoded in the customId after ":".
 * customId format: "mm-confirm-close:{encodedReason}"
 */

const { closeModmail } = require('../helpers');

module.exports = {
	execute: (interaction, container) => {
		const rawReason = interaction.customId.split(':').slice(1).join(':');
		const reason = rawReason ? decodeURIComponent(rawReason) : null;
		return closeModmail(interaction, container, reason);
	},
};
