import axios from "axios";
import { handleError } from "@/Helpers";

export async function getSubsetSumInfo(numbers, targetSum, algorithm = 1) {
  try {
    const response = await axios.request({
      method: "POST",
      url: `http://127.0.0.1:5000/subset-sum`,
      data: {
        numbers: numbers,
        target: targetSum,
        algorithm: algorithm
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    return handleError(error);
  }
}

export default {
  getSubsetSumInfo,
};