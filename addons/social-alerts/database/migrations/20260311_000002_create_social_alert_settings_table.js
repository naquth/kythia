/**
 * @namespace: addons/social-alerts/database/migrations/20260311_000002_create_social_alert_settings_table.js
 * @type: Database Migration
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const { DataTypes } = require('sequelize');

module.exports = {
	up: async (queryInterface) => {
		await queryInterface.createTable('social_alert_settings', {
			guildId: {
				type: DataTypes.STRING(25),
				allowNull: false,
				primaryKey: true,
			},
			mentionRoleId: {
				type: DataTypes.STRING(25),
				allowNull: true,
			},
			createdAt: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: new Date(),
			},
			updatedAt: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: new Date(),
			},
		});
	},

	down: async (queryInterface) => {
		await queryInterface.dropTable('social_alert_settings');
	},
};
