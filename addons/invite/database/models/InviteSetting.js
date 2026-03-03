/**
 * @namespace: addons/invite/database/models/InviteSetting.js
 * @type: Database Model
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.12.0-beta
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
