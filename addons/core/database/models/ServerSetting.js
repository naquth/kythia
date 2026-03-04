/**
 * @namespace: addons/core/database/models/ServerSetting.js
 * @type: Database Model
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

// koneksi sequelize
const { KythiaModel } = require('kythia-core');

class ServerSetting extends KythiaModel {
	static cacheKeys = [['guildId']];

	static guarded = [];
}

module.exports = ServerSetting;
