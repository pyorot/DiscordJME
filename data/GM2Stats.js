fs = require('fs')
input = require('./GM.json')
output = {}

for (item of input['itemTemplates']) {
    if (!item['templateId']) {continue}
    itemSplit = item['templateId'].split('_')
    if (itemSplit[0][0] == 'V' & itemSplit[1] == 'POKEMON') {
        info = item['pokemonSettings']
            nameSlice = itemSplit.slice(2)
            // special names
            if (nameSlice[1] == 'ALOLA') {nameSlice[1] = 'alolan'}
            else if (nameSlice[1] == 'NORMAL') {nameSlice = nameSlice.slice(0,2)}
            else if (nameSlice[0] == 'NIDORAN') {nameSlice.push(info['pokemonId'][8])}
            else if (nameSlice[0] == 'FARFETCHD') {nameSlice = ['farfetch\'d']}
            else if (nameSlice[1] == 'MIME') {nameSlice = ['mr.mime']}
            else if (nameSlice[0] == 'HO') {nameSlice = ['ho','oh']}
            else if (['CASTFORM','DEOXYS','WORMADAM','CHERRIM','SHELLOS','GASTRODON','ROTOM','GIRATINA','SHAYMIN','ARCEUS'].includes(nameSlice[0])) {nameSlice = nameSlice.slice(0,2)}
            else if (nameSlice[0] == 'MIME') {nameSlice = ['mime','jr']}
            else if (nameSlice[1] == 'Z') {nameSlice = ['porygon','z']}
            else if (nameSlice[1] == 'A') {nameSlice = ['mewtwo','armored']}

            name = nameSlice.join('-').toLowerCase()
            stats = info['stats']
                atk = parseInt(stats['baseAttack'])
                def = parseInt(stats['baseDefense'])
                sta = parseInt(stats['baseStamina'])
            type1 = info['type'].split('_')[2].toLowerCase()
            type2 = info['type2'] ? info['type2'].split('_')[2].toLowerCase() : 'none'
        console.log(name)
        console.log(`    ${atk}  ${def}  ${sta}  ${type1}  ${type2}`)
        output[name] = {'Attack': atk, 'Defense': def, 'Stamina': sta, 'Type1': type1, 'Type2': type2}
    }
}

fs.writeFileSync('Stats.json', JSON.stringify(output, null, 4))