/**
 * @namespace addons/patreon/commands/patreon.js
 * @type {Command}
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

const {
	MediaGalleryItemBuilder,
	SlashCommandBuilder,
	MediaGalleryBuilder,
	TextDisplayBuilder,
	ContainerBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	MessageFlags,
	ButtonStyle,
} = require('discord.js');

const BASE_URL = 'https://kemono.cr/api';

/**
 * Helper to build navigation buttons
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {number} page
 * @param {number} totalPages
 * @param {boolean} disabled
 */
// function buildNavButtons(interaction, page, totalPages, disabled = false) {
function buildNavButtons(_interaction, page, totalPages, disabled = false) {
	return [
		new ButtonBuilder()
			.setCustomId('patreon_first')
			.setLabel('⏪')
			.setStyle(ButtonStyle.Secondary)
			.setDisabled(disabled || page <= 1),
		new ButtonBuilder()
			.setCustomId('patreon_prev')
			.setLabel('⬅️')
			.setStyle(ButtonStyle.Primary)
			.setDisabled(disabled || page <= 1),
		new ButtonBuilder()
			.setCustomId('patreon_next')
			.setLabel('➡️')
			.setStyle(ButtonStyle.Primary)
			.setDisabled(disabled || page >= totalPages),
		new ButtonBuilder()
			.setCustomId('patreon_last')
			.setLabel('⏩')
			.setStyle(ButtonStyle.Secondary)
			.setDisabled(disabled || page >= totalPages),
	];
}

/**
 * Helper to generate the post container
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {number} page
 * @param {Array} posts
 * @param {string} service
 * @param {string} creatorId
 * @param {boolean} navDisabled
 */
// async function generatePostContainer(
function generatePostContainer(
	interaction,
	page,
	posts,
	service,
	creatorId,
	navDisabled = false,
) {
	const totalPages = posts.length;
	page = Math.max(1, Math.min(page, totalPages));

	const post = posts[page - 1];
	const title = post.title || 'Untitled Post';
	const publishedDate = post.published ? new Date(post.published) : new Date();

	// Strip HTML tags for content
	let content = post.content || '';
	content = content.replace(/<[^>]*>?/gm, ''); // Simple regex to strip HTML
	if (content.length > 500) {
		content = `${content.substring(0, 497)}...`;
	}
	if (!content) content = '*No content description.*';

	const postUrl = `${BASE_URL}/${service}/user/${creatorId}/post/${post.id}`;

	// Attachments (Find first image)
	let imageUrl = null;
	if (post.path && /\.(jpg|jpeg|png|gif|webp)$/i.test(post.path)) {
		imageUrl = `${BASE_URL}/data${post.path}`;
	}

	if (!imageUrl && post.attachments && post.attachments.length > 0) {
		const imageAttachment = post.attachments.find((att) =>
			/\.(jpg|jpeg|png|gif|webp)$/i.test(att.path),
		);
		if (imageAttachment) {
			imageUrl = `${BASE_URL}/data${imageAttachment.path}`;
		}
	}

	const displayContainer = new ContainerBuilder();

	// Add Image if exists
	if (imageUrl) {
		displayContainer.addMediaGalleryComponents(
			new MediaGalleryBuilder().addItems([
				new MediaGalleryItemBuilder().setURL(imageUrl),
			]),
		);
	}

	// Add text content
	const textContent = `## [${title}](${postUrl})\n${content}\n\n*Published: ${publishedDate.toDateString()} • Service: ${service} • Post ${page}/${totalPages}*`;

	displayContainer.addTextDisplayComponents(
		new TextDisplayBuilder().setContent(textContent),
	);

	// Navigation Row
	const navRow = new ActionRowBuilder().addComponents(
		...buildNavButtons(interaction, page, totalPages, navDisabled),
	);

	// Link Button Row (separate row or appended if room? usually nav takes 4 slots, link takes 1, fits in 5)
	// We'll add the link button to the same row if possible, or a new row.
	// 4 buttons + 1 link = 5 components (max per row is 5). Perfect.
	navRow.addComponents(
		new ButtonBuilder()
			.setLabel('🔗') // Compact label
			.setStyle(ButtonStyle.Link)
			.setURL(postUrl),
	);

	displayContainer.addActionRowComponents(navRow);

	return { container: displayContainer, page };
}

module.exports = {
	slashCommand: new SlashCommandBuilder()
		.setName('patreon')
		.setDescription(
			'🔞 Fetches latest posts from a creator on Kemono (NSFW Only).',
		)
		.addStringOption((option) =>
			option
				.setName('service')
				.setDescription('The platform service')
				.setRequired(true)
				.addChoices(
					{ name: 'Patreon', value: 'patreon' },
					{ name: 'Fanbox', value: 'fanbox' },
					{ name: 'Gumroad', value: 'gumroad' },
					{ name: 'Boosty', value: 'boosty' },
					{ name: 'Discord', value: 'discord' },
				),
		)
		.addStringOption((option) =>
			option
				.setName('creator_id')
				.setDescription('The unique Creator ID')
				.setRequired(true),
		),

	/**
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 * @param {import('../../../../../index.js').KythiaContainer} container
	 */
	async execute(interaction, container) {
		const { logger, metrics } = container;

		// 1. NSFW Check
		if (!interaction.channel.nsfw) {
			return interaction.reply({
				content:
					'🚫 **NSFW Only!** This command can only be used in NSFW channels.',
				ephemeral: true,
			});
		}

		const service = interaction.options.getString('service');
		const creatorId = interaction.options.getString('creator_id');

		await interaction.deferReply();

		const startTime = process.hrtime();

		try {
			// 2. Metrics: Log execution start
			if (metrics) {
				metrics.kythia_commands_total?.inc({ command_name: 'patreon' });
			}

			// 3. API Request
			const apiUrl = `${BASE_URL}/api/v1/${service}/user/${creatorId}/posts`;

			logger.info(
				`🔗 PatreonCommand ──(API)──> Kemono: Fetching posts for ${service}/${creatorId}`,
			);

			const response = await fetch(apiUrl);

			if (!response.ok) {
				throw new Error(`API responded with status ${response.status}`);
			}

			const posts = await response.json();

			if (!posts || posts.length === 0) {
				return interaction.editReply({
					content: `❌ No posts found for **${service}** user \`${creatorId}\`. Please check the ID and try again.`,
				});
			}

			let currentPage = 1;
			const totalPages = posts.length;

			// 4. Generate first page
			const { container: initialContainer } = await generatePostContainer(
				interaction,
				currentPage,
				posts,
				service,
				creatorId,
			);

			const message = await interaction.editReply({
				components: [initialContainer],
				flags: MessageFlags.IsComponentsV2, // Important for V2 components
			});

			if (totalPages <= 1) return; // No pagination needed

			// 5. Collector
			const collector = message.createMessageComponentCollector({
				time: 300000,
			}); // 5 mins

			collector.on('collect', async (i) => {
				if (i.user.id !== interaction.user.id) {
					return i.reply({
						content: '⛔ This interaction is not for you.',
						ephemeral: true,
					});
				}

				await i.deferUpdate();

				if (i.customId === 'patreon_first') {
					currentPage = 1;
				} else if (i.customId === 'patreon_prev') {
					currentPage = Math.max(1, currentPage - 1);
				} else if (i.customId === 'patreon_next') {
					currentPage = Math.min(totalPages, currentPage + 1);
				} else if (i.customId === 'patreon_last') {
					currentPage = totalPages;
				}

				const { container: newContainer, page } = await generatePostContainer(
					interaction, // use original interaction for 't' context if needed, or i
					currentPage,
					posts,
					service,
					creatorId,
				);
				currentPage = page; // Sync just in case

				await i.editReply({
					components: [newContainer],
				});
			});

			collector.on('end', async () => {
				try {
					const { container: finalContainer } = await generatePostContainer(
						interaction,
						currentPage,
						posts,
						service,
						creatorId,
						true, // Disable nav
					);
					await message.edit({
						components: [finalContainer],
					});
				} catch (_e) {
					// Ignore errors on end (message might be deleted)
				}
			});

			// Metrics: Log duration
			const endTime = process.hrtime(startTime);
			const durationInSeconds = endTime[0] + endTime[1] / 1e9;
			if (metrics) {
				metrics.kythia_command_duration_seconds?.observe(durationInSeconds);
			}
		} catch (error) {
			logger.error(`Error in Patreon command: ${error.message}`);
			await interaction.editReply({
				content:
					'❌ Failed to fetch data from Kemono API. The service might be down or the ID is incorrect.',
				ephemeral: true,
			});
		}
	},
};
