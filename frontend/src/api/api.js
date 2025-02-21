import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_URL || "http://localhost:8080", // Backend URL
  headers: {
    "Content-Type": "application/json",
  },
});

export default API;
