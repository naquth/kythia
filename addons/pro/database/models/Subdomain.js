/**
 * @namespace: addons/pro/database/models/Subdomain.js
 * @type: Database Model
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

const { KythiaModel } = require('kythia-core');

class Subdomain extends KythiaModel {
	static guarded = [];

	static associate(models) {
		if (models.KythiaUser) {
			this.belongsTo(models.KythiaUser, {
				foreignKey: 'userId',
				as: 'kythiaUser',
			});
		}
		if (models.DnsRecord) {
			this.hasMany(models.DnsRecord, {
				foreignKey: 'subdomainId',
				as: 'dnsRecords',
				onDelete: 'CASCADE',
			});
		}
	}

	static get structure() {
		return {
			options: { timestamps: true },
		};
	}
}

module.exports = Subdomain;
