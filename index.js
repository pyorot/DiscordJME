const extend = require('util')._extend;
const Discord = require('discord.js');          // Discord Node.js API
const https = require('https');                 // HTTP requests
const RD = require('./RD.js');                  // Parsers and calculators for some functions
const jme = require('./jme.json');              // JME quote sheet
const key = require('./key.json').bot;          // Bot token for Discord
const faqurl = require('./key.json').faq;       // URL of online editable FAQ JSON

const bot = new Discord.Client();
bot.login(key);
bot.on('ready', () => {
        faq = {}; faqupdate()
        console.log('Bot is ready.');
        });

// Channel IDs
pysgeneral =  '293028598024110080'
pys1 =        '293838131407486980'
pysstatus =   '298589684492140546'
pglgeneral =  '260119001018007552'
pglofftopic = '349689326361247744'
pglbot =      '341937230337802243'
pgldev =      '276041020402040833'

// Connection error handling
bot.on("error", (e) => console.error(e));
bot.on("disconnect", (e) => console.log(e));

// User message handling
bot.on('message', (msg) => {
        // Sends single untagged reply (use msg.reply for single tagged reply)
        function ureply(reply) {bot.channels.get(msg.channel.id).send(reply).catch(console.error)}

        // Input is !help or ?help
        if (msg.content == "!help" || msg.content == "?help") {
                ureply(help);
        }

        // Input @ bot (JME function)
		if (msg.isMentioned(bot.user)) {
                switch(msg.channel.id) {
                        case pglgeneral: case pglofftopic: case pglbot: case pysgeneral:
                                post(JME(), msg.channel.id);
                                break;
                        case pgldev: case pys1:
                                msg.reply('Salve magistra.').catch(console.error);
                                break;
                }
		};

        // Input from particular user (meme)
        if (msg.channel.id == pglgeneral && msg.author.id == "177806056989261824" && msg.content.substring(0,7) == "anyways") {
                ureply("https://cdn.discordapp.com/attachments/260119001018007552/301774028220399617/image.jpg")
        };

        // Input starts with !breakpoints
        if (msg.content == "!breakpoints" || msg.content == "!breakpoints help" ) {
                ureply(breakpoint_help);
        } else if (msg.channel.id != pglgeneral && msg.content.slice(0,13) == "!breakpoints ") {
                ureply(breakpoints(msg.content.slice(13)));
        };

        // Input starts with !raidiv
        if (msg.content == "!raidiv" || msg.content == "!raidiv help" ) {
                ureply(raidiv_help);
        } else if (msg.channel.id != pglgeneral && msg.content.slice(0,8) == "!raidiv ") {
                ureply(raidiv(msg.content.slice(8)));
        };

        // Input is 4-digit number (exposes !raidiv shortcut)
        if (msg.channel.id != pglgeneral && msg.content.length == 4 && Number.isInteger(cp = parseInt(msg.content))) {
                output = "";
                if (cp >= 2184 && cp <= 2275) {output = RD.raidiv("Mewtwo",cp)} else
                if (cp >= 2011 && cp <= 2097) {output = RD.raidiv("Tyranitar",cp)} else
                if (msg.createdAt.getMonth() == 8 && cp >= 1847 && cp <= 1930) {output = RD.raidiv("Entei",cp)} else
                if (msg.createdAt.getMonth() >= 9 && cp >= 1831 && cp <= 1913) {output = RD.raidiv("Raikou",cp)} else
                if (msg.createdAt.getMonth() >= 9 && cp >= 1538 && cp <= 1613) {output = RD.raidiv("Suicune",cp)};
                if (!!output) {ureply(output)};
        };

        // Input starts with ~ (FAQ function)
        if (msg.content == "~") {
                faqupdate()
        } else if (msg.content == "~help") {
                output = "List of FAQ commands:\n";
                for (var key in faq) {
                        if (faq.hasOwnProperty(key)) {output += key + ", "};
                }
                ureply(output)
        } else if (msg.content[0] == "~") {
                input = msg.content.slice(1)
                input.trim()
                if (!!faq[input]) {ureply(faq[input])}
                else {ureply("Unrecognised command; type ~help for a list of FAQ commands.")}
        }
});

// Sand halp
help =
          "For personal Pyobot notifications, see <http://pyobot.ga>.\n"
        + "For a list of FAQ commands, see #welcome-rules on the London Discord.\n"
        + "For help with RaidBot, type `$help`.\n"
        + "**!breakpoints** – Calculates attack breakpoints against raid bosses.\n"
        + "**!raidiv** – Lists the possible IVs of a raid boss encounter given the CP.";
breakpoint_help =
          "Syntax: !breakpoints [ATK IV] [Attacker] > [Move] > [Raid Boss]\n"
        + "E.g. !breakpoints 14 Scizor > Fury Cutter > Celebi\n"
        + "Breakpoints below level 10 are omitted."
raidiv_help =
          "Syntax: !raidiv [Pokemon] [CP]\n"
        + "E.g. !raidiv Entei 1922\n"
        + "For active legendaries and Tyranitar, you can type just the number as a shortcut – e.g. `2050`."

// Sends multiple single posts
function post(listo, channelid) {
    var list = JSON.parse(JSON.stringify(listo));
    if (list.length != 0) {
        bot.channels.get(channelid).send(list.shift()).catch(console.error);
        setTimeout(function(){post(list, channelid)}, 1200);
    }
}

// Exposes JME function
seed = 0; random_index = 0
function JME() {
        if (seed == 11 || seed == 21) {random_index++}
        while (random_index == seed) {
                random_index = Math.floor(Math.random()*jme.length);
                if (random_index == 12 || random_index == 22) {random_index++};
        }
        output = jme[random_index];
        seed = random_index;
        return output;
}

// Exposes !breakpoints function
function breakpoints(input) {
        parsed = RD.breakpoints_parser(input);
        if (typeof parsed == 'string') {output = parsed} else {output = RD.breakpoints(...parsed)};
        return output;
}

// Exposes !raidiv function
function raidiv(input) {
        parsed = RD.raidiv_parser(input);
        if (typeof parsed == 'string') {output = parsed} else {output = RD.raidiv(...parsed)};
        return output;
}

// Syncs FAQ with JSON on JSONBlob (request maker)
function faqupdate() {https.get(faqurl, faqcallback)}

// Syncs FAQ with JSON on JSONBlob (response handler)
function faqcallback(res) {
        // if the request succeeds, do this:
        function success(output) {
                faq = output
                status_message = "FAQ updated. Commands:\n"
                for (var key in faq) {
                        if (faq.hasOwnProperty(key)) {status_message += key + ", "};
                }
                bot.channels.get(pysstatus).send(status_message).catch(console.error)
        }

        // HTTP request boilerplate
        const {statusCode} = res;
        let error;
        if (statusCode !== 200) {
                error = new Error('Request Failed.\n' + `Status Code: ${statusCode}`);
                console.error(error.message);
                res.resume(); // must free memory manually here
                return;
        }
        res.setEncoding('utf8');
        let rawData = '';
        res.on('data', (chunk) => {rawData += chunk;});
        res.on('end', () => {
                try {
                        const parsedData = JSON.parse(rawData);
                        success(parsedData);
                } catch (e) {
                        console.error(e.message);
                }
        });
}