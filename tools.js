var EOL = '\n'              // display delimiter
var DLM = ' | '				// inline delimiter
var fs = require('fs')

// underlying data (sourced from "Raid damagecalc" spreadsheet)
data = {
    bosses: require('./data/Bosses.json'),
    cpm: require('./data/CPM.json'),
    eff: require('./data/Effectiveness.json'),
    moves: require('./data/Moves.json'),
    stats: require('./data/Stats.json'),
    bosscpm: require('./data/BossCPM.json')
}

// dict of command aliases: ![key] triggers command [value]
commands = {
    bp: 'bp',
    cp: 'cp',
    breakpoint: 'bp',
    breakpoints: 'bp',
    raidiv: 'raidiv',
    raidivs: 'raidiv',
    maxcp: 'maxcp',
    switch: 'switch'
}

shortcutInput = fs.readFileSync('data/Shortcuts.txt', 'utf8').split('\n').filter(x => x)

function updateShortcut() {
    shortcutRaids = []; shortcutQuests = []
    for (let input of shortcutInput) {
        let questFlag = input.slice(-1) == '-'
        let pokemon = questFlag ? input.slice(0,-1) : input
        if (!data.stats[pokemon]) {continue}
        if (questFlag) {
            shortcutQuests.push(pokemon)
        } else {
            shortcutRaids.push(pokemon)
        }
    }
}
updateShortcut()    

// each command has raw format ![command alias] [rawArgs]
// rawArgs is passed to the interpreter function i[command name] – e.g. iBp
// the interpreter checks if the inputs are valid and passes a list of input args to the processor function p[command name] – e.g. pBp
// the processor returns the formatted output text
// MOVED TO END OF FILE

help = {
    help:
        "For help on one of the following bot tools, type the command by itself:\n"
      + "– **!bp**: Calculates attack breakpoints against raid bosses.\n"
      + "– **!raidiv**: Lists the possible IVs of a raid boss encounter given only the CP.\n"
      + "– **!maxcp**: Gives the CPs of 100% and 10/10/10 raid encounters or egg hatches.\n"
      + "– **!cp**: Calculates any CP from exact IVs and level.\n",
    bp:
        "Syntax: `!bp [ATK IV] [Attacker] > [Move] > [Raid Boss]`.\n"
      + "Include a `+` after the attacker to assume weather boost.\n"
      + "E.g. `!bp 14 Scizor > Fury Cutter > Celebi`.\n"
      + "Breakpoints below level 10 are omitted.",
    cp:
      "Syntax: `!cp [Pokemon] [IV] [Level]`.\n"
    + "IV should be in attack/defence/stamina format or `100%` or `0%`.\n"
    + "E.g. `!cp Gyarados 100% L34`, `!cp Blissey 11/14/11 L22.5`.",
    raidiv:
        "Syntax: `!raidiv [Pokemon] [CP]`. Evaluates L20 by default.\n"
      + "Add a `+` after the Pokémon name to assume weather boost (L25).\n"
      + "Add a `-` after the Pokémon name to assume quest reward (L15).\n"
	  + "E.g. `!raidiv Exeggutor+ 2100`\n"
      + "For active legendaries and Tyranitar, you can type just the number as a shortcut – e.g. `2050`.",
    maxcp:
        "Gives maximum (100%) and minimum (10/10/10) possible CPs of a raided/hatched Pokémon at various levels.\n"
      + "Syntax: `!maxcp [Pokemon]`\n"
      + "E.g. `!maxcp Chansey`",
    switch:
        "!switch s [Pokemon]\n"
      + "add a - to toggle quest mode."
}

var errTextDym = "Name conventions: `mewtwo-armored`, `giratina-origin` OR `giratina-altered`, `deoxys-speed` (etc.), `ho-oh`, `vulpix-alolan` (etc.), `nidoran-f` (etc.), `mr.mime`"
var editors = ["260187369473441803", "330688169135833091", "382701315417178122"]

// reads full input bot command and processes it
function act(input, senderID) {
    if (input && input[0] == '!') {
        input = input.slice(1).toLowerCase()    // full input is lowercase (so insensitive)
        let spaceIndex = input.indexOf(' ')
        let commandText = (spaceIndex != -1)? input.slice(0,spaceIndex) : input
        if (commandText == 'help') {return help['help']}
        let command = commands[commandText]
        if (!command) {return}
        let rawArgs = (spaceIndex != -1)? input.slice(spaceIndex + 1).trim() : ''
        console.log(command, ':', rawArgs)
        if (rawArgs == '' || rawArgs == 'help') {
            return help[command]
        } else {
            if (command == "switch" && !editors.includes(senderID)) {
                return "unauthorised :snake:"
            }
            return interpreters[command](rawArgs)
        }
    }
}

// converts string of command rawArgs passed to interpreter into list of args for processor
// mode 'space': delimits input by space (as well as ,>|)
// mode 'type': treats space as text and delimits input by switch between text and num (or by ,>|)
function separate(text, mode) {
    function typeChar(char) {
        return char.match(/[0-9.]/i)? 'num'
             : char.match(/[,>|]/i)? 'delim'
             : char == ' '? ((mode == 'space')? 'delim': 'text')
             : 'text'
    }
    let current = ''    // current string
    let output = []     // result (list of separated strings)
    let state = ''      // type of input being read (text or num)

    for (char of text) {
        let type = typeChar(char)
        // should push current string to output and reset?
        if (
            type == 'delim' ||
            (mode == 'type' && state != '' && state != type)
        ) {
            if (current.trim()) {output.push(current.trim()); current = ''}
            state = ''
        }
        // should append current char to current string?
        if (
            type != 'delim'
        ) {
            current += char
            state = type
        }
    }
    if (current.trim()) {output.push(current.trim()); current = ''}
    return output
}

function iBp(rawArgs) {
    let args = separate(rawArgs, 'type')
    if (args.length != 4) {return error('#SyntaxError (bp): expected 4 inputs (atkIV, attacker, move, boss), received '+args.length+'.')}
    let atkIV = parseInt(args[0])
    if (!(0 <= atkIV && atkIV <= 15)) {return error('#SyntaxError (bp): attack IV (1st input) not between 0 and 15.')}
    let attacker = args[1]
    let attackerBoost = false
    if (attacker.slice(-1) == '+') {attackerBoost = true; attacker = attacker.slice(0,-1).trim()}
    if (!data.stats[attacker]) {return error('#NameError (bp): unknown attacker (2nd input).\n'+errTextDym)}
    let move = args[2]
    if (!data.moves[move]) {return error('#NameError (bp): unknown move (3rd input).')}
    let boss = args[3]
    if (boss.slice(-1) == '+') {boss = boss.slice(0,-1)}
    if (!data.bosses[boss]) {return error('#NameError (bp): unknown raid boss (4th input).')}
    return pBp(atkIV, attacker, move, boss, attackerBoost)
}

function pBp(atkIV, attacker, move, boss, attackerBoost) {
    function rd(level) {return _rd(atkIV, attacker, move, boss, level, attackerBoost)}
    let output = ''
    let dmg_memo = 0
	for(let level=1; level<=40; level+=0.5){
		let dmg = rd(level);
		if (dmg > dmg_memo) {
			if (level >= 10) {output += dmg + ' @ ' + level + DLM}
			dmg_memo = dmg
		}
	}
	if (output.length <= 110) {while (output.indexOf(DLM) != -1) {output = output.replace(DLM,EOL)} };
    output = output ? '__Damage @ level__' + EOL + output : 'No breakpoints above level 10 detected.'
	return output
}

function iRaidiv(rawArgs) {
    let args = separate(rawArgs, 'type')
    if (args.length != 2) {return error('#SyntaxError (raidiv): expected 2 inputs (Pokémon, CP), received '+args.length+'.')}
    let pokemon = args[0]
    let level = 20
    if (pokemon.slice(-1) == '+') {level = 25; pokemon = pokemon.slice(0,-1).trim()} else
    if (pokemon.slice(-1) == '-') {level = 15; pokemon = pokemon.slice(0,-1).trim()}
    if (!data.stats[pokemon]) {return error('#NameError (raidiv): unknown pokemon (1st input).\n'+errTextDym)}
    let cp = parseInt(args[1])
    if (!(10 <= cp && cp <= 5000)) {return error('#SyntaxError (raidiv): invalid CP.')}
    console.log(JSON.stringify([pokemon, cp, level]))
    return pRaidiv(pokemon, cp, level)
}

function pRaidiv(pokemon, cpInput, level) {
    function cp(atk,def,sta) {return _cp(pokemon, level, atk, def, sta)}
    function hp(sta) {return _hp(pokemon, level, sta)}
	let output = []
	for (let i = 45; i >= 30; i--){
		for (let a = 15; a >= 10; a--){
			for (let d = 15; d >= 10; d--){
				for (let s = 15; s >= 10; s--){		// enforces descending ordering by a+d+s
					if (a+d+s == i && cp(a,d,s) == cpInput) {
                        let IV = a + d + s
                        let HP = hp(s)
						let result = `${Math.round((IV/45)*100)}% (${IV-45})  |  ${a}/${d}/${s}  |  HP ${HP}`
						output.push(result)
					}
				}
			}
		}
	}
	
	if (output.length == 0) {return "No combinations found ("+pokemon+" at level "+level+")." + EOL + "Remember to add `+` after the Pokémon name for weather boost, or `-` for quest." + EOL}
	let outputText = "__Possible IVs of CP " + cpInput + " " + pokemon + " at level "+level+":__"
	for (n = 0, len = output.length; n < len; n++) {
		outputText += EOL + output[n]
	}
	return outputText + EOL
}

// to be rewritten in new style
function iMaxcp(input) {
    function calc(pokemon,level) {return _cp(pokemon,level,15,15,15)}
    function calcMin(pokemon,level) {return _cp(pokemon,level,10,10,10)}
	/*switch(input) {
		case "1": case "2": case "3": case "4": case "5":
			let output = "__CP of 100% IV at level 20, 25:__\n"
			for (var pokemon in data.bosses) {
				if (data.bosses.hasOwnProperty(pokemon) && data.bosses[pokemon].Active == 1 && data.bosses[pokemon].Tier == input) {
					output += pokemon + " – " + calc(pokemon,20) + ', ' + calc(pokemon,25) + EOL
				}
			}
			return output
	}*/
	if (data.stats[input]) {
        return `**${input} (cp @ level)**` + EOL
             + `\`.   100%\`:  ` + calc(input,20) + " (@ 20); " + calc(input,25) + " (@ 25); " + calc(input,30) + " (@ 30); "+ calc(input,40) + " (@ 40)" + EOL
             + `\`10/10/10\`:  ` + calcMin(input,20) + " (@ 20); " + calcMin(input,25) + " (@ 25); " + calcMin(input,30) + " (@ 30); "+ calcMin(input,40) + " (@ 40)"
	} else {
        return "#NameError (maxcp): unknown Pokémon; type `!maxcp` for help.\n"+errTextDym
	}
}

function iCp(rawArgs) {
    let args = separate(rawArgs, 'space')
    if (args.length != 3) {return error('#SyntaxError (cp): expected 3 inputs (Pokémon, IV, level), received '+args.length+'.')}
    let pokemon = args[0]
    if (pokemon.slice(-1) == '+') {pokemon = pokemon.slice(0,-1).trim()}
    if (!data.stats[pokemon]) {return error('#NameError (cp): unknown pokemon (1st input).\n'+errTextDym)}

    let ivInput = args[1]
    let attack, defence, stamina
    if (ivInput == '100%') {
        attack = defence = stamina = 15
    } else if (ivInput == '0%') {
        attack = defence = stamina = 0
    } else {
        let slash1 = ivInput.indexOf('/')
        if (slash1 == -1) {return error('#SyntaxError (cp): IV should be in a/d/s notation (2nd input).')}
        let slash2 = slash1 + 1 + ivInput.slice(slash1+1).indexOf('/')
        if (slash2 == -1) {return error('#SyntaxError (cp): IV should be in a/d/s notation (2nd input).')}
        attack = parseFloat(ivInput.slice(0,slash1))
        if (!(Number.isInteger(attack) && 0 <= attack && attack <= 15)) {return error('#SyntaxError (cp): attack should be integer between 0 and 15.')}
        defence = parseFloat(ivInput.slice(slash1+1,slash2))
        if (!(Number.isInteger(defence) && 0 <= defence && defence <= 15)) {return error('#SyntaxError (cp): defence should be integer between 0 and 15.')}
        stamina = parseFloat(ivInput.slice(slash2+1))
        if (!(Number.isInteger(stamina) && 0 <= stamina && stamina <= 15)) {return error('#SyntaxError (cp): stamina should be integer between 0 and 15.')}
    }

    let levelInput = args[2]
    let level = (levelInput[0] == "l") ? parseFloat(levelInput.slice(1)) : parseFloat(levelInput)
    if (!(Number.isInteger(level*2) && 0 <= level && level <= 40)) {return error('#SyntaxError (cp): level is not a half-integer between 0 and 40 (3rd input).')}

    return _cp(pokemon, level, attack, defence, stamina)
}

function _rd(atkIV, attackerName, moveName, bossName, level, attackerBoost) {
	let attacker = data.stats[attackerName]
	let move = data.moves[moveName]
	let defender = data.stats[bossName]
	
	let power = attackerBoost ? Math.floor(move.Power*1.2) : move.Power
	let STAB = (move.Type == attacker.Type1 || move.Type == attacker.Type2)? 1.2 : 1
	let eff = data.eff[move.Type][defender.Type1] * data.eff[move.Type][defender.Type2]
	let base_atk = attacker.Attack
	let base_def = defender.Defense
	let cpm = data.cpm[level]
	let boss_cpm = data.bosscpm[data.bosses[bossName].Tier]
    
    return output = Math.floor(1 +
          0.5
        * power
        * STAB
        * eff
        * (base_atk+atkIV)
        / (base_def+15)
        * cpm
        / boss_cpm
    )
}

function _cp(pokemonName, level, atkIV, defIV, staIV) {
	let pokemon = data.stats[pokemonName]
	return Math.max(10, Math.floor(
        0.1
      * (pokemon.Attack + atkIV)
      * Math.sqrt(pokemon.Defense + defIV)
      * Math.sqrt(pokemon.Stamina + staIV)
      * (data.cpm[level] ** 2)
    ))
}

function _hp(pokemonName, level, staIV) {
	let pokemon = data.stats[pokemonName]
	return Math.floor(
        (pokemon.Stamina + staIV) * data.cpm[level]
    )
}

function error(desc) {
    console.log(desc)
    return desc
}



function shortcut(cp) {
    console.log("Shortcut:", cp)
    if (cp >= 3000) {return}
    let output = ""
    for (let poke of shortcutRaids) {
        for (let level of [20, 25]) {
            let result = pRaidiv(poke, cp, level)
            if (result.substring(0,2) != 'No') {output += result}
        }
    }
    for (let poke of shortcutQuests) {
        let result = pRaidiv(poke, cp, 15)
        if (result.substring(0,2) != 'No') {output += result}
    }
    
    if (!output) {output = `Dunno. Check number or use \`!raidiv\` for non-${shortcutRaids.join(', ')} raids or ${shortcutQuests.join(', ')} quests.`}
    return output
}

function iSwitch(input) {
    let mode = input[0]; input = input.slice(1).trim()
    if (mode == "s") {
        let questFlag = input.slice(-1) == '-'
        let pokemon = questFlag ? input.slice(0,-1) : input
        if (!input) {
            return 'Active shortcuts (raids): ' + shortcutRaids.join(', ') + '\n'
                 + 'Active shortcuts (quests): ' + shortcutQuests.join(', ')
        } else if (!data.stats[pokemon]) {
            return "#NameError (switch): unknown Pokémon.\n"
        } else {
            let pos = shortcutInput.indexOf(input)
            console.log(pos)
            console.log('shortcutInput=', shortcutInput)
            let newStatus
            if (pos != -1) {
                shortcutInput.splice(pos, 1); newStatus = "OFF"
            } else {
                shortcutInput.push(input); newStatus = "ON"
            }
            console.log('shortcutInput=', shortcutInput)
            updateShortcut()
            fs.writeFileSync('data/Shortcuts.txt', shortcutInput.join('\n'))
            return `Updated: set ${pokemon} ${questFlag ? "quest" : "raid"} to ${newStatus}\n`
                 + 'Active shortcuts (raids): ' + shortcutRaids.join(', ') + '\n'
                 + 'Active shortcuts (quests): ' + shortcutQuests.join(', ')
        }
    } else {
        return "#SyntaxError (switch): unknown mode; type `!switch` for help."
    }
}

interpreters = {
    bp: iBp,
    cp: iCp,
    raidiv: iRaidiv,
    maxcp: iMaxcp,
    switch: iSwitch
}

// console.log(shortcutInput)
// console.log(act("!switch s mew-", "330688169135833091"))

module.exports = {act: act, pRaidiv: pRaidiv, _cp: _cp, shortcut: shortcut}