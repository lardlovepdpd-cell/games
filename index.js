
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const TOKEN = process.env.TOKEN;
const COLOR = 0xffffff;
const FILE = path.join(__dirname, "main-bank-data.json");

if (!TOKEN) {
  console.error("❌ TOKEN غير موجود في متغيرات الاستضافة");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ==================================
// MAIN BANK DATABASE
// ==================================

let db = { users: {} };

if (fs.existsSync(FILE)) {
  try {
    db = JSON.parse(fs.readFileSync(FILE, "utf8"));
    if (!db.users) db.users = {};
  } catch {
    db = { users: {} };
  }
}

function save() {
  fs.writeFileSync(FILE, JSON.stringify(db, null, 2));
}

function getUser(id) {
  if (!db.users[id]) {
    db.users[id] = {
      wallet: 500,
      bank: 0,
      debt: 0,
      last: {},
      investments: [],
      properties: [],
      inventory: [],
      partner: null
    };
  }

  const u = db.users[id];

  u.wallet ??= 500;
  u.bank ??= 0;
  u.debt ??= 0;
  u.last ??= {};
  u.investments ??= [];
  u.properties ??= [];
  u.inventory ??= [];
  u.partner ??= null;

  return u;
}

function money(n) {
  return `${Math.floor(n).toLocaleString("en-US")} ريال`;
}

function embed(title, description) {
  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(`MAIN | ${title}`)
    .setDescription(description)
    .setFooter({ text: "MAIN BANK • النظام الاقتصادي" })
    .setTimestamp();
}

function cooldown(user, key, duration) {
  const remaining = duration - (Date.now() - (user.last[key] || 0));

  if (remaining > 0) {
    const minutes = Math.ceil(remaining / 60000);
    return `⏳ انتظر **${minutes} دقيقة** قبل استخدام الأمر مرة أخرى.`;
  }

  return null;
}

function setCooldown(user, key) {
  user.last[key] = Date.now();
}

function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getAmount(text) {
  const match = text.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function getMention(message) {
  return message.mentions.users.first();
}

function reply(message, title, description) {
  return message.reply({
    embeds: [embed(title, description)]
  });
}

// ==================================
// MARKET
// ==================================

const shop = {
  "هاتف": 800,
  "سيارة": 5000,
  "ساعة": 1200,
  "كمبيوتر": 2500,
  "دراجة": 700
};

const properties = {
  "شقة": 10000,
  "فيلا": 50000,
  "مزرعة": 25000,
  "قصر": 100000
};

// ==================================
// INVESTMENTS
// ==================================

function settleInvestments(user) {
  let earned = 0;

  user.investments = user.investments.filter(inv => {
    if (Date.now() >= inv.endsAt) {
      const profit = Math.floor(inv.amount * 0.05);
      earned += inv.amount + profit;
      return false;
    }

    return true;
  });

  if (earned > 0) {
    user.wallet += earned;
  }

  return earned;
}

// ==================================
// COMMANDS
// ==================================

client.on("messageCreate", async message => {
  if (message.author.bot || !message.guild) return;

  const text = message.content.trim();
  const command = text.split(/\s+/)[0];
  const args = text.slice(command.length).trim();
  const user = getUser(message.author.id);

  const settled = settleInvestments(user);

  if (settled > 0) {
    message.channel.send({
      embeds: [
        embed("انتهاء الاستثمار", `🎉 عاد استثمارك مع الأرباح!\nاستلمت **${money(settled)}**`)
      ]
    }).catch(() => {});
  }

  save();

  try {

    // HELP

    if (["اوامر", "الأوامر", "مساعدة", "مساعده"].includes(command)) {
      return reply(message, "الأوامر", `
**💰 البنك**
\`راتب\` • \`بخشيش\` • \`حظ\` • \`فلوس\`

**📈 الاستثمار**
\`استثمار مبلغ\` • \`تداول\` • \`عقار\`

**🎲 الألعاب المجانية**
\`قمار\` • \`نرد\` • \`رهان\` • \`فواكه\` • \`لعبه\` • \`وقت\`

**🕵️ الحرامية**
\`نهب\` • \`حراميه\`

**🏦 المعاملات**
\`قرض\` • \`سداد مبلغ\` • \`تبرع @عضو مبلغ\` • \`تحويل @عضو مبلغ\` • \`توب\`

**🤝 الشراكة**
\`زواجي\` • \`زواجات\` • \`زواج @عضو\` • \`طلاق\` • \`خلع\`

**🛒 المتجر**
\`متجر\` • \`سوق\` • \`شراء\`
      `);
    }

    // BALANCE

    if (["فلوس", "رصيدي", "حسابي"].includes(command)) {
      return reply(message, "حسابك البنكي", `
👤 العضو: ${message.author}

💵 المحفظة: **${money(user.wallet)}**
🏦 البنك: **${money(user.bank)}**
📉 القرض: **${money(user.debt)}**
🏠 العقارات: **${user.properties.length}**
📦 المشتريات: **${user.inventory.length}**
      `);
    }

    // SALARY

    if (command === "راتب") {
      const wait = cooldown(user, "salary", 86400000);
      if (wait) return reply(message, "الراتب", wait);

      user.wallet += 500;
      setCooldown(user, "salary");
      save();

      return reply(message, "راتبك وصل 💰", `
استلمت راتبك اليومي!

**500 ريال**
رصيدك: **${money(user.wallet)}**
      `);
    }

    // TIP

    if (command === "بخشيش") {
      const wait = cooldown(user, "tip", 3600000);
      if (wait) return reply(message, "بخشيش", wait);

      const amount = random(20, 80);
      user.wallet += amount;
      setCooldown(user, "tip");
      save();

      return reply(message, "بخشيش 🎁", `حصلت على **${money(amount)}** بخشيش!`);
    }

    // LUCK

    if (command === "حظ") {
      const wait = cooldown(user, "luck", 21600000);
      if (wait) return reply(message, "الحظ", wait);

      const amount = random(10, 100);
      user.wallet += amount;
      setCooldown(user, "luck");
      save();

      return reply(message, "🍀 حظك اليوم", `ربحت **${money(amount)}** مجانًا!`);
    }

    // INVESTMENT

    if (command === "استثمار") {
      const amount = getAmount(args);

      if (!amount) {
        return reply(message, "الاستثمار", "اكتب المبلغ هكذا:\n`استثمار 1000`");
      }

      if (amount < 100) {
        return reply(message, "الاستثمار", "أقل مبلغ للاستثمار هو 100 ريال.");
      }

      if (amount > user.wallet) {
        return reply(message, "الاستثمار", "رصيدك غير كافٍ.");
      }

      user.wallet -= amount;

      user.investments.push({
        amount,
        endsAt: Date.now() + 3600000
      });

      save();

      return reply(message, "📈 تم الاستثمار", `
استثمرت **${money(amount)}**.

مدة الاستثمار: ساعة واحدة.
العائد الافتراضي: 5%.
      `);
    }

    // TRADING

    if (command === "تداول") {
      return reply(message, "📊 سوق التداول", `
🪙 الذهب: 2,500 ريال
💎 الألماس: 5,000 ريال
🛢️ النفط: 1,200 ريال

أسعار افتراضية داخل البوت.
      `);
    }

    // PROPERTY

    if (command === "عقار") {
      const list = Object.entries(properties)
        .map(([name, price]) => `🏠 **${name}** — ${money(price)}`)
        .join("\n");

      return reply(message, "🏠 العقارات", `
${list}

للشراء:
\`شراء عقار شقة\`
      `);
    }

    // LOAN

    if (command === "قرض") {
      if (user.debt > 0) {
        return reply(message, "القرض", `عندك قرض قائم بقيمة **${money(user.debt)}**. سدده أولًا.`);
      }

      user.wallet += 1000;
      user.debt = 1000;
      save();

      return reply(message, "🏦 تم منحك قرضًا", `
تم إضافة **1,000 ريال** إلى محفظتك.
الدين المستحق: **1,000 ريال**.
      `);
    }

    // REPAY

    if (command === "سداد") {
      const amount = getAmount(args);

      if (!amount) {
        return reply(message, "سداد القرض", "اكتب المبلغ:\n`سداد 500`");
      }

      if (amount > user.debt) {
        return reply(message, "سداد القرض", `دينك فقط ${money(user.debt)}.`);
      }

      if (amount > user.wallet) {
        return reply(message, "سداد القرض", "رصيدك غير كافٍ.");
      }

      user.wallet -= amount;
      user.debt -= amount;
      save();

      return reply(message, "✅ تم السداد", `
سددت: **${money(amount)}**
المتبقي من القرض: **${money(user.debt)}**
      `);
    }

    // TRANSFER

    if (command === "تحويل") {
      const target = getMention(message);
      const amount = getAmount(args);

      if (!target || target.bot || target.id === message.author.id) {
        return reply(message, "التحويل", "حدد عضوًا صحيحًا:\n`تحويل @عضو 100`");
      }

      if (amount <= 0 || amount > user.wallet) {
        return reply(message, "التحويل", "المبلغ غير صحيح أو رصيدك غير كافٍ.");
      }

      const receiver = getUser(target.id);

      user.wallet -= amount;
      receiver.wallet += amount;
      save();

      return reply(message, "💸 تم التحويل", `
من: ${message.author}
إلى: ${target}
المبلغ: **${money(amount)}**
      `);
    }

    // DONATION

    if (command === "تبرع") {
      const target = getMention(message);
      const amount = getAmount(args);

      if (!target || target.bot || target.id === message.author.id) {
        return reply(message, "التبرع", "حدد عضوًا صحيحًا:\n`تبرع @عضو 100`");
      }

      if (amount <= 0 || amount > user.wallet) {
        return reply(message, "التبرع", "المبلغ غير صحيح أو رصيدك غير كافٍ.");
      }

      const receiver = getUser(target.id);

      user.wallet -= amount;
      receiver.wallet += amount;
      save();

      return reply(message, "🎁 تبرع", `
تبرع ${message.author} إلى ${target}
بمبلغ **${money(amount)}**.
      `);
    }

    // TOP

    if (["توب", "المتصدرين", "top"].includes(command)) {
      const top = Object.entries(db.users)
        .sort((a, b) => (b[1].wallet + b[1].bank) - (a[1].wallet + a[1].bank))
        .slice(0, 10);

      const lines = await Promise.all(top.map(async ([id, data], i) => {
        let name = `<@${id}>`;

        try {
          const member = await client.users.fetch(id);
          name = member.username;
        } catch {}

        return `**${i + 1}.** ${name} — ${money(data.wallet + data.bank)}`;
      }));

      return reply(message, "🏆 أغنى الأعضاء", lines.join("\n") || "لا يوجد أعضاء في القائمة.");
    }

    // ROB

    if (command === "نهب") {
      const wait = cooldown(user, "rob", 7200000);
      if (wait) return reply(message, "النهب", wait);

      const amount = random(20, 150);
      user.wallet += amount;
      setCooldown(user, "rob");
      save();

      return reply(message, "🕵️ محاولة نهب", `
وجدت مبلغًا في مكان مهجور!
حصلت على **${money(amount)}**.
      `);
    }

    if (command === "حراميه") {
      const wait = cooldown(user, "rob", 7200000);

      return reply(message, "🕵️ سجل الحرامي", wait
        ? `المحاولة القادمة:\n${wait}`
        : "تقدر تستخدم أمر نهب الآن.");
    }

    // FREE DICE

    if (command === "نرد") {
      const dice = random(1, 6);

      return reply(message, "🎲 النرد", `
رميت النرد وكانت النتيجة:

# ${dice}

هذه لعبة مجانية بدون مراهنات.
      `);
    }

    // FREE LUCK GAME

    if (["قمار", "رهان"].includes(command)) {
      const outcomes = [
        "طلعت لك نجمة ⭐",
        "حصلت على نتيجة ممتازة 🏆",
        "حاول مرة ثانية 😄",
        "حصلت على نتيجة عادية 🎯"
      ];

      return reply(message, "🎮 لعبة الحظ", `
${outcomes[random(0, outcomes.length - 1)]}

اللعبة مجانية ولا تخصم أي ريال من رصيدك.
      `);
    }

    // FRUITS

    if (command === "فواكه") {
      const fruits = ["🍎", "🍊", "🍇", "🍉", "🍓", "🍒"];

      return reply(message, "🍉 الفواكه", `
${random(0, 1) ? fruits.join(" ") : [...fruits].reverse().join(" ")}

استمتع بلعبة الفواكه المجانية!
      `);
    }

    // GAME

    if (command === "لعبه") {
      const number = random(1, 10);

      return reply(message, "🎯 تحدي الرقم", `
اختر رقمًا من 1 إلى 10 في بالك.
رقم التحدي اليوم هو: **${number}**

جرب حظك في المرة القادمة!
      `);
    }

    // TIME

    if (command === "وقت") {
      return reply(message, "⏰ الوقت", `
الوقت الحالي:
<t:${Math.floor(Date.now() / 1000)}:F>
      `);
    }

    // SHOP

    if (command === "متجر") {
      const list = Object.entries(shop)
        .map(([name, price]) => `📦 **${name}** — ${money(price)}`)
        .join("\n");

      return reply(message, "🛒 المتجر", `
${list}

للشراء:
\`شراء هاتف\`
      `);
    }

    // MARKET

    if (command === "سوق") {
      return reply(message, "🏪 السوق", `
**السوق العقاري**
${Object.entries(properties).map(([name, price]) =>
  `🏠 ${name}: ${money(price)}`
).join("\n")}

**سوق المقتنيات**
${Object.entries(shop).map(([name, price]) =>
  `📦 ${name}: ${money(price)}`
).join("\n")}
      `);
    }

    // BUY

    if (command === "شراء") {
      const parts = args.split(/\s+/);
      const isProperty = parts[0] === "عقار";
      const name = isProperty ? parts.slice(1).join(" ") : parts.join(" ");

      const catalog = isProperty ? properties : shop;
      const price = catalog[name];

      if (!price) {
        return reply(message, "الشراء", "هذا الغرض غير موجود. اكتب `متجر` أو `عقار` لعرض القائمة.");
      }

      if (user.wallet < price) {
        return reply(message, "الشراء", "رصيدك غير كافٍ.");
      }

      user.wallet -= price;

      if (isProperty) {
        user.properties.push(name);
      } else {
        user.inventory.push(name);
      }

      save();

      return reply(message, "✅ تمت عملية الشراء", `
اشتريت: **${name}**
السعر: **${money(price)}**
رصيدك المتبقي: **${money(user.wallet)}**
      `);
    }

    // PARTNERSHIP

    if (command === "زواجي") {
      if (!user.partner) {
        return reply(message, "🤝 شراكتك", "ليس لديك شريك حاليًا.");
      }

      return reply(message, "🤝 شراكتك", `شريكك الحالي: <@${user.partner}>`);
    }

    if (command === "زواجات") {
      const couples = Object.entries(db.users)
        .filter(([id, u]) => u.partner && id < u.partner)
        .map(([id, u]) => `🤝 <@${id}> و <@${u.partner}>`);

      return reply(message, "🤝 الشراكات", couples.join("\n") || "لا توجد شراكات حاليًا.");
    }

    if (command === "زواج") {
      const target = getMention(message);

      if (!target || target.bot || target.id === message.author.id) {
        return reply(message, "🤝 الشراكة", "حدد عضوًا صحيحًا:\n`زواج @عضو`");
      }

      const other = getUser(target.id);

      if (user.partner || other.partner) {
        return reply(message, "🤝 الشراكة", "أحد الطرفين لديه شراكة بالفعل.");
      }

      user.partner = target.id;
      other.partner = message.author.id;
      save();

      return reply(message, "🤝 تمت الشراكة", `
تم تسجيل شراكة فريق بين:
${message.author} و ${target}
      `);
    }

    if (["طلاق", "خلع"].includes(command)) {
      if (!user.partner) {
        return reply(message, "إنهاء الشراكة", "ليس لديك شريك حاليًا.");
      }

      const partner = getUser(user.partner);
      partner.partner = null;
      user.partner = null;
      save();

      return reply(message, "إنهاء الشراكة", "تم إنهاء الشراكة بنجاح.");
    }

  } catch (error) {
    console.error("COMMAND ERROR:", error);

    message.reply("❌ حدث خطأ أثناء تنفيذ الأمر.").catch(() => {});
  }
});

// ==================================
// READY
// ==================================

client.once("ready", () => {
  console.log(`✅ MAIN BANK ONLINE: ${client.user.tag}`);

  client.user.setPresence({
    activities: [{ name: "MAIN BANK | ريال" }],
    status: "online"
  });
});

client.login(TOKEN);
