#!/usr/bin/env node
import { withFullScreen } from 'fullscreen-ink';
// import meow from 'meow';
import App from './app.js';

// const cli = meow(
//   `
// 	Usage
// 	  $ simple

// 	Options
// 		--name  Your name

// 	Examples
// 	  $ simple --name=Jane
// 	  Hello, Jane
// `,
//   {
//     importMeta: import.meta,
//     flags: {
//       name: {
//         type: 'string',
//       },
//     },
//   }
// );

withFullScreen(<App />).start();
