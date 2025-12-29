/**
 * @namespace: addons/core/commands/tools/instagram.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');

module.exports = {
	slashCommand: new SlashCommandBuilder()
		.setName('instagram')
		.setDescription('📸 Get and play an Instagram post/reel by link.')
		.addStringOption((option) =>
			option
				.setName('link')
				.setDescription('The Instagram post/reel link')
				.setRequired(true),
		),

	async execute(interaction, container) {
		const t = container.t;
		const instaUrl = interaction.options.getString('link');

		const invalidUrlTitle = await t(
			interaction,
			'core.tools.instagram.error.invalid.url.title',
		);
		const invalidUrlDesc = await t(
			interaction,
			'core.tools.instagram.error.invalid.url.desc',
		);

		// Validate Instagram URL
		if (
			!/^https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[a-zA-Z0-9_-]+\/?/.test(
				instaUrl,
			) &&
			!/^https?:\/\/instagr\.am\/[a-zA-Z0-9_-]+\/?/.test(instaUrl)
		) {
			await interaction.reply({
				embeds: [
					new EmbedBuilder().setDescription(
						`## ${invalidUrlTitle}\n${invalidUrlDesc}`,
					),
				],
				ephemeral: true,
			});
			return;
		}

		await interaction.deferReply();

		try {
			// Using SnapInsta-like API endpoint (free alternative)
			// You can also use RapidAPI's Instagram Downloader if you have an API key
			const apiUrl = `https://v3.igdownloader.app/api/ajaxSearch`;

			const response = await fetch(apiUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					'User-Agent':
						'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
				},
				body: `recaptchaToken=&q=${encodeURIComponent(instaUrl)}&t=media&lang=en`,
			});

			const data = await response.json();

			if (!data || data.status !== 'ok') {
				throw new Error(data.msg || 'No media found');
			}

			// Parse HTML response to extract video/image URL
			const htmlContent = data.data;

			// Try to find video URL first (for reels/videos)
			let mediaUrl = null;
			let mediaType = null;

			// Look for video download link
			const videoMatch = htmlContent.match(
				/href="([^"]+)"[^>]*class="[^"]*download-media[^"]*"[^>]*>\s*Download Video/i,
			);
			if (videoMatch) {
				mediaUrl = videoMatch[1];
				mediaType = 'video';
			} else {
				// Look for image download link
				const imageMatch = htmlContent.match(
					/href="([^"]+)"[^>]*class="[^"]*download-media[^"]*"[^>]*>\s*Download Image/i,
				);
				if (imageMatch) {
					mediaUrl = imageMatch[1];
					mediaType = 'image';
				}
			}

			if (!mediaUrl) {
				throw new Error('Could not extract media URL');
			}

			// Extract title if available
			const titleMatch = htmlContent.match(
				/<div[^>]*class="[^"]*desc[^"]*"[^>]*>([^<]+)<\/div>/i,
			);
			const rawTitle =
				titleMatch?.[1]?.trim() ||
				(await t(interaction, 'core.tools.instagram.default_title'));
			const title =
				rawTitle.length > 256 ? `${rawTitle.substring(0, 253)}...` : rawTitle;

			try {
				const fileExtension = mediaType === 'video' ? 'mp4' : 'jpg';
				await interaction.editReply({
					files: [
						{
							attachment: mediaUrl,
							name: `instagram.${fileExtension}`,
							description: title,
						},
					],
				});
			} catch (fileError) {
				const tooLargeTitle = await t(
					interaction,
					'core.tools.instagram.error.too.large.title',
				);
				const tooLargeDesc = await t(
					interaction,
					'core.tools.instagram.error.too.large.desc',
					{ url: mediaUrl },
				);
				if (
					fileError.code === 40005 ||
					fileError.message?.includes('Request entity too large')
				) {
					await interaction.editReply({
						embeds: [
							new EmbedBuilder().setDescription(
								`## ${tooLargeTitle}\n${tooLargeDesc}`,
							),
						],
						files: [],
					});
				} else {
					throw fileError;
				}
			}
		} catch (err) {
			console.error('Instagram fetch error:', err);
			let title, desc;
			if (err.message?.includes('No media found')) {
				title = await t(
					interaction,
					'core.tools.instagram.error.no.media.title',
				);
				desc = await t(interaction, 'core.tools.instagram.error.no.media.desc');
			} else {
				title = await t(
					interaction,
					'core.tools.instagram.error.unknown.title',
				);
				desc = await t(interaction, 'core.tools.instagram.error.unknown.desc');
			}

			await interaction.editReply({
				embeds: [new EmbedBuilder().setDescription(`## ${title}\n${desc}`)],
			});
		}
	},
};
