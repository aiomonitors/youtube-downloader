# youtube-downloader

Downloads youtube videos using the client on https://ymp4.download

This project is made with Mac OS users in mind. It uses the `process.env.HOME` environment variable to get the path to downloads
folder. This environment variable is only available on Mac and Linux. 

## Usage

To use, clone the repo and run `yarn install`
After installing the dependencies, run `node index -l=YOUTUBE_LINK__HERE`