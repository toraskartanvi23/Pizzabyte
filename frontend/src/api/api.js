import axios from "axios";

const baseUrl = import.meta.env.VITE_API_URL || "https://pizzabyte.onrender.com";
const API = axios.create({
  baseURL: `${baseUrl}/api`, // backend URL
});

export default API;
