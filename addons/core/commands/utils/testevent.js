/**
 * @namespace: addons/core/commands/utils/testevent.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

const { getEventScenarios } = require('@coreHelpers/events');

const {
	Events,
	SlashCommandBuilder,
	PermissionFlagsBits,
	InteractionContextType,
} = require('discord.js');

module.exports = {
	slashCommand: new SlashCommandBuilder()
		.setName('testevent')
		.setDescription('🧪 Trigger a Discord event for testing purposes')
		.addStringOption((option) =>
			option
				.setName('event')
				.setDescription('The event to trigger')
				.setRequired(true)
				.setAutocomplete(true),
		)
		.addStringOption((option) =>
			option
				.setName('type')
				.setDescription('The specific scenario to test for the event')
				.setRequired(false)
				.setAutocomplete(true),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.setContexts(InteractionContextType.Guild),
	ownerOnly: true,
	mainGuildOnly: true,

	/**
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 */
	async autocomplete(interaction) {
		const focusedOption = interaction.options.getFocused(true);

		if (focusedOption.name === 'event') {
			const focused = focusedOption.value.toLowerCase();
			const allEvents = Object.values(Events);

			const filtered = allEvents
				.filter((event) => event.toLowerCase().includes(focused))
				.slice(0, 25)
				.map((event) => ({ name: event, value: event }));

			await interaction.respond(filtered);
		} else if (focusedOption.name === 'type') {
			const selectedEvent = interaction.options.getString('event');
			const focused = focusedOption.value.toLowerCase();

			if (!selectedEvent) {
				return interaction.respond([
					{ name: 'Please select an event first', value: 'default' },
				]);
			}

			const availableScenarios = getEventScenarios(selectedEvent);
			const filtered = availableScenarios
				.filter((scenario) => scenario.toLowerCase().includes(focused))
				.slice(0, 25)
				.map((scenario) => ({ name: scenario, value: scenario }));

			await interaction.respond(
				filtered.length > 0
					? filtered
					: [{ name: 'default', value: 'default' }],
			);
		}
	},

	/**
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 * @param {KythiaDI.Container} container
	 */
	async execute(interaction, container) {
		const { logger, helpers } = container;
		const { createMockEventArgs } = helpers.events;

		await interaction.deferReply({ ephemeral: true });

		const eventName = interaction.options.getString('event');
		const type = interaction.options.getString('type') || 'default';
		const { client, user } = interaction;

		logger.info(
			`[TEST COMMAND] Attempting to trigger '${eventName}' (type: ${type}) for ${user.tag}`,
		);

		try {
			const args = await createMockEventArgs(eventName, interaction, type);
			client.emit(eventName, ...args);

			await interaction.editReply({
				content: `✅ Event \`${eventName}\` (type: \`${type}\`) emitted successfully!`,
			});
		} catch (err) {
			logger.error(
				`[TEST COMMAND] Error during event simulation '${eventName}':`,
				err,
			);
			await interaction.editReply({
				content: `❌ Failed to emit event \`${eventName}\`: ${err.message}`,
			});
		}
	},
};
