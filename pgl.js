cloudscraper = require('cloudscraper')
h2m = require('h2m')

// scrapes PGL by url post handle and returns discord-formatted text
async function fetch(handle) {
    return new Promise((resolve,reject) => {
        cloudscraper.get('https://pokemongolive.com/en/post/' + handle)
            .then(body => {
                let titleExec = RegExp('<h1 class="post__title">([^<]+)</h1>','').exec(body)
                if (!titleExec) {reject('title not found')}
                let title = titleExec[1]

                let textRawExec = RegExp('<h1 class="post__title">[^<]+</h1>([^]+)<ul class="social','i').exec(body)
                if (!textRawExec) {reject('body not found')}
                let textRaw = textRawExec[1]
                let text = h2m(textRaw, {overides: {a: x => {}, img: x => {}}})
                
                if (title.slice(0,11).toLowerCase() == "please join") {text = "yeah, nah."}
                if (text.slice(0,9) == "Trainers,") {text = text.slice(11)}     // delet
                text = text.replace(/\n\n-/g, "\n-")                // remove extra newline before bullet
                text = text.replace(/\*\*\n\n/g, "**\n")            // remove extra newline after heading
                
                let paras = text.split('\n\n')                      // split into paragraphs
                let parasFilter = []
                for (para of paras) {                               // keep bold ones except end sig
                    if (para.slice(0,2) == "**" && para[3] != 'T') {parasFilter.push(para)}
                }
                if (parasFilter.length == 0) {                      // if nothing left, keep first 2 paras
                    parasFilter.push(paras[0])
                    if (paras.length >= 2) {parasFilter.push(paras[1])}
                }
                output = `**${title}**\n(full: https://pokemongolive.com/en/post/${handle}/)\n\n${parasFilter.join('\n\n')}` 
                if (output.length > 2000) {output = output.slice(0,1990) + " ... [ctd]"}
                resolve(output)
            })
            .catch(error => {
                console.log('CS error (pgl entry):', error.message)
                reject('cs error')
            })
    })
}

async function main() {
    x = await fetch('globalchallenge2019')
    console.log(x)
}

module.exports = {fetch: fetch}
