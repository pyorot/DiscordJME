const extend = require('util')._extend;
const Discord = require('discord.js');
const RD = require('./RD.js');
const jme = require('./jme.json');
const key = require('./key.json')[0];

const bot = new Discord.Client();
bot.login(key);

pysgeneral =  '293028598024110080'
pys1 =        '293838131407486980'
pglgeneral =  '260119001018007552'
pglofftopic = '349689326361247744'
pgldev =      '276041020402040833'

function post(listo, channelid) {
    var list = JSON.parse(JSON.stringify(listo));
    if (list.length != 0) {
        bot.channels.get(channelid).sendMessage(list.shift());
        setTimeout(function(){post(list, channelid)}, 1200);
    }
}

bot.on('ready', () => {console.log('Bot is ready.');});
bot.on("error", (e) => console.error(e));
bot.on("disconnect", (e) => console.log(e));

bot.on('message', (msg) => {
    if (msg.isMentioned(bot.user)) {
        if (msg.channel.id == pglgeneral || msg.channel.id == pysgeneral || msg.channel.id == pglofftopic) {
			post(JME(),msg.channel.id);
        } else if (msg.channel.id == pgldev || msg.channel.id == pys1) {
            msg.reply('Word to the rasclarts.');
        }
    };
	
	if (msg.channel.id == pglgeneral && msg.author.id == "177806056989261824" && msg.content.substring(0,7) == "anyways") {
		post(["https://cdn.discordapp.com/attachments/260119001018007552/301774028220399617/image.jpg"], msg.channel.id)
	};
	
	if (msg.content == "!help") {
		post(help(),msg.channel.id);
	}
	
	if (msg.content == "!breakpoints" || msg.content == "!breakpoints help" ) {
		post(["Syntax: !breakpoints [ATK IV] [Attacker] > [Move] > [Raid Boss]","E.g. !breakpoints 14 Scizor > Fury Cutter > Celebi","Breakpoints below level 10 are omitted"],msg.channel.id);
	} else if (msg.content.slice(0,13) == "!breakpoints ") {
		bot.channels.get(msg.channel.id).sendMessage(breakpoints(msg.content.slice(13)));
	};
	
	if (msg.content == "!raidiv" || msg.content == "!raidiv help" ) {
		post(["Syntax: !raidiv [Pokemon] [CP]","E.g. !raidiv Entei 1922","For active legendaries and Tyranitar, you can type just the number as a shortcut -- e.g. `2050`"],msg.channel.id);
	} else if (msg.content.slice(0,8) == "!raidiv ") {
		bot.channels.get(msg.channel.id).sendMessage(raidiv(msg.content.slice(8)));
	};
	
	if (msg.content.length == 4 && Number.isInteger(cp = parseInt(msg.content))) {
		output = "";
		if (cp >= 2184 && cp <= 2275) {output = RD.raidiv("Mewtwo",cp)} else
		if (cp >= 2011 && cp <= 2097) {output = RD.raidiv("Tyranitar",cp)} else
		if (msg.createdAt.getMonth() == 8 && cp >= 1847 && cp <= 1930) {output = RD.raidiv("Entei",cp)} else
		if (msg.createdAt.getMonth() >= 9 && cp >= 1831 && cp <= 1913) {output = RD.raidiv("Raikou",cp)} else
		if (msg.createdAt.getMonth() >= 9 && cp >= 1538 && cp <= 1613) {output = RD.raidiv("Suicune",cp)};
		if (!!output) {bot.channels.get(msg.channel.id).sendMessage(output)};
	};
});

seed = 0; random_index = 0
function JME() {
	if (seed == 11 || seed == 21) {random_index++}
	while (random_index == seed) {
		random_index = Math.floor(Math.random()*jme.length);
		if (random_index == 12 || random_index == 22) {random_index++};
	}
	output = jme[random_index];
	seed = random_index;
	return output
}

function help() {
	output = [
		"For personal Pyobot notifications, see http://pyobot.ga",
		"> !breakpoints -- Calculates attack breakpoints against raid bosses",
		"> !raidiv -- Lists the possible IVs of a raid boss encounter given the CP"
	]
	return output
}

function breakpoints(input) {
	parsed = RD.parser(input);
	if (typeof parsed == 'string') {output = parsed} else {output = RD.breakpoints(...parsed)};
	return output;
}

function raidiv(input) {
	parsed = RD.raidiv_parser(input);
	if (typeof parsed == 'string') {output = parsed} else {output = RD.raidiv(...parsed)};
	return output;
}