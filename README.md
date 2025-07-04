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

Last but not least, you're going to need an Android phone and a USB cord to attach it to your machine. It's important your Android has developer settings enabled - there are different ways to do that, it's best to Google your make and model. 

Once that's all set, run 
```
npx expo run:android --device
```
from the root of this repo. That should send the app to your device! And voila, you're running it on your phone.
