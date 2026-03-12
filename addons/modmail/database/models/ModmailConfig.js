/**
 * @namespace: addons/modmail/database/models/ModmailConfig.js
 * @type: Database Model
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0
 */

const { KythiaModel } = require('kythia-core');

class ModmailConfig extends KythiaModel {
	static guarded = [];

	static get structure() {
		return {
			options: { timestamps: false },
		};
	}
}

module.exports = ModmailConfig;
