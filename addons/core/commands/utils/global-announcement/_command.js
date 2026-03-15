/**
 * @namespace: addons/core/commands/utils/global-announcement/_command.js
 * @type: Command Group Definition
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const {
	MessageFlags,
	PermissionFlagsBits,
	SlashCommandBuilder,
	InteractionContextType,
} = require('discord.js');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = {
	slashCommand: new SlashCommandBuilder()
		.setName('global-announcement')
		.setDescription('Send an announcement to all servers the bot has joined.')
		.setContexts(InteractionContextType.Guild)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	ownerOnly: true,
	mainGuildOnly: true,

	/**
	 * Shared function to broadcast a payload to all guilds.
	 * @param {import('discord.js').ModalSubmitInteraction} interaction
	 * @param {object} payload
	 */
	async sendToAllGuilds(interaction, payload) {
		const container = interaction.client.container;
		const { t, models, logger } = container;
		const { ServerSetting } = models;

		await interaction.editReply({
			content: await t(
				interaction,
				'core.utils.global-announcement.delivery.start',
			),
			flags: MessageFlags.Ephemeral,
		});

		const guilds = interaction.client.guilds.cache;
		let successCount = 0;
		let failCount = 0;
		const failedServers = [];

		for (const guild of guilds.values()) {
			let targetChannel = null;
			try {
				const settings = await ServerSetting.getCache({ guildId: guild.id });
				if (settings?.announcementChannelId) {
					targetChannel = await guild.channels
						.fetch(settings.announcementChannelId)
						.catch(() => null);
				}
				if (!targetChannel) {
					const channels = await guild.channels.fetch();
					const possibleChannels = channels.filter(
						(ch) =>
							ch.type === 0 &&
							ch
								.permissionsFor(guild.members.me)
								.has(PermissionFlagsBits.SendMessages) &&
							ch
								.permissionsFor(guild.members.me)
								.has(PermissionFlagsBits.ViewChannel),
					);
					const channelNamesPriority = [
						'kythia-updates',
						'kythia',
						'update',
						'bot-updates',
						'announcements',
						'pengumuman',
						'general',
						'chat',
					];
					for (const name of channelNamesPriority) {
						targetChannel = possibleChannels.find((ch) =>
							ch.name.includes(name),
						);
						if (targetChannel) break;
					}
				}
				if (targetChannel) {
					await targetChannel.send(payload);
					successCount++;
				} else {
					failCount++;
					failedServers.push(`${guild.name}`);
				}
			} catch (err) {
				logger.warn(
					`Failed to send announcement to guild: ${guild.name}. Reason: ${err.message}`,
				);
				failCount++;
				failedServers.push(`${guild.name}`);
			}
			await sleep(1000);
		}

		const failList =
			failedServers.length > 0
				? await t(
						interaction,
						'core.utils.global-announcement.delivery.report.list',
						{
							names: failedServers.slice(0, 10).join('\n'),
						},
					)
				: '';

		const description =
			(await t(
				interaction,
				'core.utils.global-announcement.delivery.report.success',
				{
					count: successCount,
				},
			)) +
			'\n' +
			(await t(
				interaction,
				'core.utils.global-announcement.delivery.report.failed',
				{
					count: failCount,
				},
			)) +
			failList;

		const { simpleContainer } = container.helpers.discord;
		const components = await simpleContainer(
			interaction,
			(await t(
				interaction,
				'core.utils.global-announcement.delivery.report.title',
			)) +
				'\n' +
				description,
			{ color: 'Green' },
		);

		await interaction.editReply({
			components,
			flags: MessageFlags.IsComponentsV2,
		});
	},
};
