/**
 * @namespace: addons/economy/database/models/MarketOrder.js
 * @type: Database Model
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */
const { KythiaModel } = require('kythia-core');

class MarketOrder extends KythiaModel {
	static guarded = [];

	static get structure() {
		return {
			options: { timestamps: true },
		};
	}
}

module.exports = MarketOrder;
