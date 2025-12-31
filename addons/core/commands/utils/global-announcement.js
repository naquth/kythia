/**
 * @namespace: addons/core/commands/utils/global-announcement.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

const {
	ContainerBuilder,
	TextDisplayBuilder,
	SeparatorBuilder,
	SeparatorSpacingSize,
	ModalBuilder,
	MessageFlags,
	TextInputStyle,
	TextInputBuilder,
	ActionRowBuilder,
	PermissionFlagsBits,
	SlashCommandBuilder,
	InteractionContextType,
} = require('discord.js');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = {
	slashCommand: new SlashCommandBuilder()
		.setName('global-announcement')
		.setDescription('Send an announcement to all servers the bot has joined.')
		.addSubcommand((sub) =>
			sub
				.setName('simple')
				.setDescription(
					'Send a simple announcement using a simple components v2.',
				),
		)
		.addSubcommand((sub) =>
			sub
				.setName('complex')
				.setDescription(
					'Send a complex announcement by pasting a JSON payload.',
				),
		)
		.setContexts(InteractionContextType.Guild)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	ownerOnly: true,
	mainGuildOnly: true,

	/**
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 * @param {KythiaDI.Container} container
	 */
	async execute(interaction, container) {
		const { logger, kythiaConfig, helpers } = container;

		const subcommand = interaction.options.getSubcommand();

		if (subcommand === 'simple') {
			const modal = new ModalBuilder()
				.setCustomId(`announcement-modal-embed_${interaction.user.id}`)
				.setTitle('📝 Create Embed Announcement');

			const titleInput = new TextInputBuilder()
				.setCustomId('announcement-title')
				.setLabel('Title')
				.setStyle(TextInputStyle.Short)
				.setRequired(true);
			const contentInput = new TextInputBuilder()
				.setCustomId('announcement-content')
				.setLabel('Content (Markdown)')
				.setStyle(TextInputStyle.Paragraph)
				.setRequired(true);

			modal.addComponents(
				new ActionRowBuilder().addComponents(titleInput),
				new ActionRowBuilder().addComponents(contentInput),
			);
			await interaction.showModal(modal);

			const modalSubmit = await interaction
				.awaitModalSubmit({
					filter: (i) => i.customId.startsWith('announcement-modal-embed_'),
					time: 300_000,
				})
				.catch(() => null);

			if (!modalSubmit)
				return logger.warn('Embed announcement modal timed out.');

			await modalSubmit.deferReply({ ephemeral: true });

			const title = modalSubmit.fields.getTextInputValue('announcement-title');
			const content = modalSubmit.fields.getTextInputValue(
				'announcement-content',
			);
			const { convertColor } = helpers.color;
			const container = new ContainerBuilder()
				.setAccentColor(
					convertColor(kythiaConfig.bot.color, { from: 'hex', to: 'decimal' }),
				)
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(`## 📢 ${title}\n\n${content}`),
				)
				.addSeparatorComponents(
					new SeparatorBuilder()
						.setSpacing(SeparatorSpacingSize.Small)
						.setDivider(true),
				)
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						`Announcement from Developer ${interaction.client.user.username} • <t:${Math.floor(Date.now() / 1000)}:R>`,
					),
				);

			const payload = {
				components: [container],
				flags: MessageFlags.IsComponentsV2,
			};
			await this.sendToAllGuilds(modalSubmit, payload);
		} else if (subcommand === 'complex') {
			const modal = new ModalBuilder()
				.setCustomId(`announcement-modal-container_${interaction.user.id}`)
				.setTitle('📝 Create Container Announcement');

			const jsonInput = new TextInputBuilder()
				.setCustomId('announcement-json')
				.setLabel('Paste JSON Payload Here')
				.setStyle(TextInputStyle.Paragraph)
				.setPlaceholder('Copy the JSON from Discohook and paste it here...')
				.setRequired(true);

			modal.addComponents(new ActionRowBuilder().addComponents(jsonInput));
			await interaction.showModal(modal);

			const modalSubmit = await interaction
				.awaitModalSubmit({
					filter: (i) => i.customId.startsWith('announcement-modal-container_'),
					time: 300_000,
				})
				.catch(() => null);

			if (!modalSubmit)
				return logger.warn('Container announcement modal timed out.');

			await modalSubmit.deferReply({ ephemeral: true });

			const jsonString =
				modalSubmit.fields.getTextInputValue('announcement-json');
			let payload;
			try {
				payload = JSON.parse(jsonString);
			} catch (err) {
				return modalSubmit.editReply({
					content: `❌ Invalid JSON! Please make sure you copied everything correctly.\n\nError: \`${err.message}\``,
					ephemeral: true,
				});
			}
			await this.sendToAllGuilds(modalSubmit, payload);
		}
	},

	async sendToAllGuilds(interaction, payload) {
		const container = interaction.container;
		const { models, logger } = container;
		const { ServerSetting } = models;
		await interaction.editReply({
			content: '⏳ Starting to send the announcement to all servers...',
			ephemeral: true,
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
				? `\n\n**Failed Server List:**\n\`\`\`${failedServers.slice(0, 10).join('\n')}\`\`\``
				: '';

		const description =
			`**Successfully Sent:** ${successCount} server(s)\n` +
			`**Failed to Send:** ${failCount} server(s)` +
			failList;

		const { simpleContainer } = container.helpers.discord;

		const components = await simpleContainer(
			interaction,
			`## ✅ Announcement Delivery Report\n${description}`,
			{ color: 'Green' },
		);

		await interaction.editReply({
			components,
			flags: MessageFlags.IsComponentsV2,
		});
	},
};
