import axios from "axios";
import { handleError } from "@/Helpers";

export async function getGraphColoring({ graph, sudoku }) {
  try {
    const response = await axios.post("http://127.0.0.1:5000/graph-coloring", {
      graph,
      sudoku
    });
    return response.data;
  } catch (error) {
    return handleError(error);
  }
}

export default {
  getGraphColoring,
};
