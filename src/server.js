const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors')
const path = require('path');
const WebSocket = require('ws')
const { accounts_monitor } = require('./models/nano_websockets')

const http_port = 3000
const ws_port = 3001

const startServer = function () {

  const app = express()

  app.use(cors())
  app.options('*', cors())

  app.use(express.static(path.join(__dirname, '/views')));

  app.set('views', './src/views')

  app.set('view engine', 'ejs');

  app.use(bodyParser.text({ inflate: true, limit: '4kb', type: '*/*' }));

  const routes = require('./routes/routes');
  app.use("/", routes)

  app.listen(http_port, () => {
    console.log(`Server listening at: http://localhost:${http_port}`)
  })
}

// WebSockets Repeater
const startWSServer = function () {
  const server = new WebSocket.Server({
    port: ws_port
  });

  let sockets = [];

  server.on('listening', () => {
    console.log(`Websocket listening at: http://localhost:${ws_port}`)
  });


  // Detect new websocket connections
  server.on('connection', function (socket) {

    console.log("connection websocket detected")
    sockets.push(socket);

    // When receive a websocket message from client
    socket.on('message', function (msg) {

      try {

        // Check if msg is valid
        data = JSON.parse(msg)
        if ("topic" in data && data.topic == "confirmation") {
          if ("options" in data && "accounts" in data.options) {

            // Check if accounts are valid
            data.options.accounts.forEach(account => {
              // check if account is valid
            })

            // Start monitoring and repeat msgs for client
            accounts_monitor(data.options.accounts, function (res) {
              socket.send(JSON.stringify(res))
            })

          }
        } else {
          socket.send(JSON.stringify({ error: "invalid topic" }))
        }

      } catch (err) {

        // The received message has formatting errors
        // Or we had an error in the connection
        console.error(err)
        socket.send(JSON.stringify({ error: err }))

      }

    });

    // When a socket connection is closed/disconnected, we remove the socket from the array
    socket.on('close', function () {
      console.log("closing socket")
      sockets = sockets.filter(s => s !== socket);
    });
  });
}

module.exports = { startServer, startWSServer }