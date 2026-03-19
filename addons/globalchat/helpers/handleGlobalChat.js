/**
 * @namespace: addons/globalchat/helpers/handleGlobalChat.js
 * @type: Helper Script
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const fetch = require('node-fetch');
const { handleFailedGlobalChat } = require('./handleFailedGlobalChat');

async function handleGlobalChat(message, container) {
	const { logger, kythiaConfig } = container;

	if (message.author.bot) return;
	if (!message.guild) return;

	try {
		// Fetch referenced message if this is a reply
		let referencedMessageData = null;
		if (message.reference?.messageId) {
			try {
				const refMsg = await message.fetchReference();
				referencedMessageData = {
					id: refMsg.id,
					content: refMsg.content,
					author: {
						id: refMsg.author.id,
						username: refMsg.author.username,
						globalName: refMsg.author.globalName || refMsg.author.username,
						avatarURL: refMsg.author.displayAvatarURL(),
					},
				};
			} catch {
				// referenced message may be deleted or inaccessible — skip gracefully
				referencedMessageData = null;
			}
		}

		const safeMessage = {
			id: message.id,
			content: message.content,
			author: {
				id: message.author.id,
				username: message.author.username,
				globalName: message.author.globalName || message.author.username,
				avatarURL: message.author.displayAvatarURL(),
			},
			channelId: message.channelId,
			guildId: message.guildId,
			referencedMessage: referencedMessageData,
			attachments: message.attachments.map((a) => ({
				url: a.url,
				contentType: a.contentType,

				id: a.id,
				filename: a.name,
				size: a.size,
				width: a.width,
				height: a.height,
			})),
			stickerItems: message.stickers.map((s) => ({
				id: s.id,
				name: s.name,
				formatType: s.format,
			})),
		};

		const apiUrl = kythiaConfig.addons.globalchat.apiUrl;
		const apiKey = kythiaConfig.addons.globalchat.apiKey;

		const response = await fetch(`${apiUrl}/chat`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify({
				message: safeMessage,
				guildName: message.guild.name,
			}),
		});

		const result = await response.json();

		switch (result.status) {
			case 'ok':
				break;
			case 'ignored':
				break;
			case 'skipped':
				break;
			case 'partial': {
				const stats = result.data?.deliveryStats || {};
				logger.info(
					`Partially delivered: ${stats.successful || 0}/${stats.total || 0}`,
					{ label: 'globalchat' },
				);
				if (
					Array.isArray(result.data?.failedGuilds) &&
					result.data.failedGuilds.length > 0
				) {
					const failedGuildNames = result.data.failedGuilds
						.map((g) => g.guildName || g.guildId)
						.join(', ');
					logger.warn(`Failed guilds: ${failedGuildNames}`, {
						label: 'globalchat',
					});

					handleFailedGlobalChat(result.data.failedGuilds, container).catch(
						(err) => {
							logger.error(
								`Error during background webhook fix attempt: ${err.message || err}`,
								{ label: 'globalchat' },
							);
						},
					);
				}
				break;
			}

			case 'failed': {
				logger.error(`All deliveries failed for message ${safeMessage.id}`, {
					label: 'globalchat',
				});

				if (
					Array.isArray(result.data?.failedGuilds) &&
					result.data.failedGuilds.length > 0
				) {
					const failedNames = result.data.failedGuilds
						.map((g) => g.guildName || g.guildId)
						.join(', ');
					logger.error(`Failed guilds: ${failedNames}`, {
						label: 'globalchat',
					});

					handleFailedGlobalChat(result.data.failedGuilds, container).catch(
						(err) => {
							logger.error(
								`Error during background webhook fix attempt: ${err.message || err}`,
								{ label: 'globalchat' },
							);
						},
					);
				} else {
					logger.debug(
						"Status was 'failed' but failedGuilds array was empty or missing.",
						{ label: 'globalchat' },
					);
				}
				break;
			}
			default:
				logger.warn(`Unknown API response status: ${result.status}`, {
					label: 'globalchat',
				});
				logger.info(`Full response: ${JSON.stringify(result)}`, {
					label: 'globalchat',
				});
		}

		if (result.status === 'ok' || result.status === 'partial') {
			logger.info(
				`Sent from: ${message.guild.name} (${message.guildId}) by ${message.author.tag}`,
				{ label: 'globalchat' },
			);
		}
	} catch (apiError) {
		logger.error(
			`Failed to send message to API: ${apiError.message || apiError}`,
			{
				label: 'globalchat',
			},
		);
	}
}

module.exports = { handleGlobalChat };
