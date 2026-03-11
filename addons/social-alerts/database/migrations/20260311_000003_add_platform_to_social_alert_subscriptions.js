/**
 * @namespace: addons/social-alerts/database/migrations/20260311_000003_add_platform_to_social_alert_subscriptions.js
 * @type: Database Migration
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const { DataTypes } = require('sequelize');

module.exports = {
	up: async (queryInterface) => {
		// Add platform column — defaults to 'youtube' so all existing rows get the correct value
		await queryInterface.addColumn('social_alert_subscriptions', 'platform', {
			type: DataTypes.STRING(20),
			allowNull: false,
			defaultValue: 'youtube',
		});
	},

	down: async (queryInterface) => {
		await queryInterface.removeColumn('social_alert_subscriptions', 'platform');
	},
};
