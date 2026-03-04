/**
 * @namespace: addons/quest/database/migrations/20251124_000038_create_quest_configs_table.js
 * @type: Database Migration
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

module.exports = {
	async up(queryInterface, DataTypes) {
		await queryInterface.createTable('quest_configs', {
			guildId: {
				type: DataTypes.STRING,
				primaryKey: true,
				allowNull: false,
			},
			channelId: { type: DataTypes.STRING, allowNull: false },
			roleId: { type: DataTypes.STRING, allowNull: true },
			createdAt: { type: DataTypes.DATE, allowNull: false },
			updatedAt: { type: DataTypes.DATE, allowNull: false },
		});
	},
	async down(queryInterface) {
		await queryInterface.dropTable('quest_configs');
	},
};
