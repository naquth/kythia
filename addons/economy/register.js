/**
 * @namespace: addons/economy/register.js
 * @type: Module
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const { initializeOrderProcessing } = require('./helpers/orderProcessor');
module.exports = {
	initialize(bot) {
		const summery = [];
		initializeOrderProcessing(bot);
		summery.push('   └─ Task: Order processing');
		return summery;
	},
};
