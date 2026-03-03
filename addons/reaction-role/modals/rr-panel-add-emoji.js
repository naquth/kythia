/**
 * @namespace: addons/reaction-role/modals/rr-panel-add-emoji.js
 * @type: Module (Modal Submit Handler)
 * @copyright © 2026 kenndeclouv
 * @assistant chaa & graa
 * @version 2.0.0
 */
const {
	ContainerBuilder,
	TextDisplayBuilder,
	MessageFlags,
} = require('discord.js');

const { refreshPanelMessage } = require('../helpers/index.js');

module.exports = {
	execute: async (interaction, container) => {
		const { models, helpers, logger } = container;
		const { ReactionRolePanel, ReactionRole } = models;
		const { simpleContainer } = helpers.discord;
		const { convertColor } = helpers.color;

		await interaction.deferUpdate();

		try {
			// customId: rr-panel-add-emoji:<panelId>
			const panelId = parseInt(interaction.customId.split(':')[1], 10);

			if (!panelId) {
				return interaction.followUp({
					components: await simpleContainer(
						interaction,
						'❌ Invalid panel ID in button.',
						{ color: 'Red' },
					),
					flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
				});
			}

			const panel = await ReactionRolePanel.findOne({
				where: { id: panelId, guildId: interaction.guildId },
			});

			if (!panel) {
				return interaction.followUp({
					components: await simpleContainer(
						interaction,
						`❌ Panel \`${panelId}\` not found.`,
						{ color: 'Red' },
					),
					flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
				});
			}

			const emojiInput = interaction.fields.getTextInputValue('emoji').trim();
			const roleId = interaction.fields.getTextInputValue('roleId').trim();

			// Validate role exists
			const role = await interaction.guild.roles
				.fetch(roleId)
				.catch(() => null);
			if (!role) {
				return interaction.followUp({
					components: await simpleContainer(
						interaction,
						`❌ Role ID \`${roleId}\` not found in this server.`,
						{ color: 'Red' },
					),
					flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
				});
			}

			// Fetch the panel message and validate emoji by reacting
			const channel = await interaction.client.channels
				.fetch(panel.channelId)
				.catch(() => null);

			if (!channel) {
				return interaction.followUp({
					components: await simpleContainer(
						interaction,
						`❌ Panel channel not found.`,
						{ color: 'Red' },
					),
					flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
				});
			}

			const message = await channel.messages
				.fetch(panel.messageId)
				.catch(() => null);

			if (!message) {
				return interaction.followUp({
					components: await simpleContainer(
						interaction,
						`❌ Panel message not found. It may have been deleted.`,
						{ color: 'Red' },
					),
					flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
				});
			}

			// Validate emoji by actually reacting
			try {
				await message.react(emojiInput);
			} catch (_) {
				return interaction.followUp({
					components: await simpleContainer(
						interaction,
						`❌ Invalid emoji: \`${emojiInput}\`. Please use a valid emoji.`,
						{ color: 'Red' },
					),
					flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
				});
			}

			// Upsert the binding
			const [rr, created] = await ReactionRole.findOrCreate({
				where: {
					guildId: interaction.guildId,
					messageId: panel.messageId,
					emoji: emojiInput,
				},
				defaults: {
					guildId: interaction.guildId,
					channelId: panel.channelId,
					messageId: panel.messageId,
					emoji: emojiInput,
					roleId: role.id,
					panelId: panel.id,
				},
			});

			if (!created) {
				rr.roleId = role.id;
				await rr.save();
			}

			// Refresh the panel embed to reflect changes
			await refreshPanelMessage(panel.id, container);

			// Reply with success
			const successContainer = new ContainerBuilder()
				.setAccentColor(
					convertColor('Green', { from: 'discord', to: 'decimal' }),
				)
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						`✅ **Emoji binding ${created ? 'added' : 'updated'}!**\n\n` +
							`${emojiInput} ➡️ <@&${role.id}>\n\n` +
							`The panel embed has been updated. You can add more emojis using the **Add Emoji → Role** button.`,
					),
				);

			await interaction.followUp({
				components: [successContainer],
				flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
			});
		} catch (error) {
			logger.error(error, { label: 'reaction-role:rr-panel-add-emoji' });
			await interaction.followUp({
				components: await simpleContainer(
					interaction,
					'❌ An error occurred while adding the emoji binding.',
					{ color: 'Red' },
				),
				flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
			});
		}
	},
};
