const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');
const $q = require('q');

var collection = '/b/blutengel.html';
var domain = 'https://www.azlyrics.com';
var songlist = [];
var outputFile = 'lyrics.txt';

const sleep = m => new Promise(r => setTimeout(r, m))

const getSonglist = new Promise(
  function (resolve, reject) {
    request(domain+collection, (error, response, html) => {
      if (!error && response.statusCode == 200) {
        let $ = cheerio.load(html);
        let songnames = $('#listAlbum').children('.listalbum-item').children('a');
        let songlist = [];
        songnames.each((i, el) => {
          songlist.push(el.attribs.href.substr(2));
        });
        resolve(songlist);
      }
    });
  }
);



(async () => {
  // Wipe the output file clean at the beginning
  fs.truncate(outputFile, 0, function(){'Output file clean'})
  songlist = await getSonglist;
  scrapAll();
})();

async function scrapAll(limit) {
  try {
    let chain = $q.when();
    let limit = songlist.length;
    for (let i = 0; i < limit; i++) {
      chain = chain.then(async () => {
        await sleep(5000);
        return getLyrics(songlist[i]);
      });
    }
  }
  catch (error) {
    console.log(error);
  }
}

async function getLyrics(address) {
  return new Promise(function (resolve, reject) {
    request(domain + address, (error, response, html) => {
      if (!error && response.statusCode == 200) {
        let info = '';
        console.log('Scraping' + address);
        let $ = cheerio.load(html);
        // Sadly, it's basically hardcoding what I need to get.
        // The developers of this site were trying to be
        // smart about DDoS but little did they know.
        let lyrics = $('.row').children('div').get(2).children[14].children;
        let text = ''

        if (lyrics == undefined) {
          console.log("PROBABLY A COVER so whatever");
        }
        else {
          for (let i = 0; i < lyrics.length; i++) {
            if (lyrics[i].type == 'text') {
              text += lyrics[i].data;
            }
          }
          var file = fs.createWriteStream(outputFile, {flags:'a'});
          file.on('error', function(err) {"This ain't it chief"});
          file.write(text.trim() + '\n\n');
          file.end();
        }
      }
      resolve();
    });
  })
}
