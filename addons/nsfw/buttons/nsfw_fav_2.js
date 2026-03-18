/**
 * @namespace: addons/nsfw/buttons/nsfw_fav_2.js
 * @type: Module
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const { handleFavorite } = require('../helpers/buttons.js');

module.exports = {
	execute: async (interaction, container) => {
		await handleFavorite(interaction, container, 2);
	},
};
