const { 
    Client, 
    GatewayIntentBits, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    EmbedBuilder, 
    AttachmentBuilder,
    PermissionsBitField 
} = require('discord.js');
const { createCanvas } = require('canvas');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const userScores = new Map();

// قائمة الكلمات الافتراضية
let gameWords = ["برمجة", "ديسكورد", "سعودية", "تكنولوجيا", "حاسوب", "سيرفر", "ألعاب", "تحدي", "سرعة", "ذكاء", "قهوة", "مستقبل"];
const CAPITALS = {
    "السعودية": "الرياض",
    "مصر": "القاهرة",
    "الإمارات": "أبوظبي",
    "اليابان": "طوكيو",
    "فرنسا": "باريس",
    "الكويت": "الكويت",
    "ألمانيا": "برلين"
};

function addScore(userId, points = 1) {
    const current = userScores.get(userId) || 0;
    userScores.set(userId, current + points);
}

// دالة عامة لتوليد صور الألعاب بـ Canvas (لكل الألعاب)
function generateGameImage(titleText, mainText) {
    const canvas = createCanvas(500, 200);
    const ctx = canvas.getContext('2d');

    // خلفية متدرجة ملونة حديثة
    ctx.fillStyle = `rgb(${Math.floor(Math.random() * 50 + 20)}, ${Math.floor(Math.random() * 50 + 20)}, ${Math.floor(Math.random() * 80 + 80)})`;
    ctx.fillRect(0, 0, 500, 200);

    // خطوط تشويش عشوائية للخلفية
    for (let i = 0; i < 6; i++) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(Math.random() * 500, Math.random() * 200);
        ctx.lineTo(Math.random() * 500, Math.random() * 200);
        ctx.stroke();
    }

    // عنوان اللعبة الصغير داخل الصورة
    ctx.fillStyle = '#AAAAAA';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(titleText, 250, 40);

    // النص الأساسي (الكلمة أو السؤال أو المسألة)
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 40px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(mainText, 250, 120);

    return canvas.toBuffer();
}

client.once('ready', () => {
    console.log(`✅ تم تشغيل البوت بنجاح باسم: ${client.user.tag}`);
    client.user.setActivity('ألعاب | للبدء اكتب: ألعاب 🎮');
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const content = message.content.trim();

    // أمر عرض قائمة الألعاب (بدون بادئة: "ألعاب" أو "العاب")
    if (content === 'ألعاب' || content === 'العاب') {
        const embed = new EmbedBuilder()
            .setTitle('🎮 قائمة الألعاب التفاعلية الحديثة')
            .setDescription('اختر اللعبة التي تريدها من الأزرار بالأسفل لتحدي أصدقائك!\n\n*ملاحظة: تعديل أسماء/كلمات الألعاب مخصص لصاحب السيرفر فقط عبر كتابة: `تعديل الكلمات`*')
            .setColor(0x5865F2)
            .setFooter({ text: 'الأسرع في الكتابة هو الفائز! 🔥' });

        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('game_fast').setLabel('📸 أسرع واحد').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('game_unscramble').setLabel('🧩 فكك الكلمة').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('game_scramble').setLabel('🔤 ترتيب الحروف').setStyle(ButtonStyle.Secondary)
        );

        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('game_capitals').setLabel('🌍 عواصم الدول').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('game_math').setLabel('🔢 الحساب السريع').setStyle(ButtonStyle.Danger)
        );

        await message.reply({ embeds: [embed], components: [row1, row2] });
    }

    // أمر تعديل الكلمات (بدون بادئة، مخصص لصاحب السيرفر فقط)
    if (content.startsWith('تعديل الكلمات')) {
        if (message.author.id !== message.guild.ownerId && !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply('❌ عذراً، هذا الأمر مخصص **لصاحب السيرفر (Owner)** فقط!');
        }

        const args = content.replace('تعديل الكلمات', '').trim();
        if (!args) {
            return message.reply('⚠️ طريقة الاستخدام الصحيحة:\n`تعديل الكلمات تفاح, موز, برمجة, ديسكورد`');
        }

        const newWords = args.split(',').map(w => w.trim()).filter(w => w.length > 0);
        if (newWords.length === 0) {
            return message.reply('❌ يرجى إدخال كلمات صحيحة مفصولة بفاصلة (,).');
        }

        gameWords = newWords;
        await message.reply(`✅ تم تحديث قائمة الكلمات بنجاح وأصبحت تحتوي على **${gameWords.length}** كلمة جديدة!`);
    }

    // أمر عرض الصدارة (بدون بادئة: "الصدارة" أو "ترتيب")
    if (content === 'الصدارة' || content === 'ترتيب') {
        if (userScores.size === 0) {
            return message.reply('لا يوجد نقاط مسجلة حتى الآن! ابدأ اللعب عبر كتابة كلمة **ألعاب**');
        }

        const sorted = [...userScores.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
        let description = '';
        
        sorted.forEach(([userId, score], index) => {
            description += `**#${index + 1}** | <@${userId}> - **${score}** نقطة 🏆\n`;
        });

        const embed = new EmbedBuilder()
            .setTitle('🏆 لائحة صدارة المتصدرين')
            .setDescription(description)
            .setColor(0xFFD700);

        await message.reply({ embeds: [embed] });
    }
});

// التعامل مع الألعاب عبر الأزرار
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;
    const channel = interaction.channel;

    // 1. لعبة أسرع واحد (صورة)
    if (interaction.customId === 'game_fast') {
        await interaction.deferReply();
        const targetWord = gameWords[Math.floor(Math.random() * gameWords.length)];
        const buffer = generateGameImage("⚡ أسرع واحد واكتب الكلمة", targetWord);
        const attachment = new AttachmentBuilder(buffer, { name: 'game.png' });

        const embed = new EmbedBuilder()
            .setTitle('⚡ لعبة أسرع واحد!')
            .setDescription('اكتب الكلمة الموجودة في الصورة بالأسفل بأسرع وقت!')
            .setImage('attachment://game.png')
            .setColor(0xFFD700);

        await interaction.editReply({ embeds: [embed], files: [attachment] });

        const filter = m => m.channel.id === channel.id && m.content.trim() === targetWord;
        try {
            const collected = await channel.awaitMessages({ filter, max: 1, time: 15000, errors: ['time'] });
            const winner = collected.first();
            addScore(winner.author.id);
            await channel.send(`🎉 كفو! ${winner.author} هو الأسرع وكتب الكلمة صح! (+1 نقطة)`);
        } catch (e) {
            await channel.send(`⏰ انتهى الوقت! الكلمة كانت: **{targetWord}**`);
        }
    }

    // 2. لعبة فكك الكلمة (مع صورة)
    else if (interaction.customId === 'game_unscramble') {
        await interaction.deferReply();
        const word = gameWords[Math.floor(Math.random() * gameWords.length)];
        const spacedWord = word.split('').join('  ');
        const buffer = generateGameImage("🧩 فكك الكلمة واكتبها متصلة", spacedWord);
        const attachment = new AttachmentBuilder(buffer, { name: 'game.png' });

        const embed = new EmbedBuilder()
            .setTitle('🧩 لعبة فكك الكلمة')
            .setDescription('اكتب الكلمة المتفرقة الموجودة في الصورة بالشكل الصحيح:')
            .setImage('attachment://game.png')
            .setColor(0x57F287);

        await interaction.editReply({ embeds: [embed], files: [attachment] });

        const filter = m => m.channel.id === channel.id && m.content.trim() === word;
        try {
            const collected = await channel.awaitMessages({ filter, max: 1, time: 15000, errors: ['time'] });
            const winner = collected.first();
            addScore(winner.author.id);
            await channel.send(`✅ ممتااااز ${winner.author}! إجابة صحيحة. (+1 نقطة)`);
        } catch (e) {
            await channel.send(`⏰ انتهى الوقت! الكلمة هي: **{word}**`);
        }
    }

    // 3. لعبة ترتيب الحروف المبعثرة (مع صورة)
    else if (interaction.customId === 'game_scramble') {
        await interaction.deferReply();
        const word = gameWords[Math.floor(Math.random() * gameWords.length)];
        const shuffled = word.split('').sort(() => Math.random() - 0.5).join(' - ');
        const buffer = generateGameImage("🔤 رتب الحروف التالية", shuffled);
        const attachment = new AttachmentBuilder(buffer, { name: 'game.png' });

        const embed = new EmbedBuilder()
            .setTitle('🔤 لعبة ترتيب الحروف')
            .setDescription('الحروف في الصورة مبعثرة، قم بترتيبها واكتب الكلمة الصحيحة:')
            .setImage('attachment://game.png')
            .setColor(0xFEE75C);

        await interaction.editReply({ embeds: [embed], files: [attachment] });

        const filter = m => m.channel.id === channel.id && m.content.trim() === word;
        try {
            const collected = await channel.awaitMessages({ filter, max: 1, time: 20000, errors: ['time'] });
            const winner = collected.first();
            addScore(winner.author.id);
            await channel.send(`🏆 بطل يا ${winner.author}! رتبت الحروف بشكل صحيح وكتبت: **{word}** (+1 نقطة)`);
        } catch (e) {
            await channel.send(`⏰ انتهى الوقت! الكلمة الصحيحة كانت: **{word}**`);
        }
    }

    // 4. لعبة العواصم (مع صورة)
    else if (interaction.customId === 'game_capitals') {
        await interaction.deferReply();
        const keys = Object.keys(CAPITALS);
        const country = keys[Math.floor(Math.random() * keys.length)];
        const capital = CAPITALS[country];
        const buffer = generateGameImage("🌍 ما هي عاصمة الدولة؟", country);
        const attachment = new AttachmentBuilder(buffer, { name: 'game.png' });

        const embed = new EmbedBuilder()
            .setTitle('🌍 لعبة العواصم')
            .setDescription('انظر إلى الدولة المكتوبة في الصورة واكتب عاصمتها:')
            .setImage('attachment://game.png')
            .setColor(0x3498DB);

        await interaction.editReply({ embeds: [embed], files: [attachment] });

        const filter = m => m.channel.id === channel.id && m.content.trim() === capital;
        try {
            const collected = await channel.awaitMessages({ filter, max: 1, time: 15000, errors: ['time'] });
            const winner = collected.first();
            addScore(winner.author.id);
            await channel.send(`🌟 بطل ${winner.author}! عاصمة {country} هي فعلاً **{capital}**. (+1 نقطة)`);
        } catch (e) {
            await channel.send(`⏰ انتهى الوقت! عاصمة {country} هي **{capital}**.`);
        }
    }

    // 5. لعبة الحساب السريع (مع صورة)
    else if (interaction.customId === 'game_math') {
        await interaction.deferReply();
        const num1 = Math.floor(Math.random() * 45) + 5;
        const num2 = Math.floor(Math.random() * 45) + 5;
        const answer = num1 + num2;
        const buffer = generateGameImage("🔢 احسب الناتج بأسرع ما يمكن", `${num1} + ${num2} = ?`);
        const attachment = new AttachmentBuilder(buffer, { name: 'game.png' });

        const embed = new EmbedBuilder()
            .setTitle('🔢 لعبة الحساب السريع')
            .setDescription('احسب الناتج الرياضي الموجود في الصورة وأرسله في الشات:')
            .setImage('attachment://game.png')
            .setColor(0xED4245);

        await interaction.editReply({ embeds: [embed], files: [attachment] });

        const filter = m => m.channel.id === channel.id && m.content.trim() === answer.toString();
        try {
            const collected = await channel.awaitMessages({ filter, max: 1, time: 15000, errors: ['time'] });
            const winner = collected.first();
            addScore(winner.author.id);
            await channel.send(`🎯 ذكي جداً ${winner.author}! الإجابة **{answer}** صحيحة. (+1 نقطة)`);
        } catch (e) {
            await channel.send(`⏰ انتهى الوقت! الإجابة الصحيحة كانت **{answer}**.`);
        }
    }
});

client.login('YOUR_BOT_TOKEN_HERE');
