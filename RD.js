// Imports Pokemon data
var data = {};
data.boss = require('./RDC/Boss.json');
data.cpm = require('./RDC/CPM.json');
data.eff = require('./RDC/Effectiveness.json');
data.moves = require('./RDC/Moves.json');
data.stats = require('./RDC/Stats.json');

module.exports = {

// Calculates damage dealt given prepared input.
damage: function (ATK, attacker, move, boss, level) {
        attacker = data.stats[attacker];
        move = data.moves[move];
        defender = data.stats[boss];

        power = move.Power;
        STAB = 1; if(move.Type == attacker.Type1 || move.Type == attacker.Type2) {STAB = 1.2}
        eff = data.eff[move.Type][defender.Type1] * data.eff[move.Type][defender.Type2]
        base_atk = attacker.Attack;
        iv_atk = ATK;
        base_def = defender.Defense;
        cpm = data.cpm[level];
        boss_cpm = data.boss[boss].CpM

        return Math.floor(1 + 0.5*power*STAB*eff*(base_atk+iv_atk)/(base_def+15)*cpm/boss_cpm);
},

// Prepares output from prepared inputs.
breakpoints: function (ATK, attacker, move, boss) {
        function damage_closure(level) {return module.exports.damage(ATK, attacker, move, boss, level)};
        dmg_memo = 0;
        var EOL = require('os').EOL;    // display delimiter
        var DLM = ' | ';                                // inline delimiter
        output = '__Damage @ level__';
        for(var i=0; i<79; i++){
                level = 1+0.5*i;
                dmg = damage_closure(level);
                if(dmg > dmg_memo) {
                        if (level >= 10) {output += DLM + dmg + ' @ ' + level};
                        dmg_memo = dmg;
                }
        }
        if (output.length <= 110) {while (output.indexOf(DLM) != -1) {output = output.replace(DLM,EOL)} };
        if (output == '__Damage @ level__') {output += ' | No breakpoints above level 10 detected.'};
        return output
},

// Prepares inputs (returns error string if failed).
breakpoints_parser: function (input) {
        function isDigit(n) {
                return(String(n).charCodeAt(0) >= "0".charCodeAt(0) && n <= "9".charCodeAt(0));
        }
        function TitleCase(str)
        {
                return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
        }

        input = input.trim();

        console.log('after command: ' + input)
        ATK = ''
        while (input != '' && isDigit(input[0])) {
                ATK += input[0]; input = input.slice(1)
        }
        console.log(ATK)
        ATK = parseInt(ATK);
        if (ATK >= 0 && ATK <= 15) {}
                else {error = "Invalid attack IV; type !breakpoints for help."; console.log(error); return error}
        input = input.trim();

        console.log('after ATK IV: ' + input)
        delimiter = input.indexOf(">");
        attacker = TitleCase(input.slice(0,delimiter).trim());
        if (!data.stats[attacker])
                {error = "Invalid attacker; type !breakpoints for help."; console.log(error); return error}
        input = input.slice(delimiter+1).trim();

        console.log('after attacker: ' + input)
        delimiter = input.indexOf(">");
        move = TitleCase(input.slice(0,delimiter).trim());
        if (!data.moves[move])
                {error = "Invalid move; type !breakpoints for help."; console.log(error); return error}
        input = input.slice(delimiter+1).trim();

        console.log('after move: ' + input)
        boss = TitleCase(input);
        if (!data.boss[boss])
                {error = "Invalid raid boss; type !breakpoints for help."; console.log(error); return error}
        console.log([ATK,attacker,move,boss])
        return [ATK,attacker,move,boss]
},

// Prepares output from prepared inputs.
raidiv: function (boss_name, input_cp) {
        boss = data.stats[boss_name];
        cpm = data.cpm[20];
        function cp(atk_iv,def_iv,sta_iv) {
                atk = boss.Attack + atk_iv;     def = boss.Defense + def_iv; sta = boss.Stamina + sta_iv;
                return Math.max(10, Math.floor(0.1 * atk * Math.sqrt(def) * Math.sqrt(sta) * cpm * cpm));
        }
        output = []
        for (i = 45; i >= 30; i--){
                for (a = 15; a >= 10; a--){
                        for (d = 15; d >= 10; d--){
                                for (s = 15; s >= 10; s--){             // enforces descending ordering by a+d+s
                                        if (a+d+s == i && cp(a,d,s) == input_cp) {
                                                IV = a + d + s;
                                                result = String(Math.round((IV/45)*100)) + '% (' + String(IV-45) + ') | ' + a + '/' + d + '/' + s
                                                output.push(result)
                                        }
                                }
                        }
                }
        }

        var EOL = require('os').EOL;
        if (output.length == 0) {return "What what what what where? How did you get dat number right dere?"};
        output_text = "__Possible IVs of CP " + input_cp + " " + boss_name + " at level 20__";
        for (n = 0, len = output.length; n < len; n++) {
                output_text += EOL + output[n]
        }
        return output_text
},

// Prepares inputs (returns error string if failed).
raidiv_parser: function (input) {
        function isDigit(n) {
                return(String(n).charCodeAt(0) >= "0".charCodeAt(0) && n <= "9".charCodeAt(0));
        }
        function TitleCase(str)
        {
                return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
        }

        input = input.trim();

        console.log('after command: ' + input)
        boss = ''
        while (input != '' && !isDigit(input[0])) {
                boss += input[0]; input = input.slice(1)
        }
        boss = TitleCase(boss.trim());
        console.log(boss);
        if (!data.stats[boss])
                {error = "Invalid Pokemon / Syntax Error; type !raidiv for help."; console.log(error); return error}

        console.log('after boss: ' + input)
        cp = ''
        while (input != '' && isDigit(input[0])) {
                cp += input[0]; input = input.slice(1)
        }
        console.log(cp)
        if (cp == '')
                {error = "Invalid CP; type !raidiv for help."; console.log(error); return error}
        cp = parseInt(cp);
        return [boss,cp]
}

}