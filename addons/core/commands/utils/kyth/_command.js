/**
 * @namespace: addons/core/commands/utils/kyth/_command.js
 * @type: Command Group Definition
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const {
	SlashCommandBuilder,
	PermissionFlagsBits,
	InteractionContextType,
} = require('discord.js');

module.exports = {
	slashCommand: new SlashCommandBuilder()
		.setName('kyth')
		.setDescription('🛠️ Manage All Kythia related config')
		.setContexts(InteractionContextType.Guild)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	ownerOnly: true,
	mainGuildOnly: true,

	/**
	 * @param {import('discord.js').AutocompleteInteraction} interaction
	 */
	async autocomplete(interaction) {
		const focusedOption = interaction.options.getFocused(true);
		if (focusedOption.name === 'guild_id') {
			const focusedValue = focusedOption.value;
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
		}
	},
};
