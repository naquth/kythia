/**
 * @namespace: addons/nsfw/buttons/nsfw_fav_0.js
 * @type: Button Handler
 * @copyright © 2026 kenndeclouv
 * @assistant chaa & graa
 * @version 1.0.0-rc
 */

const { handleFavorite } = require('../helpers/buttons.js');

module.exports = {
	execute: async (interaction, container) => {
		await handleFavorite(interaction, container, 0);
	},
};
