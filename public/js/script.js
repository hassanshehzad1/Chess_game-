// Connected with backend
const socket = io();
const chess = new Chess();
const boardElement = document.getElementById("boardElement");

let playerRole = null;
let sourceSquare = null;
let draggPiece = null;

// Getting name
let playerName;
do {
  playerName = prompt("Enter name: ");
} while (!playerName);
socket.emit("playerName", playerName);

// Render board
const renderBoard = () => {
  const board = chess.board();
  boardElement.innerHTML = "";

  // Iterate  rows
  board.forEach((row, rowIndex) => {
    // Iterate each square
    row.forEach((col, colIndex) => {
      // square element
      const squareElement = document.createElement("div");
      squareElement.classList.add(
        "square",
        (rowIndex + colIndex) % 2 === 0 ? "light" : "dark"
      );

      // Assigning a value to evey square index
      squareElement.dataset.row = rowIndex;
      squareElement.dataset.col = colIndex;
      // Piece for each square
      if (col) {
        const pieceElement = document.createElement("div");
        pieceElement.classList.add(
          "piece",
          col.color === "w" ? "white" : "black"
        );

        // Sending  piece
        pieceElement.innerText = pieceUnicodeValue(col);
        pieceElement.draggable = playerRole === col.color;

        // Drag event on piece
        pieceElement.addEventListener("dragstart", (e) => {
          if (pieceElement.draggable) {
            draggPiece = pieceElement;
            sourceSquare = { row: rowIndex, col: colIndex };
            e.dataTransfer.setData("text/plain", "");
          }
        });

        // Drag event end
        pieceElement.addEventListener("dragend", (e) => {
          draggPiece = null;
          sourceSquare = null;
        });
        squareElement.appendChild(pieceElement);
      }

      // Drag over
      squareElement.addEventListener("dragover", (e) => {
        e.preventDefault();
      });

      // Drop the element on a target
      squareElement.addEventListener("drop", (e) => {
        e.preventDefault();

        if (draggPiece) {
          const targetSquare = {
            row: Number(squareElement.dataset.row),
            col: Number(squareElement.dataset.col),
          };

          // Handle moves
          handleMove(sourceSquare, targetSquare);
        }
      });

      //   Appending it boardElement
      boardElement.appendChild(squareElement);
    });
  });
};

// Get unicode
const pieceUnicodeValue = (piece) => {
  const unicodePieces = {
    r: "\u2656", // wrook
    n: "\u2658", // wknight
    b: "\u2657", // wbishop
    q: "\u2655", // wqueen
    k: "\u2654", // wking
    p: "\u2659", // wpawn
    r: "\u265C", // brook
    n: "\u265E", // bknight
    b: "\u265D", // bbishop
    q: "\u265B", // bqueen
    k: "\u265A", // bking
    p: "\u265F", // bpawn
  };
  return unicodePieces[piece.type] || "";
};

// Handle move from source to target
const handleMove = (source, target) => {
  fromSqaure = `${String.fromCharCode(97 + source.col)}${8 - source.row}`;
  toSqaure = `${String.fromCharCode(97 + target.col)}${8 - target.row}`;

  // Check if the move is a pawn promotion (i.e., pawn reaching the 8th or 1st rank)
  const piece = chess.get(fromSqaure);

  if (!piece) {
    console.error("No place at source square", move.from);
    alert("No place at source square");
    return;
  }
  const move = {
    from: fromSqaure,
    to: toSqaure,
  };

  if (piece.type === "p" && (target.row === 0 || target.row === 7)) {
    move.promotion = "q"; // Set promotion to queen
  }
  socket.emit("move", move);

  // Invalid move
  socket.on("invalidMove", (message) => {
    alert(message);
  });
};

socket.on("invalidMove", (message, playersName) => {
  alert(
    `${message}\nplayer 1:, ${playerNames.white}\nplayer 2: ${playerNames.black}`
  );
});

// Handling the backend
socket.on("playerTurn", (role) => {
  playerRole = role;
  renderBoard();
});
socket.on("Spectators", () => {
  playerRole = null;
  renderBoard();
});

socket.on("boardState", (fen) => {
  chess.load(fen);
  renderBoard();
});
socket.on("move", (move) => {
  chess.move(move);
  renderBoard();
});
