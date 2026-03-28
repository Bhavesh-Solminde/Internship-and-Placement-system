import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001",
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor: attach JWT from localStorage ────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ips_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: handle 401 auto-logout ─────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("ips_token");
      localStorage.removeItem("ips_user");
      localStorage.removeItem("ips_role");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
