const extend = require('util')._extend;
const Discord = require('discord.js');		// Discord Node.js API
const https = require('https');				// HTTP requests
const tools = require('./tools.js');		// Parsers and calculators for some functions
const jme = require('./jme.json');			// JME quote sheet
const key = require('./key.json');			// Bot token for Discord
const faqurl = key.faq;						// URL of online editable FAQ JSON

// Channel IDs
pysgeneral =  '293028598024110080'
pys1 =        '293838131407486980'
pysstatus =   '298589684492140546'
pglgeneral =  '260119001018007552'
pglofftopic = '349689326361247744'
pglbot =      '341937230337802243'
pgldev =      '276041020402040833'

const bot = new Discord.Client()
bot.login(key.bot)
bot.on('ready', () => {
	faq = {}; faqupdate()
    console.log('Bot is ready.')
    
    // setTimeout(ping,ExpRV(mu))
});

/*
mu = 6*60*60*1000
function ExpRV(mu) {
    let u = Math.random()
    return -mu*Math.log(1-u)
}

function ping() {
    let reply = "<@340128461295452162> storage is still not half-price k."
    bot.channels.get('260119001018007552').send(reply).catch(console.error)
    setTimeout(ping,ExpRV(mu))
}*/

// Connection error handling
bot.on("error", (e) => console.error(e));
bot.on("disconnect", (e) => console.log(e));

// User message handling
bot.on('message', (msg) => {
	// Sends single untagged reply (use msg.reply for single tagged reply)
	function ureply(reply) {bot.channels.get(msg.channel.id).send(reply).catch(console.error)}
	
	// Input is ?help or !register
	if (msg.content == "?help") {ureply(tools.act('!help'))}
    if (msg.content == "!register") {return}
	
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
	
    if (msg.content && msg.content[0] == '!' && msg.channel.id != pglgeneral) {
        let reply = tools.act(msg.content)
        if (reply) {
            ureply(reply)
        } else {
            if (msg.channel.id == pglbot) {ureply("#SyntaxError: command not found.")}
        }
    }
    
	// Input is 4-digit number (exposes !raidiv shortcut)
	if (msg.channel.id != pglgeneral && msg.content.length == 4 && Number.isInteger(cp = parseInt(msg.content))) {
        if (cp < 1846 || cp > 2844) {return}
        let output = ""
        for (let poke of ['latias', 'tyranitar', 'mewtwo']) {
            for (let boost of [false, true]) {
                let result = tools.pRaidiv(poke,cp,boost)
                if (result.substring(0,2) != 'No') {output += result}
            }
        }
        if (!output) {output = msg.content + " u wot?"}
        ureply(output)
	}
	
	// Input starts with ~ (FAQ function)
	if (msg.content == "~") {
		faqupdate()
	} else if (msg.content == "~help") {
		output = "List of FAQ commands:\n";
		for (var key in faq) {
			if (faq.hasOwnProperty(key)) {output += key + ", "};
		}
		ureply(output)
	} else if (msg.content == "~toggle") {
		faqEnabled = !faqEnabled;
		faq = {};
		faqupdate();
	}
	else if (msg.content[0] == "~" && msg.content[1] != "~") {
        input = (msg.content.indexOf(" ") != -1)? msg.content.slice(1, msg.content.indexOf(" ")) : msg.content.slice(1)
		if (!!faq[input]) {ureply(faq[input])}
		else {ureply("Unrecognised command; type `~help` for a list of FAQ commands.")}
	}
});

// Sends multiple single posts
function post(listo, channelid) {
    var list = JSON.parse(JSON.stringify(listo));
    if (list.length != 0) {
        bot.channels.get(channelid).send(list.shift()).catch(console.error);
        setTimeout(function(){post(list, channelid)}, 1200);
    }
}

// JME function
seed = 0; random_index = 0
function JME() {
	if (seed == 11) {random_index++}
	while (random_index == seed) {
		random_index = Math.floor(Math.random()*jme.length);
		if (random_index == 12) {random_index++};
	}
	output = jme[random_index];
	seed = random_index;
	return output;
}

faqEnabled = true;
// Syncs FAQ with JSON on JSONBlob (request maker)
function faqupdate() {
	if (!faqEnabled){console.log("FAQ disabled"); return};
	https.get(faqurl, faqcallback);
}
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