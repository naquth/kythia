/**
 * @namespace: addons/core/commands/utils/kyth/flush.js
 * @type: Module
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const { MessageFlags } = require('discord.js');

module.exports = {
	subcommand: true,
	slashCommand: (subcommand) =>
		subcommand.setName('flush').setDescription('💥 Flush Redis Cache (Global)'),
	/**
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 * @param {KythiaDI.Container} container
	 */
	async execute(interaction, container) {
		const { logger, redis, helpers } = container;
		const { simpleContainer } = helpers.discord;

		await interaction.deferReply({
			flags: MessageFlags.Ephemeral,
		});

		if (!redis || redis.status !== 'ready') {
			const msg =
				'❌ Redis is not connected or is currently down. Unable to flush.';

			return interaction.editReply({
				components: await simpleContainer(interaction, msg, {
					color: 'Red',
				}),
				flags: MessageFlags.IsComponentsV2,
			});
		}

		logger.debug('[REDIS FLUSH] Using existing shared container connection...');

		const pong = await redis.ping();
		logger.debug(`[REDIS FLUSH] Redis ping response: ${pong}`);

		logger.debug('[REDIS FLUSH] Attempting to FLUSHALL...');

		const sizeBefore = await redis.dbsize();

		const result = await redis.flushall();
		logger.debug(`[REDIS FLUSH] FLUSHALL result: ${result}`);

		const dbsize = await redis.dbsize();
		logger.debug(`[REDIS FLUSH] dbsize after FLUSHALL: ${dbsize}`);

		if (result === 'OK' && dbsize === 0) {
			await interaction.editReply({
				components: await simpleContainer(
					interaction,
					`## ✅ Redis flush successful!\n🧹 Cleared ${sizeBefore} keys.`,
					{
						color: 'Green',
					},
				),
				flags: MessageFlags.IsComponentsV2,
			});
		} else {
			await interaction.editReply({
				components: await simpleContainer(
					interaction,
					`## ⚠️ REDIS FLUSHALL\ncommand sent, but DB size is still: ${dbsize}.`,
					{
						color: 'Orange',
					},
				),
				flags: MessageFlags.IsComponentsV2,
			});
		}
	},
};
