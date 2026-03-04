/**
 * @namespace: addons/invite/database/models/InviteHistory.js
 * @type: Database Model
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const { KythiaModel } = require('kythia-core');

class InviteHistory extends KythiaModel {
	static cacheKeys = [
		['guildId'],
		['guildId', 'memberId'],
		['guildId', 'memberId', 'status'],
	];
	static guarded = [];
	static table = 'invite_histories';

	static get structure() {
		return {
			options: { timestamps: true },
		};
	}
}

module.exports = InviteHistory;
