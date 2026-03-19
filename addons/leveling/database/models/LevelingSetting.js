/**
 * @namespace: addons/leveling/database/models/LevelingSetting.js
 * @type: Database Model
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const { KythiaModel } = require('kythia-core');

class LevelingSetting extends KythiaModel {
	static cacheKeys = [['guildId']];

	static guarded = [];
}

module.exports = LevelingSetting;
