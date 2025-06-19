import GraphColoringAccess from "@/pages/api/AccessPoints/graphcoloringpropio-accesspoint";
import { useState } from "react";


export default function GraphColoring() {
  const [board, setBoard] = useState(Array(9).fill().map(() => Array(9).fill(0)));
  const [result, setResult] = useState(null);
  const [isSolving, setIsSolving] = useState(false);

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
    setIsSolving(true);
    const graph = sudokuToGraph();
    const flatSudoku = board.flat();
    try {
      const response = await GraphColoringAccess.getGraphColoring({ graph, sudoku: flatSudoku });
      let tiempo = null;
      let solucion = null;
      if (response.output) {
        const match = response.output.match(/Tiempo de resolución: ([0-9.]+) segundos/);
        if (match) tiempo = match[1];
        const lines = response.output.split('\n');
        const startIdx = lines.findIndex(line => line.trim() === 'Sudoku resuelto:');
        if (startIdx !== -1) {
          solucion = lines.slice(startIdx + 1, startIdx + 10).map(line => line.trim().split(/\s+/).map(Number));
        }
      }
      setResult({ solucion, tiempo });
    } catch (error) {
      setResult({ solucion: null, tiempo: null, error: "Error al acceder al backend de Graph Coloring." });
    } finally {
      setIsSolving(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 pb-20 gap-8">
      <h1 className="text-4xl font-bold">Coloración de Grafos (Sudoku)</h1>
      <div className="grid grid-cols-9 gap-1 border-2 border-gray-400">
        {(result && result.solucion ? result.solucion : board).map((row, i) =>
          row.map((cell, j) => {
            const original = board[i][j];
            const isFilled = original !== 0;
            return result && result.solucion ? (
              <div
                key={`solved-${i}-${j}`}
                className={`w-8 h-8 flex items-center justify-center border border-gray-300 text-lg font-bold ${isFilled ? 'text-black' : 'text-red-600'}`}
              >
                {cell !== 0 ? cell : ''}
              </div>
            ) : (
              <input
                key={`${i}-${j}`}
                type="number"
                min="0"
                max="9"
                value={cell === 0 ? '' : cell}
                onChange={e => handleCellChange(i, j, e.target.value === '' ? 0 : e.target.value)}
                className="w-8 h-8 text-center border border-gray-300 focus:outline-none"
              />
            );
          })
        )}
      </div>
      {/* Botón solo si no hay solución */}
      {!result?.solucion && (
        <>
          <button onClick={handleSubmit} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" disabled={isSolving}>
            Resolver Sudoku
          </button>
          {isSolving && (
            <div className="w-full flex justify-center mt-2">
              <div className="w-40 h-3 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-3 bg-blue-400 animate-pulse w-full flex items-center justify-center text-xs text-white">Solving...</div>
              </div>
            </div>
          )}
        </>
      )}
      {/* Caja solo para el tiempo de resolución y errores */}
      {result && (
        <div className="mt-4 p-2 border rounded bg-gray-100 w-full max-w-xl text-center">
          {result.tiempo && <div className="mb-2 font-semibold">Tiempo de resolucion: {result.tiempo} segundos</div>}
          {result.error && <div className="text-red-600">{result.error}</div>}
        </div>
      )}
      <p className="text-sm text-gray-500 mt-8">Ingresa un Sudoku y Resuélvelo usando coloración de grafos.</p>
    </div>
  );
}

