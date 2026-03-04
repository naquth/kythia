/**
 * @namespace: addons/core/commands/utils/leave-guild/_command.js
 * @type: Command Group Definition
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

const { SlashCommandBuilder, InteractionContextType } = require('discord.js');

module.exports = {
	aliases: ['lg'],
	isOwner: true,
	mainGuildOnly: true,
	slashCommand: new SlashCommandBuilder()
		.setName('leaveguild')
		.setDescription('Manage bot guild membership (Owner Only).')
		.setContexts(InteractionContextType.Guild),

	/**
	 * @param {import('discord.js').AutocompleteInteraction} interaction
	 */
	async autocomplete(interaction) {
		const focusedValue = interaction.options.getFocused();
		const guilds = interaction.client.guilds.cache;

		const filtered = guilds.filter(
			(guild) =>
				guild.name.toLowerCase().includes(focusedValue.toLowerCase()) ||
				guild.id.includes(focusedValue),
		);

		const choices = filtered
			.map((guild) => ({
				name: `${guild.name} (${guild.id})`.slice(0, 100),
				value: guild.id,
			}))
			.slice(0, 25);

		await interaction.respond(choices);
	},
};
