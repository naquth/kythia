/**
 * @namespace: addons/birthday/cron/announcer.js
 * @type: Cron Job
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

const { welcomeBanner } = require('kythia-arts');
const { MessageFlags, AttachmentBuilder } = require('discord.js');
const { DateTime } = require('luxon');

module.exports = {
	taskName: 'daily-greeter',
	schedule: '0 * * * *', // every 1 hour
	active: true,
	execute: async (container) => {
		const { client } = container;
		const { models, helpers, logger } = client.container;
		const { UserBirthday } = models;
		const { t } = client.container;

		logger.info('🎂 Running birthday announcer...', { label: 'birthday' });

		const now = DateTime.now();
		const currentDay = now.day;
		const currentMonth = now.month;
		const currentYear = now.year;

		try {
			const birthdays = await UserBirthday.getAllCache({
				where: {
					day: currentDay,
					month: currentMonth,
				},
			});

			if (birthdays.length === 0) return;

			for (const record of birthdays) {
				if (record.lastCelebratedYear === currentYear) continue;

				const guild = client.guilds.cache.get(record.guildId);
				if (!guild) continue;

				const { BirthdaySetting } = models;
				let channel = null;

				const setting = await BirthdaySetting.getCache({
					guildId: guild.id,
				});

				if (setting?.channelId) {
					channel = guild.channels.cache.get(setting.channelId);
				}

				if (!channel) {
					channel = guild.systemChannel;
				}

				if (!channel) continue;

				try {
					const user = await client.users
						.fetch(record.userId)
						.catch(() => null);
					if (!user) continue;

					const roleId = setting?.roleId;
					const pingRoleId = setting?.pingRoleId;
					const showAge = setting?.showAge ?? true;
					let contentMsg = setting?.message;

					const getZodiac = (d, m) => {
						const z = [
							{ sign: '♑ Capricorn', lastDay: 19 },
							{ sign: '♒ Aquarius', lastDay: 18 },
							{ sign: '♓ Pisces', lastDay: 20 },
							{ sign: '♈ Aries', lastDay: 19 },
							{ sign: '♉ Taurus', lastDay: 20 },
							{ sign: '♊ Gemini', lastDay: 20 },
							{ sign: '♋ Cancer', lastDay: 22 },
							{ sign: '♌ Leo', lastDay: 22 },
							{ sign: '♍ Virgo', lastDay: 22 },
							{ sign: '♎ Libra', lastDay: 22 },
							{ sign: '♏ Scorpio', lastDay: 21 },
							{ sign: '♐ Sagittarius', lastDay: 21 },
							{ sign: '♑ Capricorn', lastDay: 31 },
						];
						return d > z[m - 1].lastDay ? z[m].sign : z[m - 1].sign;
					};

					let age = '';
					if (record.year && showAge) {
						age = (currentYear - record.year).toString();
					}
					const zodiac = getZodiac(currentDay, currentMonth);

					if (!contentMsg) {
						contentMsg = await t(guild, 'birthday.announcement', {
							user: user.toString(),
						});
					} else {
						contentMsg = contentMsg
							.replace(/{user}/g, user.toString())
							.replace(/{age}/g, age || '')
							.replace(/{zodiac}/g, zodiac);
					}

					if (roleId) {
						const member = await guild.members.fetch(user.id).catch(() => null);
						if (member) {
							await member.roles.add(roleId).catch((e) => {
								if (logger)
									logger.warn(
										`⚠ [Birthday] Failed to add role ${roleId} to ${user.tag}: ${e.message}`,
									);
							});
						}
					}

					// KYTHIA ARTS GENERATION
					const bannerBuffer = await welcomeBanner(user.id, {
						customUsername: user.username,
						botToken: client.token,
						customBackground: setting?.bgUrl || null,
						welcomeText: 'HAPPY BIRTHDAY',
						welcomeColor: setting?.embedColor || '#FFD700',
						usernameColor: '#FFFFFF',
						avatarBorder: {
							width: 6,
							color: setting?.embedColor || '#FFD700',
						},
						type: 'welcome', // Reusing welcome type for now as instructed
					}).catch((e) => {
						logger?.error(`❌ [Birthday] Failed to generate arts: ${e}`);
						return null;
					});

					const files = [];
					let imageUrl = null;
					if (Buffer.isBuffer(bannerBuffer)) {
						const attachment = new AttachmentBuilder(bannerBuffer, {
							name: 'birthday.png',
						});
						files.push(attachment);
						imageUrl = 'attachment://birthday.png';
					}

					const {
						ContainerBuilder,
						TextDisplayBuilder,
						MediaGalleryBuilder,
						MediaGalleryItemBuilder,
						SeparatorBuilder,
						SeparatorSpacingSize,
					} = require('discord.js');
					const { convertColor } = helpers.color;

					// let messageContent = `Hey ${user.toString()}!`;
					// if (pingRoleId) {
					// 	messageContent += ` <@&${pingRoleId}>`;
					// }

					// Manually build container
					const colorInput = setting?.embedColor || '#FFD700';
					const accentColor = convertColor(colorInput, {
						from: 'hex',
						to: 'decimal',
					});

					const builder = new ContainerBuilder()
						.setAccentColor(accentColor)
						.addTextDisplayComponents(
							new TextDisplayBuilder().setContent(
								`# 🎂 Happy Birthday!\n${contentMsg}`,
							),
						);

					// Add Image (Arts or Background)
					if (imageUrl) {
						builder.addSeparatorComponents(
							new SeparatorBuilder()
								.setSpacing(SeparatorSpacingSize.Small)
								.setDivider(true),
						);
						// If attaching a file, use attachment:// syntax
						builder.addMediaGalleryComponents(
							new MediaGalleryBuilder().addItems([
								new MediaGalleryItemBuilder().setURL(imageUrl),
							]),
						);
					} else if (setting?.bgUrl) {
						builder.addSeparatorComponents(
							new SeparatorBuilder()
								.setSpacing(SeparatorSpacingSize.Small)
								.setDivider(true),
						);
						builder.addMediaGalleryComponents(
							new MediaGalleryBuilder().addItems([
								new MediaGalleryItemBuilder().setURL(setting.bgUrl),
							]),
						);
					}

					await channel.send({
						// content: messageContent,
						components: [builder],
						files: files,
						flags: MessageFlags.IsComponentsV2,
					});

					// Update DB
					record.lastCelebratedYear = currentYear;
					await record.save();
				} catch (err) {
					if (logger)
						logger.error(
							`❌ [Birthday] Failed to announce for user ${record.userId} in guild ${record.guildId}:`,
							err,
						);
				}
			}
		} catch (error) {
			if (logger)
				logger.error('❌ [Birthday] Error fetching birthdays:', error);
		}
	},
};
