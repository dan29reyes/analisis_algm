// components/GraphDisplayDialog.jsx
import React, { useRef, useEffect, useCallback } from "react";
import { Network } from "vis-network";
import HamiltonianDialog from "@/components/hamiltonianModal"; // Assuming this path is correct

// Import planet images (adjust paths as per your project structure)
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

const starMap =
  "https://images.unsplash.com/photo-1616712134411-6b6ae89bc3ba?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8c3BhY2UlMjBzdGFyc3x8ZW58MHx8MHx8fDA%3D";

const visOptions = {
  layout: {
    hierarchical: false,
    improvedLayout: true,
    randomSeed: undefined,
  },
  physics: {
    enabled: true, // Enable physics for better layout calculation on matrix graphs
    barnesHut: {
      gravitationalConstant: -2000,
      centralGravity: 0.3,
      springLength: 95,
      springConstant: 0.04,
      damping: 0.09,
      avoidOverlap: 0,
    },
    solver: "barnesHut",
    stabilization: {
      enabled: true,
      iterations: 1000,
      updateInterval: 25,
      fit: true,
    },
  },
  nodes: {
    shape: "dot",
    size: 30, // Increased size for better visibility
    font: {
      face: "Arial",
      size: 14, // Increased font size
      color: "#fff", // White color for labels
      align: "center",
    },
    borderWidth: 2,
    color: {
      border: "#61dafb", // A pleasant blue for node borders
      background: "#282c34", // Dark background for nodes
      highlight: {
        border: "#00ffff",
        background: "#4b0082",
      },
    },
  },
  edges: {
    width: 2, // Increased edge width
    arrows: {
      to: {
        enabled: false, // No arrows needed for undirected graph
      },
    },
    smooth: {
      enabled: true,
      type: "dynamic",
    },
    color: {
      color: "#ffff", // White color for edges
      highlight: "#00ffff",
      hover: "#00ffff",
    },
    font: {
      size: 10,
      align: "middle",
      color: "#fff",
    },
  },
  interaction: {
    navigationButtons: true,
    zoomView: true,
    dragNodes: true, // Allow dragging nodes for better arrangement
    dragView: true,
  },
  // Background color should be set on the container div, not directly on Vis.js options
};

// Reusable VisGraph component (copied from your original code)
const VisGraph = ({ graphData, options, index, isDialogGraph = false }) => {
  const containerRef = useRef(null);
  const currentNetworkInstance = useRef(null);

  useEffect(() => {
    if (
      containerRef.current &&
      graphData &&
      graphData.nodes &&
      graphData.edges
    ) {
      const data = {
        nodes: graphData.nodes,
        edges: graphData.edges,
      };

      if (currentNetworkInstance.current) {
        currentNetworkInstance.current.destroy();
        currentNetworkInstance.current = null;
      }

      const network = new Network(containerRef.current, data, options);
      currentNetworkInstance.current = network;
      // Fit the network after stabilization
      network.once("stabilizationIterationsDone", () => {
        network.fit();
      });
      // Ensure fit happens even if physics are disabled or not needed
      network.fit();
    }

    return () => {
      if (currentNetworkInstance.current) {
        currentNetworkInstance.current.destroy();
        currentNetworkInstance.current = null;
      }
    };
  }, [graphData, options, index, isDialogGraph]);

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

const GraphDisplayDialog = ({ isOpen, onClose, graphMatrix }) => {
  // Function to convert adjacency matrix to Vis.js nodes and edges
  const createGraphDataFromMatrix = useCallback((matrix) => {
    const nodes = [];
    const edges = [];
    const totalNodes = matrix.length;

    // Create nodes
    for (let i = 0; i < totalNodes; i++) {
      const planetImage =
        i < planets.length ? planets[i].planet : planets[0].planet;
      nodes.push({
        id: i, // Use number directly for id for Vis.js
        label: i < planets.length ? planets[i].name : `Vertex ${i}`, // Use planet name or generic
        shape: "image",
        image: planetImage.src || planetImage,
        size: 30,
        font: { color: "#fff" }, // Labels should be white for visibility on dark background
      });
    }

    // Create edges based on the adjacency matrix
    for (let i = 0; i < totalNodes; i++) {
      for (let j = i + 1; j < totalNodes; j++) {
        // Ensure i < j to avoid duplicate edges and self-loops (assuming undirected graph)
        if (matrix[i][j] === 1) {
          edges.push({
            from: i,
            to: j,
            color: "#ffff", // White color for connected edges
          });
        }
      }
    }
    return { nodes, edges };
  }, []);

  const dialogGraphData = graphMatrix
    ? createGraphDataFromMatrix(graphMatrix)
    : null;

  return (
    <HamiltonianDialog isOpen={isOpen} onClose={onClose} title="Grafo Original">
      {dialogGraphData ? (
        <div
          className="w-[90vw] h-[70vh] relative rounded-lg overflow-hidden" // Added rounded-lg and overflow-hidden
          style={{
            backgroundImage: `url(${starMap})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            zIndex: 1,
            backgroundColor: "#1a1a2e", 
            border: "2px solid #61dafb", 
          }}
        >
          <VisGraph
            graphData={dialogGraphData}
            options={visOptions}
            index={"matrix-graph-dialog"}
            isDialogGraph={true}
          />
        </div>
      ) : (
        <div className="w-[90vw] h-[70vh] flex items-center justify-center text-white text-lg bg-gray-900 rounded-lg">
          No graph data available to display.
        </div>
      )}
    </HamiltonianDialog>
  );
};

export default GraphDisplayDialog;
