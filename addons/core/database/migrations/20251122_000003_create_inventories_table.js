/**
 * @namespace: addons/core/database/migrations/20251122_000003_create_inventories_table.js
 * @type: Database Migration
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

module.exports = {
	async up(queryInterface, DataTypes) {
		await queryInterface.createTable('inventories', {
			id: {
				type: DataTypes.INTEGER,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
			},
			userId: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			itemName: {
				type: DataTypes.STRING,
				allowNull: false,
			},
		});

		await queryInterface.addIndex('inventories', ['userId'], {
			name: 'inventories_userId',
		});
	},

	async down(queryInterface) {
		await queryInterface.dropTable('inventories');
	},
};
