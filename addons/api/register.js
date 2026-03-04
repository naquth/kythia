/**
 * @namespace: addons/api/register.js
 * @type: Module
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const initializeServer = require('./server');

module.exports = {
	async initialize(bot) {
		const summary = [];
		const server = await initializeServer(bot);
		if (server) {
			summary.push('   └─ 🚀 Initializing API...');
		}

		return summary;
	},
};
