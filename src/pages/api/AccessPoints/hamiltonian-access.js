import axios from "axios";
import { handleError } from "@/Helpers";

export async function getHamiltonianInfo(vertexCount, startVertex) {
  try {
    const response = await axios.request({
      method: "GET",
      url: `http://127.0.0.1:5000/find-paths?vertices=${vertexCount}&start=${startVertex}`,
    });
    return response.data;
  } catch (error) {
    return handleError(error);
  }
}

export default {
  getHamiltonianInfo,
};
