# Real time web game that uses ethereum blockchain

## Development
- Solidity
The rest of the game is dependant of the contracts, so you have to build the contracts first.
Contracts are built with truffle 4 which you have to install.
Navigate to /solidity and run truffle develop, from the you can run the migrate command.

 - Server
 The server is written in Node.js and is using socket.io for communication with the frontend
 You can run the server by going to /server and running `npm start`
 Server listens on port 60000

 - Frontend
 The game is written in Phaser and opensource game engine.
 The menu and other settings are written in Preact a lightweight version on React.

 To run the frontend navigate to /frontend
 Run `npm install` or `yarn install`
 And run `npm run dev` a development server will start