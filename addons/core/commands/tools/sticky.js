/**
 * @namespace: addons/core/commands/tools/sticky.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

const {
	MessageFlags,
	SlashCommandBuilder,
	PermissionFlagsBits,
	InteractionContextType,
} = require('discord.js');

module.exports = {
	slashCommand: new SlashCommandBuilder()
		.setName('sticky')
		.setDescription('📌 Manage sticky messages in a channel.')
		.addSubcommand((sub) =>
			sub
				.setName('set')
				.setDescription('Sets a sticky message for this channel.')
				.addStringOption((opt) =>
					opt
						.setName('message')
						.setDescription('The content of the sticky message.')
						.setRequired(true),
				),
		)
		.addSubcommand((sub) =>
			sub
				.setName('remove')
				.setDescription('Removes the sticky message from this channel.'),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
		.setContexts(InteractionContextType.Guild),

	guildOnly: true,
	permissions: PermissionFlagsBits.ManageMessages,
	botPermissions: PermissionFlagsBits.ManageMessages,

	/**
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 * @param {KythiaDI.Container} container
	 */
	async execute(interaction, container) {
		const { t, helpers, models } = container;
		const { simpleContainer } = helpers.discord;
		const { StickyMessage } = models;

		const sub = interaction.options.getSubcommand();
		const channelId = interaction.channel.id;

		switch (sub) {
			case 'set': {
				const messageContent = interaction.options.getString('message');
				const existingSticky = await StickyMessage.getCache({ channelId });

				if (existingSticky) {
					return interaction.reply({
						content: await t(interaction, 'core.tools.sticky.set.error.exists'),
						ephemeral: true,
					});
				}

				const msg = messageContent;
				const components = await simpleContainer(interaction, msg);
				const message = await interaction.channel.send({
					components,
					flags: MessageFlags.IsComponentsV2,
				});

				await StickyMessage.create(
					{
						channelId,
						message: messageContent,
						messageId: message.id,
					},
					{ individualHooks: true },
				);

				return interaction.reply({
					content: await t(interaction, 'core.tools.sticky.set.success'),
					ephemeral: true,
				});
			}

			case 'remove': {
				const sticky = await StickyMessage.getCache({ channelId: channelId });

				if (!sticky) {
					const msg = await t(
						interaction,
						'core.tools.sticky.remove.error.not.found',
					);
					const components = await simpleContainer(interaction, msg, {
						color: 'Red',
					});

					return interaction.reply({
						components,
						flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
					});
				}

				if (sticky?.messageId) {
					try {
						const oldMsg = await interaction.channel.messages
							.fetch(sticky.messageId)
							.catch(() => null);
						if (oldMsg) await oldMsg.delete().catch(() => {});
					} catch (_e) {}
				}
				await sticky.destroy({ individualHooks: true });

				const msg = await t(interaction, 'core.tools.sticky.remove.success');
				const components = await simpleContainer(interaction, msg, {
					color: 'Red',
				});

				return interaction.reply({
					components,
					flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
				});
			}
		}
	},
};
