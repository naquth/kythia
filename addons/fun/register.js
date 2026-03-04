/**
 * @namespace: addons/fun/register.js
 * @type: Module
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */
const marryButtonHandler = require('./buttons/marry.js');

const initialize = (bot) => {
	const summary = [];
	bot.registerButtonHandler('marry', marryButtonHandler.execute);

	summary.push("  └─ Button: 'marry'");

	return summary;
};

module.exports = {
	initialize,
};
