
const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  AttachmentBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  PermissionsBitField
} = require("discord.js");

const { createCanvas, GlobalFonts } = require("@napi-rs/canvas");
const fs = require("fs");
const path = require("path");

// =====================================
// MAIN GAMES
// =====================================

const TOKEN = process.env.TOKEN;
const COLOR = 0xffffff;
const DATA_FILE = path.join(__dirname, "games-data.json");

if (!TOKEN) {
  console.error("❌ ضع TOKEN في متغيرات الاستضافة");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

// =====================================
// DATA
// =====================================

let data = {
  points: {},
  names: {
    fast: "الأسرع",
    scramble: "فكك",
    xo: "اكس او",
    rps: "حجر ورقة مقص",
    quiz: "سؤال",
    guess: "تخمين",
    mafia: "مافيا"
  }
};

try {
  if (fs.existsSync(DATA_FILE)) {
    const saved = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    data = {
      points: saved.points || {},
      names: { ...data.names, ...(saved.names || {}) }
    };
  }
} catch (error) {
  console.error("خطأ قراءة ملف البيانات:", error);
}

function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function addPoints(userId, amount) {
  data.points[userId] = (data.points[userId] || 0) + amount;
  saveData();
}

// =====================================
// IMAGE GENERATOR
// =====================================

// البحث عن خط عربي موجود على النظام دون الحاجة لرفع مجلد fonts
const fontPaths = [
  "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
  "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
  "/usr/share/fonts/truetype/noto/NotoNaskhArabic-Regular.ttf",
  "/usr/share/fonts/truetype/freefont/FreeSans.ttf",
  "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
  "C:/Windows/Fonts/tahoma.ttf",
  "C:/Windows/Fonts/arial.ttf"
];

let fontLoaded = false;

for (const fontPath of fontPaths) {
  try {
    if (fs.existsSync(fontPath)) {
      GlobalFonts.registerFromPath(fontPath, "MainArabic");
      fontLoaded = true;
      console.log("✅ تم تحميل الخط:", fontPath);
      break;
    }
  } catch (error) {
    console.log("تعذر تحميل الخط:", fontPath);
  }
}

if (!fontLoaded) {
  console.log("⚠️ لم يتم العثور على خط عربي في النظام.");
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text).split(" ");
  let line = "";
  let currentY = y;

  for (const word of words) {
    const testLine = line ? line + " " + word : word;

    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = word;
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }

  if (line) ctx.fillText(line, x, currentY);
}

function makeCard(title, content, subtitle = "MAIN GAMES") {
  const canvas = createCanvas(1000, 500);
  const ctx = canvas.getContext("2d");

  // الخلفية
  const gradient = ctx.createLinearGradient(0, 0, 1000, 500);
  gradient.addColorStop(0, "#111111");
  gradient.addColorStop(1, "#333333");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1000, 500);

  // الإطار
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 5;
  ctx.strokeRect(20, 20, 960, 460);

  // الزخرفة
  ctx.fillStyle = "#555555";
  ctx.beginPath();
  ctx.arc(900, 80, 120, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(80, 430, 100, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = "center";
  ctx.direction = "rtl";

  const font = fontLoaded ? "MainArabic" : "sans-serif";

  // العنوان
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold 55px "${font}"`;
  ctx.fillText(title, 500, 125);

  // خط فاصل
  ctx.fillStyle = "#aaaaaa";
  ctx.fillRect(180, 155, 640, 4);

  // المحتوى
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold 65px "${font}"`;

  drawWrappedText(ctx, content, 500, 285, 850, 85);

  // اسم البوت
  ctx.fillStyle = "#cccccc";
  ctx.font = `bold 28px "${font}"`;
  ctx.fillText(subtitle, 500, 440);

  return canvas.toBuffer("image/png");
}

function imageAttachment(title, content) {
  const buffer = makeCard(title, content);

  return new AttachmentBuilder(buffer, {
    name: "main-games.png"
  });
}

// =====================================
// SEND IMAGE - IMPORTANT
// =====================================

async function sendGameImage(channel, title, content, description = "") {
  const attachment = imageAttachment(title, content);

  const embed = new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(title)
    .setDescription(description || "🎮 MAIN GAMES")
    .setImage("attachment://main-games.png")
    .setFooter({ text: "MAIN GAMES" });

  return channel.send({
    embeds: [embed],
    files: [attachment]
  });
}

// =====================================
// WORDS AND QUESTIONS
// =====================================

const words = [
  "برمجة",
  "كمبيوتر",
  "مدرسة",
  "سيارة",
  "مستشفى",
  "طائرة",
  "مكتبة",
  "هاتف",
  "انترنت",
  "روبوت",
  "تلفزيون",
  "بطارية",
  "شاشة",
  "لوحة",
  "كيبورد"
];

const questions = [
  {
    q: "ما عاصمة المملكة العربية السعودية؟",
    a: ["الرياض", "جدة", "مكة"]
  },
  {
    q: "كم عدد أيام الأسبوع؟",
    a: ["7", "5", "10"]
  },
  {
    q: "ما أكبر كوكب في المجموعة الشمسية؟",
    a: ["المشتري", "الأرض", "المريخ"]
  },
  {
    q: "ما الحيوان المعروف بسفينة الصحراء؟",
    a: ["الجمل", "الحصان", "الفيل"]
  },
  {
    q: "كم عدد ألوان قوس قزح؟",
    a: ["7", "5", "9"]
  }
];

// =====================================
// GAME HELPERS
// =====================================

function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function shuffleWord(word) {
  let result = word;

  while (result === word) {
    result = word.split("").sort(() => Math.random() - 0.5).join("");
  }

  return result;
}

function getTopPlayers() {
  return Object.entries(data.points)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
}

// =====================================
// FAST GAME
// =====================================

async function startFast(message) {
  const word = randomItem(words);
  const image = imageAttachment("⚡ الأسرع", word);

  const embed = new EmbedBuilder()
    .setColor(COLOR)
    .setTitle("⚡ تحدي الأسرع")
    .setDescription("أول شخص يكتب الكلمة الموجودة في الصورة يفوز!")
    .setImage("attachment://main-games.png")
    .setFooter({ text: "الوقت: 15 ثانية | الجائزة: 5 نقاط" });

  await message.channel.send({
    embeds: [embed],
    files: [image]
  });

  const collector = message.channel.createMessageCollector({
    time: 15000
  });

  collector.on("collect", async msg => {
    if (msg.author.bot) return;

    if (msg.content.trim() === word) {
      collector.stop("winner");
      addPoints(msg.author.id, 5);

      message.channel.send(
        `🏆 ${msg.author} فاز! حصل على **5 نقاط**.`
      );
    }
  });

  collector.on("end", (_, reason) => {
    if (reason !== "winner") {
      message.channel.send(`⏰ انتهى الوقت! الكلمة كانت: **${word}**`);
    }
  });
}

// =====================================
// SCRAMBLE GAME
// =====================================

async function startScramble(message) {
  const word = randomItem(words);
  const scrambled = shuffleWord(word);

  const image = imageAttachment("🧩 فكك الكلمة", scrambled);

  const embed = new EmbedBuilder()
    .setColor(COLOR)
    .setTitle("🧩 لعبة فكك")
    .setDescription("رتب الحروف واكتب الكلمة الصحيحة!")
    .setImage("attachment://main-games.png")
    .setFooter({ text: "الوقت: 30 ثانية | الجائزة: 5 نقاط" });

  await message.channel.send({
    embeds: [embed],
    files: [image]
  });

  const collector = message.channel.createMessageCollector({
    time: 30000
  });

  collector.on("collect", msg => {
    if (msg.author.bot) return;

    if (msg.content.trim() === word) {
      collector.stop("winner");
      addPoints(msg.author.id, 5);

      message.channel.send(
        `🏆 ${msg.author} حل الكلمة! حصل على **5 نقاط**.`
      );
    }
  });

  collector.on("end", (_, reason) => {
    if (reason !== "winner") {
      message.channel.send(`⏰ انتهى الوقت! الإجابة: **${word}**`);
    }
  });
}

// =====================================
// QUIZ GAME
// =====================================

async function startQuiz(message) {
  const question = randomItem(questions);

  const image = imageAttachment("❓ سؤال", question.q);

  const embed = new EmbedBuilder()
    .setColor(COLOR)
    .setTitle("❓ سؤال وجواب")
    .setDescription(
      question.a.map((answer, i) => `**${i + 1}.** ${answer}`).join("\n")
    )
    .setImage("attachment://main-games.png")
    .setFooter({ text: "الوقت: 30 ثانية | الجائزة: 5 نقاط" });

  await message.channel.send({
    embeds: [embed],
    files: [image]
  });

  const correct = question.a[0];

  const collector = message.channel.createMessageCollector({
    time: 30000
  });

  collector.on("collect", msg => {
    if (msg.author.bot) return;

    if (
      msg.content.trim() === correct ||
      msg.content.trim() === "1"
    ) {
      collector.stop("winner");
      addPoints(msg.author.id, 5);

      message.channel.send(
        `🏆 ${msg.author} جاوب صح! حصل على **5 نقاط**.`
      );
    }
  });

  collector.on("end", (_, reason) => {
    if (reason !== "winner") {
      message.channel.send(`⏰ انتهى الوقت! الإجابة: **${correct}**`);
    }
  });
}

// =====================================
// GUESS GAME
// =====================================

async function startGuess(message) {
  const number = Math.floor(Math.random() * 20) + 1;

  const image = imageAttachment("🔢 تخمين الرقم", "من 1 إلى 20");

  const embed = new EmbedBuilder()
    .setColor(COLOR)
    .setTitle("🔢 خمن الرقم")
    .setDescription("اكتب رقمًا من 1 إلى 20!")
    .setImage("attachment://main-games.png")
    .setFooter({ text: "الوقت: 30 ثانية | الجائزة: 5 نقاط" });

  await message.channel.send({
    embeds: [embed],
    files: [image]
  });

  const collector = message.channel.createMessageCollector({
    time: 30000
  });

  collector.on("collect", msg => {
    if (msg.author.bot) return;

    const guess = Number(msg.content.trim());

    if (!Number.isInteger(guess) || guess < 1 || guess > 20) return;

    if (guess === number) {
      collector.stop("winner");
      addPoints(msg.author.id, 5);

      message.channel.send(
        `🏆 ${msg.author} خمن الرقم الصحيح! حصل على **5 نقاط**.`
      );
    }
  });

  collector.on("end", (_, reason) => {
    if (reason !== "winner") {
      message.channel.send(`⏰ انتهى الوقت! الرقم كان: **${number}**`);
    }
  });
}

// =====================================
// ROCK PAPER SCISSORS
// =====================================

async function startRPS(message) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("rps_rock")
      .setLabel("حجر")
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId("rps_paper")
      .setLabel("ورقة")
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId("rps_scissors")
      .setLabel("مقص")
      .setStyle(ButtonStyle.Secondary)
  );

  const embed = new EmbedBuilder()
    .setColor(COLOR)
    .setTitle("✊ حجر ورقة مقص")
    .setDescription("اختر حركتك من الأزرار!");

  const game = await message.channel.send({
    embeds: [embed],
    components: [row]
  });

  const collector = game.createMessageComponentCollector({
    time: 30000
  });

  collector.on("collect", async interaction => {
    const choices = {
      rps_rock: "حجر",
      rps_paper: "ورقة",
      rps_scissors: "مقص"
    };

    const userChoice = choices[interaction.customId];
    const botChoice = randomItem(["حجر", "ورقة", "مقص"]);

    let result = "تعادل!";

    if (
      (userChoice === "حجر" && botChoice === "مقص") ||
      (userChoice === "ورقة" && botChoice === "حجر") ||
      (userChoice === "مقص" && botChoice === "ورقة")
    ) {
      result = "فزت! حصلت على 3 نقاط.";
      addPoints(interaction.user.id, 3);
    } else if (userChoice !== botChoice) {
      result = "خسرت!";
    }

    await interaction.reply({
      content:
        `اختيارك: **${userChoice}**\n` +
        `اختياري: **${botChoice}**\n` +
        `النتيجة: **${result}**`,
      ephemeral: true
    });

    collector.stop();
  });

  collector.on("end", async () => {
    try {
      await game.edit({ components: [] });
    } catch {}
  });
}

// =====================================
// XO GAME
// =====================================

async function startXO(message) {
  let board = ["⬜", "⬜", "⬜", "⬜", "⬜", "⬜", "⬜", "⬜", "⬜"];
  let ended = false;

  function checkWinner(b, symbol) {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];

    return lines.some(line => line.every(i => b[i] === symbol));
  }

  function getRows() {
    return [0, 1, 2].map(row => {
      const buttons = [0, 1, 2].map(col => {
        const index = row * 3 + col;

        return new ButtonBuilder()
          .setCustomId(`xo_${index}`)
          .setLabel(board[index] === "⬜" ? "　" : board[index])
          .setStyle(
            board[index] === "❌"
              ? ButtonStyle.Danger
              : board[index] === "⭕"
                ? ButtonStyle.Primary
                : ButtonStyle.Secondary
          )
          .setDisabled(board[index] !== "⬜" || ended);
      });

      return new ActionRowBuilder().addComponents(buttons);
    });
  }

  const embed = new EmbedBuilder()
    .setColor(COLOR)
    .setTitle("⭕ لعبة اكس او")
    .setDescription("أنت ❌ وأنا ⭕");

  const game = await message.channel.send({
    embeds: [embed],
    components: getRows()
  });

  const collector = game.createMessageComponentCollector({
    time: 60000
  });

  collector.on("collect", async interaction => {
    if (ended) {
      return interaction.reply({
        content: "اللعبة انتهت.",
        ephemeral: true
      });
    }

    const index = Number(interaction.customId.split("_")[1]);

    if (board[index] !== "⬜") {
      return interaction.reply({
        content: "هذا المكان مستخدم!",
        ephemeral: true
      });
    }

    board[index] = "❌";

    if (checkWinner(board, "❌")) {
      ended = true;
      addPoints(interaction.user.id, 5);
      collector.stop();

      await interaction.update({
        embeds: [
          EmbedBuilder.from(embed)
            .setDescription(`🏆 ${interaction.user} فاز! حصل على 5 نقاط.`)
        ],
        components: getRows()
      });
      return;
    }

    if (board.every(cell => cell !== "⬜")) {
      ended = true;
      collector.stop();

      await interaction.update({
        embeds: [
          EmbedBuilder.from(embed).setDescription("تعادل!")
        ],
        components: getRows()
      });
      return;
    }

    const available = board
      .map((cell, i) => cell === "⬜" ? i : -1)
      .filter(i => i !== -1);

    const botIndex = randomItem(available);
    board[botIndex] = "⭕";

    if (checkWinner(board, "⭕")) {
      ended = true;
      collector.stop();
    }

    if (board.every(cell => cell !== "⬜")) {
      ended = true;
      collector.stop();
    }

    const description = checkWinner(board, "⭕")
      ? "🤖 فاز البوت!"
      : ended
        ? "تعادل!"
        : "أنت ❌ وأنا ⭕";

    await interaction.update({
      embeds: [
        EmbedBuilder.from(embed).setDescription(description)
      ],
      components: getRows()
    });
  });

  collector.on("end", async () => {
    ended = true;

    try {
      await game.edit({
        components: getRows()
      });
    } catch {}
  });
}

// =====================================
// MAFIA GAME
// =====================================

async function startMafia(message) {
  const players = new Set();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("mafia_join")
      .setLabel("دخول اللعبة")
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId("mafia_start")
      .setLabel("بدء اللعبة")
      .setStyle(ButtonStyle.Primary)
  );

  const embed = new EmbedBuilder()
    .setColor(COLOR)
    .setTitle("🕵️ لعبة مافيا")
    .setDescription(
      "اضغط دخول اللعبة للمشاركة.\n" +
      "تحتاج اللعبة إلى 4 لاعبين على الأقل."
    );

  const game = await message.channel.send({
    embeds: [embed],
    components: [row]
  });

  const collector = game.createMessageComponentCollector({
    time: 120000
  });

  collector.on("collect", async interaction => {
    if (interaction.customId === "mafia_join") {
      players.add(interaction.user.id);

      return interaction.reply({
        content: `✅ تم تسجيلك! عدد اللاعبين: ${players.size}`,
        ephemeral: true
      });
    }

    if (interaction.customId === "mafia_start") {
      if (players.size < 4) {
        return interaction.reply({
          content: "تحتاج إلى 4 لاعبين على الأقل.",
          ephemeral: true
        });
      }

      collector.stop();

      const list = [...players];
      const mafia = randomItem(list);

      const remaining = list.filter(id => id !== mafia);
      const doctor = randomItem(remaining);

      for (const id of list) {
        let role = "👤 مواطن";

        if (id === mafia) role = "🔪 أنت المافيا!";
        if (id === doctor) role = "💉 أنت الطبيب!";

        try {
          const user = await client.users.fetch(id);
          await user.send(`🎭 دورك في لعبة المافيا: **${role}**`);
        } catch {}
      }

      await interaction.reply({
        content: "🎭 تم توزيع الأدوار على اللاعبين في الخاص."
      });
    }
  });

  collector.on("end", async () => {
    try {
      await game.edit({ components: [] });
    } catch {}
  });
}

// =====================================
// GAME MENU
// =====================================

async function showGames(message) {
  const embed = new EmbedBuilder()
    .setColor(COLOR)
    .setTitle("🎮 MAIN GAMES")
    .setDescription(
      Object.values(data.names)
        .map(name => `🎯 **${name}**`)
        .join("\n")
    )
    .setFooter({ text: "اكتب اسم اللعبة في الشات للبدء" });

  await message.channel.send({ embeds: [embed] });
}

// =====================================
// HELP
// =====================================

async function showHelp(message) {
  const embed = new EmbedBuilder()
    .setColor(COLOR)
    .setTitle("📚 أوامر MAIN GAMES")
    .setDescription(
      "**الألعاب:**\n" +
      "• الألعاب\n" +
      "• الأسرع\n" +
      "• فكك\n" +
      "• اكس او\n" +
      "• حجر ورقة مقص\n" +
      "• سؤال\n" +
      "• تخمين\n" +
      "• مافيا\n\n" +
      "**أوامر أخرى:**\n" +
      "• المتصدرين\n" +
      "• تغيير الألعاب"
    );

  await message.channel.send({ embeds: [embed] });
}

// =====================================
// LEADERBOARD
// =====================================

async function showLeaderboard(message) {
  const top = getTopPlayers();

  const description = top.length
    ? top.map(([id, points], index) =>
        `**${index + 1}.** <@${id}> — **${points} نقطة**`
      ).join("\n")
    : "لا توجد نقاط حتى الآن.";

  const embed = new EmbedBuilder()
    .setColor(COLOR)
    .setTitle("🏆 المتصدرين")
    .setDescription(description);

  await message.channel.send({ embeds: [embed] });
}

// =====================================
// RENAME GAMES
// =====================================

async function renameGames(message) {
  if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    return message.reply("❌ هذا الأمر للإدارة فقط.");
  }

  const options = Object.entries(data.names).map(([key, name]) => ({
    label: name,
    value: key
  }));

  const menu = new StringSelectMenuBuilder()
    .setCustomId("rename_game_select")
    .setPlaceholder("اختر اللعبة التي تريد تغيير اسمها")
    .addOptions(options);

  const row = new ActionRowBuilder().addComponents(menu);

  await message.channel.send({
    content: "⚙️ اختر اللعبة:",
    components: [row]
  });
}

// =====================================
// MESSAGE COMMANDS
// =====================================

client.on("messageCreate", async message => {
  if (message.author.bot || !message.guild) return;

  const command = message.content.trim().toLowerCase();

  try {
    if (["الألعاب", "العاب", "ألعاب", "الالعاب", "games"].includes(command)) {
      return showGames(message);
    }

    if (["مساعدة", "الاوامر", "الأوامر", "help"].includes(command)) {
      return showHelp(message);
    }

    if (["الأسرع", "الاسرع", "fast"].includes(command)) {
      return startFast(message);
    }

    if (["فكك", "تفكيك", "تفكيك كلمات"].includes(command)) {
      return startScramble(message);
    }

    if (["اكس او", "إكس أو", "xo"].includes(command)) {
      return startXO(message);
    }

    if (["حجر ورقة مقص"].includes(command)) {
      return startRPS(message);
    }

    if (["سؤال", "اسئلة", "أسئلة"].includes(command)) {
      return startQuiz(message);
    }

    if (["تخمين", "خمن الرقم", "تخمين الرقم"].includes(command)) {
      return startGuess(message);
    }

    if (["مافيا", "لعبة مافيا"].includes(command)) {
      return startMafia(message);
    }

    if (["المتصدرين", "توب", "top"].includes(command)) {
      return showLeaderboard(message);
    }

    if ([
      "تغيير الألعاب",
      "تغيير اسماء الألعاب",
      "تعديل الألعاب"
    ].includes(command)) {
      return renameGames(message);
    }
  } catch (error) {
    console.error("خطأ في الأمر:", error);

    message.channel.send(
      "❌ حدث خطأ أثناء تشغيل اللعبة. راجع سجل الاستضافة."
    ).catch(() => {});
  }
});

// =====================================
// INTERACTIONS
// =====================================

client.on("interactionCreate", async interaction => {
  if (!interaction.isStringSelectMenu()) return;

  if (interaction.customId === "rename_game_select") {
    if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({
        content: "❌ هذا الأمر للإدارة فقط.",
        ephemeral: true
      });
    }

    const key = interaction.values[0];

    const modalMessage = await interaction.reply({
      content: `لتغيير اسم اللعبة **${data.names[key]}** اكتب الاسم الجديد في الشات.`,
      ephemeral: true,
      fetchReply: true
    });

    const filter = msg =>
      msg.author.id === interaction.user.id &&
      msg.channel.id === interaction.channel.id;

    const collector = interaction.channel.createMessageCollector({
      filter,
      max: 1,
      time: 30000
    });

    collector.on("collect", async msg => {
      const newName = msg.content.trim();

      if (!newName || newName.length > 50) {
        return interaction.followUp({
          content: "❌ الاسم غير صالح.",
          ephemeral: true
        });
      }

      data.names[key] = newName;
      saveData();

      await interaction.followUp({
        content: `✅ تم تغيير اسم اللعبة إلى **${newName}**.`,
        ephemeral: true
      });
    });

    collector.on("end", collected => {
      if (!collected.size) {
        interaction.followUp({
          content: "انتهى وقت تغيير الاسم.",
          ephemeral: true
        }).catch(() => {});
      }
    });
  }
});

// =====================================
// READY
// =====================================

client.once("ready", () => {
  console.log(`✅ ${client.user.tag} is online`);
  console.log("🎮 MAIN GAMES is ready");

  client.user.setPresence({
    activities: [{ name: "MAIN GAMES 🎮" }],
    status: "online"
  });
});

client.login(TOKEN);
