/**
 * @namespace: addons/pro/database/models/DnsRecord.js
 * @type: Database Model
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

const { KythiaModel } = require('kythia-core');

class DnsRecord extends KythiaModel {
	static guarded = [];

	static associate(models) {
		if (models.Subdomain) {
			this.belongsTo(models.Subdomain, {
				foreignKey: 'subdomainId',
				as: 'subdomain',
			});
		}
	}

	static get structure() {
		return {
			options: { timestamps: false },
		};
	}
}

module.exports = DnsRecord;
