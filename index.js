const extend = require('util')._extend
const Discord = require('discord.js')		// Discord Node.js API
const https = require('https')				// HTTP requests
const tools = require('./tools.js')			// Parsers and calculators for some functions
const pgl = require('./pgl.js')
const jme = require('./jme.json')			// JME quote sheet
const key = require('./key.json')			// Bot token for Discord
cloudscraper = require('cloudscraper')
// const faqurl = key.faq;					// URL of online editable FAQ JSON

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
    // setTimeout(ping,ExpRV(mu))
	// faq = {}; faqupdate()
	setTimeout(runPgl, 1000*3)
	setTimeout(()=>{duck('research')}, 1000*5)
	console.log('Bot is ready.')
})

// Connection error handling
bot.on("error", console.error);
bot.on("disconnect", console.log);

// User message handling
bot.on('message', msg => {
	// Sends single untagged reply (use msg.reply for single tagged reply)
	function ureply(text) {bot.channels.get(msg.channel.id).send(text).catch(console.error)}
	function ureply2(text,attachment) {bot.channels.get(msg.channel.id).send(text,attachment).catch(console.error)}

	// Special commands
	if (msg.content == "!oi") {ureply2("?", {files: [`https://i.imgur.com/AliyniJ.png`]})}

	if (msg.content.slice(0,5) == "!info") {
		let input = msg.content.slice(6)
		if (duckPics[input]) {
			ureply2("LeekDuck "+input, {files: [duckPics[input]]})
		} else if (input in duckPics) {
			ureply("Infographic not loaded; try again in 5s.")
			clearTimeout(nextDuckCall)
			nextDuckCall = setTimeout(()=>{duck(input)}, 0)
		} else {
			ureply("Unknown infographic; try `boss`, `research`, `shinylist`.")
		}
		return
	}

	if (msg.content.slice(0,5) == "!blog" && (msg.author.id == "260187369473441803" || msg.channel.id != pglgeneral)) {
		let input = msg.content.slice(6)
		pgl.fetch(input).then(ureply).catch(error => {ureply("Failed – wrong url or scrape glitched.")})
		return
	}
	
	// Input @ bot (JME function)
    if (msg.isMentioned(bot.user)) {
		switch(msg.channel.id) {
			case pys1:
				msg.reply('Salve magistra.').catch(console.error);
				break;
			default:
				post(JME(), msg.channel.id);
				break;
		}
    };
	
	// Input from particular user (meme)
	if (msg.channel.id == pglgeneral && msg.author.id == "177806056989261824" && msg.content.substring(0,7).toLowerCase() == "anyways") {
		ureply("https://cdn.discordapp.com/attachments/260119001018007552/301774028220399617/image.jpg")
	};
	
	// Input is ! command
    if (msg.content && msg.content[0] == '!' && msg.channel.id != pglgeneral && msg.author.id != "292053330153177098") {
        let reply = tools.act(msg.content, msg.author.id)
        if (reply) {
            ureply(reply)
        } else {
            if (msg.channel.id == pglbot) {ureply("#SyntaxError: command not found.")}
        }
    }
    
	// Input is 4-digit number (exposes !raidiv shortcut)
	if (msg.channel.id != pglgeneral && msg.content.length == 4 && Number.isInteger(cp = parseInt(msg.content)) && msg.author.id != "292053330153177098") {
		ureply(tools.shortcut(cp))
	}
})

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
	seed = random_index;
	return jme[random_index];
}

// Duck
var nextDuckCall
duckPics = {'boss': null, 'research': null, 'eggs': null} // store url to detected image
function duck(handle) { // called on infographic handle (key in above dict)
	let timeout = (1000*60*2)*(1+Math.random()/2) // timeout (in s) uniformly distrib. on [2,3]
	// use cloudscraper to get past cloudflare. fetch entire leekduck webpage at handle
	cloudscraper.get(`http://leekduck.com/${handle}/`, async function(error, response, body) { // result goes in "body"
		if (error) {
			console.log('CS error:', error)
		} else {
			let result // url to detected image. use regex to match hyperlinks detected in webpage body
			switch (handle) {
				case "research":
					result = 'https://leekduck.com/' + body.match(/assets\/img\/research\/field\/.+\.jpg/)[0]
					break
				case "boss":
					result = 'https://leekduck.com/' + body.match(/assets\/img\/raid-bosses\/graphic\/.+\.jpg/)[0]
					break
				case "eggs":
					result = 'https://leekduck.com/' + body.match(/assets\/img\/eggs\/[^d]+\.jpg/)[0]
					break
				default:
					result = ''
					break
			}
			if (result) { // if url found
				if (duckPics[handle] != result) { // and not the same as before
					text = `New ${handle} infographic from LeekDuck:`
					file = result
					attachment = {files: [file]}
					// post image to test chan
					bot.channels.get(pysstatus).send(text, attachment).catch(console.error)
					console.log(`Duck updated ${handle} (${result}).`)
					// repost image to test+real chan if not first-run (note that bot auto-restarts every day)
					if (duckPics[handle]) { // first-run = is there a url in the dict yet?
						bot.channels.get(pysstatus).send(`Duck sent! ${handle} (${result}).`)
						bot.channels.get(pglgeneral).send(text, attachment).catch(console.error)
						console.log(`Duck sent ${handle} (${result}).`)
						timeout = 1000*60*50 // override timeout w/ 50 mins to prevent spam
					}
					duckPics[handle] = result // save new url to compare with next time
				}
			}
		}
		nextHandle = {'boss': 'research', 'research': 'eggs', 'eggs': 'boss'}[handle] // increment to next handle
		nextDuckCall = setTimeout(()=>{duck(nextHandle)}, timeout) // call self again with timeout
	})
}

// PGL
var nextPglCall
var pglHandles = []
var pglFirstRun = true
async function runPgl() {
	let timeout = (1000*60*2)*(1+Math.random()/2)
	try {
		body = await cloudscraper.get(`https://pokemongolive.com/en/`)
	} catch (err) { console.log('CS error (pgl home):', err) }

	let regex = RegExp('\/en\/post\/([^"\/]+)\/','g')
	while ((regexItem = regex.exec(body)) !== null) {
		handle = regexItem[1]
		if (!pglHandles.includes(handle)) {
			pglHandles.push(handle)
			try {
				text = await pgl.fetch(handle)
			} catch (err) {}
			bot.channels.get(pysstatus).send(text).catch(console.error)
			console.log(`PGL updated ${handle}.`)
			if (!pglFirstRun) {
				bot.channels.get(pglgeneral).send(text).catch(console.error)
				console.log(`PGL sent ${handle}!`)
			}
		}
	}
	pglFirstRun = false
    nextPglCall = setTimeout(runPgl, timeout)
}
