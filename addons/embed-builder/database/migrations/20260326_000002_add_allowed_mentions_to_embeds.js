/**
 * @namespace: addons/embed-builder/database/migrations/20260326_000002_add_allowed_mentions_to_embeds.js
 * @type: Database Migration
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

module.exports = {
	async up(queryInterface, DataTypes) {
		await queryInterface.addColumn('embed_builders', 'allowedMentions', {
			// Stored as JSON: null means "everyone" (default), or {parse:[]} / {parse:['roles']} etc.
			type: DataTypes.JSON,
			allowNull: true,
			defaultValue: null,
		});
	},

	async down(queryInterface) {
		await queryInterface.removeColumn('embed_builders', 'allowedMentions');
	},
};
