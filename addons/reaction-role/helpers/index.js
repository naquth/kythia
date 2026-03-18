/**
 * @namespace: addons/reaction-role/helpers/index.js
 * @type: Helper Script
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ContainerBuilder,
	MediaGalleryBuilder,
	MediaGalleryItemBuilder,
	SeparatorBuilder,
	SeparatorSpacingSize,
	TextDisplayBuilder,
	MessageFlags,
} = require('discord.js');

// =============================================================================
// buildLayoutContainer — embed-builder JSON → Components V2
// =============================================================================

/**
 * Layout schema (all fields optional):
 * {
 *   accentColor:   string,  // hex  e.g. "#5865F2"
 *   authorName:    string,
 *   authorIconUrl: string,  // stored but not renderable natively in CV2 — ignored
 *   authorUrl:     string,
 *   title:         string,
 *   titleUrl:      string,
 *   description:   string,
 *   fields:        [{ name: string, value: string, inline?: boolean }],
 *   imageUrl:      string,  // large image at bottom
 *   thumbnailUrl:  string,  // small image shown above title
 *   footerText:    string,
 *   footerIconUrl: string,  // stored but not renderable natively in CV2 — ignored
 *   timestamp:     string,  // ISO 8601 — appended to footer as Discord timestamp
 * }
 *
 * @param {object}   layout      Layout config object (see schema above).
 * @param {object[]} bindings    Array of ReactionRole DB instances.
 * @param {object}   container   Kythia DI container.
 * @param {object}   [panelData] Panel DB record (for whitelist/blacklist + id).
 * @returns {ContainerBuilder}
 */
function buildLayoutContainer(layout, bindings, container, panelData = {}) {
	const { helpers } = container;
	const { convertColor } = helpers.color;

	// --- Accent color ---
	let accentColor;
	try {
		accentColor = layout.accentColor
			? convertColor(layout.accentColor, { from: 'hex', to: 'decimal' })
			: convertColor(container.kythiaConfig.bot.color, {
					from: 'hex',
					to: 'decimal',
				});
	} catch (_) {
		accentColor = convertColor(container.kythiaConfig.bot.color, {
			from: 'hex',
			to: 'decimal',
		});
	}

	const builder = new ContainerBuilder().setAccentColor(accentColor);

	// --- Thumbnail (shown above title as a small gallery item) ---
	if (layout.thumbnailUrl) {
		builder.addMediaGalleryComponents(
			new MediaGalleryBuilder().addItems(
				new MediaGalleryItemBuilder().setURL(layout.thumbnailUrl),
			),
		);
		builder.addSeparatorComponents(
			new SeparatorBuilder()
				.setSpacing(SeparatorSpacingSize.Small)
				.setDivider(false),
		);
	}

	// --- Author ---
	if (layout.authorName) {
		const authorText = layout.authorUrl
			? `[${layout.authorName}](${layout.authorUrl})`
			: layout.authorName;
		builder.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(`-# ${authorText}`),
		);
	}

	// --- Title ---
	if (layout.title) {
		const titleText = layout.titleUrl
			? `## [${layout.title}](${layout.titleUrl})`
			: `## ${layout.title}`;
		builder.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(titleText),
		);
	}

	// --- Divider after header block ---
	if (layout.authorName || layout.title) {
		builder.addSeparatorComponents(
			new SeparatorBuilder()
				.setSpacing(SeparatorSpacingSize.Small)
				.setDivider(true),
		);
	}

	// --- Description ---
	if (layout.description) {
		builder.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(layout.description),
		);
	}

	// --- Fields ---
	if (Array.isArray(layout.fields) && layout.fields.length > 0) {
		if (layout.description) {
			builder.addSeparatorComponents(
				new SeparatorBuilder()
					.setSpacing(SeparatorSpacingSize.Small)
					.setDivider(false),
			);
		}

		// Pair inline fields two-at-a-time
		const inlineBuffer = [];
		const flushInline = () => {
			for (const f of inlineBuffer) {
				builder.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(`**${f.name}**\n${f.value}`),
				);
			}
			inlineBuffer.length = 0;
		};

		for (const field of layout.fields) {
			if (field.inline) {
				inlineBuffer.push(field);
				if (inlineBuffer.length === 2) {
					builder.addTextDisplayComponents(
						new TextDisplayBuilder().setContent(
							`**${inlineBuffer[0].name}**　|　**${inlineBuffer[1].name}**\n${inlineBuffer[0].value}　|　${inlineBuffer[1].value}`,
						),
					);
					inlineBuffer.length = 0;
				}
			} else {
				flushInline();
				builder.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						`**${field.name}**\n${field.value}`,
					),
				);
			}
		}
		flushInline();
	}

	// --- Emoji bindings ---
	if (bindings && bindings.length > 0) {
		builder.addSeparatorComponents(
			new SeparatorBuilder()
				.setSpacing(SeparatorSpacingSize.Small)
				.setDivider(true),
		);
		let bindingLines = '';
		for (const rr of bindings) {
			bindingLines += `${rr.emoji} ➡️ <@&${rr.roleId}>\n`;
		}
		builder.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(bindingLines.trimEnd()),
		);
	}

	// --- Large image (bottom, before footer) ---
	if (layout.imageUrl) {
		builder.addSeparatorComponents(
			new SeparatorBuilder()
				.setSpacing(SeparatorSpacingSize.Small)
				.setDivider(false),
		);
		builder.addMediaGalleryComponents(
			new MediaGalleryBuilder().addItems(
				new MediaGalleryItemBuilder().setURL(layout.imageUrl),
			),
		);
	}

	// --- Footer (text + timestamp) ---
	const footerParts = [];
	if (layout.footerText) footerParts.push(layout.footerText);
	if (layout.timestamp) {
		try {
			const ts = Math.floor(new Date(layout.timestamp).getTime() / 1000);
			footerParts.push(`<t:${ts}:f>`);
		} catch (_) {
			footerParts.push(layout.timestamp);
		}
	}
	if (footerParts.length > 0) {
		builder.addSeparatorComponents(
			new SeparatorBuilder()
				.setSpacing(SeparatorSpacingSize.Small)
				.setDivider(true),
		);
		builder.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(`-# ${footerParts.join(' • ')}`),
		);
	}

	// --- Whitelist / blacklist roles note ---
	const wlbl = [];
	const whitelist = panelData.whitelistRoles || [];
	const blacklist = panelData.blacklistRoles || [];
	if (whitelist.length > 0)
		wlbl.push(`🟢 Whitelist: ${whitelist.map((id) => `<@&${id}>`).join(', ')}`);
	if (blacklist.length > 0)
		wlbl.push(`🔴 Blacklist: ${blacklist.map((id) => `<@&${id}>`).join(', ')}`);
	if (wlbl.length > 0) {
		builder.addSeparatorComponents(
			new SeparatorBuilder()
				.setSpacing(SeparatorSpacingSize.Small)
				.setDivider(true),
		);
		builder.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(wlbl.join('\n')),
		);
	}

	// --- Add Emoji button (if panel ID known) ---
	if (panelData.id) {
		builder.addSeparatorComponents(
			new SeparatorBuilder()
				.setSpacing(SeparatorSpacingSize.Small)
				.setDivider(false),
		);
		builder.addActionRowComponents(
			new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId(`rr-panel-add-emoji-show:${panelData.id}`)
					.setLabel('Add Emoji → Role')
					.setStyle(ButtonStyle.Success)
					.setEmoji('➕'),
			),
		);
	}

	return builder;
}

// =============================================================================
// buildPanelEmbed — simple default panel (no custom layout)
// =============================================================================

/**
 * Build a Components V2 ContainerBuilder for a reaction role panel.
 * If `panelData.layout` is set, delegates to buildLayoutContainer() for
 * full embed-builder-style rendering; otherwise renders a simple default.
 *
 * @param {object}   panelData     Panel DB record or plain object.
 * @param {object[]} reactionRoles Array of ReactionRole DB instances.
 * @param {object}   container     Kythia DI container.
 * @returns {ContainerBuilder}
 */
function buildPanelEmbed(panelData, reactionRoles, container) {
	// Delegate to custom layout renderer if a layout config is present
	if (panelData.layout && typeof panelData.layout === 'object') {
		// Merge panel-level title/description into layout as defaults
		const mergedLayout = {
			title: panelData.title,
			description: panelData.description,
			...panelData.layout,
		};
		return buildLayoutContainer(
			mergedLayout,
			reactionRoles,
			container,
			panelData,
		);
	}

	const { kythiaConfig, helpers } = container;
	const { convertColor } = helpers.color;

	const accentColor = convertColor(kythiaConfig.bot.color, {
		from: 'hex',
		to: 'decimal',
	});

	const builder = new ContainerBuilder().setAccentColor(accentColor);

	// Title
	const title = panelData.title || '🎭 Reaction Roles';
	builder.addTextDisplayComponents(
		new TextDisplayBuilder().setContent(`## ${title}`),
	);

	builder.addSeparatorComponents(
		new SeparatorBuilder()
			.setSpacing(SeparatorSpacingSize.Small)
			.setDivider(true),
	);

	// Description (optional)
	if (panelData.description) {
		builder.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(panelData.description),
		);
		builder.addSeparatorComponents(
			new SeparatorBuilder()
				.setSpacing(SeparatorSpacingSize.Small)
				.setDivider(false),
		);
	}

	// Emoji bindings
	if (!reactionRoles || reactionRoles.length === 0) {
		builder.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(
				'> *No reaction roles added yet. Use the buttons below to add some!*',
			),
		);
	} else {
		let lines = '';
		for (const rr of reactionRoles) {
			lines += `${rr.emoji} ➡️ <@&${rr.roleId}>\n`;
		}
		builder.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(lines.trimEnd()),
		);
	}

	// Whitelist / blacklist footer
	const flags = [];
	const whitelist = panelData.whitelistRoles || [];
	const blacklist = panelData.blacklistRoles || [];
	if (whitelist.length > 0)
		flags.push(
			`🟢 Whitelist: ${whitelist.map((id) => `<@&${id}>`).join(', ')}`,
		);
	if (blacklist.length > 0)
		flags.push(
			`🔴 Blacklist: ${blacklist.map((id) => `<@&${id}>`).join(', ')}`,
		);
	if (flags.length > 0) {
		builder.addSeparatorComponents(
			new SeparatorBuilder()
				.setSpacing(SeparatorSpacingSize.Small)
				.setDivider(true),
		);
		builder.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(flags.join('\n')),
		);
	}

	// Add Emoji button (only shown if panelId is present on the data object)
	if (panelData.id) {
		builder.addSeparatorComponents(
			new SeparatorBuilder()
				.setSpacing(SeparatorSpacingSize.Small)
				.setDivider(false),
		);
		builder.addActionRowComponents(
			new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId(`rr-panel-add-emoji-show:${panelData.id}`)
					.setLabel('Add Emoji → Role')
					.setStyle(ButtonStyle.Success)
					.setEmoji('➕'),
			),
		);
	}

	return builder;
}

// =============================================================================
// buildReactionRoleComponents — legacy (no panel)
// =============================================================================

/**
 * Backwards-compatible builder used by old (non-panel) reaction roles.
 *
 * @param {object[]} reactionRoles
 * @param {object}   container
 * @returns {ContainerBuilder}
 */
function buildReactionRoleComponents(reactionRoles, container) {
	return buildPanelEmbed(
		{
			title: '🎭 Reaction Roles',
			description: null,
			whitelistRoles: [],
			blacklistRoles: [],
		},
		reactionRoles,
		container,
	);
}

// =============================================================================
// refreshPanelMessage
// =============================================================================

/**
 * Re-fetch all ReactionRole records for a given panel, then re-edit the
 * Discord panel message using the panel's current layout (custom or default).
 *
 * @param {number} panelId   DB primary key of the ReactionRolePanel record.
 * @param {object} container Kythia DI container.
 * @returns {Promise<void>}
 */
async function refreshPanelMessage(panelId, container) {
	const { models, logger } = container;
	const client = container.client;
	const { ReactionRolePanel, ReactionRole } = models;

	const panel = await ReactionRolePanel.findByPk(panelId);
	if (!panel || !panel.messageId) return;

	const reactionRoles = await ReactionRole.findAll({
		where: { panelId: panel.id },
	});

	const channel = await client.channels
		.fetch(panel.channelId)
		.catch(() => null);
	if (!channel) {
		logger.warn(`Channel ${panel.channelId} not found for panel ${panelId}.`, {
			label: 'reaction-role refresh',
		});
		return;
	}

	const message = await channel.messages
		.fetch(panel.messageId)
		.catch(() => null);
	if (!message) {
		logger.warn(
			`Message ${panel.messageId} not found in channel ${panel.channelId}.`,
			{ label: 'reaction-role refresh' },
		);
		return;
	}

	const updatedContainer = buildPanelEmbed(
		panel.toJSON(),
		reactionRoles,
		container,
	);

	await message.edit({
		components: [updatedContainer],
		flags: MessageFlags.IsComponentsV2,
	});
}

// =============================================================================
// refreshReactionRoleMessage — legacy (no panel)
// =============================================================================

/**
 * Legacy helper — refreshes a Discord message that has reaction roles but
 * no associated panel (backwards compatibility with old add-command records).
 *
 * @param {string} messageId   Discord message ID.
 * @param {object} container   Kythia DI container.
 * @returns {Promise<void>}
 */
async function refreshReactionRoleMessage(messageId, container) {
	const { models, logger } = container;
	const client = container.client;
	const { ReactionRole } = models;

	const reactionRoles = await ReactionRole.findAll({ where: { messageId } });
	if (reactionRoles.length === 0) return;

	// If these belong to a panel, delegate to panel refresh
	const firstWithPanel = reactionRoles.find((rr) => rr.panelId != null);
	if (firstWithPanel) {
		return refreshPanelMessage(firstWithPanel.panelId, container);
	}

	const channelId = reactionRoles[0].channelId;
	const channel = await client.channels.fetch(channelId).catch(() => null);
	if (!channel) {
		logger.warn(`Channel ${channelId} not found.`, {
			label: 'reaction-role refresh',
		});
		return;
	}

	const message = await channel.messages.fetch(messageId).catch(() => null);
	if (!message) {
		logger.warn(`Message ${messageId} not found.`, {
			label: 'reaction-role refresh',
		});
		return;
	}

	const updatedContainer = buildReactionRoleComponents(
		reactionRoles,
		container,
	);
	await message.edit({
		components: [updatedContainer],
		flags: MessageFlags.IsComponentsV2,
	});
}

module.exports = {
	buildLayoutContainer,
	buildPanelEmbed,
	buildReactionRoleComponents,
	refreshPanelMessage,
	refreshReactionRoleMessage,
};
