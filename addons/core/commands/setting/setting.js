/**
 * @namespace: addons/core/commands/setting/setting.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */
const {
	SlashCommandBuilder,
	ChannelType,
	PermissionFlagsBits,
	InteractionContextType,
	ContainerBuilder,
	TextDisplayBuilder,
	SeparatorBuilder,
	SeparatorSpacingSize,
	MessageFlags,
} = require('discord.js');
const { updateStats } = require('../../helpers/stats');

const fs = require('node:fs');
const path = require('node:path');

const langDir = path.join(__dirname, '../../lang');
let availableLanguages = [];

try {
	const files = fs.readdirSync(langDir);
	availableLanguages = files
		.filter((file) => file.endsWith('.json'))
		.map((file) => {
			const langCode = path.basename(file, '.json');
			try {
				const langData = JSON.parse(
					fs.readFileSync(path.join(langDir, file), 'utf8'),
				);
				return {
					name: langData.languageName || langCode,
					value: langCode,
				};
			} catch {
				return {
					name: langCode,
					value: langCode,
				};
			}
		});
} catch (_e) {
	availableLanguages = [];
}
/**
 * Memastikan data dari DB yang seharusnya array benar-benar array.
 * @param {*} dbField - Field dari model Sequelize.
 * @returns {Array} - Field yang sudah dijamin berupa array.
 */
function ensureArray(dbField) {
	if (Array.isArray(dbField)) {
		return dbField;
	}
	if (typeof dbField === 'string') {
		try {
			const parsed = JSON.parse(dbField);
			return Array.isArray(parsed) ? parsed : [];
		} catch {
			return [];
		}
	}
	return [];
}

const createToggleOption = () => {
	return (opt) =>
		opt
			.setName('status')
			.setDescription('Select status')
			.setRequired(true)
			.addChoices(
				{ name: 'Enable', value: 'enable' },
				{ name: 'Disable', value: 'disable' },
			);
};

const featureMap = {
	'anti-invites': ['antiInviteOn', 'Anti-Invites'],
	'anti-links': ['antiLinkOn', 'Anti-Links'],
	'anti-spam': ['antiSpamOn', 'Anti-Spam'],
	'anti-badwords': ['antiBadwordOn', 'Anti-Badwords'],
	'anti-mention': ['antiMentionOn', 'Anti-Mention'],
	'anti-all-caps': ['antiAllCapsOn', 'Anti-All Caps'],
	'anti-emoji-spam': ['antiEmojiSpamOn', 'Anti-Emoji Spam'],
	'anti-zalgo': ['antiZalgoOn', 'Anti-Zalgo'],
	'server-stats': ['serverStatsOn', 'Server Stats'],
	leveling: ['levelingOn', 'Leveling'],
	adventure: ['adventureOn', 'Adventure'],
	'welcome-in': ['welcomeInOn', 'Welcome In'],
	'welcome-out': ['welcomeOutOn', 'Welcome Out'],
	'minecraft-stats': ['minecraftStatsOn', 'Minecraft Stats'],
	streak: ['streakOn', 'Streak'],
	invites: ['invitesOn', 'Invites'],
	'boost-log': ['boostLogOn', 'Boost Log'],
};

const toggleableFeatures = Object.keys(featureMap);

const command = new SlashCommandBuilder()
	.setName('set')
	.setDescription('⚙️ Settings bot configuration')
	.setContexts(InteractionContextType.Guild)
	.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
	.addSubcommandGroup((group) =>
		group
			.setName('automod')
			.setDescription('🔒 Automod settings')
			.addSubcommand((sub) =>
				sub
					.setName('whitelist')
					.setDescription('🔄 Add or remove from whitelist')
					.addStringOption((opt) =>
						opt
							.setName('action')
							.setDescription('Add or remove')
							.setRequired(true)
							.addChoices(
								{ name: 'Add', value: 'add' },
								{ name: 'Remove', value: 'remove' },
							),
					)
					.addMentionableOption((opt) =>
						opt
							.setName('target')
							.setDescription('User or role')
							.setRequired(true),
					),
			)
			.addSubcommand((sub) =>
				sub
					.setName('badwords')
					.setDescription('🔄 Add or remove bad words')
					.addStringOption((opt) =>
						opt
							.setName('action')
							.setDescription('Add or remove')
							.setRequired(true)
							.addChoices(
								{ name: 'Add', value: 'add' },
								{ name: 'Remove', value: 'remove' },
							),
					)
					.addStringOption((opt) =>
						opt.setName('word').setDescription('Word').setRequired(true),
					),
			)
			.addSubcommand((sub) =>
				sub
					.setName('badword-whitelist')
					.setDescription('🔄 Add or remove bad word whitelist')
					.addStringOption((opt) =>
						opt
							.setName('action')
							.setDescription('Add or remove')
							.setRequired(true)
							.addChoices(
								{ name: 'Add', value: 'add' },
								{ name: 'Remove', value: 'remove' },
							),
					)
					.addStringOption((opt) =>
						opt.setName('word').setDescription('Word').setRequired(true),
					),
			)
			.addSubcommand((sub) =>
				sub
					.setName('exception-channel')
					.setDescription('🔄 Add or remove exception channel')
					.addStringOption((opt) =>
						opt
							.setName('action')
							.setDescription('Add or remove')
							.setRequired(true)
							.addChoices(
								{ name: 'Add', value: 'add' },
								{ name: 'Remove', value: 'remove' },
							),
					)
					.addChannelOption((opt) =>
						opt
							.setName('channel')
							.setDescription('Channel for exception')
							.setRequired(true),
					),
			)
			.addSubcommand((sub) =>
				sub
					.setName('mod-log-channel')
					.setDescription('🔄 Channel to be used for automod logs')
					.addChannelOption((opt) =>
						opt
							.setName('channel')
							.setDescription('Select channel for automod logs')
							.setRequired(true),
					),
			)
			.addSubcommand((sub) =>
				sub
					.setName('audit-log-channel')
					.setDescription('🔄 Channel to be used for audit logs')
					.addChannelOption((opt) =>
						opt
							.setName('channel')
							.setDescription('Select channel for audit logs')
							.setRequired(true),
					),
			)
			.addSubcommand((sub) =>
				sub.setName('badwords-list').setDescription('View bad words list'),
			)
			.addSubcommand((sub) =>
				sub
					.setName('badwords-whitelist-list')
					.setDescription('View bad words whitelist list'),
			)
			.addSubcommand((sub) =>
				sub
					.setName('exception-channel-list')
					.setDescription('View exception channels'),
			)
			.addSubcommand((sub) =>
				sub.setName('whitelist-list').setDescription('View whitelist'),
			),
	)

	.addSubcommandGroup((group) =>
		group
			.setName('stats')
			.setDescription('📈 Server statistics settings')
			.addSubcommand((sub) =>
				sub
					.setName('category')
					.setDescription('📈 Set category for server stats channels')
					.addChannelOption((opt) =>
						opt
							.setName('category')
							.setDescription('Category channel')
							.setRequired(true),
					),
			)
			.addSubcommand((sub) =>
				sub
					.setName('add')
					.setDescription('📈 Add a new stat for a specific channel')
					.addStringOption((opt) =>
						opt
							.setName('format')
							.setDescription('Stat format, e.g.: {memberstotal}')
							.setRequired(true),
					)
					.addChannelOption((opt) =>
						opt
							.setName('channel')
							.setDescription(
								'📈 Select a channel to use as stat (if not selected, the bot will create a new channel)',
							)
							.setRequired(false),
					),
			)
			.addSubcommand((sub) =>
				sub
					.setName('edit')
					.setDescription('📈 Edit the format of an existing stat channel')
					.addStringOption((opt) =>
						opt
							.setName('stats')
							.setDescription('Select the stat to edit')
							.setRequired(true)
							.setAutocomplete(true),
					)
					.addChannelOption((opt) =>
						opt
							.setName('channel')
							.setDescription('📈 Edit stat channel')
							.setRequired(false),
					)
					.addStringOption((opt) =>
						opt
							.setName('format')
							.setDescription('📈 Edit stat format, e.g.: {membersonline}')
							.setRequired(false),
					),
			)
			.addSubcommand((sub) =>
				sub
					.setName('enable')
					.setDescription('📈 Enable stat channel')
					.addStringOption((opt) =>
						opt
							.setName('stats')
							.setDescription('Select the stat to enable')
							.setRequired(true)
							.setAutocomplete(true),
					),
			)
			.addSubcommand((sub) =>
				sub
					.setName('disable')
					.setDescription('📈 Disable stat channel')
					.addStringOption((opt) =>
						opt
							.setName('stats')
							.setDescription('Select the stat to disable')
							.setRequired(true)
							.setAutocomplete(true),
					),
			)
			.addSubcommand((sub) =>
				sub
					.setName('remove')
					.setDescription('📈 Delete the stat and its channel')
					.addStringOption((opt) =>
						opt
							.setName('stats')
							.setDescription('Select the stat to delete')
							.setRequired(true)
							.setAutocomplete(true),
					),
			),
	)

	.addSubcommandGroup((group) =>
		group
			.setName('admin')
			.setDescription('🔒 Bot admin settings')
			.addSubcommand((sub) =>
				sub
					.setName('edit')
					.setDescription('🔒 Add or remove admin')
					.addStringOption((opt) =>
						opt
							.setName('action')
							.setDescription('Add or remove')
							.setRequired(true)
							.addChoices(
								{ name: 'Add', value: 'add' },
								{ name: 'Remove', value: 'remove' },
							),
					)
					.addMentionableOption((opt) =>
						opt
							.setName('target')
							.setDescription('User or role admin')
							.setRequired(true),
					),
			)
			.addSubcommand((sub) =>
				sub.setName('admin-list').setDescription('View admin list'),
			),
	)

	.addSubcommandGroup((group) =>
		group
			.setName('welcome')
			.setDescription('👋 Welcome system settings')
			.addSubcommand((sub) =>
				sub
					.setName('in-channel')
					.setDescription('👋 Set welcome in channel')
					.addChannelOption((opt) =>
						opt
							.setName('channel')
							.setDescription('Welcome in channel')
							.setRequired(true),
					),
			)
			.addSubcommand((sub) =>
				sub
					.setName('out-channel')
					.setDescription('👋 Set welcome out channel')
					.addChannelOption((opt) =>
						opt
							.setName('channel')
							.setDescription('Welcome out channel')
							.setRequired(true),
					),
			)
			.addSubcommand((sub) =>
				sub
					.setName('role')
					.setDescription('👋 Set welcome role')
					.addRoleOption((opt) =>
						opt
							.setName('role')
							.setDescription('Role for welcome')
							.setRequired(true),
					),
			)
			.addSubcommand((sub) =>
				sub
					.setName('in-text')
					.setDescription('👋 Set welcome in text')
					.addStringOption((opt) =>
						opt
							.setName('text')
							.setDescription('Text for welcome in')
							.setRequired(true),
					),
			)
			.addSubcommand((sub) =>
				sub
					.setName('out-text')
					.setDescription('👋 Set welcome out text')
					.addStringOption((opt) =>
						opt
							.setName('text')
							.setDescription('Text for welcome out')
							.setRequired(true),
					),
			)
			.addSubcommand((sub) =>
				sub
					.setName('in-background')
					.setDescription('👋 Set welcome in background')
					.addStringOption((opt) =>
						opt
							.setName('background')
							.setDescription('Background for welcome in')
							.setRequired(true),
					),
			)
			.addSubcommand((sub) =>
				sub
					.setName('out-background')
					.setDescription('👋 Set welcome out background')
					.addStringOption((opt) =>
						opt
							.setName('background')
							.setDescription('Background for welcome out')
							.setRequired(true),
					),
			),
	)

	.addSubcommandGroup((group) =>
		group
			.setName('leveling')
			.setDescription('🎮 Leveling system settings')
			.addSubcommand((sub) =>
				sub
					.setName('channel')
					.setDescription('🎮 Set channel for level up messages')
					.addChannelOption((opt) =>
						opt
							.setName('channel')
							.setDescription('Channel for level up messages')
							.setRequired(true),
					),
			)
			.addSubcommand((sub) =>
				sub
					.setName('cooldown')
					.setDescription('🎮 Set XP gain cooldown')
					.addIntegerOption((opt) =>
						opt
							.setName('cooldown')
							.setDescription('Cooldown in seconds')
							.setRequired(true),
					),
			)
			.addSubcommand((sub) =>
				sub
					.setName('xp')
					.setDescription('🎮 Set XP amount per message')
					.addIntegerOption((opt) =>
						opt
							.setName('xp')
							.setDescription('XP gained per message')
							.setRequired(true),
					),
			)
			.addSubcommand((sub) =>
				sub
					.setName('rolereward')
					.setDescription('🎮 Set role reward for a specific level')
					.addStringOption((opt) =>
						opt
							.setName('action')
							.setDescription('Add or remove role reward')
							.setRequired(true)
							.addChoices(
								{ name: 'Add', value: 'add' },
								{ name: 'Remove', value: 'remove' },
							),
					)
					.addIntegerOption((opt) =>
						opt
							.setName('level')
							.setDescription('Required level')
							.setRequired(true),
					)
					.addRoleOption((opt) =>
						opt
							.setName('role')
							.setDescription('Role to be given')
							.setRequired(true),
					),
			),
	)

	.addSubcommandGroup((group) =>
		group
			.setName('minecraft')
			.setDescription('🎮 Minecraft server settings')
			.addSubcommand((sub) =>
				sub
					.setName('ip')
					.setDescription('🎮 Set Minecraft server IP')
					.addStringOption((opt) =>
						opt
							.setName('ip')
							.setDescription('Minecraft server IP')
							.setRequired(true),
					),
			)
			.addSubcommand((sub) =>
				sub
					.setName('port')
					.setDescription('🎮 Set Minecraft server port')
					.addIntegerOption((opt) =>
						opt
							.setName('port')
							.setDescription('Minecraft server port')
							.setRequired(true),
					),
			)
			.addSubcommand((sub) =>
				sub
					.setName('ip-channel')
					.setDescription('🎮 Set channel to display Minecraft server IP')
					.addChannelOption((opt) =>
						opt
							.setName('channel')
							.setDescription('Channel for Minecraft IP')
							.setRequired(true),
					),
			)
			.addSubcommand((sub) =>
				sub
					.setName('port-channel')
					.setDescription('🎮 Set channel to display Minecraft server port')
					.addChannelOption((opt) =>
						opt
							.setName('channel')
							.setDescription('Channel for Minecraft port')
							.setRequired(true),
					),
			)
			.addSubcommand((sub) =>
				sub
					.setName('status-channel')
					.setDescription('🎮 Set channel for Minecraft server status')
					.addChannelOption((opt) =>
						opt
							.setName('channel')
							.setDescription('Channel for Minecraft status')
							.setRequired(true),
					),
			),
	)

	.addSubcommandGroup((group) =>
		group
			.setName('language')
			.setDescription('🌐 Language settings')
			.addSubcommand((sub) =>
				sub
					.setName('set')
					.setDescription('🌐 Set bot language')
					.addStringOption((opt) =>
						Array.isArray(availableLanguages) && availableLanguages.length > 0
							? opt
									.setName('lang')
									.setDescription('Choose language')
									.setRequired(true)
									.addChoices(...availableLanguages)
							: opt
									.setName('lang')
									.setDescription('Choose language')
									.setRequired(true),
					),
			),
	)

	.addSubcommandGroup((group) =>
		group
			.setName('testimony')
			.setDescription('💬 Testimony system settings')
			.addSubcommand((sub) =>
				sub
					.setName('testimony-channel')
					.setDescription('💬 Set channel to send testimonies')
					.addChannelOption((opt) =>
						opt
							.setName('channel')
							.setDescription('Testimony channel')
							.setRequired(true),
					),
			)
			.addSubcommand((sub) =>
				sub
					.setName('feedback-channel')
					.setDescription('💬 Set channel for testimony feedback')
					.addChannelOption((opt) =>
						opt
							.setName('channel')
							.setDescription('Testimony feedback channel')
							.setRequired(true),
					),
			)
			.addSubcommand((sub) =>
				sub
					.setName('count-channel')
					.setDescription(
						'💬 Set channel to display testimony count (name will be changed automatically)',
					)
					.addChannelOption((opt) =>
						opt
							.setName('channel')
							.setDescription('Testimony counter channel')
							.setRequired(true),
					),
			)
			.addSubcommand((sub) =>
				sub
					.setName('count-format')
					.setDescription('💬 Set channel name format for testimony counter')
					.addStringOption((opt) =>
						opt
							.setName('format')
							.setDescription(
								'Channel name format, use {count} for the number. Example: testimony-{count}',
							)
							.setRequired(true),
					),
			)
			.addSubcommand((sub) =>
				sub
					.setName('reset-count')
					.setDescription('💬 Reset testimony count to 0'),
			)
			.addSubcommand((sub) =>
				sub
					.setName('count')
					.setDescription('💬 Change testimony count')
					.addIntegerOption((opt) =>
						opt
							.setName('count')
							.setDescription('New testimony count')
							.setRequired(true),
					),
			),
	)

	.addSubcommandGroup((group) =>
		group
			.setName('ai')
			.setDescription('🤖 AI settings')
			.addSubcommand((sub) =>
				sub
					.setName('add-channel')
					.setDescription('🤖 Allow a channel to use AI')
					.addChannelOption((opt) =>
						opt.setName('channel').setDescription('Channel').setRequired(true),
					),
			)
			.addSubcommand((sub) =>
				sub
					.setName('remove-channel')
					.setDescription('🤖 Disallow a channel from using AI')
					.addChannelOption((opt) =>
						opt.setName('channel').setDescription('Channel').setRequired(true),
					),
			)
			.addSubcommand((sub) =>
				sub.setName('list').setDescription('🤖 List AI-enabled channels'),
			),
	)

	.addSubcommandGroup((group) =>
		group
			.setName('channels')
			.setDescription('📢 Misc channels settings')
			.addSubcommand((sub) =>
				sub
					.setName('announcement')
					.setDescription('📢 Set announcement channel')
					.addChannelOption((opt) =>
						opt.setName('channel').setDescription('Channel').setRequired(true),
					),
			)
			.addSubcommand((sub) =>
				sub
					.setName('invite')
					.setDescription('📢 Set invite log channel')
					.addChannelOption((opt) =>
						opt.setName('channel').setDescription('Channel').setRequired(true),
					),
			),
	)

	.addSubcommandGroup((group) =>
		group
			.setName('booster')
			.setDescription('🚀 Booster log settings')
			.addSubcommand((sub) =>
				sub
					.setName('channel')
					.setDescription('🚀 Set boost log channel')
					.addChannelOption((opt) =>
						opt
							.setName('channel')
							.setDescription('Channel for boost logs')
							.setRequired(true),
					),
			)
			.addSubcommand((sub) =>
				sub
					.setName('message')
					.setDescription('🚀 Set boost log message')
					.addStringOption((opt) =>
						opt
							.setName('message')
							.setDescription(
								'Custom message for boost logs (use placeholders like {username}, {displayName})',
							)
							.setRequired(true),
					),
			),
	)

	.addSubcommandGroup((group) =>
		group
			.setName('streak-settings')
			.setDescription('🔥 Streak additional settings')
			.addSubcommand((sub) =>
				sub
					.setName('minimum')
					.setDescription('🔥 Set minimum streak')
					.addIntegerOption((opt) =>
						opt
							.setName('minimum')
							.setDescription('Minimum streak')
							.setRequired(true),
					),
			)
			.addSubcommand((sub) =>
				sub
					.setName('emoji')
					.setDescription('🔥 Set streak emoji')
					.addStringOption((opt) =>
						opt.setName('emoji').setDescription('Emoji').setRequired(true),
					),
			)
			.addSubcommand((sub) =>
				sub
					.setName('nickname')
					.setDescription('🔥 Toggle auto-nickname for streak')
					.addStringOption(createToggleOption()),
			),
	)

	.addSubcommandGroup((group) =>
		group
			.setName('raw')
			.setDescription('🧰 Advanced: set any ServerSetting field')
			.addSubcommand((sub) =>
				sub
					.setName('set')
					.setDescription('🧰 Set any field (admin only)')
					.addStringOption((opt) =>
						opt.setName('field').setDescription('Field name').setRequired(true),
					)
					.addStringOption((opt) =>
						opt.setName('value').setDescription('Value').setRequired(true),
					),
			),
	)

	.addSubcommandGroup((group) =>
		group
			.setName('streak')
			.setDescription('🔥 Streak system settings')
			.addSubcommand((sub) =>
				sub
					.setName('rolereward')
					.setDescription('🔥 Set role reward for a specific streak')
					.addStringOption((opt) =>
						opt
							.setName('action')
							.setDescription('Add or remove role reward')
							.setRequired(true)
							.addChoices(
								{ name: 'Add', value: 'add' },
								{ name: 'Remove', value: 'remove' },
							),
					)
					.addIntegerOption((opt) =>
						opt
							.setName('streak')
							.setDescription('Required streak')
							.setRequired(true),
					)
					.addRoleOption((opt) =>
						opt
							.setName('role')
							.setDescription('Role to be given')
							.setRequired(true),
					),
			),
	)

	.addSubcommand((sub) =>
		sub.setName('view').setDescription('🔍 View all bot settings'),
	)

	.addSubcommandGroup((group) => {
		group
			.setName('features')
			.setDescription('🔄 Enable or disable a specific feature');

		for (const [subcommandName, [, featureDisplayName]] of Object.entries(
			featureMap,
		)) {
			group.addSubcommand((sub) =>
				sub
					.setName(subcommandName)
					.setDescription(`Enable or disable the ${featureDisplayName} feature`)
					.addStringOption(createToggleOption()),
			);
		}

		return group;
	});
module.exports = {
	slashCommand: command,
	permissions: PermissionFlagsBits.ManageGuild,
	botPermissions: PermissionFlagsBits.ManageGuild,
	async autocomplete(interaction) {
		const container = interaction.client.container;
		const { t, models, helpers } = container;
		const { ServerSetting } = models;
		const { getChannelSafe } = helpers.discord;
		const focused = interaction.options.getFocused();
		const settings = await ServerSetting.getCache({
			guildId: interaction.guild.id,
		});
		const stats = settings?.serverStats ?? [];

		const filtered = stats
			.filter(async (stat) => {
				const channel = await getChannelSafe(interaction.guild, stat.channelId);
				return channel?.name.toLowerCase().includes(focused.toLowerCase());
			})
			.map(async (stat) => {
				const channel = await getChannelSafe(interaction.guild, stat.channelId);
				return {
					name: `${channel.name} (${stat.enabled ? await t(interaction, 'core.setting.setting.stats.enabled.text') : await t(interaction, 'core.setting.setting.stats.disabled.text')})`,
					value: channel.id,
				};
			});

		await interaction.respond(filtered.slice(0, 25));
	},
	async execute(interaction, container) {
		const { t, kythiaConfig, helpers, models, logger } = container;
		const { getChannelSafe, simpleContainer } = helpers.discord;
		// const { convertColor } = helpers.color;
		const { ServerSetting } = models;

		await interaction.deferReply({ ephemeral: true });

		const group = interaction.options.getSubcommandGroup(false);
		const sub = interaction.options.getSubcommand();
		const guildId = interaction.guild.id;
		const guildName = interaction.guild.name;
		const _status = interaction.options.getString('status');
		const action = interaction.options.getString('action');
		const target = interaction.options.getMentionable('target');
		const channel = interaction.options.getChannel('channel');

		const [serverSetting, created] = await ServerSetting.findOrCreateWithCache({
			where: { guildId: guildId },
			defaults: { guildId: guildId, guildName: guildName },
		});

		if (created) {
			await ServerSetting.clearNegativeCache({ where: { guildId: guildId } });
			logger.info(
				`[CACHE] Cleared negative cache for new ServerSetting: ${guildId}`,
			);
		}

		function cleanAndParseJson(value) {
			if (typeof value !== 'string') return value;
			let tempValue = value;
			try {
				while (typeof tempValue === 'string') {
					tempValue = JSON.parse(tempValue);
				}
				return tempValue;
			} catch (_e) {
				return tempValue;
			}
		}

		if (sub === 'view') {
			if (!serverSetting || !serverSetting.dataValues) {
				const components = await simpleContainer(
					interaction,
					await t(interaction, 'core.setting.setting.no.config'),
					{ color: kythiaConfig.bot.color },
				);
				return interaction.editReply({
					components,
					flags: MessageFlags.IsComponentsV2,
				});
			}
			const settings = serverSetting.dataValues;
			const kategori = { umum: [], boolean: [], array: [], lainnya: [] };
			function formatKey(key) {
				return key
					.replace(/([a-z])([A-Z])/g, '$1 $2')
					.replace(/^./, (str) => str.toUpperCase())
					.replace(/\s([a-z])/g, (_match, p1) => ` ${p1.toUpperCase()}`);
			}
			for (const [key, value] of Object.entries(settings)) {
				if (['id', 'guildId'].includes(key)) continue;
				const formattedKey = `\`${formatKey(key)}\``;
				if (typeof value === 'boolean') {
					const displayKey = formattedKey.replace(/\sOn`$/, '`');
					kategori.boolean.push(
						`${value ? `🟩 ・${displayKey}` : `🟥 ・${displayKey}`}`,
					);
				} else if (Array.isArray(value)) {
					if (value.length === 0) {
						kategori.array.push(
							`🟪 ・${formattedKey} ➜ *${await t(interaction, 'core.setting.setting.empty')}*`,
						);
					} else {
						let list = '';
						value.forEach((item) => {
							if (
								typeof item === 'object' &&
								item.level &&
								(item.roleId || item.role)
							) {
								const roleDisplay = item.roleId
									? `<@&${item.roleId}>`
									: `<@&${item.role}>`;
								list += `   └ 🥇 level ${item.level} ➜ ${roleDisplay}\n`;
							} else if (typeof item === 'object') {
								list += `   └ 🔹 \`${JSON.stringify(item)}\`\n`;
							} else {
								list += `   └ 🔹 ${item}\n`;
							}
						});
						kategori.array.push(`🟪 ・${formattedKey}:\n${list.trim()}`);
					}
				} else if (typeof value === 'string' || typeof value === 'number') {
					let displayValue = value;
					const cleanedValue = cleanAndParseJson(value);

					if (
						key === 'badwords' ||
						key === 'whitelist' ||
						key === 'ignoredChannels'
					) {
						if (Array.isArray(cleanedValue) && cleanedValue.length > 0) {
							if (key === 'ignoredChannels') {
								displayValue = cleanedValue.map((id) => `<#${id}>`).join(', ');
							} else {
								displayValue = cleanedValue
									.map((item) => `\`${item}\``)
									.join(', ');
							}
						} else {
							displayValue = `*${await t(interaction, 'core.setting.setting.empty')}*`;
						}
					} else if (key === 'serverStats') {
						if (Array.isArray(cleanedValue) && cleanedValue.length > 0) {
							displayValue = cleanedValue
								.map((stat) => `\n   └ ${stat.format} ➜ <#${stat.channelId}>`)
								.join('');
						} else {
							displayValue = `*${await t(interaction, 'core.setting.setting.not.set')}*`;
						}
					} else if (
						key.toLowerCase().includes('channelid') ||
						key.toLowerCase().includes('forumid') ||
						(key.toLowerCase().includes('categoryid') && value)
					) {
						displayValue = `<#${value}>`;
					} else if (key.toLowerCase().includes('roleid')) {
						displayValue = `<@&${value}>`;
					}
					kategori.umum.push(
						`🟨 ・${formattedKey} ➜ ${displayValue || `*${await t(interaction, 'core.setting.setting.not.set')}*`}`,
					);
				} else {
					kategori.lainnya.push(`⬛ ・${formattedKey}`);
				}
			}

			const allLines = [];

			if (kategori.boolean.length) {
				allLines.push(
					`### ⭕ ${await t(interaction, 'core.setting.setting.section.boolean')}`,
				);
				allLines.push(...kategori.boolean);
				allLines.push('');
			}

			if (kategori.umum.length) {
				allLines.push(
					`### ⚙️ ${await t(interaction, 'core.setting.setting.section.umum')}`,
				);
				allLines.push(...kategori.umum);
				allLines.push('');
			}

			if (kategori.array.length) {
				allLines.push(
					`### 🗃️ ${await t(interaction, 'core.setting.setting.section.array')}`,
				);
				allLines.push(...kategori.array);
				allLines.push('');
			}

			if (kategori.lainnya.length) {
				allLines.push(
					`### ❓ ${await t(interaction, 'core.setting.setting.section.lainnya')}`,
				);
				allLines.push(...kategori.lainnya);
				allLines.push('');
			}

			const pages = [];
			let currentPage = '';
			const MAX_LENGTH = 4096;
			for (const line of allLines) {
				if (currentPage.length + line.length + 1 > MAX_LENGTH) {
					pages.push(currentPage);
					currentPage = '';
				}
				currentPage += `${line}\n`;
			}
			if (currentPage.length > 0) {
				pages.push(currentPage);
			}

			let page = 0;
			const totalPages = pages.length;

			const buildPageContainer = async (pageIdx) => {
				const { convertColor } = helpers.color;
				const container = new ContainerBuilder()
					.setAccentColor(
						convertColor(kythiaConfig.bot.color, {
							from: 'hex',
							to: 'decimal',
						}),
					)
					.addTextDisplayComponents(
						new TextDisplayBuilder().setContent(
							`## ${await t(interaction, 'core.setting.setting.embed.title.view')}`,
						),
					)
					.addTextDisplayComponents(
						new TextDisplayBuilder().setContent(
							pages[pageIdx] ||
								(await t(interaction, 'core.setting.setting.no.configured')),
						),
					)
					.addSeparatorComponents(
						new SeparatorBuilder()
							.setSpacing(SeparatorSpacingSize.Small)
							.setDivider(true),
					)
					.addTextDisplayComponents(
						new TextDisplayBuilder().setContent(
							`${await t(interaction, 'common.embed.footer', { username: interaction.client.user.username })} • Page ${pageIdx + 1}/${totalPages}`,
						),
					);
				return container;
			};

			if (pages.length === 1) {
				const container = await buildPageContainer(0);
				return interaction.editReply({
					components: [container],
					flags: MessageFlags.IsComponentsV2,
				});
			}

			const {
				ActionRowBuilder,
				ButtonBuilder,
				ButtonStyle,
			} = require('discord.js');
			const prevBtn = new ButtonBuilder()
				.setCustomId('setting_view_prev')
				.setLabel('◀️')
				.setStyle(ButtonStyle.Secondary)
				.setDisabled(true);
			const nextBtn = new ButtonBuilder()
				.setCustomId('setting_view_next')
				.setLabel('▶️')
				.setStyle(ButtonStyle.Secondary)
				.setDisabled(pages.length <= 1);

			const row = new ActionRowBuilder().addComponents(prevBtn, nextBtn);

			const msg = await interaction.editReply({
				components: [await buildPageContainer(page), row],
				flags: MessageFlags.IsComponentsV2,
				fetchReply: true,
			});

			const filter = (i) =>
				i.user.id === interaction.user.id &&
				(i.customId === 'setting_view_prev' ||
					i.customId === 'setting_view_next');
			const collector = msg.createMessageComponentCollector({
				filter,
				time: 60_000,
			});

			collector.on('collect', async (i) => {
				if (i.customId === 'setting_view_prev') {
					page = Math.max(0, page - 1);
				} else if (i.customId === 'setting_view_next') {
					page = Math.min(pages.length - 1, page + 1);
				}

				prevBtn.setDisabled(page === 0);
				nextBtn.setDisabled(page === pages.length - 1);

				await i.update({
					components: [await buildPageContainer(page), row],
					flags: MessageFlags.IsComponentsV2,
				});
			});

			collector.on('end', async () => {
				prevBtn.setDisabled(true);
				nextBtn.setDisabled(true);
				try {
					await msg.edit({
						components: [row],
					});
				} catch (_e) {}
			});

			return;
		}

		if (toggleableFeatures.includes(sub)) {
			const status = interaction.options.getString('status');
			const [settingKey, featureName] = featureMap[sub];

			serverSetting[settingKey] = status === 'enable';
			await serverSetting.saveAndUpdateCache();

			const isEnabled = status === 'enable';
			const translationKey = isEnabled
				? 'core.setting.setting.feature.enabled'
				: 'core.setting.setting.feature.disabled';

			const components = await simpleContainer(
				interaction,
				await t(interaction, translationKey, { feature: featureName }),
				{ color: isEnabled ? 'Green' : 'Red' },
			);
			return interaction.editReply({
				components,
				flags: MessageFlags.IsComponentsV2,
			});
		}

		switch (group) {
			case 'automod': {
				switch (sub) {
					case 'whitelist': {
						const targetId = target.id;
						let whitelist = ensureArray(serverSetting.whitelist);

						if (action === 'add') {
							if (whitelist.includes(targetId)) {
								const components = await simpleContainer(
									interaction,
									await t(
										interaction,
										'core.setting.setting.whitelist.already',
									),
									{ color: 'Yellow' },
								);
								return interaction.editReply({
									components,
									flags: MessageFlags.IsComponentsV2,
								});
							}
							whitelist.push(targetId);
							serverSetting.whitelist = whitelist;
							serverSetting.changed('whitelist', true);
							await serverSetting.saveAndUpdateCache('guildId');

							const isRole = interaction.guild.roles.cache.has(targetId);
							const components = await simpleContainer(
								interaction,
								isRole
									? await t(
											interaction,
											'core.setting.setting.whitelist.add.role',
											{ role: `<@&${targetId}>` },
										)
									: await t(
											interaction,
											'core.setting.setting.whitelist.add.user',
											{ user: `<@${targetId}>` },
										),
								{ color: 'Green' },
							);
							return interaction.editReply({
								components,
								flags: MessageFlags.IsComponentsV2,
							});
						} else if (action === 'remove') {
							if (!whitelist.includes(targetId)) {
								const components = await simpleContainer(
									interaction,
									await t(
										interaction,
										'core.setting.setting.whitelist.notfound',
									),
									{ color: 'Red' },
								);
								return interaction.editReply({
									components,
									flags: MessageFlags.IsComponentsV2,
								});
							}
							whitelist = whitelist.filter((id) => id !== targetId);
							serverSetting.whitelist = whitelist;
							serverSetting.changed('whitelist', true);
							await serverSetting.saveAndUpdateCache('guildId');

							const isRole = interaction.guild.roles.cache.has(targetId);
							const components = await simpleContainer(
								interaction,
								isRole
									? await t(
											interaction,
											'core.setting.setting.whitelist.remove.role',
											{ role: `<@&${targetId}>` },
										)
									: await t(
											interaction,
											'core.setting.setting.whitelist.remove.user',
											{ user: `<@${targetId}>` },
										),
								{ color: 'Green' },
							);
							return interaction.editReply({
								components,
								flags: MessageFlags.IsComponentsV2,
							});
						} else {
							const components = await simpleContainer(
								interaction,
								await t(
									interaction,
									'core.setting.setting.whitelist.invalid.action',
								),
								{ color: 'Red' },
							);
							return interaction.editReply({
								components,
								flags: MessageFlags.IsComponentsV2,
							});
						}
					}
					case 'whitelist-list': {
						let whitelist = serverSetting.whitelist;
						if (typeof whitelist === 'string') {
							try {
								whitelist = JSON.parse(whitelist);
							} catch {
								whitelist = [];
							}
						}
						if (!Array.isArray(whitelist)) whitelist = [];
						if (whitelist.length === 0) {
							const components = await simpleContainer(
								interaction,
								await t(interaction, 'core.setting.setting.whitelist.empty'),
								{ color: 'Yellow' },
							);
							return interaction.editReply({
								components,
								flags: MessageFlags.IsComponentsV2,
							});
						}
						const whitelistString = whitelist
							.map(async (id) => {
								const member = interaction.guild.members.cache.get(id);
								if (member) return `<@${id}>`;
								const role = interaction.guild.roles.cache.get(id);
								if (role) return `<@&${id}>`;
								return await t(interaction, 'core.setting.setting.invalid.id', {
									id,
								});
							})
							.join('\n');
						const components = await simpleContainer(
							interaction,
							await t(interaction, 'core.setting.setting.whitelist.list', {
								list: whitelistString,
							}),
							{ color: kythiaConfig.bot.color },
						);
						return interaction.editReply({
							components,
							flags: MessageFlags.IsComponentsV2,
						});
					}
					case 'badwords': {
						let badwords = serverSetting.badwords;
						if (!Array.isArray(badwords) && typeof badwords === 'string') {
							try {
								badwords = JSON.parse(badwords);
							} catch {
								badwords = [];
							}
						} else if (!Array.isArray(badwords)) {
							badwords = [];
						}
						const word = interaction.options.getString('word');
						if (!word) {
							const components = await simpleContainer(
								interaction,
								await t(
									interaction,
									'core.setting.setting.badword.word.required',
								),
								{ color: 'Red' },
							);
							return interaction.editReply({
								components,
								flags: MessageFlags.IsComponentsV2,
							});
						}
						if (action === 'add') {
							if (badwords.includes(word.toLowerCase())) {
								const components = await simpleContainer(
									interaction,
									await t(interaction, 'core.setting.setting.badword.already'),
									{ color: 'Yellow' },
								);
								return interaction.editReply({
									components,
									flags: MessageFlags.IsComponentsV2,
								});
							}
							badwords.push(word.toLowerCase());
							serverSetting.badwords = badwords;
							serverSetting.changed('badwords', true);
							await serverSetting.saveAndUpdateCache('guildId');
							try {
								const { regexCache } = require('../../system/automod');
								if (regexCache && typeof regexCache.delete === 'function') {
									regexCache.delete(interaction.guild.id);
								}
							} catch {}
							const components = await simpleContainer(
								interaction,
								await t(interaction, 'core.setting.setting.badword.add', {
									word,
								}),
								{ color: 'Green' },
							);
							return interaction.editReply({
								components,
								flags: MessageFlags.IsComponentsV2,
							});
						} else if (action === 'remove') {
							if (!badwords.includes(word.toLowerCase())) {
								const components = await simpleContainer(
									interaction,
									await t(interaction, 'core.setting.setting.badword.notfound'),
									{ color: 'Red' },
								);
								return interaction.editReply({
									components,
									flags: MessageFlags.IsComponentsV2,
								});
							}
							badwords = badwords.filter((w) => w !== word.toLowerCase());
							serverSetting.badwords = badwords;
							serverSetting.changed('badwords', true);
							await serverSetting.saveAndUpdateCache('guildId');
							const components = await simpleContainer(
								interaction,
								await t(interaction, 'core.setting.setting.badword.remove', {
									word,
								}),
								{ color: 'Green' },
							);
							return interaction.editReply({
								components,
								flags: MessageFlags.IsComponentsV2,
							});
						}
						break;
					}
					case 'badwords-list': {
						let badwords = serverSetting.badwords;
						if (typeof badwords === 'string') {
							try {
								badwords = JSON.parse(badwords);
							} catch {
								badwords = [];
							}
						}
						if (!Array.isArray(badwords)) badwords = [];
						if (badwords.length === 0) {
							const components = await simpleContainer(
								interaction,
								await t(interaction, 'core.setting.setting.badword.empty'),
								{ color: 'Yellow' },
							);
							return interaction.editReply({
								components,
								flags: MessageFlags.IsComponentsV2,
							});
						}
						const badwordsString = badwords.map((w) => `• \`${w}\``).join('\n');
						const components = await simpleContainer(
							interaction,
							await t(interaction, 'core.setting.setting.badword.list', {
								list: badwordsString,
							}),
							{ color: kythiaConfig.bot.color },
						);
						return interaction.editReply({
							components,
							flags: MessageFlags.IsComponentsV2,
						});
					}
					case 'badword-whitelist': {
						let badwordWhitelist = serverSetting.badwordWhitelist;
						if (
							!Array.isArray(badwordWhitelist) &&
							typeof badwordWhitelist === 'string'
						) {
							try {
								badwordWhitelist = JSON.parse(badwordWhitelist);
							} catch {
								badwordWhitelist = [];
							}
						} else if (!Array.isArray(badwordWhitelist)) {
							badwordWhitelist = [];
						}
						const word = interaction.options.getString('word');
						if (!word) {
							const components = await simpleContainer(
								interaction,
								await t(
									interaction,
									'core.setting.setting.badword.word.required',
								),
								{ color: 'Red' },
							);
							return interaction.editReply({
								components,
								flags: MessageFlags.IsComponentsV2,
							});
						}
						if (action === 'add') {
							if (badwordWhitelist.includes(word.toLowerCase())) {
								const components = await simpleContainer(
									interaction,
									await t(
										interaction,
										'core.setting.setting.badword.whitelist.already',
									),
									{ color: 'Yellow' },
								);
								return interaction.editReply({
									components,
									flags: MessageFlags.IsComponentsV2,
								});
							}
							badwordWhitelist.push(word.toLowerCase());
							serverSetting.badwordWhitelist = badwordWhitelist;
							serverSetting.changed('badwordWhitelist', true);
							await serverSetting.saveAndUpdateCache('guildId');
							try {
								const { regexCache } = require('../../system/automod');
								if (regexCache && typeof regexCache.delete === 'function') {
									regexCache.delete(interaction.guild.id);
								}
							} catch {}
							const components = await simpleContainer(
								interaction,
								await t(
									interaction,
									'core.setting.setting.badword.whitelist.add',
									{ word },
								),
								{ color: 'Green' },
							);
							return interaction.editReply({
								components,
								flags: MessageFlags.IsComponentsV2,
							});
						} else if (action === 'remove') {
							if (!badwordWhitelist.includes(word.toLowerCase())) {
								const components = await simpleContainer(
									interaction,
									await t(
										interaction,
										'core.setting.setting.badword.whitelist.notfound',
									),
									{ color: 'Red' },
								);
								return interaction.editReply({
									components,
									flags: MessageFlags.IsComponentsV2,
								});
							}
							badwordWhitelist = badwordWhitelist.filter(
								(w) => w !== word.toLowerCase(),
							);
							serverSetting.badwordWhitelist = badwordWhitelist;
							serverSetting.changed('badwordWhitelist', true);
							await serverSetting.saveAndUpdateCache('guildId');
							const components = await simpleContainer(
								interaction,
								await t(
									interaction,
									'core.setting.setting.badword.whitelist.remove',
									{ word },
								),
								{ color: 'Green' },
							);
							return interaction.editReply({
								components,
								flags: MessageFlags.IsComponentsV2,
							});
						}
						break;
					}
					case 'badword-whitelist-list': {
						let badwordWhitelist = serverSetting.badwordWhitelist;
						if (typeof badwordWhitelist === 'string') {
							try {
								badwordWhitelist = JSON.parse(badwordWhitelist);
							} catch {
								badwordWhitelist = [];
							}
						}
						if (!Array.isArray(badwordWhitelist)) badwordWhitelist = [];
						if (badwordWhitelist.length === 0) {
							const components = await simpleContainer(
								interaction,
								await t(
									interaction,
									'core.setting.setting.badword.whitelist.empty',
								),
								{ color: 'Yellow' },
							);
							return interaction.editReply({
								components,
								flags: MessageFlags.IsComponentsV2,
							});
						}
						const badwordWhitelistString = badwordWhitelist
							.map((w) => `• \`${w}\``)
							.join('\n');
						const components = await simpleContainer(
							interaction,
							await t(
								interaction,
								'core.setting.setting.badword.whitelist.list',
								{ list: badwordWhitelistString },
							),
							{ color: kythiaConfig.bot.color },
						);
						return interaction.editReply({
							components,
							flags: MessageFlags.IsComponentsV2,
						});
					}
					case 'exception-channel': {
						const targetId = channel.id;
						let ignoredChannels = serverSetting.ignoredChannels;
						if (
							!Array.isArray(ignoredChannels) &&
							typeof ignoredChannels === 'string'
						) {
							try {
								ignoredChannels = JSON.parse(ignoredChannels);
							} catch {
								ignoredChannels = [];
							}
						} else if (!Array.isArray(ignoredChannels)) {
							ignoredChannels = [];
						}
						if (action === 'add') {
							if (ignoredChannels.includes(targetId)) {
								const components = await simpleContainer(
									interaction,
									await t(
										interaction,
										'core.setting.setting.exception.channel.already',
									),
									{ color: 'Yellow' },
								);
								return interaction.editReply({
									components,
									flags: MessageFlags.IsComponentsV2,
								});
							}
							ignoredChannels.push(targetId);
							serverSetting.ignoredChannels = ignoredChannels;
							serverSetting.changed('ignoredChannels', true);
							await serverSetting.saveAndUpdateCache('guildId');
							const components = await simpleContainer(
								interaction,
								await t(
									interaction,
									'core.setting.setting.exception.channel.add',
									{ channel: `<#${targetId}>` },
								),
								{ color: 'Green' },
							);
							return interaction.editReply({
								components,
								flags: MessageFlags.IsComponentsV2,
							});
						} else if (action === 'remove') {
							if (!ignoredChannels.includes(targetId)) {
								const components = await simpleContainer(
									interaction,
									await t(
										interaction,
										'core.setting.setting.exception.channel.notfound',
									),
									{ color: 'Red' },
								);
								return interaction.editReply({
									components,
									flags: MessageFlags.IsComponentsV2,
								});
							}
							ignoredChannels = ignoredChannels.filter((id) => id !== targetId);
							serverSetting.ignoredChannels = ignoredChannels;
							serverSetting.changed('ignoredChannels', true);
							await serverSetting.saveAndUpdateCache('guildId');
							const components = await simpleContainer(
								interaction,
								await t(
									interaction,
									'core.setting.setting.exception.channel.remove',
									{ channel: `<#${targetId}>` },
								),
								{ color: 'Green' },
							);
							return interaction.editReply({
								components,
								flags: MessageFlags.IsComponentsV2,
							});
						} else {
							const components = await simpleContainer(
								interaction,
								await t(
									interaction,
									'core.setting.setting.exception.channel.invalid.action',
								),
								{ color: 'Red' },
							);
							return interaction.editReply({
								components,
								flags: MessageFlags.IsComponentsV2,
							});
						}
					}
					case 'exception-channel-list': {
						let ignoredChannels = serverSetting.ignoredChannels;
						if (typeof ignoredChannels === 'string') {
							try {
								ignoredChannels = JSON.parse(ignoredChannels);
							} catch {
								ignoredChannels = [];
							}
						}
						if (!Array.isArray(ignoredChannels)) ignoredChannels = [];
						if (ignoredChannels.length === 0) {
							const components = await simpleContainer(
								interaction,
								await t(
									interaction,
									'core.setting.setting.exception.channel.empty',
								),
								{ color: 'Yellow' },
							);
							return interaction.editReply({
								components,
								flags: MessageFlags.IsComponentsV2,
							});
						}
						const list = ignoredChannels
							.map(async (id) => {
								const ch = await getChannelSafe(interaction.guild, id);
								return ch
									? `<#${id}>`
									: await t(interaction, 'core.setting.setting.invalid.id', {
											id,
										});
							})
							.join('\n');
						const components = await simpleContainer(
							interaction,
							await t(
								interaction,
								'core.setting.setting.exception.channel.list',
								{ list },
							),
							{ color: kythiaConfig.bot.color },
						);
						return interaction.editReply({
							components,
							flags: MessageFlags.IsComponentsV2,
						});
					}
					case 'mod-log-channel': {
						const targetChannel = channel;
						if (!targetChannel.isTextBased()) {
							const components = await simpleContainer(
								interaction,
								await t(
									interaction,
									'core.setting.setting.log.channel.invalid',
								),
								{ color: 'Red' },
							);
							return interaction.editReply({
								components,
								flags: MessageFlags.IsComponentsV2,
							});
						}
						serverSetting.modLogChannelId = targetChannel.id;
						await serverSetting.saveAndUpdateCache('guildId');
						const components = await simpleContainer(
							interaction,
							await t(interaction, 'core.setting.setting.mod.log.channel.set', {
								channel: `<#${targetChannel.id}>`,
							}),
							{ color: 'Green' },
						);
						return interaction.editReply({
							components,
							flags: MessageFlags.IsComponentsV2,
						});
					}
					case 'audit-log-channel': {
						const targetChannel = channel;
						if (!targetChannel.isTextBased()) {
							const components = await simpleContainer(
								interaction,
								await t(
									interaction,
									'core.setting.setting.log.channel.invalid',
								),
								{ color: 'Red' },
							);
							return interaction.editReply({
								components,
								flags: MessageFlags.IsComponentsV2,
							});
						}
						serverSetting.auditLogChannelId = targetChannel.id;
						await serverSetting.saveAndUpdateCache('guildId');
						const components = await simpleContainer(
							interaction,
							await t(
								interaction,
								'core.setting.setting.audit.log.channel.set',
								{ channel: `<#${targetChannel.id}>` },
							),
							{ color: 'Green' },
						);
						return interaction.editReply({
							components,
							flags: MessageFlags.IsComponentsV2,
						});
					}
				}
				break;
			}
			case 'features': {
				if (toggleableFeatures.includes(sub)) {
					const status = interaction.options.getString('status');
					const [settingKey, featureName] = featureMap[sub];

					serverSetting[settingKey] = status === 'enable';
					await serverSetting.saveAndUpdateCache();

					const components = await simpleContainer(
						interaction,
						`✅ Fitur **${featureName}** telah **di-${status === 'enable' ? 'aktifkan' : 'nonaktifkan'}**.`,
						{ color: status === 'enable' ? 'Green' : 'Red' },
					);
					return interaction.editReply({
						components,
						flags: MessageFlags.IsComponentsV2,
					});
				}
				break;
			}
			case 'stats': {
				const allowedPlaceholders = [
					'{memberstotal}',
					'{online}',
					'{idle}',
					'{dnd}',
					'{offline}',
					'{bots}',
					'{humans}',
					'{online_bots}',
					'{online_humans}',
					'{boosts}',
					'{boost_level}',
					'{channels}',
					'{text_channels}',
					'{voice_channels}',
					'{categories}',
					'{announcement_channels}',
					'{stage_channels}',
					'{roles}',
					'{emojis}',
					'{stickers}',
					'{guild}',
					'{guild_id}',
					'{owner}',
					'{owner_id}',
					'{region}',
					'{verified}',
					'{partnered}',
					'{date}',
					'{time}',
					'{datetime}',
					'{day}',
					'{month}',
					'{year}',
					'{hour}',
					'{minute}',
					'{second}',
					'{timestamp}',
					'{created_date}',
					'{created_time}',
					'{guild_age}',
					'{member_join}',
				];
				switch (sub) {
					case 'category': {
						const cat = interaction.options.getChannel('category');
						if (!cat || cat.type !== ChannelType.GuildCategory) {
							const components = await simpleContainer(
								interaction,
								await t(
									interaction,
									'core.setting.setting.stats.category.invalid',
								),
								{ color: 'Red' },
							);
							return interaction.editReply({
								components,
								flags: MessageFlags.IsComponentsV2,
							});
						}
						serverSetting.serverStatsCategoryId = cat.id;
						await serverSetting.saveAndUpdateCache('guildId');
						const components = await simpleContainer(
							interaction,
							await t(interaction, 'core.setting.setting.stats.category.set', {
								category: `<#${cat.id}>`,
							}),
							{ color: 'Green' },
						);
						return interaction.editReply({
							components,
							flags: MessageFlags.IsComponentsV2,
						});
					}
					case 'add': {
						const format = interaction.options.getString('format');
						let channel = interaction.options.getChannel('channel');
						const hasAllowedPlaceholder = allowedPlaceholders.some((ph) =>
							format.includes(ph),
						);
						if (!hasAllowedPlaceholder) {
							const components = await simpleContainer(
								interaction,
								await t(
									interaction,
									'core.setting.setting.stats.format.invalid',
									{
										placeholders: allowedPlaceholders.join(', '),
									},
								),
								{ color: 'Red' },
							);
							return interaction.editReply({
								components,
								flags: MessageFlags.IsComponentsV2,
							});
						}
						if (!channel) {
							channel = await interaction.guild.channels.create({
								name: format.replace(/{.*?}/g, '0'),
								type: ChannelType.GuildVoice,
								parent: serverSetting.serverStatsCategoryId,
								permissionOverwrites: [
									{
										id: interaction.guild.roles.everyone,
										deny: [PermissionFlagsBits.Connect],
										allow: [PermissionFlagsBits.ViewChannel],
									},
								],
							});
						}
						const already = serverSetting.serverStats?.find(
							(s) => s.channelId === channel.id,
						);
						if (already) {
							const components = await simpleContainer(
								interaction,
								await t(interaction, 'core.setting.setting.stats.already'),
								{ color: 'Yellow' },
							);
							return interaction.editReply({
								components,
								flags: MessageFlags.IsComponentsV2,
							});
						}
						serverSetting.serverStats ??= [];
						serverSetting.serverStats.push({
							channelId: channel.id,
							format,
							enabled: true,
						});
						serverSetting.changed('serverStats', true);
						await serverSetting.saveAndUpdateCache('guildId');
						await updateStats(interaction, interaction.client, [serverSetting]);
						const components = await simpleContainer(
							interaction,
							await t(interaction, 'core.setting.setting.stats.add', {
								channel: `<#${channel.id}>`,
								format,
							}),
							{ color: 'Green' },
						);
						return interaction.editReply({
							components,
							flags: MessageFlags.IsComponentsV2,
						});
					}
					case 'edit': {
						const statsId = interaction.options.getString('stats');
						const format = interaction.options.getString('format');
						const stat = serverSetting.serverStats?.find(
							(s) => s.channelId === statsId,
						);
						if (!stat) {
							const components = await simpleContainer(
								interaction,
								await t(interaction, 'core.setting.setting.stats.notfound'),
								{ color: 'Red' },
							);
							return interaction.editReply({
								components,
								flags: MessageFlags.IsComponentsV2,
							});
						}
						if (format) stat.format = format;
						const hasAllowedPlaceholder = allowedPlaceholders.some((ph) =>
							format.includes(ph),
						);
						if (!hasAllowedPlaceholder) {
							const components = await simpleContainer(
								interaction,
								await t(
									interaction,
									'core.setting.setting.stats.format.invalid',
									{
										placeholders: allowedPlaceholders.join(', '),
									},
								),
								{ color: 'Red' },
							);
							return interaction.editReply({
								components,
								flags: MessageFlags.IsComponentsV2,
							});
						}
						serverSetting.changed('serverStats', true);
						await serverSetting.saveAndUpdateCache('guildId');
						await updateStats(interaction, interaction.client, [serverSetting]);
						const components = await simpleContainer(
							interaction,
							await t(interaction, 'core.setting.setting.stats.edit', {
								channel: `<#${statsId}>`,
								format,
							}),
							{ color: 'Green' },
						);
						return interaction.editReply({
							components,
							flags: MessageFlags.IsComponentsV2,
						});
					}
					case 'enable': {
						const statsId = interaction.options.getString('stats');
						const stat = serverSetting.serverStats?.find(
							(s) => s.channelId === statsId,
						);
						if (!stat) {
							const components = await simpleContainer(
								interaction,
								await t(interaction, 'core.setting.setting.stats.notfound'),
								{ color: 'Red' },
							);
							return interaction.editReply({
								components,
								flags: MessageFlags.IsComponentsV2,
							});
						}
						stat.enabled = true;
						serverSetting.changed('serverStats', true);
						await serverSetting.saveAndUpdateCache('guildId');
						await updateStats(interaction, interaction.client, [serverSetting]);
						const components = await simpleContainer(
							interaction,
							await t(interaction, 'core.setting.setting.stats.enabled.msg', {
								channel: `<#${statsId}>`,
							}),
							{ color: 'Green' },
						);
						return interaction.editReply({
							components,
							flags: MessageFlags.IsComponentsV2,
						});
					}
					case 'disable': {
						const statsId = interaction.options.getString('stats');
						const stat = serverSetting.serverStats?.find(
							(s) => s.channelId === statsId,
						);
						if (!stat) {
							const components = await simpleContainer(
								interaction,
								await t(interaction, 'core.setting.setting.stats.notfound'),
								{ color: 'Red' },
							);
							return interaction.editReply({
								components,
								flags: MessageFlags.IsComponentsV2,
							});
						}
						stat.enabled = false;
						serverSetting.changed('serverStats', true);
						await serverSetting.saveAndUpdateCache('guildId');
						await updateStats(interaction, interaction.client, [serverSetting]);
						const components = await simpleContainer(
							interaction,
							await t(interaction, 'core.setting.setting.stats.disabled.msg', {
								channel: `<#${statsId}>`,
							}),
							{ color: 'Red' },
						);
						return interaction.editReply({
							components,
							flags: MessageFlags.IsComponentsV2,
						});
					}
					case 'remove': {
						const statsId = interaction.options.getString('stats');
						const channel = await getChannelSafe(interaction.guild, statsId);
						const before = serverSetting.serverStats?.length || 0;
						serverSetting.serverStats = serverSetting.serverStats?.filter(
							(s) => s.channelId !== statsId,
						);
						const after = serverSetting.serverStats?.length || 0;
						try {
							if (channel?.deletable) {
								await channel.delete('Stat channel removed');
							}
						} catch (_) {}
						serverSetting.changed('serverStats', true);
						await serverSetting.saveAndUpdateCache('guildId');
						await updateStats(interaction, interaction.client, [serverSetting]);
						const isSuccess = before !== after;
						const components = await simpleContainer(
							interaction,
							isSuccess
								? await t(
										interaction,
										'core.setting.setting.stats.remove.success',
									)
								: await t(
										interaction,
										'core.setting.setting.stats.remove.notfound',
									),
							{ color: isSuccess ? 'Green' : 'Yellow' },
						);
						return interaction.editReply({
							components,
							flags: MessageFlags.IsComponentsV2,
						});
					}
				}
				break;
			}
			case 'welcome': {
				switch (sub) {
					case 'in-channel': {
						const targetChannel = channel;
						serverSetting.welcomeInChannelId = targetChannel.id;
						await serverSetting.saveAndUpdateCache('guildId');
						const components = await simpleContainer(
							interaction,
							await t(
								interaction,
								'core.setting.setting.welcome.in.channel.set',
								{ channel: `<#${targetChannel.id}>` },
							),
							{ color: 'Green' },
						);
						return interaction.editReply({
							components,
							flags: MessageFlags.IsComponentsV2,
						});
					}
					case 'out-channel': {
						const targetChannel = channel;
						serverSetting.welcomeOutChannelId = targetChannel.id;
						await serverSetting.saveAndUpdateCache('guildId');
						const components = await simpleContainer(
							interaction,
							await t(
								interaction,
								'core.setting.setting.welcome.out.channel.set',
								{ channel: `<#${targetChannel.id}>` },
							),
							{ color: 'Green' },
						);
						return interaction.editReply({
							components,
							flags: MessageFlags.IsComponentsV2,
						});
					}
					case 'role': {
						const targetRole = interaction.options.getRole('role');
						serverSetting.welcomeRoleId = targetRole.id;
						await serverSetting.saveAndUpdateCache('guildId');
						const components = await simpleContainer(
							interaction,
							await t(interaction, 'core.setting.setting.welcome.role.set', {
								role: `<@&${targetRole.id}>`,
							}),
							{ color: 'Green' },
						);
						return interaction.editReply({
							components,
							flags: MessageFlags.IsComponentsV2,
						});
					}
					case 'in-text': {
						const text = interaction.options.getString('text');
						serverSetting.welcomeInText = text;
						await serverSetting.saveAndUpdateCache('guildId');
						const components = await simpleContainer(
							interaction,
							await t(interaction, 'core.setting.setting.welcome.in.text.set', {
								text,
							}),
							{ color: 'Green' },
						);
						return interaction.editReply({
							components,
							flags: MessageFlags.IsComponentsV2,
						});
					}
					case 'out-text': {
						const text = interaction.options.getString('text');
						serverSetting.welcomeOutText = text;
						await serverSetting.saveAndUpdateCache('guildId');
						const components = await simpleContainer(
							interaction,
							await t(
								interaction,
								'core.setting.setting.welcome.out.text.set',
								{ text },
							),
							{ color: 'Green' },
						);
						return interaction.editReply({
							components,
							flags: MessageFlags.IsComponentsV2,
						});
					}
					case 'in-background': {
						const background = interaction.options.getString('background');
						if (!background.startsWith('http')) {
							const components = await simpleContainer(
								interaction,
								await t(
									interaction,
									'core.setting.setting.welcome.in.background.invalid',
								),
								{ color: 'Red' },
							);
							return interaction.editReply({
								components,
								flags: MessageFlags.IsComponentsV2,
							});
						}
						serverSetting.welcomeInBackgroundUrl = background;
						await serverSetting.saveAndUpdateCache('guildId');
						const components = await simpleContainer(
							interaction,
							await t(
								interaction,
								'core.setting.setting.welcome.in.background.set',
								{ background },
							),
							{ color: 'Green' },
						);
						return interaction.editReply({
							components,
							flags: MessageFlags.IsComponentsV2,
						});
					}
					case 'out-background': {
						const background = interaction.options.getString('background');
						if (!background.startsWith('http')) {
							const components = await simpleContainer(
								interaction,
								await t(
									interaction,
									'core.setting.setting.welcome.out.background.invalid',
								),
								{ color: 'Red' },
							);
							return interaction.editReply({
								components,
								flags: MessageFlags.IsComponentsV2,
							});
						}
						serverSetting.welcomeOutBackgroundUrl = background;
						await serverSetting.saveAndUpdateCache('guildId');
						const components = await simpleContainer(
							interaction,
							await t(
								interaction,
								'core.setting.setting.welcome.out.background.set',
								{ background },
							),
							{ color: 'Green' },
						);
						return interaction.editReply({
							components,
							flags: MessageFlags.IsComponentsV2,
						});
					}
				}
				break;
			}
			case 'leveling': {
				switch (sub) {
					case 'channel': {
						const targetChannel = interaction.options.getChannel('channel');
						serverSetting.levelingChannelId = targetChannel.id;
						await serverSetting.saveAndUpdateCache('guildId');
						const components = await simpleContainer(
							interaction,
							await t(
								interaction,
								'core.setting.setting.leveling.channel.set',
								{ channel: `<#${targetChannel.id}>` },
							),
							{ color: 'Green' },
						);
						return interaction.editReply({
							components,
							flags: MessageFlags.IsComponentsV2,
						});
					}
					case 'cooldown': {
						const cooldown = interaction.options.getInteger('cooldown');
						serverSetting.levelingCooldown = cooldown * 1000;
						await serverSetting.saveAndUpdateCache('guildId');
						const components = await simpleContainer(
							interaction,
							await t(
								interaction,
								'core.setting.setting.leveling.cooldown.set',
								{ cooldown },
							),
							{ color: 'Green' },
						);
						return interaction.editReply({
							components,
							flags: MessageFlags.IsComponentsV2,
						});
					}
					case 'xp': {
						const xp = interaction.options.getInteger('xp');
						serverSetting.levelingXp = xp;
						await serverSetting.saveAndUpdateCache('guildId');
						const components = await simpleContainer(
							interaction,
							await t(interaction, 'core.setting.setting.leveling.xp.set', {
								xp,
							}),
							{ color: 'Green' },
						);
						return interaction.editReply({
							components,
							flags: MessageFlags.IsComponentsV2,
						});
					}
					case 'rolereward': {
						const role = interaction.options.getRole('role');
						const level = interaction.options.getInteger('level');
						const action = interaction.options.getString('action');
						if (!serverSetting.roleRewards) serverSetting.roleRewards = [];
						let components;
						if (action === 'add') {
							serverSetting.roleRewards = serverSetting.roleRewards.filter(
								(r) => r.level !== level,
							);
							serverSetting.roleRewards.push({ level, role: role.id });
							components = await simpleContainer(
								interaction,
								await t(
									interaction,
									'core.setting.setting.leveling.rolereward.add',
									{ role: `<@&${role.id}>`, level },
								),
								{ color: 'Green' },
							);
						} else if (action === 'remove') {
							const initial = serverSetting.roleRewards.length;
							serverSetting.roleRewards = serverSetting.roleRewards.filter(
								(r) => r.level !== level,
							);
							if (serverSetting.roleRewards.length === initial) {
								components = await simpleContainer(
									interaction,
									await t(
										interaction,
										'core.setting.setting.leveling.rolereward.notfound',
										{ level },
									),
									{ color: 'Red' },
								);
							} else {
								components = await simpleContainer(
									interaction,
									await t(
										interaction,
										'core.setting.setting.leveling.rolereward.remove',
										{ level },
									),
									{ color: 'Green' },
								);
							}
						}
						serverSetting.changed('roleRewards', true);
						await serverSetting.saveAndUpdateCache('guildId');
						return interaction.editReply({
							components,
							flags: MessageFlags.IsComponentsV2,
						});
					}
				}
				break;
			}
			case 'minecraft': {
				switch (sub) {
					case 'ip': {
						const ip = interaction.options.getString('ip');
						serverSetting.minecraftIp = ip;
						await serverSetting.saveAndUpdateCache('guildId');
						const components = await simpleContainer(
							interaction,
							await t(interaction, 'core.setting.setting.minecraft.ip.set', {
								ip,
							}),
							{ color: 'Green' },
						);
						return interaction.editReply({
							components,
							flags: MessageFlags.IsComponentsV2,
						});
					}
					case 'port': {
						const port = interaction.options.getInteger('port');
						serverSetting.minecraftPort = port;
						await serverSetting.saveAndUpdateCache('guildId');
						const components = await simpleContainer(
							interaction,
							await t(interaction, 'core.setting.setting.minecraft.port.set', {
								port,
							}),
							{ color: 'Green' },
						);
						return interaction.editReply({
							components,
							flags: MessageFlags.IsComponentsV2,
						});
					}
					case 'ip-channel': {
						serverSetting.minecraftIpChannelId = channel.id;
						await serverSetting.saveAndUpdateCache('guildId');
						const components = await simpleContainer(
							interaction,
							await t(
								interaction,
								'core.setting.setting.minecraft.ip.channel.set',
								{ channel: `<#${channel.id}>` },
							),
							{ color: 'Green' },
						);
						return interaction.editReply({
							components,
							flags: MessageFlags.IsComponentsV2,
						});
					}
					case 'port-channel': {
						serverSetting.minecraftPortChannelId = channel.id;
						await serverSetting.saveAndUpdateCache('guildId');
						const components = await simpleContainer(
							interaction,
							await t(
								interaction,
								'core.setting.setting.minecraft.port.channel.set',
								{ channel: `<#${channel.id}>` },
							),
							{ color: 'Green' },
						);
						return interaction.editReply({
							components,
							flags: MessageFlags.IsComponentsV2,
						});
					}
					case 'status-channel': {
						serverSetting.minecraftStatusChannelId = channel.id;
						await serverSetting.saveAndUpdateCache('guildId');
						const components = await simpleContainer(
							interaction,
							await t(
								interaction,
								'core.setting.setting.minecraft.status.channel.set',
								{ channel: `<#${channel.id}>` },
							),
							{ color: 'Green' },
						);
						return interaction.editReply({
							components,
							flags: MessageFlags.IsComponentsV2,
						});
					}
					case 'players-channel': {
						serverSetting.minecraftPlayersChannelId = channel.id;
						await serverSetting.saveAndUpdateCache('guildId');
						const components = await simpleContainer(
							interaction,
							await t(
								interaction,
								'core.setting.setting.minecraft.players.channel.set',
								{ channel: `<#${channel.id}>` },
							),
							{ color: 'Green' },
						);
						return interaction.editReply({
							components,
							flags: MessageFlags.IsComponentsV2,
						});
					}
				}
				break;
			}
			case 'language': {
				if (sub === 'set') {
					const lang = interaction.options.getString('lang');
					serverSetting.lang = lang;
					await serverSetting.saveAndUpdateCache('guildId');
					const components = await simpleContainer(
						interaction,
						await t(interaction, 'core.setting.setting.language.set', { lang }),
						{ color: 'Green' },
					);
					return interaction.editReply({
						components,
						flags: MessageFlags.IsComponentsV2,
					});
				}
				break;
			}
			case 'testimony': {
				switch (sub) {
					case 'testimony-channel': {
						if (!channel || channel.type !== 0) {
							const components = await simpleContainer(
								interaction,
								await t(
									interaction,
									'core.setting.setting.testimony.channel.invalid',
								),
								{ color: 'Red' },
							);
							return interaction.editReply({
								components,
								flags: MessageFlags.IsComponentsV2,
							});
						}
						serverSetting.testimonyChannelId = channel.id;
						await serverSetting.saveAndUpdateCache('guildId');
						const components = await simpleContainer(
							interaction,
							await t(
								interaction,
								'core.setting.setting.testimony.channel.set',
								{ channel: `<#${channel.id}>` },
							),
							{ color: 'Green' },
						);
						return interaction.editReply({
							components,
							flags: MessageFlags.IsComponentsV2,
						});
					}
					case 'feedback-channel': {
						if (!channel || channel.type !== 0) {
							const components = await simpleContainer(
								interaction,
								await t(
									interaction,
									'core.setting.setting.testimony.channel.invalid',
								),
								{ color: 'Red' },
							);
							return interaction.editReply({
								components,
								flags: MessageFlags.IsComponentsV2,
							});
						}
						serverSetting.feedbackChannelId = channel.id;
						await serverSetting.saveAndUpdateCache('guildId');
						const components = await simpleContainer(
							interaction,
							await t(
								interaction,
								'core.setting.setting.testimony.feedback.channel.set',
								{ channel: `<#${channel.id}>` },
							),
							{ color: 'Green' },
						);
						return interaction.editReply({
							components,
							flags: MessageFlags.IsComponentsV2,
						});
					}
					case 'count-channel': {
						if (!channel) {
							const components = await simpleContainer(
								interaction,
								await t(
									interaction,
									'core.setting.setting.testimony.channel.invalid',
								),
								{ color: 'Red' },
							);
							return interaction.editReply({
								components,
								flags: MessageFlags.IsComponentsV2,
							});
						}
						serverSetting.testimonyCountChannelId = channel.id;
						await serverSetting.saveAndUpdateCache('guildId');
						const components2 = await simpleContainer(
							interaction,
							await t(
								interaction,
								'core.setting.setting.testimony.count.channel.set',
								{ channel: `<#${channel.id}>` },
							),
							{ color: 'Green' },
						);
						return interaction.editReply({
							components: components2,
							flags: MessageFlags.IsComponentsV2,
						});
					}
					case 'count-format': {
						const format = interaction.options.getString('format');
						if (!format || !format.includes('{count}')) {
							const components = await simpleContainer(
								interaction,
								await t(
									interaction,
									'core.setting.setting.testimony.count.format.invalid',
								),
								{ color: 'Red' },
							);
							return interaction.editReply({
								components,
								flags: MessageFlags.IsComponentsV2,
							});
						}
						serverSetting.testimonyCountFormat = format;
						await serverSetting.saveAndUpdateCache('guildId');
						const components = await simpleContainer(
							interaction,
							await t(
								interaction,
								'core.setting.setting.testimony.count.format.set',
								{ format },
							),
							{ color: 'Green' },
						);
						return interaction.editReply({
							components,
							flags: MessageFlags.IsComponentsV2,
						});
					}
					case 'reset-count': {
						serverSetting.testimonyCount = 0;
						serverSetting.changed('testimonyCount');
						await serverSetting.saveAndUpdateCache('guildId');
						const components = await simpleContainer(
							interaction,
							await t(
								interaction,
								'core.setting.setting.testimony.count.reset',
							),
							{ color: 'Green' },
						);
						if (serverSetting.testimonyCountChannelId) {
							try {
								const testimonyCountChannel = await interaction.client.channels
									.fetch(serverSetting.testimonyCountChannelId)
									.catch(() => null);
								if (testimonyCountChannel) {
									const format =
										serverSetting.testimonyCountFormat || '{count} Testimonies';
									const newName = format.replace(
										/{count}/gi,
										serverSetting.testimonyCount,
									);
									if (testimonyCountChannel.name !== newName) {
										await testimonyCountChannel.setName(newName);
									}
								}
							} catch (_err) {}
						}
						return interaction.editReply({
							components,
							flags: MessageFlags.IsComponentsV2,
						});
					}
					case 'count': {
						const count = interaction.options.getInteger('count');
						if (typeof count !== 'number' || count < 0) {
							const components = await simpleContainer(
								interaction,
								await t(
									interaction,
									'core.setting.setting.testimony.count.invalid',
								),
								{ color: 'Red' },
							);
							return interaction.editReply({
								components,
								flags: MessageFlags.IsComponentsV2,
							});
						}
						serverSetting.testimonyCount = count;
						serverSetting.changed('testimonyCount');
						await serverSetting.saveAndUpdateCache('guildId');
						const components = await simpleContainer(
							interaction,
							await t(interaction, 'core.setting.setting.testimony.count.set', {
								count,
							}),
							{ color: 'Green' },
						);
						if (serverSetting.testimonyCountChannelId) {
							try {
								const testimonyCountChannel = await interaction.client.channels
									.fetch(serverSetting.testimonyCountChannelId)
									.catch(() => null);
								if (testimonyCountChannel) {
									const format =
										serverSetting.testimonyCountFormat || '{count} Testimonies';
									const newName = format.replace(
										/{count}/gi,
										serverSetting.testimonyCount,
									);
									if (testimonyCountChannel.name !== newName) {
										await testimonyCountChannel.setName(newName);
									}
								}
							} catch (_err) {}
						}
						return interaction.editReply({
							components,
							flags: MessageFlags.IsComponentsV2,
						});
					}
				}
				break;
			}
			case 'streak': {
				switch (sub) {
					case 'rolereward': {
						const role = interaction.options.getRole('role');
						const streak = interaction.options.getInteger('streak');
						const action = interaction.options.getString('action');
						if (!serverSetting.streakRoleRewards)
							serverSetting.streakRoleRewards = [];
						let components;
						if (action === 'add') {
							serverSetting.streakRoleRewards =
								serverSetting.streakRoleRewards.filter(
									(r) => r.streak !== streak,
								);
							serverSetting.streakRoleRewards.push({ streak, role: role.id });
							components = await simpleContainer(
								interaction,
								await t(
									interaction,
									'core.setting.setting.streak.rolereward.add',
									{ role: `<@&${role.id}>`, streak },
								),
								{ color: 'Green' },
							);
						} else if (action === 'remove') {
							const initial = serverSetting.streakRoleRewards.length;
							serverSetting.streakRoleRewards =
								serverSetting.streakRoleRewards.filter(
									(r) => r.streak !== streak,
								);
							if (serverSetting.streakRoleRewards.length === initial) {
								components = await simpleContainer(
									interaction,
									await t(
										interaction,
										'core.setting.setting.streak.rolereward.notfound',
										{ streak },
									),
									{ color: 'Red' },
								);
							} else {
								components = await simpleContainer(
									interaction,
									await t(
										interaction,
										'core.setting.setting.streak.rolereward.remove',
										{ streak },
									),
									{ color: 'Green' },
								);
							}
						}
						serverSetting.changed('streakRoleRewards', true);
						await serverSetting.saveAndUpdateCache('guildId');
						return interaction.editReply({
							components,
							flags: MessageFlags.IsComponentsV2,
						});
					}
				}
				break;
			}
			case 'streak-settings': {
				if (sub === 'minimum') {
					const minimum = interaction.options.getInteger('minimum');
					serverSetting.streakMinimum = minimum;
					await serverSetting.saveAndUpdateCache('guildId');
					const components = await simpleContainer(
						interaction,
						await t(interaction, 'core.setting.setting.streak.minimum.set', {
							minimum,
						}),
						{ color: 'Green' },
					);
					return interaction.editReply({
						components,
						flags: MessageFlags.IsComponentsV2,
					});
				}
				if (sub === 'emoji') {
					const emoji = interaction.options.getString('emoji');
					serverSetting.streakEmoji = emoji;
					await serverSetting.saveAndUpdateCache('guildId');
					const components = await simpleContainer(
						interaction,
						await t(interaction, 'core.setting.setting.streak.emoji.set', {
							emoji,
						}),
						{ color: 'Green' },
					);
					return interaction.editReply({
						components,
						flags: MessageFlags.IsComponentsV2,
					});
				}
				if (sub === 'nickname') {
					const status = interaction.options.getString('status');
					serverSetting.streakNickname = status === 'enable';
					await serverSetting.saveAndUpdateCache('guildId');
					const components = await simpleContainer(
						interaction,
						await t(interaction, 'core.setting.setting.streak.nickname.set', {
							status: status === 'enable' ? 'Enabled' : 'Disabled',
						}),
						{ color: status === 'enable' ? 'Green' : 'Red' },
					);
					return interaction.editReply({
						components,
						flags: MessageFlags.IsComponentsV2,
					});
				}
				break;
			}
			case 'channels': {
				if (sub === 'announcement') {
					serverSetting.announcementChannelId = channel.id;
					await serverSetting.saveAndUpdateCache('guildId');
					const components = await simpleContainer(
						interaction,
						await t(
							interaction,
							'core.setting.setting.announcement.channel.set',
							{ channel: `<#${channel.id}>` },
						),
						{ color: 'Green' },
					);
					return interaction.editReply({
						components,
						flags: MessageFlags.IsComponentsV2,
					});
				}
				if (sub === 'invite') {
					serverSetting.inviteChannelId = channel.id;
					await serverSetting.saveAndUpdateCache('guildId');
					const components = await simpleContainer(
						interaction,
						await t(interaction, 'core.setting.setting.invite.channel.set', {
							channel: `<#${channel.id}>`,
						}),
						{ color: 'Green' },
					);
					return interaction.editReply({
						components,
						flags: MessageFlags.IsComponentsV2,
					});
				}
				break;
			}
			case 'booster': {
				switch (sub) {
					case 'channel': {
						serverSetting.boostLogChannelId = channel.id;
						await serverSetting.saveAndUpdateCache('guildId');
						const components = await simpleContainer(
							interaction,
							`✅ Boost log channel has been set to <#${channel.id}>`,
							{ color: 'Green' },
						);
						return interaction.editReply({
							components,
							flags: MessageFlags.IsComponentsV2,
						});
					}
					case 'message': {
						const message = interaction.options.getString('message');
						serverSetting.boostLogMessage = message;
						await serverSetting.saveAndUpdateCache('guildId');
						const components = await simpleContainer(
							interaction,
							`✅ Boost log message has been updated!\n\n**Preview:**\n${message}`,
							{ color: 'Green' },
						);
						return interaction.editReply({
							components,
							flags: MessageFlags.IsComponentsV2,
						});
					}
				}
				break;
			}
			case 'ai': {
				if (sub === 'add-channel') {
					const aiChannelIds = ensureArray(serverSetting.aiChannelIds);
					if (!aiChannelIds.includes(channel.id)) aiChannelIds.push(channel.id);
					serverSetting.aiChannelIds = aiChannelIds;
					serverSetting.changed('aiChannelIds', true);
					await serverSetting.saveAndUpdateCache('guildId');
					const components = await simpleContainer(
						interaction,
						await t(interaction, 'core.setting.setting.ai.channel.add', {
							channel: `<#${channel.id}>`,
						}),
						{ color: 'Green' },
					);
					return interaction.editReply({
						components,
						flags: MessageFlags.IsComponentsV2,
					});
				}
				if (sub === 'remove-channel') {
					let aiChannelIds = ensureArray(serverSetting.aiChannelIds);
					aiChannelIds = aiChannelIds.filter((id) => id !== channel.id);
					serverSetting.aiChannelIds = aiChannelIds;
					serverSetting.changed('aiChannelIds', true);
					await serverSetting.saveAndUpdateCache('guildId');
					const components = await simpleContainer(
						interaction,
						await t(interaction, 'core.setting.setting.ai.channel.remove', {
							channel: `<#${channel.id}>`,
						}),
						{ color: 'Green' },
					);
					return interaction.editReply({
						components,
						flags: MessageFlags.IsComponentsV2,
					});
				}
				if (sub === 'list') {
					const aiChannelIds = ensureArray(serverSetting.aiChannelIds);
					if (aiChannelIds.length === 0) {
						const components = await simpleContainer(
							interaction,
							await t(interaction, 'core.setting.setting.ai.channel.empty'),
							{ color: 'Yellow' },
						);
						return interaction.editReply({
							components,
							flags: MessageFlags.IsComponentsV2,
						});
					}
					const list = aiChannelIds.map((id) => `<#${id}>`).join('\n');
					const components = await simpleContainer(
						interaction,
						await t(interaction, 'core.setting.setting.ai.channel.list', {
							list,
						}),
						{ color: kythiaConfig.bot.color },
					);
					return interaction.editReply({
						components,
						flags: MessageFlags.IsComponentsV2,
					});
				}
				break;
			}

			case 'raw': {
				if (sub === 'set') {
					const field = interaction.options.getString('field');
					const valueStr = interaction.options.getString('value');
					if (!Object.hasOwn(serverSetting.dataValues, field)) {
						const components = await simpleContainer(
							interaction,
							await t(interaction, 'core.setting.setting.raw.field.invalid', {
								field,
							}),
							{ color: 'Red' },
						);
						return interaction.editReply({
							components,
							flags: MessageFlags.IsComponentsV2,
						});
					}
					const original = serverSetting.dataValues[field];
					let parsed = valueStr;
					try {
						if (typeof original === 'number') parsed = Number(valueStr);
						else if (typeof original === 'boolean')
							parsed = ['true', '1', 'yes', 'on', 'enable'].includes(
								valueStr.toLowerCase(),
							);
						else if (Array.isArray(original)) parsed = JSON.parse(valueStr);
						else if (original === null) {
							try {
								parsed = JSON.parse(valueStr);
							} catch {
								parsed = valueStr;
							}
						}
					} catch (_) {
						parsed = valueStr;
					}
					serverSetting[field] = parsed;
					if (Array.isArray(parsed)) serverSetting.changed(field, true);
					await serverSetting.saveAndUpdateCache('guildId');
					const components = await simpleContainer(
						interaction,
						await t(interaction, 'core.setting.setting.raw.set', {
							field,
							value: `\`${valueStr}\``,
						}),
						{ color: 'Green' },
					);
					return interaction.editReply({
						components,
						flags: MessageFlags.IsComponentsV2,
					});
				}
				break;
			}
			default: {
				const components = await simpleContainer(
					interaction,
					await t(interaction, 'core.setting.setting.command.not.found'),
					{ color: 'Red' },
				);
				return interaction.editReply({
					components,
					flags: MessageFlags.IsComponentsV2,
				});
			}
		}
	},
};
