import hamiltonianAccess from "@/pages/api/AccessPoints/hamiltonian-access";
import { useState, useEffect } from "react";

export default function Hamiltonian() {
  const [vertex_count, setVertexCount] = useState(1);
  const [start_vertex, setStartVertex] = useState(0);
  const [hamiltonianInfo, setHamiltonianInfo] = useState(null);
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [isVisualizingPaths, setIsVisualizingPaths] = useState(false);
  const [pathProgress, setPathProgress] = useState({});
  const [topPathsData, setTopPathsData] = useState([]);
  const [lowestPath, setLowestPath] = useState(null);

  useEffect(() => {
    let intervals = {};
    if (isVisualizingPaths && topPathsData.length > 0) {
      Object.values(intervals).forEach(clearInterval);

      const initialProgress = {};
      topPathsData.forEach((path) => {
        initialProgress[path.name] = 0;
      });
      setPathProgress(initialProgress);

      topPathsData.forEach((path) => {
        const duration = path.time_taken_seconds * 1000;
        const startTime = Date.now();

        intervals[path.name] = setInterval(() => {
          const elapsedTime = Date.now() - startTime;
          let newProgress = (elapsedTime / duration) * 100;

          if (newProgress >= 100) {
            newProgress = 100;
            clearInterval(intervals[path.name]);
          }

          setPathProgress((prev) => {
            if (prev.hasOwnProperty(path.name)) {
              return { ...prev, [path.name]: newProgress };
            }
            return prev;
          });
        }, 50);
      });
    } else if (!isVisualizingPaths && Object.keys(pathProgress).length > 0) {
      const timeout = setTimeout(() => {
        setPathProgress({});
        Object.values(intervals).forEach(clearInterval);
      }, 1000);
      return () => clearTimeout(timeout);
    }

    return () => {
      Object.values(intervals).forEach(clearInterval);
    };
  }, [isVisualizingPaths, topPathsData]);

  const getLowest = () => {
    if (topPathsData.length === 0) return null;
    const resp = topPathsData.reduce((min, path) => {
      return path.path_length < min.path_length ? path : min;
    }, topPathsData[0]);
    setLowestPath(resp);
    return resp;
  };

  const testHamiltonianAccess = async () => {
    setIsApiLoading(true);
    setIsVisualizingPaths(false);
    setHamiltonianInfo(null);
    setTopPathsData([]);
    setPathProgress({});

    try {
      const response = await hamiltonianAccess.getHamiltonianInfo(
        vertex_count,
        start_vertex
      );
      if (response) {
        setTopPathsData(response.top_paths || []);
        let formattedPaths = (response.top_paths || [])
          .map(
            (path) =>
              `${path.name}: ${path.path.join(" -> ")}, Longitud: ${
                path.path_length
              }, Tiempo: ${path.time_taken_seconds}s`
          )
          .join("\n");
        setHamiltonianInfo(
          `Tiempo total: ${response.total_time_seconds} seconds\nCantidad de Vertices: ${response.graph_vertices}\nCaminos Encontrados: ${response.total_paths_found}\nTop Caminos:\n${formattedPaths}`
        );

        if (response.top_paths && response.top_paths.length > 0) {
          const lowestPath = getLowest();
          if (lowestPath) {
            setHamiltonianInfo(
              (prev) =>
                `${prev}\n\nCamino más corto:\n${
                  lowestPath.name
                }: ${lowestPath.path.join(" -> ")}, Longitud: ${
                  lowestPath.path_length
                }`
            );
          }
        }
        setIsVisualizingPaths(true);
      } else {
        console.error("No data received from Hamiltonian access.");
      }
    } catch (error) {
      console.error(
        "Error accessing Hamiltonian:",
        error,
        error.response ? error.response.data : ""
      );
      setHamiltonianInfo(
        `Error: ${error.message || "Unknown error"}. Check console for details.`
      );
      setTopPathsData([]);
    } finally {
      setIsApiLoading(false);
      if (!topPathsData.length) {
        setIsVisualizingPaths(false);
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen p-8 pb-20 gap-4">
      <div className="flex justify-between">
        <div className="flex flex-col items-start">
          <h1 className="text-4xl font-bold">Hamiltoniano</h1>
          <p className="text-lg">
            Esta página es un marcador de posición para la funcionalidad
            Hamiltoniana.
          </p>
          <p className="text-sm text-gray-400">
            Número recomendado de vértices 11
          </p>
        </div>
        <div className="flex items-end gap-4">
          <label className="flex flex-col">
            <span className="text-base">Número de vértices:</span>
            <input
              type="number"
              min={1}
              value={vertex_count}
              onChange={(e) => setVertexCount(Number(e.target.value))}
              className="p-2 border rounded"
            />
          </label>
          <label className="flex flex-col">
            <span className="text-base">Vértice de inicio:</span>
            <input
              type="number"
              min={0}
              value={start_vertex}
              onChange={(e) => setStartVertex(Number(e.target.value))}
              className="p-2 border rounded"
            />
          </label>
          <button
            className="px-8 py-2 bg-gray-300 text-black rounded hover:bg-gray-400 transition-colors cursor-pointer h-fit"
            onClick={testHamiltonianAccess}
            disabled={isApiLoading}
          >
            Test
          </button>
        </div>
      </div>

      <div className="w-full flex flex-col gap-2">
        {isVisualizingPaths && topPathsData.length > 0 ? (
          topPathsData.map((path) => (
            <div key={path.name} className="flex items-center gap-2">
              <span className="w-24 text-left text-sm font-medium">
                {path.name}:
              </span>
              <div className="flex-grow h-4 bg-gray-200 rounded-full overflow-hidden w-full">
                <div
                  className="h-full bg-green-500 transition-all duration-100 ease-linear"
                  style={{ width: `${pathProgress[path.name] || 0}%` }}
                />
              </div>
              <span className="flex text-sm text-gray-400 w-fit">
                {`${(pathProgress[path.name] || 0).toFixed(2)}%`}
              </span>
            </div>
          ))
        ) : (
          <div className="text-gray-500 w-full text-center text-xl py-12">
            {hamiltonianInfo && !isApiLoading
              ? "Haz clic en 'Test' para iniciar la prueba Hamiltoniana."
              : "Calculando resultados..."}
          </div>
        )}
      </div>
      <textarea
        className="w-full h-64 p-4 mt-4 border rounded"
        placeholder="Aquí se mostrarán los resultados de la prueba..."
        readOnly
        value={hamiltonianInfo}
      />
    </div>
  );
}
