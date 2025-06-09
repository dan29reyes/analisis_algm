import axios from "axios";
import { handleError } from "@/Helpers";

export async function getGraphColoring(graph) {
  try {
    // Serialize and encode the graph for URL
    const graphParam = encodeURIComponent(JSON.stringify(graph));
    const response = await axios.request({
      method: "GET",
      url: `http://127.0.0.1:5000/graph-coloring?graph=${graphParam}`,
    });
    return response.data;
  } catch (error) {
    return handleError(error);
  }
}

export default {
  getGraphColoring,
};