const https = require('https');
const key = require('./key.json').bot;
const Discord = require('discord.js');
const bot = new Discord.Client();
bot.login(key);

posts = {
	1: "368832932988583938",
	2: "368833172101660683",
	3: "368833367002710016",
	4: "368833460611317760",
	5: "368833625732546561",
	6: "368834015152701451",
	7: "368834106215366656",
	8: "368834242869985280",
	9: "368834325795569695",
	10: "368834417000579072",
	11:	"368834460864741376",
	12: "368834520365137920",
	13: "368834629018583053"
}

var messages = {}

bot.on('ready', () => {
	ar_chan = bot.channels.get("310058980623908864")
	ar_chan.fetchMessages().then(
		(m) => {messages = m; console.log('Fetched.')}
	)
	server = bot.guilds.get("260119001018007552")
});

var stdin = process.openStdin();
stdin.addListener("data", function(d) {
    // note:  d is an object, and when converted to a string it will
    // end with a linefeed.  so we (rather crudely) account for that  
    // with toString() and then trim()
	message = messages.get(posts[d.toString().trim()])
	if (!message) {console.error("undefined message")}
	else {
		console.log(message.content);
		reacts = message.reactions.get('tangela:297004856768724992')
		console.log("reactions: " + reacts.count);
		reacts.fetchUsers().then(
			(m) => {
				m.map(user => {
					console.log(user.username+"#"+user.discriminator);
					/* server.search({
						before: '2017-10-15',
						author: user
					}).then((res) => {
						console.log("posts: " + res.totalResults)
					}) */
				})
			}
		);
	}
})