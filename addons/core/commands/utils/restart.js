/**
 * @namespace: addons/core/commands/utils/restart.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

const {
	ButtonStyle,
	MessageFlags,
	ButtonBuilder,
	ContainerBuilder,
	ActionRowBuilder,
	SeparatorBuilder,
	TextDisplayBuilder,
	SlashCommandBuilder,
	SeparatorSpacingSize,
	InteractionContextType,
	PermissionFlagsBits,
} = require('discord.js');

let restartTimer = null;

module.exports = {
	slashCommand: new SlashCommandBuilder()
		.setName('restart')
		.setDescription('🔁 Restarts the bot with optional scheduler.')
		.addIntegerOption((option) =>
			option
				.setName('minutes')
				.setDescription('⏱️ Restart in X minutes (e.g. 30)')
				.setMinValue(1),
		)
		.addStringOption((option) =>
			option
				.setName('time')
				.setDescription(
					'⏰ Restart at specific time (Format HH:mm, e.g. 23:59)',
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
		const { t, kythiaConfig, helpers } = container;
		const { convertColor } = helpers.color;
		const { simpleContainer } = helpers.container;

		const minutes = interaction.options.getInteger('minutes');
		const timeStr = interaction.options.getString('time');

		if (minutes || timeStr) {
			let delayMs = 0;
			let targetTime = new Date();
			let mode = '';

			if (timeStr) {
				const [hours, mins] = timeStr.split(':').map(Number);
				if (
					Number.isNaN(hours) ||
					Number.isNaN(mins) ||
					hours > 23 ||
					mins > 59
				) {
					const msg = '❌ Invalid time format! Use HH:mm (e.g. 23:59)';
					const components = await simpleContainer(interaction, msg, {
						color: 'Red',
					});
					return interaction.editReply({
						components,
						flags: MessageFlags.IsComponentsV2,
					});
				}

				targetTime.setHours(hours, mins, 0, 0);

				if (targetTime < new Date()) {
					targetTime.setDate(targetTime.getDate() + 1);
				}

				delayMs = targetTime.getTime() - Date.now();
				mode = `at **${timeStr}**`;
			} else {
				delayMs = minutes * 60 * 1000;
				targetTime = new Date(Date.now() + delayMs);
				mode = `in **${minutes} minutes**`;
			}

			if (restartTimer) clearTimeout(restartTimer);

			restartTimer = setTimeout(() => {
				console.log('[Scheduler] Restarting system now...');
				process.exit(0);
			}, delayMs);

			interaction.client.kythiaRestartTimestamp = targetTime.getTime();

			const scheduleContainer = new ContainerBuilder().setAccentColor(
				convertColor(kythiaConfig.bot.color, { from: 'hex', to: 'decimal' }),
			);

			scheduleContainer.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(
					`⏱️ **Restart Scheduled**\n\nSystem will restart ${mode}.\nTarget: <t:${Math.floor(targetTime.getTime() / 1000)}:R>`,
				),
			);

			scheduleContainer.addSeparatorComponents(
				new SeparatorBuilder()
					.setSpacing(SeparatorSpacingSize.Small)
					.setDivider(true),
			);

			scheduleContainer.addActionRowComponents(
				new ActionRowBuilder().addComponents(
					new ButtonBuilder()
						.setCustomId('cancel_schedule')
						.setLabel('Cancel Schedule')
						.setStyle(ButtonStyle.Secondary),
				),
			);

			const msg = await interaction.reply({
				components: [scheduleContainer],
				flags: MessageFlags.IsComponentsV2,
			});

			const collector = msg.createMessageComponentCollector({
				filter: (i) =>
					i.user.id === interaction.user.id && i.customId === 'cancel_schedule',
				time: delayMs < 2147483647 ? delayMs : 2147483647,
			});

			collector.on('collect', async (i) => {
				if (restartTimer) {
					clearTimeout(restartTimer);
					restartTimer = null;
				}

				interaction.client.kythiaRestartTimestamp = null;

				const msg = '✅ **Scheduled restart cancelled.**';
				const components = await simpleContainer(interaction, msg, {
					color: 'Green',
				});
				await i.update({
					components: components,
					flags: MessageFlags.IsComponentsV2,
				});
				collector.stop();
			});

			return;
		}

		const restartContainer = new ContainerBuilder().setAccentColor(
			convertColor(kythiaConfig.bot.color, { from: 'hex', to: 'decimal' }),
		);
		restartContainer.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(
				await t(interaction, 'core.utils.restart.embed.confirm.desc'),
			),
		);
		restartContainer.addSeparatorComponents(
			new SeparatorBuilder()
				.setSpacing(SeparatorSpacingSize.Small)
				.setDivider(true),
		);
		restartContainer.addActionRowComponents(
			new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId('confirm_restart')
					.setLabel(await t(interaction, 'core.utils.restart.button.confirm'))
					.setStyle(ButtonStyle.Danger),
				new ButtonBuilder()
					.setCustomId('cancel_restart')
					.setLabel(await t(interaction, 'core.utils.restart.button.cancel'))
					.setStyle(ButtonStyle.Secondary),
			),
		);

		await interaction.reply({
			components: [restartContainer],
			flags: MessageFlags.IsComponentsV2,
		});

		const collector = interaction.channel.createMessageComponentCollector({
			filter: (i) => i.user.id === interaction.user.id,
			time: 15000,
		});

		collector.on('collect', async (i) => {
			collector.stop('handled');

			if (i.customId === 'cancel_restart') {
				const cancelContainer = new ContainerBuilder().setAccentColor(
					convertColor(kythiaConfig.bot.color, { from: 'hex', to: 'decimal' }),
				);
				cancelContainer.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						await t(interaction, 'core.utils.restart.embed.cancelled.desc'),
					),
				);
				try {
					await i.update({
						components: [cancelContainer],
						flags: MessageFlags.IsComponentsV2,
					});
				} catch {}
			} else if (i.customId === 'confirm_restart') {
				const loadingContainer = new ContainerBuilder().setAccentColor(
					convertColor(kythiaConfig.bot.color, { from: 'hex', to: 'decimal' }),
				);
				loadingContainer.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						await t(interaction, 'core.utils.restart.embed.restarting.desc'),
					),
				);
				try {
					await i.update({
						components: [loadingContainer],
						flags: MessageFlags.IsComponentsV2,
					});
				} catch {}
				setTimeout(() => process.exit(0), 1000);
			}
		});

		collector.on('end', async (_collected, reason) => {
			if (reason === 'time') {
				const timeoutContainer = new ContainerBuilder().setAccentColor(
					convertColor(kythiaConfig.bot.color, { from: 'hex', to: 'decimal' }),
				);
				timeoutContainer.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						await t(interaction, 'core.utils.restart.embed.timeout.desc'),
					),
				);
				await interaction.editReply({
					components: [timeoutContainer],
					flags: MessageFlags.IsComponentsV2,
				});
			}
		});
	},
};
