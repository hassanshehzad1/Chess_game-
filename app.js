// Requiring modules
const express = require("express");
const http = require("http");
const socket = require("socket.io");
const path = require("path");
const Chess = require("chess.js").Chess;
const chess = new Chess();
const app = express();

// Creating a socket server
const server = http.createServer(app);
const io = socket(server);

// Setting on view
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

// Creating players
let players = {};
let playerTurn = "w";

// Starting the server
app.get("/", (req, res) => {
  res.render("index", { title: "Chess Game" });
});

// Conncetion with io
let playerName = "";
io.on("connection", (client) => {
  client.on("playerName", (name) => (playerName = name));

  //  Players white
  if (!players.white) {
    players.white = client.id;
    client.emit("playerTurn", "w");
  }
  // Players black
  else if (!players.black) {
    players.black = client.id;
    client.emit("playerTurn", "b");
  }
  // Spectators
  else {
    client.emit("Spectators");
  }

  // Disconnet
  client.on("disconnect", () => {
    if (client.id === players.white) {
      delete players.white;
    } else if (client.id === players.black) {
      delete players.black;
    }

    // Reset game
    if (!players.white && !players.black) {
      chess.reset();
    }
  });

  // Handling the client move
  client.on("move", (move) => {
    try {
      // Invalid move
      if (!move.from || !move.to) {
        client.emit("invalidmove", "Invalid move format.");
        return;
      }

      //Wrong turns
      if (
        (chess.turn() === "w" && client.id !== players.white) ||
        (chess.turn() === "b" && client.id !== players.black)
      ) {
        client.emit("invalidMove", "Its not your turn");
        return;
      }
      // Check result
      const result = chess.move(move);

      if (result) {
        playerTurn = chess.turn();
        io.emit("move", move);
        io.emit("boardState", chess.fen());
      } else {
        client.emit("invalidMove", "This is not valid move");
      }
    } catch (error) {
      console.error(error);
      client.emit("Invalid move: ", "This is not valid move");
    }
  });
});

server.listen(3000);
