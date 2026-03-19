const { MessageFlags } = require('discord.js');

module.exports = {
	name: 'blacklist',
	priority: 5, // High priority, run early before most other checks

	/**
	 * @param {import('discord.js').Interaction} interaction
	 * @param {any} command
	 * @param {KythiaDI.Container} container
	 * @returns {Promise<boolean>}
	 */
	async execute(interaction, _command, container) {
		const { models, logger, redis } = container;
		const { KythiaBlacklist } = models;

		// Helper to check and cache blacklist status
		const checkBlacklist = async (type, targetId) => {
			const cacheKey = `kythia:middleware:blacklist:${type}:${targetId}`;
			const isBlacklisted = await redis.get(cacheKey);

			if (isBlacklisted !== null) {
				return isBlacklisted === 'true';
			}

			// Not in cache, check DB
			const record = await KythiaBlacklist.getCache({
				where: { type, targetId },
			}).catch(() => null);

			const blacklisted = !!record;
			// Cache for 15 minutes (900 seconds)
			await redis.set(cacheKey, blacklisted ? 'true' : 'false', 'EX', 900);

			return blacklisted;
		};

		// 1. Check if User is blacklisted
		if (interaction.user) {
			const userBlacklisted = await checkBlacklist('user', interaction.user.id);

			if (userBlacklisted) {
				logger.info(
					`Blocked interaction from blacklisted user: ${interaction.user.tag} (${interaction.user.id})`,
					{ label: 'middleware:blacklist' },
				);

				if (interaction.isRepliable()) {
					try {
						const msg = await container.t(
							interaction,
							'common.error.blacklisted',
							{
								defaultValue:
									'You are currently blacklisted from using Kythia.',
							},
						);
						const components = await container.helpers.discord.simpleContainer(
							interaction,
							msg,
							{ color: 'Red' },
						);
						await interaction.reply({
							components,
							flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
						});
					} catch (_e) {
						await interaction
							.reply({
								content: 'You are currently blacklisted from using Kythia.',
								flags: MessageFlags.Ephemeral,
							})
							.catch(() => {});
					}
				}
				return false; // Stop execution
			}
		}

		// 2. Check if Guild is blacklisted
		if (interaction.guildId) {
			const guildBlacklisted = await checkBlacklist(
				'guild',
				interaction.guildId,
			);

			if (guildBlacklisted) {
				logger.info(
					`Blocked interaction from blacklisted guild: ${interaction.guildId}`,
					{ label: 'middleware:blacklist' },
				);

				if (interaction.isRepliable()) {
					try {
						const msg = await container.t(
							interaction,
							'common.error.blacklisted_guild',
							{
								defaultValue:
									'This server is currently blacklisted from using Kythia.',
							},
						);
						const components = await container.helpers.discord.simpleContainer(
							interaction,
							msg,
							{ color: 'Red' },
						);
						await interaction.reply({
							components,
							flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
						});
					} catch (_e) {
						await interaction
							.reply({
								content:
									'This server is currently blacklisted from using Kythia.',
								flags: MessageFlags.Ephemeral,
							})
							.catch(() => {});
					}
				}
				return false; // Stop execution
			}
		}

		return true; // Allow execution
	},
};
