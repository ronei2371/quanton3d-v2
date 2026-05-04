import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
  (import.meta.env.PROD ? "/api" : "http://localhost:10000/api");

const api = axios.create({
  baseURL,
});

export default api;
