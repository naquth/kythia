/**
 * @namespace: addons/fun/register.js
 * @type: Module
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
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
