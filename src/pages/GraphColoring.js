import GraphColoringAccess from "@/pages/api/AccessPoints/graphcoloring-accesspoint";
import { useState } from "react";


export default function GraphColoring() {
  const [board, setBoard] = useState(Array(9).fill().map(() => Array(9).fill(0)));
  const [result, setResult] = useState(null);

  const handleCellChange = (row, col, value) => {
    const newBoard = board.map((r, i) =>
      r.map((cell, j) => (i === row && j === col ? Number(value) : cell))
    );
    setBoard(newBoard);
  };

  // Convierte el tablero de Sudoku a un grafo 
  const sudokuToGraph = () => {
    const V = 9 * 9;
    const graph = Array(V).fill().map(() => Array(V).fill(0));
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        const idx = i * 9 + j;
        for (let k = 0; k < 9; k++) {
          if (k !== j) graph[idx][i * 9 + k] = 1;
          if (k !== i) graph[idx][k * 9 + j] = 1;
        }
        const boxRow = Math.floor(i / 3) * 3;
        const boxCol = Math.floor(j / 3) * 3;
        for (let r = boxRow; r < boxRow + 3; r++) {
          for (let c = boxCol; c < boxCol + 3; c++) {
            const boxIdx = r * 9 + c;
            if (boxIdx !== idx) graph[idx][boxIdx] = 1;
          }
        }
      }
    }
    return graph;
  };

  const handleSubmit = async () => {
    const graph = sudokuToGraph();
    try {
      const response = await GraphColoringAccess.getGraphColoring(graph);
      setResult(response.output || JSON.stringify(response));
    } catch (error) {
      setResult("Error al acceder al backend de Graph Coloring.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 pb-20 gap-8">
      <h1 className="text-4xl font-bold">Coloración de Grafos (Sudoku)</h1>
      <div className="grid grid-cols-9 gap-1 border-2 border-gray-400">
        {board.map((row, i) =>
          row.map((cell, j) => (
            <input
              key={`${i}-${j}`}
              type="number"
              min="0"
              max="9"
              value={cell === 0 ? '' : cell}
              onChange={e => handleCellChange(i, j, e.target.value === '' ? 0 : e.target.value)}
              className="w-8 h-8 text-center border border-gray-300 focus:outline-none"
            />
          ))
        )}
      </div>
      <button onClick={handleSubmit} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        Resolver Sudoku
      </button>
      {result && <div className="mt-4 p-2 border rounded bg-gray-100 w-full max-w-xl text-center">{result}</div>}
      <p className="text-sm text-gray-500 mt-8">Ingresa un Sudoku y Resulvelo usando coloracion de grafos.</p>
    </div>
  );
}

