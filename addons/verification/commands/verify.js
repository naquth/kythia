/**
 * @namespace: addons/verification/commands/verify.js
 * @type: Command
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const {
	SlashCommandBuilder,
	PermissionFlagsBits,
	InteractionContextType,
	MessageFlags,
} = require('discord.js');
const { sendCaptcha } = require('../helpers/verify');
const { clearSession } = require('../helpers/session');

const CAPTCHA_TYPES = [
	{ name: 'Math (multiple choice buttons)', value: 'math' },
	{ name: 'Emoji click (buttons)', value: 'emoji' },
	{ name: 'Image text (type the code)', value: 'image' },
];

const command = new SlashCommandBuilder()
	.setName('verify')
	.setDescription('🛡️ Verification system management')
	.setContexts(InteractionContextType.Guild)
	.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)

	// /verify setup <sub>
	.addSubcommandGroup((g) =>
		g
			.setName('setup')
			.setDescription('Configure the verification system')
			.addSubcommand((s) =>
				s
					.setName('role')
					.setDescription('Set the role given to verified members')
					.addRoleOption((o) =>
						o.setName('role').setDescription('Verified role').setRequired(true),
					),
			)
			.addSubcommand((s) =>
				s
					.setName('unverified-role')
					.setDescription(
						'Role assigned on join (restricts unverified members)',
					)
					.addRoleOption((o) =>
						o
							.setName('role')
							.setDescription('Unverified role')
							.setRequired(true),
					),
			)
			.addSubcommand((s) =>
				s
					.setName('channel')
					.setDescription(
						'Channel where captcha is sent (leave blank for DM only)',
					)
					.addChannelOption((o) =>
						o
							.setName('channel')
							.setDescription('Verification channel')
							.setRequired(false),
					),
			)
			.addSubcommand((s) =>
				s
					.setName('type')
					.setDescription('Captcha challenge type')
					.addStringOption((o) =>
						o
							.setName('type')
							.setDescription('Type of captcha')
							.setRequired(true)
							.addChoices(...CAPTCHA_TYPES),
					),
			)
			.addSubcommand((s) =>
				s
					.setName('timeout')
					.setDescription(
						'How long members have to complete the captcha (seconds)',
					)
					.addIntegerOption((o) =>
						o
							.setName('seconds')
							.setDescription('Timeout in seconds (30–600)')
							.setRequired(true)
							.setMinValue(30)
							.setMaxValue(600),
					),
			)
			.addSubcommand((s) =>
				s
					.setName('attempts')
					.setDescription('Max wrong attempts before failing')
					.addIntegerOption((o) =>
						o
							.setName('count')
							.setDescription('Max attempts (1–10)')
							.setRequired(true)
							.setMinValue(1)
							.setMaxValue(10),
					),
			)
			.addSubcommand((s) =>
				s
					.setName('kick-on-fail')
					.setDescription('Kick member if they exceed max attempts')
					.addBooleanOption((o) =>
						o.setName('enabled').setDescription('Enable?').setRequired(true),
					),
			)
			.addSubcommand((s) =>
				s
					.setName('kick-on-timeout')
					.setDescription('Kick member if they time out')
					.addBooleanOption((o) =>
						o.setName('enabled').setDescription('Enable?').setRequired(true),
					),
			)
			.addSubcommand((s) =>
				s
					.setName('log-channel')
					.setDescription('Channel to log verification events')
					.addChannelOption((o) =>
						o
							.setName('channel')
							.setDescription('Log channel')
							.setRequired(true),
					),
			)
			.addSubcommand((s) =>
				s
					.setName('welcome-message')
					.setDescription('DM sent to members after they verify')
					.addStringOption((o) =>
						o
							.setName('message')
							.setDescription('Welcome message text (or "none" to disable)')
							.setRequired(true),
					),
			),
	)

	// Direct subcommands
	.addSubcommand((s) =>
		s.setName('status').setDescription('View current verification config'),
	)
	.addSubcommand((s) =>
		s
			.setName('reset')
			.setDescription('Re-send captcha to a member')
			.addUserOption((o) =>
				o.setName('member').setDescription('Target member').setRequired(true),
			),
	)
	.addSubcommand((s) =>
		s
			.setName('force')
			.setDescription('Manually verify a member (skip captcha)')
			.addUserOption((o) =>
				o.setName('member').setDescription('Target member').setRequired(true),
			),
	)
	.addSubcommand((s) =>
		s
			.setName('revoke')
			.setDescription('Remove verified role from a member')
			.addUserOption((o) =>
				o.setName('member').setDescription('Target member').setRequired(true),
			),
	);

module.exports = {
	slashCommand: command,
	permissions: PermissionFlagsBits.ManageGuild,

	async execute(interaction, container) {
		const { models } = container;
		const { VerificationConfig, ServerSetting } = models;

		await interaction.deferReply({ ephemeral: true });

		const group = interaction.options.getSubcommandGroup(false);
		const sub = interaction.options.getSubcommand();
		const guildId = interaction.guild.id;

		const reply = (content) => {
			return interaction.editReply({ content, flags: MessageFlags.Ephemeral });
		};

		// -----------------------------------------------------------------------
		// setup group
		// -----------------------------------------------------------------------
		if (group === 'setup') {
			const [config] = await VerificationConfig.findOrCreate({
				where: { guildId },
				defaults: { guildId },
			});

			if (sub === 'role') {
				const role = interaction.options.getRole('role');
				config.verifiedRoleId = role.id;
				await config.save();
				return reply(`✅ Verified role set to ${role}.`);
			}

			if (sub === 'unverified-role') {
				const role = interaction.options.getRole('role');
				config.unverifiedRoleId = role.id;
				await config.save();
				return reply(`✅ Unverified role set to ${role}.`);
			}

			if (sub === 'channel') {
				const ch = interaction.options.getChannel('channel');
				config.channelId = ch ? ch.id : null;
				await config.save();
				return reply(
					ch
						? `✅ Verification channel set to <#${ch.id}>.`
						: `✅ Verification channel cleared — will use DM only.`,
				);
			}

			if (sub === 'type') {
				const type = interaction.options.getString('type');
				config.captchaType = type;
				await config.save();
				const label = CAPTCHA_TYPES.find((t) => t.value === type)?.name;
				return reply(`✅ Captcha type set to **${label}**.`);
			}

			if (sub === 'timeout') {
				const secs = interaction.options.getInteger('seconds');
				config.timeoutSeconds = secs;
				await config.save();
				return reply(`✅ Timeout set to **${secs}s**.`);
			}

			if (sub === 'attempts') {
				const count = interaction.options.getInteger('count');
				config.maxAttempts = count;
				await config.save();
				return reply(`✅ Max attempts set to **${count}**.`);
			}

			if (sub === 'kick-on-fail') {
				config.kickOnFail = interaction.options.getBoolean('enabled');
				await config.save();
				return reply(
					`✅ Kick on fail: **${config.kickOnFail ? 'enabled' : 'disabled'}**.`,
				);
			}

			if (sub === 'kick-on-timeout') {
				config.kickOnTimeout = interaction.options.getBoolean('enabled');
				await config.save();
				return reply(
					`✅ Kick on timeout: **${config.kickOnTimeout ? 'enabled' : 'disabled'}**.`,
				);
			}

			if (sub === 'log-channel') {
				const ch = interaction.options.getChannel('channel');
				if (!ch?.isTextBased()) return reply('❌ That is not a text channel.');
				config.logChannelId = ch.id;
				await config.save();
				return reply(`✅ Log channel set to <#${ch.id}>.`);
			}

			if (sub === 'welcome-message') {
				const msg = interaction.options.getString('message');
				config.welcomeMessage = msg === 'none' ? null : msg;
				await config.save();
				return reply(
					msg === 'none'
						? `✅ Welcome message disabled.`
						: `✅ Welcome message saved.`,
				);
			}
		}

		// -----------------------------------------------------------------------
		// Direct subcommands
		// -----------------------------------------------------------------------
		if (sub === 'status') {
			const config = await VerificationConfig.findOne({ where: { guildId } });
			const settings = await ServerSetting.getCache({ guildId });

			if (!config) {
				return reply(
					'⚠️ Verification not configured yet. Use `/verify setup role` to start.',
				);
			}

			const typeLabel =
				CAPTCHA_TYPES.find((t) => t.value === config.captchaType)?.name ||
				config.captchaType;
			return reply(
				`## 🛡️ Verification Status\n\n` +
					`**System:** ${settings?.verificationOn ? '🟢 Enabled' : '🔴 Disabled (toggle via `/set features verificationOn`)'}\n` +
					`**Captcha Type:** ${typeLabel}\n` +
					`**Verified Role:** ${config.verifiedRoleId ? `<@&${config.verifiedRoleId}>` : '❌ Not set'}\n` +
					`**Unverified Role:** ${config.unverifiedRoleId ? `<@&${config.unverifiedRoleId}>` : 'None'}\n` +
					`**Channel:** ${config.channelId ? `<#${config.channelId}>` : 'DM only'}\n` +
					`**Timeout:** ${config.timeoutSeconds}s\n` +
					`**Max Attempts:** ${config.maxAttempts}\n` +
					`**Kick on Fail:** ${config.kickOnFail ? '✅' : '❌'}\n` +
					`**Kick on Timeout:** ${config.kickOnTimeout ? '✅' : '❌'}\n` +
					`**Log Channel:** ${config.logChannelId ? `<#${config.logChannelId}>` : 'None'}\n` +
					`**Welcome DM:** ${config.welcomeMessage ? '✅ Set' : 'None'}`,
			);
		}

		if (sub === 'reset') {
			const user = interaction.options.getUser('member');
			const member = await interaction.guild.members
				.fetch(user.id)
				.catch(() => null);
			if (!member) return reply('❌ Member not found.');

			const config = await VerificationConfig.findOne({ where: { guildId } });
			if (!config) return reply('❌ Verification not configured.');

			clearSession(guildId, user.id);
			await sendCaptcha(member, config);
			return reply(`✅ New captcha sent to ${member.user.tag}.`);
		}

		if (sub === 'force') {
			const user = interaction.options.getUser('member');
			const member = await interaction.guild.members
				.fetch(user.id)
				.catch(() => null);
			if (!member) return reply('❌ Member not found.');

			const config = await VerificationConfig.findOne({ where: { guildId } });
			if (!config) return reply('❌ Verification not configured.');

			// Manually verify
			clearSession(guildId, user.id);
			if (config.verifiedRoleId) {
				const role = interaction.guild.roles.cache.get(config.verifiedRoleId);
				if (role) await member.roles.add(role).catch(() => null);
			}
			if (config.unverifiedRoleId) {
				const role = interaction.guild.roles.cache.get(config.unverifiedRoleId);
				if (role) await member.roles.remove(role).catch(() => null);
			}
			if (config.logChannelId) {
				const ch = await interaction.guild.channels
					.fetch(config.logChannelId)
					.catch(() => null);
				if (ch?.isTextBased()) {
					await ch
						.send(
							`✅ **Manually Verified:** ${member.user.tag} (<@${member.id}>) by ${interaction.user.tag}.`,
						)
						.catch(() => null);
				}
			}
			return reply(`✅ ${member.user.tag} has been manually verified.`);
		}

		if (sub === 'revoke') {
			const user = interaction.options.getUser('member');
			const member = await interaction.guild.members
				.fetch(user.id)
				.catch(() => null);
			if (!member) return reply('❌ Member not found.');

			const config = await VerificationConfig.findOne({ where: { guildId } });
			if (!config) return reply('❌ Verification not configured.');

			if (config.verifiedRoleId) {
				const role = interaction.guild.roles.cache.get(config.verifiedRoleId);
				if (role) await member.roles.remove(role).catch(() => null);
			}
			if (config.unverifiedRoleId) {
				const role = interaction.guild.roles.cache.get(config.unverifiedRoleId);
				if (role) await member.roles.add(role).catch(() => null);
			}
			return reply(
				`✅ Verification revoked for ${member.user.tag}. They will need to verify again.`,
			);
		}
	},
};
