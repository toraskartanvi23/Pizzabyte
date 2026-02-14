import axios from "axios";

// Backend URL from environment variable
const baseUrl = import.meta.env.REACT_APP_API_URL || "https://pizzabyte.onrender.com";

const API = axios.create({
  baseURL: baseUrl,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // needed if backend uses cookies/sessions
});

// Optional: log requests
API.interceptors.request.use(
  (config) => {
    console.log("API Request:", config.method.toUpperCase(), config.url);
    return config;
  },
  (error) => Promise.reject(error)
);

// Optional: log responses/errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Response Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default API;


