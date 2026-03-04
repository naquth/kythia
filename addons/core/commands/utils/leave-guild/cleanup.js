/**
 * @namespace: addons/core/commands/utils/leave-guild/cleanup.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

const { MessageFlags } = require('discord.js');

module.exports = {
	subcommand: true,
	slashCommand: (subcommand) =>
		subcommand
			.setName('cleanup')
			.setDescription('Mass leave guilds with member count below threshold.')
			.addIntegerOption((option) =>
				option
					.setName('min_member')
					.setDescription(
						'Threshold: Leave guilds with LESS members than this.',
					)
					.setRequired(true),
			)
			.addStringOption((option) =>
				option
					.setName('message')
					.setDescription('Last message to send before leaving (Optional).'),
			)
			.addStringOption((option) =>
				option
					.setName('except')
					.setDescription(
						'Comma-separated guild IDs to additionally protect from being left (Optional).',
					),
			),

	/**
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 * @param {KythiaDI.Container} container
	 */
	async execute(interaction, container) {
		const { t, kythiaConfig, helpers, logger } = container;
		const { simpleContainer } = helpers.discord;
		const { client } = interaction;

		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		const exceptRaw = interaction.options.getString('except') || '';
		const extraExcept = exceptRaw
			.split(',')
			.map((id) => id.trim())
			.filter(Boolean);

		const SAFE_GUILDS = [
			kythiaConfig.bot.mainGuildId,
			kythiaConfig.bot.devGuildId,
			interaction?.guild?.id,
			...extraExcept,
		].filter(Boolean);

		const threshold = interaction.options.getInteger('min_member');
		const customMsg =
			interaction.options.getString('message') ||
			(await t(interaction, 'core.utils.leave-guild.cleanup.goodbye', {
				threshold,
			}));

		const customMsgContainer = await simpleContainer(interaction, customMsg);

		const targets = client.guilds.cache.filter(
			(g) => g.memberCount < threshold && !SAFE_GUILDS.includes(g.id),
		);

		if (targets.size === 0) {
			const components = await simpleContainer(
				interaction,
				await t(interaction, 'core.utils.leave-guild.cleanup.empty', {
					threshold,
				}),
			);
			return interaction.editReply({
				components,
				flags: MessageFlags.IsComponentsV2,
			});
		}

		let leftCount = 0;
		let errorCount = 0;
		const leftNames = [];

		for (const [, guild] of targets) {
			try {
				let channel = guild.systemChannel;
				if (!channel) {
					channel = guild.channels.cache.find(
						(c) =>
							c.isTextBased() &&
							c.permissionsFor(guild.members.me).has('SendMessages') &&
							(c.name.includes('general') ||
								c.name.includes('chat') ||
								c.name.includes('obrolan')),
					);
				}
				if (!channel) {
					channel = guild.channels.cache.find(
						(c) =>
							c.isTextBased() &&
							c.permissionsFor(guild.members.me).has('SendMessages'),
					);
				}
				if (channel) {
					await channel
						.send({
							components: customMsgContainer,
							flags: MessageFlags.IsComponentsV2,
						})
						.catch(() => null);
				}
				await guild.leave();
				leftCount++;
				leftNames.push(`${guild.name} (${guild.memberCount})`);
				await new Promise((r) => setTimeout(r, 1000));
			} catch (e) {
				logger.error(`Failed to cleanup guild ${guild.name}:`, e, {
					label: 'core:utils:leave-guild',
				});
				errorCount++;
			}
		}

		let desc = await t(interaction, 'core.utils.leave-guild.cleanup.success', {
			threshold,
			leftCount,
			errorCount,
		});
		if (leftNames.length > 0) {
			const sliced = leftNames.slice(0, 10);
			const extra =
				leftNames.length > 10
					? await t(interaction, 'core.utils.leave-guild.cleanup.more', {
							count: leftNames.length - 10,
						})
					: '';
			desc += await t(interaction, 'core.utils.leave-guild.cleanup.list', {
				names: sliced.join('\n') + (extra ? `\n${extra}` : ''),
			});
		}

		const components = await simpleContainer(interaction, desc);
		return interaction.editReply({
			components,
			flags: MessageFlags.IsComponentsV2,
		});
	},
};
