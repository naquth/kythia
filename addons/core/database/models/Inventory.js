/**
 * @namespace: addons/core/database/models/Inventory.js
 * @type: Database Model
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const { KythiaModel } = require('kythia-core');

class Inventory extends KythiaModel {
	static cacheKeys = [['userId']];

	static guarded = [];
}

module.exports = Inventory;
