import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  Partials,
  REST,
  Routes,
  SlashCommandBuilder,
} from "discord.js";

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;
const prefix = process.env.DISCORD_PREFIX ?? "!";
const singularMaxAttemptsPerPlayer = 2;
const fastTypingDurationMs = 10_000;
const singularDurationMs = 15_000;
const eventRoundDelayMs = 2_000;
const gameStartColor = 0x2ecc71;
const gameResultColor = 0xf1c40f;
const gameTimeoutColor = 0xe74c3c;

if (!token) {
  throw new Error("Missing DISCORD_TOKEN secret. Add your Discord bot token before starting the bot.");
}

const slashCommands = [
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check whether the bot is online."),
  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Show available bot commands."),
].map((command) => command.toJSON());

const fastTypingWords = {
  easy: ["ضوء القمر", "غيمة بيضاء", "موج البحر", "نجم بعيد", "باب المدينة", "صوت الريح", "طريق الرمال", "زهرة نادرة", "عين الصقر", "ليل هادئ"],
  medium: ["ذاكرة المسافر", "رسالة مشفرة", "خريطة قديمة", "بوابة مهجورة", "قافلة الصحراء", "مفتاح الأسرار", "مدينة الضباب", "طائر الرعد", "حكاية البحار", "نافذة الظلال"],
  hard: ["استراتيجية محكمة", "مسؤولية استثنائية", "مغامرة غامضة", "احتمالات متشابكة", "تكنولوجيا متقدمة", "معلومات استخباراتية", "قرار مصيري", "ذاكرة استثنائية", "تجربة افتراضية", "منظومة متكاملة", "تحليل استراتيجي", "مخطوطة أثرية"],
};

const singularWords = {
  easy: [
    { prompt: "أبواب", answer: "باب" },
    { prompt: "أقلام", answer: "قلم" },
    { prompt: "كتب", answer: "كتاب" },
    { prompt: "نجوم", answer: "نجم" },
    { prompt: "بحار", answer: "بحر" },
    { prompt: "ورود", answer: "وردة" },
    { prompt: "بيوت", answer: "بيت" },
    { prompt: "مفاتيح", answer: "مفتاح" },
    { prompt: "سيارات", answer: "سيارة" },
    { prompt: "مدارس", answer: "مدرسة" },
  ],
  medium: [
    { prompt: "حدائق", answer: "حديقة" },
    { prompt: "رسائل", answer: "رسالة" },
    { prompt: "نوافذ", answer: "نافذة" },
    { prompt: "طائرات", answer: "طائرة" },
    { prompt: "مدن", answer: "مدينة" },
    { prompt: "أصدقاء", answer: "صديق" },
    { prompt: "أصوات", answer: "صوت" },
    { prompt: "جبال", answer: "جبل" },
    { prompt: "طرق", answer: "طريق" },
    { prompt: "قصص", answer: "قصة" },
  ],
  hard: [
    { prompt: "مسؤوليات", answer: "مسؤولية" },
    { prompt: "استراتيجيات", answer: "استراتيجية" },
    { prompt: "معلومات", answer: "معلومة" },
    { prompt: "تقنيات", answer: "تقنية" },
    { prompt: "تجارب", answer: "تجربة" },
    { prompt: "قرارات", answer: "قرار" },
    { prompt: "احتمالات", answer: "احتمال" },
    { prompt: "مكتبات", answer: "مكتبة" },
    { prompt: "مستشفيات", answer: "مستشفى" },
    { prompt: "مغامرات", answer: "مغامرة" },
    { prompt: "استنتاجات", answer: "استنتاج" },
    { prompt: "افتراضات", answer: "افتراض" },
    { prompt: "تحليلات", answer: "تحليل" },
    { prompt: "منظومات", answer: "منظومة" },
    { prompt: "مؤتمرات", answer: "مؤتمر" },
    { prompt: "مخطوطات", answer: "مخطوطة" },
  ],
};

const pluralWords = {
  easy: [
    { prompt: "باب", answer: "أبواب" },
    { prompt: "قلم", answer: "أقلام" },
    { prompt: "كتاب", answer: "كتب" },
    { prompt: "نجم", answer: "نجوم" },
    { prompt: "بحر", answer: "بحار" },
    { prompt: "وردة", answer: "ورود" },
    { prompt: "بيت", answer: "بيوت" },
    { prompt: "مفتاح", answer: "مفاتيح" },
    { prompt: "سيارة", answer: "سيارات" },
    { prompt: "مدرسة", answer: "مدارس" },
  ],
  medium: [
    { prompt: "حديقة", answer: "حدائق" },
    { prompt: "رسالة", answer: "رسائل" },
    { prompt: "نافذة", answer: "نوافذ" },
    { prompt: "طائرة", answer: "طائرات" },
    { prompt: "مدينة", answer: "مدن" },
    { prompt: "صديق", answer: "أصدقاء" },
    { prompt: "صوت", answer: "أصوات" },
    { prompt: "جبل", answer: "جبال" },
    { prompt: "طريق", answer: "طرق" },
    { prompt: "قصة", answer: "قصص" },
  ],
  hard: [
    { prompt: "مسؤولية", answer: "مسؤوليات" },
    { prompt: "استراتيجية", answer: "استراتيجيات" },
    { prompt: "معلومة", answer: "معلومات" },
    { prompt: "تقنية", answer: "تقنيات" },
    { prompt: "تجربة", answer: "تجارب" },
    { prompt: "قرار", answer: "قرارات" },
    { prompt: "احتمال", answer: "احتمالات" },
    { prompt: "مكتبة", answer: "مكتبات" },
    { prompt: "مستشفى", answer: "مستشفيات" },
    { prompt: "مغامرة", answer: "مغامرات" },
    { prompt: "استنتاج", answer: "استنتاجات" },
    { prompt: "افتراض", answer: "افتراضات" },
    { prompt: "تحليل", answer: "تحليلات" },
    { prompt: "منظومة", answer: "منظومات" },
    { prompt: "مؤتمر", answer: "مؤتمرات" },
    { prompt: "مخطوطة", answer: "مخطوطات" },
  ],
};

const activeGames = new Map();
const eventSetups = new Map();
const eventSessions = new Map();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel],
});

async function registerSlashCommands() {
  if (!clientId) {
    console.warn("DISCORD_CLIENT_ID is not set. Slash command registration skipped.");
    return;
  }

  const rest = new REST({ version: "10" }).setToken(token);

  if (guildId) {
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
      body: slashCommands,
    });
    console.info(`Registered slash commands for guild ${guildId}.`);
    return;
  }

  await rest.put(Routes.applicationCommands(clientId), {
    body: slashCommands,
  });
  console.info("Registered global slash commands.");
}

function helpText() {
  return [
    "Available commands:",
    "`/ping` or `!ping` — check whether the bot is online",
    "`/help` or `!help` — show this help message",
    "`العاب` or `!العاب` — show the game list",
    "`ايفنت` or `فعاليه` — create a timed event",
    "`توقيف` or `!توقيف` — stop the current event",
    "`اسرع` or `!اسرع` — start a 10-second Arabic speed typing game",
    "`مفرد` or `!مفرد` — start a 15-second singular-word game",
    "`جمع` or `!جمع` — start a 15-second plural-word game",
  ].join("\n");
}

function gamesListText() {
  return [
    "# الألعاب المتاحة",
    "1. `اسرع` — انسخ العبارة قبل انتهاء الوقت",
    "2. `مفرد` — حوّل الكلمة من جمع إلى مفرد",
    "3. `جمع` — حوّل الكلمة من مفرد إلى جمع",
    "-# اكتب اسم اللعبة مباشرة، أو استخدم `ايفنت` لتشغيل جولات متواصلة",
  ].join("\n");
}

function gameButtonsRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("event:game:fast")
      .setLabel("اسرع")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("event:game:singular")
      .setLabel("مفرد")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("event:game:plural")
      .setLabel("جمع")
      .setStyle(ButtonStyle.Secondary),
  );
}

function durationButtonsRows() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("event:duration:1")
        .setLabel("1 دقيقة")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("event:duration:2")
        .setLabel("2 دقائق")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("event:duration:3")
        .setLabel("3 دقائق")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("event:duration:4")
        .setLabel("4 دقائق")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("event:duration:5")
        .setLabel("5 دقائق")
        .setStyle(ButtonStyle.Secondary),
    ),
  ];
}

function gameName(gameType) {
  if (gameType === "fast") {
    return "اسرع";
  }

  if (gameType === "singular") {
    return "مفرد";
  }

  return "جمع";
}

function gameInstruction(gameType) {
  if (gameType === "fast") {
    return "اكتب العبارة كما تظهر تماماً";
  }

  if (gameType === "singular") {
    return "اكتب مفرد الكلمة المعروضة";
  }

  return "اكتب جمع الكلمة المعروضة";
}

function gameDurationSeconds(gameType) {
  return gameType === "fast" ? 10 : 15;
}

function createGameStartEmbed(gameConfig) {
  return new EmbedBuilder()
    .setColor(gameStartColor)
    .setTitle(gameName(gameConfig.type))
    .setDescription(`# ${gameConfig.prompt}`)
    .setFooter({
      text: `${gameInstruction(gameConfig.type)} • ${gameDurationSeconds(gameConfig.type)}s`,
    });
}

function createGameWinEmbed(game, message, seconds) {
  return new EmbedBuilder()
    .setColor(gameResultColor)
    .setTitle("إجابة صحيحة")
    .setDescription(`${message.author} ⚡ ${seconds}s`)
    .addFields(
      { name: "اللعبة", value: gameName(game.type), inline: true },
      { name: "الإجابة", value: game.answer, inline: true },
    );
}

function createGameTimeoutEmbed(gameConfig) {
  return new EmbedBuilder()
    .setColor(gameTimeoutColor)
    .setTitle("انتهى الوقت")
    .setDescription(`${gameConfig.timeoutText}\n\nالإجابة: **${gameConfig.answer}**`);
}

function pickRandomFromPool(pool) {
  const difficulties = Object.keys(pool);
  const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
  const items = pool[difficulty];
  const item = items[Math.floor(Math.random() * items.length)];

  return { difficulty, item };
}

function normalizeAnswer(value) {
  return value.trim().replace(/\s+/g, " ");
}

function isSingularAnswerAttempt(value) {
  const normalized = normalizeAnswer(value);
  return /^[\u0600-\u06FF]+$/u.test(normalized) && normalized.length >= 2;
}

async function deleteDuplicateAttempt(message) {
  if (!message.deletable) {
    return;
  }

  try {
    await message.delete();
  } catch (error) {
    console.warn("Failed to delete duplicate game attempt.", error);
  }
}

function createFastTypingGameConfig() {
  const { difficulty, item } = pickRandomFromPool(fastTypingWords);

  return {
    type: "fast",
    difficulty,
    prompt: item,
    answer: item,
    durationMs: fastTypingDurationMs,
    timeoutText: "انتهى الوقت. ما أحد كتب الجملة",
  };
}

function createSingularGameConfig() {
  const { difficulty, item } = pickRandomFromPool(singularWords);

  return {
    type: "singular",
    difficulty,
    prompt: item.prompt,
    answer: item.answer,
    durationMs: singularDurationMs,
    timeoutText: "انتهى الوقت. المفرد الصحيح هو",
  };
}

function createPluralGameConfig() {
  const { difficulty, item } = pickRandomFromPool(pluralWords);

  return {
    type: "plural",
    difficulty,
    prompt: item.prompt,
    answer: item.answer,
    durationMs: singularDurationMs,
    timeoutText: "انتهى الوقت. الجمع الصحيح هو",
  };
}

function createGameConfig(gameType) {
  if (gameType === "fast") {
    return createFastTypingGameConfig();
  }

  if (gameType === "singular") {
    return createSingularGameConfig();
  }

  return createPluralGameConfig();
}

async function finishEventIfNeeded(channel) {
  const session = eventSessions.get(channel.id);

  if (!session || Date.now() < session.endsAt) {
    return false;
  }

  if (session.nextRoundTimeout) {
    clearTimeout(session.nextRoundTimeout);
  }

  eventSessions.delete(channel.id);
  await channel.send("انتهى الايفنت. شكراً لكل المشاركين.");
  return true;
}

async function scheduleNextEventRound(channel) {
  const session = eventSessions.get(channel.id);

  if (!session) {
    return;
  }

  if (await finishEventIfNeeded(channel)) {
    return;
  }

  session.nextRoundTimeout = setTimeout(async () => {
    await startEventRound(channel);
  }, eventRoundDelayMs);
}

async function startEventRound(channel) {
  const session = eventSessions.get(channel.id);

  if (!session || activeGames.has(channel.id)) {
    return;
  }

  if (await finishEventIfNeeded(channel)) {
    return;
  }

  await startGameInChannel(channel, createGameConfig(session.gameType));
}

async function startGameInChannel(channel, gameConfig) {
  if (activeGames.has(channel.id)) {
    await channel.send("فيه جولة شغالة الآن. جاوب قبل ما يخلص الوقت.");
    return false;
  }

  const timeout = setTimeout(async () => {
    const game = activeGames.get(channel.id);

    if (!game || game.answer !== gameConfig.answer) {
      return;
    }

    activeGames.delete(channel.id);

    try {
      await channel.send({ embeds: [createGameTimeoutEmbed(gameConfig)] });
      await scheduleNextEventRound(channel);
    } catch (error) {
      console.error("Failed to send game timeout message.", error);
    }
  }, gameConfig.durationMs);

  activeGames.set(channel.id, {
    ...gameConfig,
    timeout,
    startedAt: Date.now(),
    totalAttempts: 0,
    attemptCounts: new Map(),
  });

  await channel.send({ embeds: [createGameStartEmbed(gameConfig)] });
  return true;
}

async function startGame(message, gameConfig) {
  if (activeGames.has(message.channel.id)) {
    await message.reply("فيه جولة شغالة الآن. جاوب قبل ما يخلص الوقت.");
    return false;
  }

  return startGameInChannel(message.channel, gameConfig);
}

async function startFastTypingGame(message) {
  await startGame(message, createFastTypingGameConfig());
}

async function startSingularGame(message) {
  await startGame(message, createSingularGameConfig());
}

async function startPluralGame(message) {
  await startGame(message, createPluralGameConfig());
}

async function startEventSetup(message) {
  if (eventSessions.has(message.channel.id)) {
    await message.reply("فيه ايفنت شغال الآن في هذا الروم.");
    return;
  }

  if (activeGames.has(message.channel.id)) {
    await message.reply("فيه جولة شغالة الآن. انتظر حتى تنتهي ثم ابدأ الايفنت.");
    return;
  }

  const setupMessage = await message.reply({
    content: "# إعداد الايفنت\nاختر اللعبة التي تريد تشغيلها بشكل متواصل.",
    components: [gameButtonsRow()],
  });

  eventSetups.set(setupMessage.id, {
    ownerId: message.author.id,
    channelId: message.channel.id,
    gameType: null,
  });
}

async function stopEvent(message) {
  const session = eventSessions.get(message.channel.id);
  const activeGame = activeGames.get(message.channel.id);
  let stoppedSetup = false;

  for (const [messageId, setup] of eventSetups.entries()) {
    if (setup.channelId === message.channel.id) {
      eventSetups.delete(messageId);
      stoppedSetup = true;
    }
  }

  if (!session && !stoppedSetup) {
    await message.reply("ما فيه ايفنت شغال حالياً في هذا الروم.");
    return;
  }

  if (session?.nextRoundTimeout) {
    clearTimeout(session.nextRoundTimeout);
  }

  if (activeGame) {
    clearTimeout(activeGame.timeout);
    activeGames.delete(message.channel.id);
  }

  eventSessions.delete(message.channel.id);
  await message.reply("تم توقيف الايفنت.");
}

async function handleEventButton(interaction) {
  const setup = eventSetups.get(interaction.message.id);

  if (!setup) {
    await interaction.reply({
      content: "هذا الايفنت لم يعد متاح.",
      ephemeral: true,
    });
    return;
  }

  if (interaction.user.id !== setup.ownerId) {
    await interaction.reply({
      content: "فقط صاحب الايفنت يقدر يختار.",
      ephemeral: true,
    });
    return;
  }

  const [, action, value] = interaction.customId.split(":");

  if (action === "game") {
    setup.gameType = value;
    await interaction.update({
      content: `# إعداد الايفنت\nاللعبة المختارة: **${gameName(value)}**\nاختر مدة الايفنت.`,
      components: durationButtonsRows(),
    });
    return;
  }

  if (action !== "duration" || !setup.gameType) {
    await interaction.reply({
      content: "اختر اللعبة أولاً.",
      ephemeral: true,
    });
    return;
  }

  const minutes = Number(value);
  const channel = interaction.channel;

  eventSetups.delete(interaction.message.id);
  eventSessions.set(setup.channelId, {
    gameType: setup.gameType,
    endsAt: Date.now() + minutes * 60 * 1000,
    nextRoundTimeout: null,
  });

  await interaction.update({
    content: `# بدأ الايفنت\nاللعبة: **${gameName(setup.gameType)}**\nالمدة: **${minutes} دقيقة**\nالجولات ستبدأ تلقائياً حتى تنتهي المدة.`,
    components: [],
  });

  await startEventRound(channel);
}

async function handleGameAnswer(message) {
  const game = activeGames.get(message.channel.id);

  if (!game) {
    return false;
  }

  if (normalizeAnswer(message.content) === game.answer) {
    clearTimeout(game.timeout);
    activeGames.delete(message.channel.id);

    const seconds = ((Date.now() - game.startedAt) / 1000).toFixed(2);
    await message.reply({ embeds: [createGameWinEmbed(game, message, seconds)] });
    await scheduleNextEventRound(message.channel);
    return true;
  }

  if (game.type === "fast") {
    game.totalAttempts += 1;
    await deleteDuplicateAttempt(message);
    return true;
  }

  if (!isSingularAnswerAttempt(message.content)) {
    await deleteDuplicateAttempt(message);
    return true;
  }

  const attemptCount = game.attemptCounts.get(message.author.id) ?? 0;

  if (attemptCount >= singularMaxAttemptsPerPlayer) {
    await deleteDuplicateAttempt(message);
    return true;
  }

  game.totalAttempts += 1;
  game.attemptCounts.set(message.author.id, attemptCount + 1);
  return true;
}

client.once(Events.ClientReady, async (readyClient) => {
  console.info(`Logged in as ${readyClient.user.tag}.`);

  try {
    await registerSlashCommands();
  } catch (error) {
    console.error("Failed to register slash commands.", error);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isButton() && interaction.customId.startsWith("event:")) {
    await handleEventButton(interaction);
    return;
  }

  if (!interaction.isChatInputCommand()) {
    return;
  }

  if (interaction.commandName === "ping") {
    await interaction.reply("Pong. The bot is online.");
    return;
  }

  if (interaction.commandName === "help") {
    await interaction.reply({ content: helpText(), ephemeral: true });
  }
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) {
    return;
  }

  const content = normalizeAnswer(message.content).toLowerCase();
  const startsWithPrefix = content.startsWith(prefix);
  const command = startsWithPrefix ? content.slice(prefix.length).trim() : content;

  if (command === "توقيف") {
    await stopEvent(message);
    return;
  }

  if (await handleGameAnswer(message)) {
    return;
  }

  if (command === "اسرع") {
    await startFastTypingGame(message);
    return;
  }

  if (command === "العاب") {
    await message.reply(gamesListText());
    return;
  }

  if (command === "ايفنت" || command === "فعاليه" || command === "فعالية") {
    await startEventSetup(message);
    return;
  }

  if (command === "مفرد") {
    await startSingularGame(message);
    return;
  }

  if (command === "جمع") {
    await startPluralGame(message);
    return;
  }

  if (!startsWithPrefix) {
    return;
  }

  if (command === "ping") {
    await message.reply("Pong. The bot is online.");
    return;
  }

  if (command === "help") {
    await message.reply(helpText());
    return;
  }

  if (command === "العاب") {
    await message.reply(gamesListText());
  }
});

client.on(Events.Error, (error) => {
  console.error("Discord client error.", error);
});

async function shutdown(signal) {
  console.info(`Received ${signal}. Shutting down Discord bot.`);

  for (const game of activeGames.values()) {
    clearTimeout(game.timeout);
  }

  for (const session of eventSessions.values()) {
    if (session.nextRoundTimeout) {
      clearTimeout(session.nextRoundTimeout);
    }
  }

  activeGames.clear();
  eventSessions.clear();
  eventSetups.clear();
  client.destroy();
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

await client.login(token);
