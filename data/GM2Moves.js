fs = require('fs')
input = require('./GM.json')
output = {}

for (item of input['itemTemplates']) {
    if (!item['templateId']) {continue}
    itemSplit = item['templateId'].split('_')
    if (itemSplit[0][0] == 'V' & itemSplit[1] == 'MOVE') {
        info = item['moveSettings']
            nameSlice = itemSplit.slice(2)
            // special names
            if (nameSlice.slice(-1)[0]=='BLASTOISE') {nameSlice = nameSlice.slice(0,-1)}
            if (nameSlice.slice(-1)[0]=='FAST') {nameSlice = nameSlice.slice(0,-1)}
            if (nameSlice[0]=='X') {nameSlice=['x-scissor']}
            if (nameSlice[0]=='WEATHER' & nameSlice[1]=='BALL') {nameSlice[2]=`(${nameSlice[2]})`}
            name = nameSlice.join(' ').toLowerCase()
            power = info['power'] ? info['power'] : 0
            type = info['pokemonType'].split('_')[2].toLowerCase()
        console.log(name)
        console.log(`    ${power}  ${type}`)
        output[name] = {'Type': type, 'Power': parseInt(power)}
    }
}

outputSorted = {}
Object.keys(output).sort().forEach(function(key) {outputSorted[key] = output[key]})

fs.writeFileSync('Moves.json', JSON.stringify(outputSorted, null, 4))