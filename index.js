
const { Client, GatewayIntentBits, AttachmentBuilder } = require("discord.js");
const { createCanvas } = require("@napi-rs/canvas");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.on("ready", () => {
  console.log(`MAIN GAMES ONLINE: ${client.user.tag}`);
});

client.on("messageCreate", async message => {
  if (message.author.bot) return;
  if (message.content.trim() !== "اختبار صورة") return;

  try {
    const canvas = createCanvas(900, 450);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#222222";
    ctx.fillRect(0, 0, 900, 450);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 65px Arial";
    ctx.textAlign = "center";
    ctx.fillText("MAIN GAMES", 450, 220);

    ctx.font = "35px Arial";
    ctx.fillText("IMAGE TEST", 450, 300);

    const buffer = canvas.toBuffer("image/png");

    const attachment = new AttachmentBuilder(buffer, {
      name: "main-games.png"
    });

    await message.channel.send({
      content: "هذه صورة اختبار MAIN GAMES",
      files: [attachment]
    });

    console.log("تم إرسال الصورة بنجاح");

  } catch (error) {
    console.error("IMAGE ERROR:", error);
    message.reply("حدث خطأ أثناء إنشاء الصورة.");
  }
});

client.login(process.env.TOKEN);
