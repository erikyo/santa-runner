# Santa runner (Google Dinosaur game bootleg)

![santa-runner](https://user-images.githubusercontent.com/8550908/206718884-8f5aecc4-ceec-4918-a18b-04e62f01c436.gif)

This is a Bootleg of the Google Chrome Easter Egg "Dinosaur_Game" (or "T-Rex Runner"). The game is an Easter egg which appears when you have no internet access. More info are available at the [Dinosaur Game wiki](https://en.wikipedia.org/wiki/Dinosaur_Game)
 

The dino game is extracted from the [Chromium sources](https://source.chromium.org/chromium/chromium/src/+/main:components/neterror/), rigged with the ES6 imports and bundled with webpack.
This makes it very easy to build your own version of the T-Rex runner, because, for example, images and sounds will be automatically base64 encoded and all scripts are wrapped in a single file (that makes it easy then to upload it to your website or app)

[PLAY ONLINE](https://erikyo.github.io/santa-runner/)

Controls:
- ⬆️️ Jump / Start the game (alternative key: Space Bar)
- ⬇️ Crouch

The original T-Rex game can be started inputting into the omnibox [chrome://dino](chrome://dino) (or chrome://network-error/-106) in Chromium browsers > 39.

---
## Development
As much as possible I made sure that you can edit the game assets and options, so you too can make your own bootleg.
You can edit the assets in the './src' folder but, after doing so you have to recompile the scripts with webpack. See below how to do it:

#### Prerequisites:
- [NodeJS](https://nodejs.org/en/download/)

#### Installation:
```bash
$ git clone https://github.com/WordPress/santa-runner.git
$ cd santa-runner
$ npm install
```

`npm run build` to build the bundled version (will be outputted into ./dist folder)

`npm run start` to start the webpack dev server @ `http://localhost:8080` 

---
### Credits
@ Chrome UX team in 2014 - Sebastien Gabriel, Alan Bettes, and Edward Jung
