/**
 * @namespace: addons/activity/database/models/ActivityStat.js
 * @type: Database Model
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const { KythiaModel } = require('kythia-core');

class ActivityStat extends KythiaModel {
	static cacheKeys = [['guildId', 'userId']];
	static customInvalidationTags = ['ActivityStat:leaderboard'];
	static guarded = [];

	static get structure() {
		return {
			options: { timestamps: true },
		};
	}
}

module.exports = ActivityStat;
