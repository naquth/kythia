/**
 * @namespace: addons/core/commands/moderation/pin.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */
const { PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
	slashCommand: (subcommand) =>
		subcommand
			.setName('pin')
			.setDescription('📌 Pins a message in the channel.')
			.addStringOption((option) =>
				option
					.setName('message_id')
					.setDescription('The ID of the message to pin')
					.setRequired(true),
			),
	permissions: PermissionFlagsBits.ManageMessages,
	botPermissions: PermissionFlagsBits.ManageMessages,
	async execute(interaction, container) {
		const { t, helpers, kythiaConfig } = container;
		const { createContainer, simpleContainer } = helpers.discord;

		await interaction.deferReply({ ephemeral: true });

		const messageId = interaction.options.getString('message_id');

		try {
			const message = await interaction.channel.messages.fetch(messageId);
			if (!message) {
				const reply = await simpleContainer(
					interaction,
					await t(interaction, 'core.moderation.pin.not.found'),
					{ color: 'Red' },
				);
				return interaction.editReply({
					components: reply,
					flags: MessageFlags.IsComponentsV2,
					ephemeral: true,
				});
			}

			if (message.pinned) {
				const reply = await simpleContainer(
					interaction,
					await t(interaction, 'core.moderation.pin.already.pinned'),
					{ color: 'Red' },
				);
				return interaction.editReply({
					components: reply,
					flags: MessageFlags.IsComponentsV2,
					ephemeral: true,
				});
			}

			await message.pin();

			const reply = await createContainer(interaction, {
				color: kythiaConfig.bot.color,
				title: await t(interaction, 'core.moderation.pin.success.title'),
				description: await t(interaction, 'core.moderation.pin.success.desc', {
					messageUrl: message.url,
				}),
				thumbnail: interaction.guild.iconURL(),
			});
			return interaction.editReply({
				components: reply,
				flags: MessageFlags.IsComponentsV2,
			});
		} catch (error) {
			const reply = await simpleContainer(
				interaction,
				await t(interaction, 'core.moderation.pin.failed', {
					error: error.message,
				}),
				{ color: 'Red' },
			);
			return interaction.editReply({
				components: reply,
				flags: MessageFlags.IsComponentsV2,
				ephemeral: true,
			});
		}
	},
};
