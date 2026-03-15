/**
 * @namespace: addons/core/commands/utils/flush.js
 * @type: Command
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
	slashCommand: new SlashCommandBuilder()
		.setName('test')
		.setDescription('💥 Test Command'),
	/**
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 * @param {KythiaDI.Container} container
	 */
	async execute(interaction, _container) {
		// const { logger, redis, helpers } = container;
		// const { simpleContainer } = helpers.discord;

		// await interaction.reply('Hello');
		const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
		await sleep(10000);
		await interaction.reply({ content: 'Hi', flags: MessageFlags.Ephemeral });
		// await interaction.deferReply({
		// 	flags: MessageFlags.Ephemeral,
		// });
	},
};
