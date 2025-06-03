import hamiltonianAccess from "@/pages/api/AccessPoints/hamiltonian-access";
import { useState } from "react";

export default function Hamiltonian() {
  const [vertex_count, setVertexCount] = useState(1);
  const [start_vertex, setStartVertex] = useState(0);
  const [hamiltonianInfo, setHamiltonianInfo] = useState(null);

  const testHamiltonianAccess = async () => {
    try {
      const response = await hamiltonianAccess.getHamiltonianInfo(
        vertex_count,
        start_vertex
      );
      if (response) {
        let formattedPaths = response.top_paths
          .map(
            (path) =>
              `${path.name}: ${path.path.join(" -> ")}, Longitud: ${
                path.path_length
              }`
          )
          .join("\n");
        setHamiltonianInfo(
          `Tiempo total: ${response.total_time_seconds} seconds\nCantidad de Vertices: ${response.graph_vertices}\nCaminos Encontrados: ${response.total_paths_found}\nTop Caminos:\n${formattedPaths}`
        );
      } else {
        console.error("No data received from Hamiltonian access.");
      }
    } catch (error) {
      console.error("Error accessing Hamiltonian:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 pb-20 gap-4">
      <h1 className="text-4xl font-bold">Hamiltoniano</h1>
      <p className="text-lg">
        Esta página es un marcador de posición para la funcionalidad
        Hamiltoniana.
      </p>
      <p className="text-sm text-gray-400">Número recomendado de vértices 11</p>
      <div className="flex flex-col gap-4">
        <label className="flex flex-col">
          <span className="text-lg">Número de vértices:</span>
          <input
            type="number"
            min={1}
            value={vertex_count}
            onChange={(e) => setVertexCount(Number(e.target.value))}
            className="mt-2 p-2 border rounded"
          />
        </label>

        <label className="flex flex-col">
          <span className="text-lg">Vértice de inicio:</span>
          <input
            type="number"
            min={0}
            value={start_vertex}
            onChange={(e) => setStartVertex(Number(e.target.value))}
            className="mt-2 p-2 border rounded"
          />
        </label>
      </div>
      <button
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors cursor-pointer"
        onClick={testHamiltonianAccess}
      >
        Test
      </button>
      <textarea
        className="w-full h-64 p-4 mt-4 border rounded"
        placeholder="Aquí se mostrarán los resultados de la prueba..."
        readOnly
        value={hamiltonianInfo}
      />
    </div>
  );
}
