request = require('superagent')
fs = require('fs')
key = require('./key.json').imgur

function imgurGet(address) {return new Promise((resolve,reject) => {
    request
        .get(`https://i.imgur.com/${address}.jpg`)
        .timeout({response: 5*1000, deadline: 10*1000})
        .then(data => {
            // fs.writeFileSync(`imgur/${address}.jpg`, data.body)
            console.log(`imgur resolved ${address}.jpg`)
            resolve(data.body)
        })
        .catch(err => {console.error(err); reject('request')})
    setTimeout(() => reject('timeout-manual'), 10*1000)    // manual rejection after 10s (to prevent hanging awaiting reply)
})}

async function test() {
    console.log("begin")
    await imgurGet("8gewONz")
    console.log("end")
}

module.exports = imgurGet