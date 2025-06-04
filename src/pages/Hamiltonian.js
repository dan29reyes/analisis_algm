import hamiltonianAccess from "@/pages/api/AccessPoints/hamiltonian-access";
import { useState, useEffect, useCallback, useRef } from "react";
import { Network } from "vis-network";

export default function Hamiltonian() {
  const [vertex_count, setVertexCount] = useState(1);
  const [start_vertex, setStartVertex] = useState(0);
  const [hamiltonianInfo, setHamiltonianInfo] = useState(null);
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [topPathsData, setTopPathsData] = useState([]);
  const [displayedVertexCount, setDisplayedVertexCount] = useState(1);
  const [displayedStartVertex, setDisplayedStartVertex] = useState(0);
  const [graphElements, setGraphElements] = useState([]);

  const networkInstancesRef = useRef([]);

  const getLowest = useCallback(() => {
    if (topPathsData.length === 0) return null;
    const resp = topPathsData.reduce((min, path) => {
      return path.path_length < min.path_length ? path : min;
    }, topPathsData[0]);
    return resp;
  }, [topPathsData]);

  const generateVisElements = useCallback(
    (pathData, totalNodes) => {
      const nodes = [];
      const edges = [];
      const pathNodes = new Set(pathData.path);

      for (let i = 0; i < totalNodes; i++) {
        nodes.push({
          id: `node-${i}`,
          label: `Node ${i}`,
          color: pathNodes.has(i) ? "#007bff" : "#666",
          font: { color: pathNodes.has(i) ? "#fff" : "#000" },
          shape: "dot",
          size: 15,
        });
      }

      for (let i = 0; i < pathData.path.length - 1; i++) {
        const sourceNode = pathData.path[i];
        const targetNode = pathData.path[i + 1];
        if (typeof sourceNode !== "number" || typeof targetNode !== "number") {
          console.warn("Invalid node in path:", pathData.path);
          continue;
        }
        edges.push({
          from: `node-${sourceNode}`,
          to: `node-${targetNode}`,
          arrows: "to",
          color: "#28a745",
        });
      }
      return { nodes, edges };
    },
    [displayedStartVertex]
  );

  useEffect(() => {
    const newGraphElements = Array.from({ length: 10 }, (_, i) => {
      const pathData = topPathsData[i];
      if (pathData) {
        return {
          id: pathData.name || `path-${i}`,
          elements: generateVisElements(pathData, displayedVertexCount),
          pathInfo: pathData,
          isEmpty: false,
        };
      } else {
        return {
          id: `placeholder-${i}`,
          elements: { nodes: [], edges: [] },
          pathInfo: { name: `Path ${i + 1}`, path_length: 0, path: [] },
          isEmpty: true,
        };
      }
    });
    setGraphElements(newGraphElements);
  }, [
    topPathsData,
    generateVisElements,
    displayedVertexCount,
    displayedStartVertex,
  ]);

  const testHamiltonianAccess = async () => {
    setIsApiLoading(true);
    setHamiltonianInfo(null);
    setTopPathsData([]);
    setDisplayedVertexCount(vertex_count);
    setDisplayedStartVertex(start_vertex);

    try {
      const response = await hamiltonianAccess.getHamiltonianInfo(
        vertex_count,
        start_vertex
      );

      if (response) {
        const receivedTopPaths = response.top_paths || [];
        setTopPathsData(receivedTopPaths);

        let formattedPaths = receivedTopPaths
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

        if (receivedTopPaths.length > 0) {
          const lowestPathResult = getLowest();
          if (lowestPathResult) {
            setHamiltonianInfo(
              (prev) =>
                `${prev}\n\nCamino más corto:\n${
                  lowestPathResult.name
                }: ${lowestPathResult.path.join(" -> ")}, Longitud: ${
                  lowestPathResult.path_length
                }`
            );
          }
        }
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
    }
  };

  const visOptions = {
    layout: {
      hierarchical: false,
      improvedLayout: true,
      randomSeed: undefined,
    },
    physics: {
      enabled: false,
      stabilization: {
        enabled: false,
      },
    },
    nodes: {
      shape: "dot",
      size: 15,
      font: {
        face: "Arial",
        size: 8,
        color: "#000",
        align: "center",
      },
      borderWidth: 1,
      color: {
        border: "#2B7CE9",
        background: "#97C2E5",
      },
    },
    edges: {
      width: 1,
      arrows: "to",
      smooth: {
        enabled: true,
        type: "dynamic",
      },
      font: {
        size: 6,
        align: "middle",
      },
    },
    interaction: {
      navigationButtons: true,
      zoomView: true,
      dragNodes: false,
      dragView: true,
    },
  };

  const VisGraph = ({ graphData, options, index }) => {
    const containerRef = useRef(null);

    useEffect(() => {
      let network = networkInstancesRef.current[index];

      if (containerRef.current) {
        const data = {
          nodes: graphData.elements.nodes,
          edges: graphData.elements.edges,
        };

        if (!network) {
          network = new Network(containerRef.current, data, options);
          networkInstancesRef.current[index] = network;
          network.fit();
        } else {
          network.setData(data);
          network.fit();
        }
      }

      return () => {
        if (network) {
          network.destroy();
          networkInstancesRef.current[index] = null;
        }
      };
    }, [graphData.id, graphData.elements, options, index]);

    return (
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: graphData.isEmpty ? "#f0f0f0" : "transparent",
        }}
      ></div>
    );
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

      {isApiLoading && (
        <div className="text-gray-500 w-full text-center text-xl py-12">
          Calculando resultados...
        </div>
      )}
      {!isApiLoading && topPathsData.length === 0 && (
        <div className="text-gray-500 w-full text-center text-xl py-12">
          Ajusta los parámetros y presiona 'Test' para generar caminos
          Hamiltonianos.
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mt-8">
        {graphElements.map((graph, index) => (
          <div key={graph.id} className="border p-2 rounded shadow-md">
            <h3 className="flex text-sm font-semibold mb-2 justify-between">
              {graph.isEmpty ? `Empty Path ${index + 1}` : graph.pathInfo.name}{" "}
              (Length: {graph.pathInfo.path_length})
              <button
                className="text-xs text-blue-500 hover:underline cursor-pointer"
                onClick={() => {
                  const path = graph.pathInfo.path.join(" -> ");
                  alert(`Path: ${path}`);
                }}
                disabled={graph.isEmpty}
              >
                Expandir
              </button>
            </h3>
            <div
              style={{
                width: "100%",
                height: "200px",
                border: "1px solid #eee",
              }}
            >
              <VisGraph graphData={graph} options={visOptions} index={index} />
            </div>
          </div>
        ))}
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
