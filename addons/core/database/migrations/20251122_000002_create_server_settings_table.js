/**
 * @namespace: addons/core/database/migrations/20251122_000002_create_server_settings_table.js
 * @type: Database Migration
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

module.exports = {
	async up(queryInterface, DataTypes) {
		await queryInterface.createTable('server_settings', {
			guildId: { type: DataTypes.STRING, allowNull: false, primaryKey: true },
			guildName: { type: DataTypes.STRING, allowNull: true },
			lang: { type: DataTypes.STRING, defaultValue: 'en' },
			prefix: { type: DataTypes.STRING, allowNull: true },

			whitelist: { type: DataTypes.JSON, defaultValue: [] },
			badwords: { type: DataTypes.JSON, defaultValue: [] },
			badwordWhitelist: { type: DataTypes.JSON, defaultValue: [] },
			admins: { type: DataTypes.JSON, defaultValue: [] },
			ignoredChannels: { type: DataTypes.JSON, defaultValue: [] },
			modLogChannelId: { type: DataTypes.STRING },
			auditLogChannelId: { type: DataTypes.STRING },

			serverStats: { type: DataTypes.JSON, defaultValue: [] },
			serverStatsCategoryId: { type: DataTypes.STRING, allowNull: true },

			antiInviteOn: { type: DataTypes.BOOLEAN, defaultValue: false },
			antiLinkOn: { type: DataTypes.BOOLEAN, defaultValue: false },
			antiSpamOn: { type: DataTypes.BOOLEAN, defaultValue: false },
			antiBadwordOn: { type: DataTypes.BOOLEAN, defaultValue: false },
			antiMentionOn: { type: DataTypes.BOOLEAN, defaultValue: false },
			antiAllCapsOn: { type: DataTypes.BOOLEAN, defaultValue: false },
			antiEmojiSpamOn: { type: DataTypes.BOOLEAN, defaultValue: false },
			antiZalgoOn: { type: DataTypes.BOOLEAN, defaultValue: false },
			serverStatsOn: { type: DataTypes.BOOLEAN, defaultValue: false },

			adventureOn: { type: DataTypes.BOOLEAN, defaultValue: false },
			levelingOn: { type: DataTypes.BOOLEAN, defaultValue: false },

			minecraftStatsOn: { type: DataTypes.BOOLEAN, defaultValue: false },
			streakOn: { type: DataTypes.BOOLEAN, defaultValue: false },

			invitesOn: { type: DataTypes.BOOLEAN, defaultValue: false },

			rolePrefixOn: { type: DataTypes.BOOLEAN, defaultValue: false },

			boostLogOn: { type: DataTypes.BOOLEAN, defaultValue: false },

			levelingCurve: {
				type: DataTypes.ENUM('linear', 'exponential', 'constant'),
				defaultValue: 'linear',
			},
			levelingMultiplier: { type: DataTypes.FLOAT, defaultValue: 1.0 },
			levelingMaxLevel: { type: DataTypes.INTEGER, allowNull: true },

			messageXpEnabled: { type: DataTypes.BOOLEAN, defaultValue: true },
			messageXpMode: {
				type: DataTypes.ENUM('random', 'per_word', 'fixed'),
				defaultValue: 'random',
			},
			messageXpMin: { type: DataTypes.INTEGER, defaultValue: 15 },
			messageXpMax: { type: DataTypes.INTEGER, defaultValue: 25 },
			messageXpCooldown: { type: DataTypes.INTEGER, defaultValue: 60 },

			voiceXpEnabled: { type: DataTypes.BOOLEAN, defaultValue: true },
			voiceXpMin: { type: DataTypes.INTEGER, defaultValue: 15 },
			voiceXpMax: { type: DataTypes.INTEGER, defaultValue: 40 },
			voiceXpCooldown: { type: DataTypes.INTEGER, defaultValue: 180 },
			voiceMinMembers: { type: DataTypes.INTEGER, defaultValue: 2 },
			voiceAntiAfk: { type: DataTypes.BOOLEAN, defaultValue: true },

			reactionXpEnabled: { type: DataTypes.BOOLEAN, defaultValue: false },
			reactionXpAward: {
				type: DataTypes.ENUM('none', 'both', 'author', 'reactor'),
				defaultValue: 'both',
			},
			reactionXpMin: { type: DataTypes.INTEGER, defaultValue: 1 },
			reactionXpMax: { type: DataTypes.INTEGER, defaultValue: 5 },
			reactionXpCooldown: { type: DataTypes.INTEGER, defaultValue: 10 },

			levelingChannelId: { type: DataTypes.STRING, allowNull: true },
			levelingMessage: {
				type: DataTypes.TEXT,
				defaultValue: 'GG {user.mention}, you reached level **{user.level}**!',
			},
			levelingImageEnabled: { type: DataTypes.BOOLEAN, defaultValue: true },

			roleRewards: { type: DataTypes.JSON, defaultValue: [] },
			roleRewardStack: { type: DataTypes.BOOLEAN, defaultValue: false },

			xpBoosters: { type: DataTypes.JSON, defaultValue: [] },
			channelBoosters: { type: DataTypes.JSON, defaultValue: [] },
			stackBoosters: { type: DataTypes.BOOLEAN, defaultValue: true },

			noXpChannels: { type: DataTypes.JSON, defaultValue: [] },
			noXpRoles: { type: DataTypes.JSON, defaultValue: [] },

			threadXpEnabled: { type: DataTypes.BOOLEAN, defaultValue: true },
			forumXpEnabled: { type: DataTypes.BOOLEAN, defaultValue: true },
			textInVoiceXpEnabled: { type: DataTypes.BOOLEAN, defaultValue: true },
			slashCommandXpEnabled: { type: DataTypes.BOOLEAN, defaultValue: true },

			autoResetXp: { type: DataTypes.BOOLEAN, defaultValue: false },

			minecraftIp: { type: DataTypes.STRING, allowNull: true },
			minecraftPort: { type: DataTypes.INTEGER, allowNull: true },

			minecraftIpChannelId: { type: DataTypes.STRING, allowNull: true },
			minecraftPortChannelId: { type: DataTypes.STRING, allowNull: true },
			minecraftStatusChannelId: { type: DataTypes.STRING, allowNull: true },
			minecraftPlayersChannelId: { type: DataTypes.STRING, allowNull: true },

			aiChannelIds: { type: DataTypes.JSON, defaultValue: [] },

			testimonyChannelId: { type: DataTypes.STRING, allowNull: true },
			feedbackChannelId: { type: DataTypes.STRING, allowNull: true },
			testimonyCount: { type: DataTypes.BIGINT, defaultValue: 0 },
			testimonyCountFormat: { type: DataTypes.STRING, allowNull: true },
			testimonyCountChannelId: { type: DataTypes.STRING, allowNull: true },

			openCloseType: {
				type: DataTypes.ENUM(
					'channelname',
					'channelmessage',
					'channelnameandmessage',
				),
				allowNull: true,
			},
			openCloseChannelId: { type: DataTypes.STRING, allowNull: true },
			openChannelNameFormat: { type: DataTypes.STRING, allowNull: true },
			closeChannelNameFormat: { type: DataTypes.STRING, allowNull: true },
			openChannelMessageFormat: { type: DataTypes.JSON, defaultValue: [] },
			closeChannelMessageFormat: { type: DataTypes.JSON, defaultValue: [] },

			streakRoleRewards: { type: DataTypes.JSON, defaultValue: [] },
			streakEmoji: { type: DataTypes.STRING, allowNull: true },
			streakMinimum: { type: DataTypes.INTEGER, defaultValue: 3 },
			streakNickname: { type: DataTypes.BOOLEAN, defaultValue: false },

			announcementChannelId: { type: DataTypes.STRING, allowNull: true },
			inviteChannelId: { type: DataTypes.STRING, allowNull: true },

			boostLogChannelId: { type: DataTypes.STRING, allowNull: true },
			boostLogMessage: { type: DataTypes.TEXT, allowNull: true },

			botName: { type: DataTypes.STRING, allowNull: true },
			botAvatarUrl: { type: DataTypes.STRING, allowNull: true },
			botBannerUrl: { type: DataTypes.STRING, allowNull: true },
			botBio: { type: DataTypes.TEXT, allowNull: true },
		});
	},

	async down(queryInterface) {
		await queryInterface.dropTable('server_settings');
	},
};
