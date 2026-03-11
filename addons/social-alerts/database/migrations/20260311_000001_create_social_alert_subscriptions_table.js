/**
 * @namespace: addons/social-alerts/database/migrations/20260311_000001_create_social_alert_subscriptions_table.js
 * @type: Database Migration
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const { DataTypes } = require('sequelize');

module.exports = {
	up: async (queryInterface) => {
		await queryInterface.createTable('social_alert_subscriptions', {
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			guildId: {
				type: DataTypes.STRING(25),
				allowNull: false,
			},
			discordChannelId: {
				type: DataTypes.STRING(25),
				allowNull: false,
			},
			youtubeChannelId: {
				type: DataTypes.STRING(50),
				allowNull: false,
			},
			youtubeChannelName: {
				type: DataTypes.STRING(100),
				allowNull: false,
			},
			youtubeThumbnailUrl: {
				type: DataTypes.TEXT,
				allowNull: true,
			},
			message: {
				type: DataTypes.TEXT,
				allowNull: true,
			},
			lastVideoId: {
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

		// One subscription per YouTube channel per guild
		await queryInterface.addIndex(
			'social_alert_subscriptions',
			['guildId', 'youtubeChannelId'],
			{ unique: true },
		);

		// Fast lookup by guild
		await queryInterface.addIndex('social_alert_subscriptions', ['guildId']);
	},

	down: async (queryInterface) => {
		await queryInterface.dropTable('social_alert_subscriptions');
	},
};
