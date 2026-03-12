/**
 * @namespace: addons/modmail/database/models/Modmail.js
 * @type: Database Model
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0
 */

const { KythiaModel } = require('kythia-core');

class Modmail extends KythiaModel {
	static guarded = [];

	static get structure() {
		return {
			options: { timestamps: true },
		};
	}
}

module.exports = Modmail;
