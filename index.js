const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const request = require('request-promise-native');

const HEADERS = {
    'authority': 'ymp4.download',
    'accept': '*/*',
    'x-requested-with': 'XMLHttpRequest',
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.97 Safari/537.36',
    'Content-Type': 'application/x-www-form-urlencoded',
    'origin': 'https://ymp4.download',
    'referer': 'https://ymp4.download/en1/',
    'accept-language': 'en-US,en;q=0.9'
};


const getSessionID = async () => {
    const res = await request.get('https://ymp4.download/en1/', {
        headers: {
            'authority': 'ymp4.download',
            'cache-control': 'max-age=0',
            'upgrade-insecure-requests': '1',
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.97 Safari/537.36',
            'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
            'service-worker-navigation-preload': 'true',
            'sec-fetch-site': 'none',
            'sec-fetch-mode': 'navigate',
            'sec-fetch-user': '?1',
            'sec-fetch-dest': 'document',
            'accept-language': 'en-US,en;q=0.9',
        },
        resolveWithFullResponse: true,
    });
    const $ = cheerio.load(res.body);

    for (const elem of $('script').toArray()) {
        const innerHTML = $(elem).html().toString();
        if (innerHTML.substr(0, 6) === 'apikey') {
            const sidRawString = innerHTML.split(';')[1].trim();
            return sidRawString.slice(5, sidRawString.length - 1);
        }
    }
};

const getDownloadLink = async (link, sessionId) => {
    const encodedLink = encodeURIComponent(link).replace(/'/g,"%27").replace(/"/g,"%22");
    const body = `url=${encodedLink}&sid=${sessionId}&lng=en`;
    const headers = {...HEADERS, 'cookie' : `PHPSESSID=${sessionId}`};
    const res = await request.post('https://ymp4.download/', {
        headers,
        body,
        followAllRedirects: true,
        resolveWithFullResponse: true,
    });
    const $ = cheerio.load(res.body);
    return $('#moreOptions > h6 > div > div:nth-child(1) > table.table.table-dark.text-muted.mb-4 > tbody > tr > td.text-right > a').attr('href');
};

(async () => {
    if (process.argv.length > 2) {
        const args = {};
        for (let i = 2; i < process.argv.length; i++) {
            const arg = process.argv[i];
            if (arg.split('=').length >= 2) {
                args[arg.split('=')[0].slice(1)] = arg.split('=').slice(1).join('=').replace('\\', '').replace('\\', '');
            }
        };

        const downloadLink = args["l"] || args["link"];
        const downloadPath = path.resolve(args["p"] || args["path"] || process.env.HOME, 'downloads', 'syrian', `${Math.floor(Math.random() * 100000000)}.mp4`);
        // const body = `url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DPI060eBm5xM&sid=vc87ruvod3mlsr91t28cb4avu4&lng=en`
        const sessionId = await getSessionID();
        
        const dl = await getDownloadLink(downloadLink, sessionId);
        const file = fs.createWriteStream(downloadPath);
        const s = request({
            uri: dl
        })
        .pipe(file)
        .on('finish', () => {
            console.log(`The file is finished downloading.`)
        })
        .on('error', (error) => {
            console.log(error);
        });
    } else {
        throw new Error('Please provide a link with the flag -l')
    }
})();