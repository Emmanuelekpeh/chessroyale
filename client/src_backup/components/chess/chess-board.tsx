import { useEffect, useState } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";

interface ChessBoardProps {
  fen: string;
  onMove: (move: string) => void;
}

export default function ChessBoard({ fen, onMove }: ChessBoardProps) {
  const [game, setGame] = useState(new Chess(fen));

  useEffect(() => {
    setGame(new Chess(fen));
  }, [fen]);

  const makeMove = (sourceSquare: string, targetSquare: string) => {
    try {
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });

      if (move) {
        setGame(new Chess(game.fen()));
        onMove(move.san);
        return true;
      }
    } catch {
      return false;
    }
    return false;
  };

  return (
    <div className="w-full max-w-[600px] mx-auto">
      <Chessboard
        position={game.fen()}
        onPieceDrop={(sourceSquare, targetSquare) => makeMove(sourceSquare, targetSquare)}
        customBoardStyle={{
          borderRadius: "8px",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
        }}
      />
    </div>
  );
}
