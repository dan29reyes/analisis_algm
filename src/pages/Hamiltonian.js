import hamiltonianAccess from "@/pages/api/AccessPoints/hamiltonian-access";
import { useState, useEffect, useCallback, useRef } from "react";
import { Network } from "vis-network";
import FadeInWhenVisible from "@/components/AnimatedComponent";
import HamiltonianDialog from "@/components/hamiltonianModal";
import Image from "next/image";
import { TypeAnimation } from "react-type-animation";

//planets
import alderaan from "@/assets/planets/planet_alderaan.png";
import balmorra from "@/assets/planets/planet_balmorra.png";
import belsavis from "@/assets/planets/planet_belsavis.png";
import corellia from "@/assets/planets/planet_corellia.png";
import coruscant from "@/assets/planets/planet_coruscant.png";
import dromundkass from "@/assets/planets/planet_dromundkass.png";
import hoth from "@/assets/planets/planet_hoth.png";
import hutta from "@/assets/planets/planet_hutta.png";
import narshaddaa from "@/assets/planets/planet_narshaddaa.png";
import tatooine from "@/assets/planets/planet_tatooine.png";
import taris from "@/assets/planets/planet_taris.png";
import kashyyyk from "@/assets/planets/planet_kashyyyk.png";
import voss from "@/assets/planets/planet_voss.png";
import deathstar from "@/assets/planets/Death_Star.webp";
import { Switch } from "@headlessui/react";

// Clan logos
import republicLogo from "@/assets/logos/republic_logo.png";
import separatistLogo from "@/assets/logos/separatist_logo.png";
import { Expand, Clock, Spline } from "lucide-react";

export default function Hamiltonian() {
  const [vertex_count, setVertexCount] = useState(1);
  const [start_vertex, setStartVertex] = useState(0);
  const [hamiltonianInfo, setHamiltonianInfo] = useState(null);
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [isTypingResponse, setIsTypingResponse] = useState(false);
  const [topPathsData, setTopPathsData] = useState([]);
  const [displayedVertexCount, setDisplayedVertexCount] = useState(1);
  const [displayedStartVertex, setDisplayedStartVertex] = useState(0);
  const [graphElements, setGraphElements] = useState([]);
  const [method, setMethod] = useState("pathfinder");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogGraphData, setDialogGraphData] = useState(null);

  const starMap =
    "https://images.unsplash.com/photo-1616712134411-6b6ae89bc3ba?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8c3BhY2UlMjBzdGFyc3x8ZW58MHx8MHx8fDA%3D";
  const planets = [
    { name: "Death Star", planet: deathstar },
    { name: "Alderaan", planet: alderaan },
    { name: "Balmorra", planet: balmorra },
    { name: "Belsavis", planet: belsavis },
    { name: "Corellia", planet: corellia },
    { name: "Coruscant", planet: coruscant },
    { name: "Dromund Kass", planet: dromundkass },
    { name: "Hoth", planet: hoth },
    { name: "Hutta", planet: hutta },
    { name: "Nar Shaddaa", planet: narshaddaa },
    { name: "Tatooine", planet: tatooine },
    { name: "Taris", planet: taris },
    { name: "Voss", planet: voss },
    { name: "Kashyyyk", planet: kashyyyk },
  ];

  const generateVisElements = useCallback(
    (pathData, totalNodes) => {
      const nodes = [];
      const edges = [];
      const pathNodes = new Set(pathData.path);

      for (let i = 0; i < totalNodes; i++) {
        const planetImage =
          i < planets.length ? planets[i].planet : planets[0].planet;
        nodes.push({
          id: `node-${i}`,
          label: i < planets.length ? planets[i].name : planets[0].name,
          shape: "image",
          image: planetImage.src || planetImage,
          size: 30,
          font: { color: pathNodes.has(i) ? "#fff" : "#000" },
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
          color: "#ffff",
        });
      }
      return { nodes, edges };
    },
    [displayedStartVertex]
  );

  useEffect(() => {
    const newGraphElements = Array.from({ length: 9 }, (_, i) => {
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

  const getLowest = useCallback(() => {
    if (topPathsData.length === 0) return null;
    const resp = topPathsData.reduce((min, path) => {
      return path.path_length < min.path_length ? path : min;
    }, topPathsData[0]);
    return resp;
  }, [topPathsData]);

  const testHamiltonianAccess = async () => {
    setIsApiLoading(true);
    setIsTypingResponse(false);
    setHamiltonianInfo(null);
    setTopPathsData([]);
    setDisplayedVertexCount(vertex_count);
    setDisplayedStartVertex(start_vertex);

    try {
      const response = await hamiltonianAccess.getHamiltonianInfo(
        vertex_count,
        start_vertex,
        method
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

        let fullHamiltonianInfo = `Tiempo total: ${response.total_time_seconds} seconds\nCantidad de Vertices: ${response.graph_vertices}\nCaminos Encontrados: ${response.total_paths_found}\nTop Caminos:\n${formattedPaths}`;

        if (receivedTopPaths.length > 0) {
          const lowestPathResult = getLowest();
          if (lowestPathResult) {
            fullHamiltonianInfo += `\n\nCamino más corto:\n${
              lowestPathResult.name
            }: ${lowestPathResult.path.join(" -> ")}, Longitud: ${
              lowestPathResult.path_length
            }`;
          }
        }

        setHamiltonianInfo(fullHamiltonianInfo);
        setIsTypingResponse(true);
      } else {
        console.error("No data received from Hamiltonian access.");
        setHamiltonianInfo("Error: No data received from Hamiltonian access.");
        setIsTypingResponse(true);
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
      setIsTypingResponse(true);
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
    backgroundcolor: "transparent",
  };

  const VisGraph = ({ graphData, options, index, isDialogGraph = false }) => {
    const containerRef = useRef(null);
    const currentNetworkInstance = useRef(null);

    useEffect(() => {
      if (containerRef.current) {
        const data = {
          nodes: graphData.elements.nodes,
          edges: graphData.elements.edges,
        };

        if (currentNetworkInstance.current) {
          currentNetworkInstance.current.destroy();
          currentNetworkInstance.current = null;
        }

        const network = new Network(containerRef.current, data, options);
        currentNetworkInstance.current = network;
        network.fit();
      }

      return () => {
        if (currentNetworkInstance.current) {
          currentNetworkInstance.current.destroy();
          currentNetworkInstance.current = null;
        }
      };
    }, [graphData.id, graphData.elements, options, index, isDialogGraph]);

    return (
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "transparent",
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 2,
        }}
      ></div>
    );
  };

  const openDialogWithGraph = (graph) => {
    setDialogGraphData(graph);
    setIsDialogOpen(true);
  };

  const genericLoadingSequence = [
    "Calculando el camino más óptimo...",
    1500,
    "Analizando la vasta red galáctica...",
    1500,
    "Evitando los asteroides...",
    1500,
    "Rastreando las señales de la fuerza...",
    1500,
    "Reuniendo datos de rutas estelares...",
    1500,
    "Buscando el rumbo en el hiperespacio...",
    1500,
    "¡Pronto tendremos tus caminos!",
    1500,
  ];

  const clearPageData = () => {
    setHamiltonianInfo(null);
    setTopPathsData([]);
    setDisplayedVertexCount(1);
    setDisplayedStartVertex(0);
    setGraphElements([]);
    setIsApiLoading(false);
    setIsTypingResponse(false);
  };

  return (
    <div
      className={
        `flex flex-col min-h-screen p-8 pb-20 gap-4 bg-gradient-to-r ` +
        (method !== "pathfinder"
          ? "from-cyan-900 to-cyan-300"
          : "from-red-900 to-black")
      }
    >
      <FadeInWhenVisible delay={0.1}>
        <div className="flex justify-between">
          <div className="flex items-center gap-4">
            <img
              src={
                method !== "pathfinder"
                  ? "https://fiverr-res.cloudinary.com/images/f_auto,q_auto,t_main1/v1/attachments/delivery/asset/5b20686a5227f6e8aba008711b318c54-1691088613/jedi%20walk%20front/make-pixel-art-sprites-characters-and-animations.gif"
                  : "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/75ea55d3-a433-4fbb-aa82-d31111063dc0/d4mh6ry-6502ac89-97e3-4297-9a10-efcf023654ff.gif?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiJcL2ZcLzc1ZWE1NWQzLWE0MzMtNGZiYi1hYTgyLWQzMTExMTA2M2RjMFwvZDRtaDZyeS02NTAyYWM4OS05N2UzLTQyOTctOWExMC1lZmNmMDIzNjU0ZmYuZ2lmIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.QX2XN5El0iZO7rBsxFw-Z1dT8F4MUuuFnYGAoMAk2w0"
              }
              alt="Logo"
              className={`rounded-full ${
                method !== "pathfinder" ? "h-28" : "h-20"
              } `}
            />
            <div className="flex flex-col items-start justify-end">
              <h1 className="text-4xl font-bold">Hamiltoniano</h1>
              <p className="text-base">
                Esta página es una prueba de acceso a puntos hamiltonianos en un
                grafo. Puedes ingresar
                <br /> el número de vértices y el vértice de inicio para probar
                el acceso a puntos hamiltonianos.
              </p>
              <p className="text-sm text-gray-400">
                Número recomendado de vértices 11
              </p>
              <div className="flex justify-center gap-2 mt-2">
                <Switch
                  checked={method !== "pathfinder"}
                  onChange={() => {
                    setMethod((prev) =>
                      prev === "pathfinder"
                        ? "community_path_finder"
                        : "pathfinder"
                    );
                    clearPageData();
                  }}
                  className={`${
                    method !== "pathfinder" ? "bg-cyan-950" : "bg-red-950"
                  } relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none cursor-pointer`}
                >
                  <span
                    className={`${
                      method !== "pathfinder"
                        ? "translate-x-6 bg-cyan-500"
                        : "translate-x-1 bg-red-500"
                    } inline-block w-4 h-4 transform rounded-full transition-transform`}
                  />
                </Switch>
                <p className="flex text-base text-gray-200 h-full">
                  {method !== "pathfinder"
                    ? "Republic Code"
                    : "Separatist code"}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
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
              className="px-8 py-2 mt-6 bg-gray-50 text-black rounded hover:bg-gray-200 transition-colors cursor-pointer h-fit"
              onClick={testHamiltonianAccess}
              disabled={isApiLoading}
            >
              Test
            </button>
            <Image
              src={method !== "pathfinder" ? republicLogo : separatistLogo}
              alt="Logo"
              className="h-24 w-28"
            />
          </div>
        </div>
      </FadeInWhenVisible>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-8">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 w-full col-span-2">
          {graphElements.map((graph, index) => (
            <div
              key={graph.id}
              className={`border p-2 rounded shadow-md ${
                method === "pathfinder"
                  ? "bg-red-950 text-red-500 border-red-500"
                  : "bg-cyan-950 text-cyan-500 border-cyan-500"
              }`}
            >
              <h3 className="flex text-sm font-semibold justify-between">
                {graph.isEmpty
                  ? `Empty Path ${index + 1}`
                  : graph.pathInfo.name}{" "}
                <button
                  className="text-xs text-white hover:underline cursor-pointer"
                  onClick={() => openDialogWithGraph(graph)}
                  disabled={graph.isEmpty}
                >
                  Expandir <Expand className="inline h-4 w-4" />
                </button>
              </h3>
              <h3 className="flex text-sm font-semibold py-2">
                <Clock className="inline h-4 w-4 mr-2" />
                {graph.isEmpty
                  ? `Sin Tiempo`
                  : "Tiempo " + graph.pathInfo.time_taken_seconds + "s"}
              </h3>
              <h3 className="flex text-sm font-semibold mb-2">
                <Spline className="inline h-4 w-4 mr-2" />
                {graph.isEmpty
                  ? `Sin recorrido`
                  : "Camino: " + graph.pathInfo.path}
              </h3>
              <div
                className={`w-full h-[200px] border solid rounded relative ${
                  method === "pathfinder" ? "border-red-500" : "border-cyan-500"
                }`}
                style={{
                  backgroundImage: `url(${starMap})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  zIndex: 1,
                }}
              >
                <VisGraph
                  graphData={graph}
                  options={visOptions}
                  index={index}
                />
              </div>
            </div>
          ))}
        </div>

        <div
          className={`h-full p-4 border-2 col-span-1 border-black rounded-md overflow-auto whitespace-pre-wrap ${
            method === "pathfinder"
              ? "bg-red-950 text-red-500"
              : "bg-cyan-950 text-cyan-500"
          }`}
          style={{
            textAlign: "left",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {isApiLoading || isTypingResponse || !hamiltonianInfo ? (
            <TypeAnimation
              key={hamiltonianInfo || "loading-sequence"}
              sequence={
                isApiLoading
                  ? genericLoadingSequence
                  : hamiltonianInfo
                  ? [
                      hamiltonianInfo,
                      () => {
                        setIsTypingResponse(false);
                      },
                    ]
                  : genericLoadingSequence
              }
              wrapper="span"
              speed={80}
              repeat={isApiLoading || !hamiltonianInfo ? Infinity : 0}
              style={{ display: "inline-block" }}
            />
          ) : (
            hamiltonianInfo
          )}
        </div>
      </div>

      <HamiltonianDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={
          dialogGraphData
            ? `${dialogGraphData.pathInfo.name} (Length: ${dialogGraphData.pathInfo.path_length})`
            : ""
        }
      >
        {dialogGraphData ? (
          <div
            className="w-[90vw] h-[70vh] relative"
            style={{
              backgroundImage: `url(${starMap})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              zIndex: 1,
            }}
          >
            <VisGraph
              graphData={dialogGraphData}
              options={visOptions}
              index={"dialog-graph"}
              isDialogGraph={true}
            />
          </div>
        ) : (
          <div className="w-[90vw] h-[70vh] flex items-center justify-center text-white">
            No graph data available.
          </div>
        )}
      </HamiltonianDialog>
    </div>
  );
}
