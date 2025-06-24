import GraphColoringAccess from "@/pages/api/AccessPoints/graphcoloringpropio-accesspoint";
import GraphColoringComunidadAccess from "@/pages/api/AccessPoints/graphcoloring-accesspoint";
import { useState } from "react";


export default function GraphColoring() {
  const [board, setBoard] = useState(Array(9).fill().map(() => Array(9).fill(0)));
  const [result, setResult] = useState({comunidad: null, propio: null});
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
      // Llamar ambos endpoints en paralelo
      const [comunidadResp, propioResp] = await Promise.all([
        GraphColoringComunidadAccess.getGraphColoring({ graph, sudoku: flatSudoku }),
        GraphColoringAccess.getGraphColoring({ graph, sudoku: flatSudoku })
      ]);
      // Procesar comunidad
      let comunidad = { solucion: null, tiempo: null, error: null };
      if (comunidadResp.output) {
        // Buscar ambas variantes: 'Tiempo de resolucion' y 'Tiempo de resolución'
        let match = comunidadResp.output.match(/Tiempo de resoluci[oó]n: ([0-9.]+) segundos/);
        if (match) comunidad.tiempo = match[1];
        const lines = comunidadResp.output.split('\n');
        const startIdx = lines.findIndex(line => line.trim() === 'Sudoku resuelto:');
        if (startIdx !== -1) {
          comunidad.solucion = lines.slice(startIdx + 1, startIdx + 10).map(line => line.trim().split(/\s+/).map(Number));
        }
      } else {
        comunidad.error = "Error al acceder al backend de Comunidad.";
      }
      // Procesar propio
      let propio = { solucion: null, tiempo: null, error: null };
      if (propioResp.output) {
        let match = propioResp.output.match(/Tiempo de resoluci[oó]n: ([0-9.]+) segundos/);
        if (match) propio.tiempo = match[1];
        const lines = propioResp.output.split('\n');
        const startIdx = lines.findIndex(line => line.trim() === 'Sudoku resuelto:');
        if (startIdx !== -1) {
          propio.solucion = lines.slice(startIdx + 1, startIdx + 10).map(line => line.trim().split(/\s+/).map(Number));
        }
      } else {
        propio.error = "Error al acceder al backend de Propio.";
      }
      setResult({ comunidad, propio });
    } catch (error) {
      setResult({
        comunidad: { solucion: null, tiempo: null, error: "Error al acceder al backend de Comunidad." },
        propio: { solucion: null, tiempo: null, error: "Error al acceder al backend de Propio." }
      });
    } finally {
      setIsSolving(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 pb-20 gap-8 bg-gray-900 text-white">
      <h1 className="text-4xl font-bold">Coloración de Grafos (Sudoku)</h1>
      <div className="flex flex-row gap-12">
        {/* Tablero para Sudoku Comunidad */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Sudoku Comunidad</h2>
          <div className="grid grid-cols-9 gap-1 border-2 border-gray-700 bg-gray-800 rounded-lg p-2">
            {(result.comunidad && result.comunidad.solucion ? result.comunidad.solucion : board).map((row, i) =>
              row.map((cell, j) => {
                const original = board[i][j];
                const isFilled = original !== 0;
                return result.comunidad && result.comunidad.solucion ? (
                  <div
                    key={`solved-comunidad-${i}-${j}`}
                    className={`w-12 h-12 flex items-center justify-center border border-gray-700 text-xl font-bold rounded ${isFilled ? 'text-white bg-gray-900' : 'text-red-400 bg-gray-800'}`}
                  >
                    {cell !== 0 ? cell : ''}
                  </div>
                ) : (
                  <input
                    key={`comunidad-${i}-${j}`}
                    type="number"
                    min="0"
                    max="9"
                    value={cell === 0 ? '' : cell}
                    onChange={e => handleCellChange(i, j, e.target.value === '' ? 0 : e.target.value)}
                    className="w-12 h-12 text-center border border-gray-700 bg-gray-900 text-white rounded focus:outline-none"
                  />
                );
              })
            )}
          </div>
          {result.comunidad && (
            <div className="mt-2 text-center">
              {result.comunidad.tiempo !== null && result.comunidad.tiempo !== undefined && result.comunidad.tiempo !== '' && (
                <div className="text-xs text-green-400">Tiempo: {result.comunidad.tiempo} s</div>
              )}
              {result.comunidad.error && <div className="text-xs text-red-400">{result.comunidad.error}</div>}
            </div>
          )}
        </div>
        {/* Tablero para Sudoku Propio */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Sudoku Propio</h2>
          <div className="grid grid-cols-9 gap-1 border-2 border-gray-700 bg-gray-800 rounded-lg p-2">
            {(result.propio && result.propio.solucion ? result.propio.solucion : board).map((row, i) =>
              row.map((cell, j) => {
                const original = board[i][j];
                const isFilled = original !== 0;
                return result.propio && result.propio.solucion ? (
                  <div
                    key={`solved-propio-${i}-${j}`}
                    className={`w-12 h-12 flex items-center justify-center border border-gray-700 text-xl font-bold rounded ${isFilled ? 'text-white bg-gray-900' : 'text-red-400 bg-gray-800'}`}
                  >
                    {cell !== 0 ? cell : ''}
                  </div>
                ) : (
                  <input
                    key={`propio-${i}-${j}`}
                    type="number"
                    min="0"
                    max="9"
                    value={cell === 0 ? '' : cell}
                    onChange={e => handleCellChange(i, j, e.target.value === '' ? 0 : e.target.value)}
                    className="w-12 h-12 text-center border border-gray-700 bg-gray-900 text-white rounded focus:outline-none"
                  />
                );
              })
            )}
          </div>
          {result.propio && (
            <div className="mt-2 text-center">
              {result.propio.tiempo !== null && result.propio.tiempo !== undefined && result.propio.tiempo !== '' && (
                <div className="text-xs text-green-400">Tiempo: {result.propio.tiempo} s</div>
              )}
              {result.propio.error && <div className="text-xs text-red-400">{result.propio.error}</div>}
            </div>
          )}
        </div>
      </div>
      {!(result.comunidad && result.comunidad.solucion) && !(result.propio && result.propio.solucion) && (
        <>
          <button onClick={handleSubmit} className="mt-4 px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800" disabled={isSolving}>
            Resolver Sudoku
          </button>
          {isSolving && (
            <div className="w-full flex justify-center mt-2">
              <div className="w-40 h-3 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-3 bg-blue-500 animate-pulse w-full flex items-center justify-center text-xs text-white">Solving...</div>
              </div>
            </div>
          )}
        </>
      )}
      <p className="text-sm text-gray-400 mt-8">Ingresa un Sudoku y Resuélvelo usando coloración de grafos.</p>
    </div>
  );
}

