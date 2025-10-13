import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export const analyzeScreen = async (frame: string) => {
  const response = await axios.post(`${API_BASE_URL}/screen2vec`, { frame });
  return response.data;
};
