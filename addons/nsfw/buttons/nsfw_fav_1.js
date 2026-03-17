/**
 * @namespace: addons/nsfw/buttons/nsfw_fav_1.js
 * @type: Button Handler
 * @copyright © 2026 kenndeclouv
 * @assistant chaa & graa
 * @version 1.0.0-rc
 */

const { handleFavorite } = require('../helpers/buttons.js');

module.exports = {
	execute: async (interaction, container) => {
		await handleFavorite(interaction, container, 1);
	},
};
