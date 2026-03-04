/**
 * @namespace: addons/streak/database/models/Streak.js
 * @type: Database Model
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const { KythiaModel } = require('kythia-core');

class Streak extends KythiaModel {
	static customInvalidationTags = ['Streak:leaderboard'];
	static guarded = [];

	static get structure() {
		return {
			options: { timestamps: true },
		};
	}
}

module.exports = Streak;
