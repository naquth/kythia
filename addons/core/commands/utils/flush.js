/**
 * @namespace: addons/core/commands/utils/flush.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

const {
	SlashCommandBuilder,
	InteractionContextType,
	MessageFlags,
	PermissionFlagsBits,
} = require('discord.js');

module.exports = {
	slashCommand: new SlashCommandBuilder()
		.setName('flush')
		.setDescription('💥 Flush Redis Cache (Global)')
		.setContexts(InteractionContextType.Guild)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	ownerOnly: true,
	mainGuildOnly: true,
	/**
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 * @param {KythiaDI.Container} container
	 */
	async execute(interaction, container) {
		const { logger, redis, helpers } = container;
		const { simpleContainer } = helpers.discord;

		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		if (!redis || redis.status !== 'ready') {
			const msg =
				'❌ Redis is not connected or is currently down. Unable to flush.';

			return interaction.editReply({
				components: simpleContainer(interaction, msg, {
					color: 'Red',
				}),
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
				components: simpleContainer(
					interaction,
					`## ✅ Redis flush successful!\n🧹 Cleared ${sizeBefore} keys.`,
					{
						color: 'Green',
					},
				),
			});
		} else {
			await interaction.editReply({
				components: simpleContainer(
					interaction,
					`## ⚠️ REDIS FLUSHALL\ncommand sent, but DB size is still: ${dbsize}.`,
					{
						color: 'Orange',
					},
				),
			});
		}
	},
};
