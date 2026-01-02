export enum Events {
  ApplicationCommandPermissionsUpdate = 'applicationCommandPermissionsUpdate',
  AutoModerationActionExecution = 'autoModerationActionExecution',
  AutoModerationRuleCreate = 'autoModerationRuleCreate',
  AutoModerationRuleDelete = 'autoModerationRuleDelete',
  AutoModerationRuleUpdate = 'autoModerationRuleUpdate',
  ClientReady = 'clientReady',
  EntitlementCreate = 'entitlementCreate',
  EntitlementDelete = 'entitlementDelete',
  EntitlementUpdate = 'entitlementUpdate',
  GuildAuditLogEntryCreate = 'guildAuditLogEntryCreate',
  GuildAvailable = 'guildAvailable',
  GuildCreate = 'guildCreate',
  GuildDelete = 'guildDelete',
  GuildUpdate = 'guildUpdate',
  GuildUnavailable = 'guildUnavailable',
  GuildMemberAdd = 'guildMemberAdd',
  GuildMemberRemove = 'guildMemberRemove',
  GuildMemberUpdate = 'guildMemberUpdate',
  GuildMemberAvailable = 'guildMemberAvailable',
  GuildMembersChunk = 'guildMembersChunk',
  GuildIntegrationsUpdate = 'guildIntegrationsUpdate',
  GuildRoleCreate = 'roleCreate',
  GuildRoleDelete = 'roleDelete',
  InviteCreate = 'inviteCreate',
  InviteDelete = 'inviteDelete',
  GuildRoleUpdate = 'roleUpdate',
  GuildEmojiCreate = 'emojiCreate',
  GuildEmojiDelete = 'emojiDelete',
  GuildEmojiUpdate = 'emojiUpdate',
  GuildBanAdd = 'guildBanAdd',
  GuildBanRemove = 'guildBanRemove',
  ChannelCreate = 'channelCreate',
  ChannelDelete = 'channelDelete',
  ChannelUpdate = 'channelUpdate',
  ChannelPinsUpdate = 'channelPinsUpdate',
  MessageCreate = 'messageCreate',
  MessageDelete = 'messageDelete',
  MessageUpdate = 'messageUpdate',
  MessageBulkDelete = 'messageDeleteBulk',
  MessagePollVoteAdd = 'messagePollVoteAdd',
  MessagePollVoteRemove = 'messagePollVoteRemove',
  MessageReactionAdd = 'messageReactionAdd',
  MessageReactionRemove = 'messageReactionRemove',
  MessageReactionRemoveAll = 'messageReactionRemoveAll',
  MessageReactionRemoveEmoji = 'messageReactionRemoveEmoji',
  ThreadCreate = 'threadCreate',
  ThreadDelete = 'threadDelete',
  ThreadUpdate = 'threadUpdate',
  ThreadListSync = 'threadListSync',
  ThreadMemberUpdate = 'threadMemberUpdate',
  ThreadMembersUpdate = 'threadMembersUpdate',
  UserUpdate = 'userUpdate',
  PresenceUpdate = 'presenceUpdate',
  VoiceChannelEffectSend = 'voiceChannelEffectSend',
  VoiceServerUpdate = 'voiceServerUpdate',
  VoiceStateUpdate = 'voiceStateUpdate',
  TypingStart = 'typingStart',
  WebhooksUpdate = 'webhooksUpdate',
  InteractionCreate = 'interactionCreate',
  Error = 'error',
  Warn = 'warn',
  Debug = 'debug',
  CacheSweep = 'cacheSweep',
  ShardDisconnect = 'shardDisconnect',
  ShardError = 'shardError',
  ShardReconnecting = 'shardReconnecting',
  ShardReady = 'shardReady',
  ShardResume = 'shardResume',
  Invalidated = 'invalidated',
  Raw = 'raw',
  StageInstanceCreate = 'stageInstanceCreate',
  StageInstanceUpdate = 'stageInstanceUpdate',
  StageInstanceDelete = 'stageInstanceDelete',
  SubscriptionCreate = 'subscriptionCreate',
  SubscriptionUpdate = 'subscriptionUpdate',
  SubscriptionDelete = 'subscriptionDelete',
  GuildStickerCreate = 'stickerCreate',
  GuildStickerDelete = 'stickerDelete',
  GuildStickerUpdate = 'stickerUpdate',
  GuildScheduledEventCreate = 'guildScheduledEventCreate',
  GuildScheduledEventUpdate = 'guildScheduledEventUpdate',
  GuildScheduledEventDelete = 'guildScheduledEventDelete',
  GuildScheduledEventUserAdd = 'guildScheduledEventUserAdd',
  GuildScheduledEventUserRemove = 'guildScheduledEventUserRemove',
  GuildSoundboardSoundCreate = 'guildSoundboardSoundCreate',
  GuildSoundboardSoundDelete = 'guildSoundboardSoundDelete',
  GuildSoundboardSoundUpdate = 'guildSoundboardSoundUpdate',
  GuildSoundboardSoundsUpdate = 'guildSoundboardSoundsUpdate',
  SoundboardSounds = 'soundboardSounds',
}

export interface ClientEvents {
  applicationCommandPermissionsUpdate: [data: ApplicationCommandPermissionsUpdateData];
  autoModerationActionExecution: [autoModerationActionExecution: AutoModerationActionExecution];
  autoModerationRuleCreate: [autoModerationRule: AutoModerationRule];
  autoModerationRuleDelete: [autoModerationRule: AutoModerationRule];
  autoModerationRuleUpdate: [
    oldAutoModerationRule: AutoModerationRule | null,
    newAutoModerationRule: AutoModerationRule,
  ];
  cacheSweep: [message: string];
  channelCreate: [channel: NonThreadGuildBasedChannel];
  channelDelete: [channel: DMChannel | NonThreadGuildBasedChannel];
  channelPinsUpdate: [channel: TextBasedChannel, date: Date];
  channelUpdate: [
    oldChannel: DMChannel | NonThreadGuildBasedChannel,
    newChannel: DMChannel | NonThreadGuildBasedChannel,
  ];
  clientReady: [client: Client<true>];
  debug: [message: string];
  warn: [message: string];
  emojiCreate: [emoji: GuildEmoji];
  emojiDelete: [emoji: GuildEmoji];
  emojiUpdate: [oldEmoji: GuildEmoji, newEmoji: GuildEmoji];
  entitlementCreate: [entitlement: Entitlement];
  entitlementDelete: [entitlement: Entitlement];
  entitlementUpdate: [oldEntitlement: Entitlement | null, newEntitlement: Entitlement];
  error: [error: Error];
  guildAuditLogEntryCreate: [auditLogEntry: GuildAuditLogsEntry, guild: Guild];
  guildAvailable: [guild: Guild];
  guildBanAdd: [ban: GuildBan];
  guildBanRemove: [ban: GuildBan];
  guildCreate: [guild: Guild];
  guildDelete: [guild: Guild];
  guildUnavailable: [guild: Guild];
  guildIntegrationsUpdate: [guild: Guild];
  guildMemberAdd: [member: GuildMember];
  guildMemberAvailable: [member: GuildMember | PartialGuildMember];
  guildMemberRemove: [member: GuildMember | PartialGuildMember];
  guildMembersChunk: [members: ReadonlyCollection<Snowflake, GuildMember>, guild: Guild, data: GuildMembersChunk];
  guildMemberUpdate: [oldMember: GuildMember | PartialGuildMember, newMember: GuildMember];
  guildUpdate: [oldGuild: Guild, newGuild: Guild];
  guildSoundboardSoundCreate: [soundboardSound: GuildSoundboardSound];
  guildSoundboardSoundDelete: [soundboardSound: GuildSoundboardSound | PartialSoundboardSound];
  guildSoundboardSoundUpdate: [
    oldSoundboardSound: GuildSoundboardSound | null,
    newSoundboardSound: GuildSoundboardSound,
  ];
  guildSoundboardSoundsUpdate: [soundboardSounds: ReadonlyCollection<Snowflake, GuildSoundboardSound>, guild: Guild];
  inviteCreate: [invite: Invite];
  inviteDelete: [invite: Invite];
  messageCreate: [message: OmitPartialGroupDMChannel<Message>];
  messageDelete: [message: OmitPartialGroupDMChannel<Message | PartialMessage>];
  messagePollVoteAdd: [pollAnswer: PollAnswer | PartialPollAnswer, userId: Snowflake];
  messagePollVoteRemove: [pollAnswer: PollAnswer | PartialPollAnswer, userId: Snowflake];
  messageReactionRemoveAll: [
    message: OmitPartialGroupDMChannel<Message | PartialMessage>,
    reactions: ReadonlyCollection<string | Snowflake, MessageReaction>,
  ];
  messageReactionRemoveEmoji: [reaction: MessageReaction | PartialMessageReaction];
  messageDeleteBulk: [
    messages: ReadonlyCollection<Snowflake, Message<true> | PartialMessage<true>>,
    channel: GuildTextBasedChannel,
  ];
  messageReactionAdd: [
    reaction: MessageReaction | PartialMessageReaction,
    user: User | PartialUser,
    details: MessageReactionEventDetails,
  ];
  messageReactionRemove: [
    reaction: MessageReaction | PartialMessageReaction,
    user: User | PartialUser,
    details: MessageReactionEventDetails,
  ];
  messageUpdate: [
    oldMessage: OmitPartialGroupDMChannel<Message | PartialMessage>,
    newMessage: OmitPartialGroupDMChannel<Message>,
  ];
  presenceUpdate: [oldPresence: Presence | null, newPresence: Presence];
  /** @deprecated Use {@link ClientEvents.ClientReady} instead. */
  ready: [client: Client<true>];
  invalidated: [];
  roleCreate: [role: Role];
  roleDelete: [role: Role];
  roleUpdate: [oldRole: Role, newRole: Role];
  threadCreate: [thread: AnyThreadChannel, newlyCreated: boolean];
  threadDelete: [thread: AnyThreadChannel];
  threadListSync: [threads: ReadonlyCollection<Snowflake, AnyThreadChannel>, guild: Guild];
  threadMemberUpdate: [oldMember: ThreadMember, newMember: ThreadMember];
  threadMembersUpdate: [
    addedMembers: ReadonlyCollection<Snowflake, ThreadMember>,
    removedMembers: ReadonlyCollection<Snowflake, ThreadMember | PartialThreadMember>,
    thread: AnyThreadChannel,
  ];
  threadUpdate: [oldThread: AnyThreadChannel, newThread: AnyThreadChannel];
  typingStart: [typing: Typing];
  userUpdate: [oldUser: User | PartialUser, newUser: User];
  voiceChannelEffectSend: [voiceChannelEffect: VoiceChannelEffect];
  voiceStateUpdate: [oldState: VoiceState, newState: VoiceState];
  /** @deprecated Use {@link ClientEvents.webhooksUpdate} instead. */
  webhookUpdate: ClientEvents['webhooksUpdate'];
  webhooksUpdate: [channel: TextChannel | NewsChannel | VoiceChannel | ForumChannel | MediaChannel];
  interactionCreate: [interaction: Interaction];
  shardDisconnect: [closeEvent: CloseEvent, shardId: number];
  shardError: [error: Error, shardId: number];
  shardReady: [shardId: number, unavailableGuilds: Set<Snowflake> | undefined];
  shardReconnecting: [shardId: number];
  shardResume: [shardId: number, replayedEvents: number];
  stageInstanceCreate: [stageInstance: StageInstance];
  stageInstanceUpdate: [oldStageInstance: StageInstance | null, newStageInstance: StageInstance];
  stageInstanceDelete: [stageInstance: StageInstance];
  stickerCreate: [sticker: Sticker];
  stickerDelete: [sticker: Sticker];
  stickerUpdate: [oldSticker: Sticker, newSticker: Sticker];
  subscriptionCreate: [subscription: Subscription];
  subscriptionDelete: [subscription: Subscription];
  subscriptionUpdate: [oldSubscription: Subscription | null, newSubscription: Subscription];
  guildScheduledEventCreate: [guildScheduledEvent: GuildScheduledEvent];
  guildScheduledEventUpdate: [
    oldGuildScheduledEvent: GuildScheduledEvent | PartialGuildScheduledEvent | null,
    newGuildScheduledEvent: GuildScheduledEvent,
  ];
  guildScheduledEventDelete: [guildScheduledEvent: GuildScheduledEvent | PartialGuildScheduledEvent];
  guildScheduledEventUserAdd: [guildScheduledEvent: GuildScheduledEvent | PartialGuildScheduledEvent, user: User];
  guildScheduledEventUserRemove: [guildScheduledEvent: GuildScheduledEvent | PartialGuildScheduledEvent, user: User];
  soundboardSounds: [soundboardSounds: ReadonlyCollection<Snowflake, GuildSoundboardSound>, guild: Guild];
}