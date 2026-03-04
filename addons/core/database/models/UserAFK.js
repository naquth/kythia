/**
 * @namespace: addons/core/database/models/UserAFK.js
 * @type: Database Model
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const { KythiaModel } = require('kythia-core');

class UserAFK extends KythiaModel {
	static cacheKeys = [['userId', 'guildId']];

	static table = 'user_afks';

	static guarded = [];
}

module.exports = UserAFK;
