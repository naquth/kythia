/**
 * @namespace: addons/pro/database/models/Monitor.js
 * @type: Database Model
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

const { KythiaModel } = require('kythia-core');

class Monitor extends KythiaModel {
	static guarded = [];

	static associate(models) {
		if (models.KythiaUser) {
			this.belongsTo(models.KythiaUser, {
				foreignKey: 'userId',
				as: 'kythiaUser',
			});
		}
	}

	static get structure() {
		return {
			options: { timestamps: false },
		};
	}
}

module.exports = Monitor;
