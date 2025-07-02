## Installation and setup

First make sure you have Node installed on your machine. If you don't, I'd recommend installing it with `nvm`, or Node Version Manager, because cleaning up Node versions is a huge, huge pain in the ass.

Once you've got Node installed, from this folder run
```
npm install
```
Then run
```
npm install -g expo
```
That should give you the expo CLI. Expo is a React Native development framework that makes it easy to build mobile apps without all the added IOS/Android cruft. We'll be using that for our development server as we work on this project.

Last but not least, you're going to need the Expo Go app. You can get it [here](https://expo.dev/go). Expo is what lets you run the project on your phone - it's a sandbox that downloads the React Native project you're serving locally.