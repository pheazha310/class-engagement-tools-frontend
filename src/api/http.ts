import axios from "axios";

// Centralize axios instance so components don't directly depend on axios.
// This also ensures the dependency is explicit in one place.
export const http = axios.create({
  baseURL: "",
  headers: {
    "Content-Type": "application/json",
  },
});

