/**
 * @namespace: addons/modmail/commands/areply.js
 * @type: Command
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0
 *
 * /modmail areply <message>
 * Sends an ANONYMOUS reply to the user's DMs from inside a modmail thread.
 * The message shows "Staff" as the sender instead of the real username.
 * Useful for ban appeals or sensitive situations to protect mod identity.
 */

const { relayStaffReply } = require('../helpers');

module.exports = {
	subcommand: true,
	slashCommand: (subcommand) =>
		subcommand
			.setName('areply')
			.setDescription(
				'Reply anonymously — the user will see "Staff" instead of your name.',
			)
			.addStringOption((option) =>
				option
					.setName('message')
					.setDescription('The anonymous message to send to the user.')
					.setRequired(true)
					.setMaxLength(2000),
			),

	/**
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 * @param {KythiaDI.Container} container
	 */
	execute(interaction, container) {
		const content = interaction.options.getString('message');
		return relayStaffReply(interaction, content, true, container);
	},
};
