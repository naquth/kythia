/**
 * @namespace: addons/globalchat/commands/remove.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

const { MessageFlags } = require('discord.js');
const fetch = require('node-fetch');

module.exports = {
	subcommand: true,
	slashCommand: (subcommand) =>
		subcommand
			.setName('remove')
			.setDescription('Remove this server from the global chat network'),
	async execute(interaction, container) {
		const { t, models, kythiaConfig, helpers, logger } = container;
		const { GlobalChat } = models;
		const { simpleContainer } = helpers.discord;

		const apiUrl = kythiaConfig?.addons?.globalchat?.apiUrl;

		await interaction.deferReply();

		const localDbChat = await GlobalChat.getCache({
			guildId: interaction.guild.id,
		});
		if (localDbChat) {
			await localDbChat.destroy();
		}

		try {
			const res = await fetch(`${apiUrl}/remove/${interaction.guild.id}`, {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${kythiaConfig.addons.globalchat.apiKey}`,
				},
			});
			const resJson = await res.json();

			if (resJson.status === 'ok') {
				const components = await simpleContainer(
					interaction,
					await t(interaction, 'globalchat.remove.success'),
					{ color: 'Green' },
				);
				return interaction.editReply({
					components,
					flags: MessageFlags.IsComponentsV2,
				});
			} else if (resJson.code === 'GUILD_NOT_FOUND') {
				const components = await simpleContainer(
					interaction,
					await t(interaction, 'globalchat.remove.not.found'),
					{ color: 'Orange' },
				);
				return interaction.editReply({
					components,
					flags: MessageFlags.IsComponentsV2,
				});
			} else {
				const components = await simpleContainer(
					interaction,
					await t(interaction, 'globalchat.remove.failed'),
					{ color: 'Red' },
				);
				return interaction.editReply({
					components,
					flags: MessageFlags.IsComponentsV2,
				});
			}
		} catch (error) {
			logger.error('Failed to remove guild from global chat via API:', error);
			const components = await simpleContainer(
				interaction,
				await t(interaction, 'globalchat.remove.error'),
				{ color: 'Red' },
			);
			return interaction.editReply({
				components,
				flags: MessageFlags.IsComponentsV2,
			});
		}
	},
};
