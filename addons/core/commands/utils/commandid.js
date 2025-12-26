/**
 * @namespace: addons/core/commands/utils/commandid.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

const {
	MessageFlags,
	SlashCommandBuilder,
	InteractionContextType,
	PermissionFlagsBits,
} = require('discord.js');

module.exports = {
	slashCommand: new SlashCommandBuilder()
		.setName('command-id')
		.setDescription("🔍 Find a command's ID and generate its mention.")
		.addStringOption((opt) =>
			opt
				.setName('name')
				.setDescription('The name of the command to look up')
				.setRequired(true),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.setContexts(InteractionContextType.Guild),
	ownerOnly: true,
	mainGuildOnly: true,

	/**
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 * @param {KythiaDI.Container} container
	 */
	async execute(interaction, container) {
		const { t, helpers } = container;
		const { simpleContainer } = helpers.discord;

		await interaction.deferReply();

		const input = interaction.options.getString('name');
		const parts = input.trim().split(/\s+/);
		const commandName = parts[0];

		await interaction.client.application.commands.fetch();
		const cmd = interaction.client.application.commands.cache.find(
			(c) => c.name === commandName,
		);

		if (!cmd) {
			const components = await simpleContainer(interaction, {
				content: await t(interaction, 'core.utils.commandid.not.found', {
					commandName,
				}),
			});
			return interaction.editReply({
				components,
				flags: MessageFlags.IsComponentsV2,
			});
		}

		const mention = `</${parts.join(' ')}:${cmd.id}>`;
		return interaction.editReply({
			content: await t(interaction, 'core.utils.commandid.success', {
				commandId: cmd.id,
				mention,
			}),
		});
	},
};
