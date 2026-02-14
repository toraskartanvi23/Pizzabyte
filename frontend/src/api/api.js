import axios from "axios";

const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API = axios.create({
  baseURL: `${baseUrl}/api`, // backend URL
});

export default API;
