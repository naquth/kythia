/**
 * @namespace: addons/invite/database/models/InviteSetting.js
 * @type: Database Model
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const { KythiaModel } = require('kythia-core');

class InviteSetting extends KythiaModel {
	static cacheKeys = [['guildId']];
	static guarded = [];
	static table = 'invite_settings';

	static get structure() {
		return {
			options: { timestamps: true },
		};
	}
}

module.exports = InviteSetting;
