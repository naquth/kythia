/**
 * @namespace: addons/autoreply/events/messageCreate.js
 * @type: Event
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

const { MessageFlags } = require('discord.js');

module.exports = async (bot, message) => {
	const { models, helpers } = bot.client.container;
	const { AutoReply } = models;
	const { createContainer } = helpers.discord;

	if (message.author.bot || !message.guild) return;

	const reply = await AutoReply.findOne({
		where: {
			guildId: message.guild.id,
			trigger: message.content,
		},
	});

	if (!reply) return;

	if (reply.useContainer) {
		const replyContaner = await createContainer(message, {
			description: reply.response,
			media: reply.media ? [reply.media] : [],
			footer: true,
		});

		return message.reply({
			components: replyContaner,
			flags: MessageFlags.IsComponentsV2,
		});
	} else {
		const content = {};
		if (reply.response) content.content = reply.response;
		if (reply.media) content.files = [reply.media];

		if (Object.keys(content).length > 0) {
			return message.reply(content);
		}
	}
};
