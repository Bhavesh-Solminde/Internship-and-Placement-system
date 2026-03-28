import { create } from "zustand";

// Try to parse existing user session from local storage immediately to prevent flicker
let initialUser = null;
let initialToken = null;
let initialRole = null;

const savedToken = localStorage.getItem("ips_token");
const savedUser = localStorage.getItem("ips_user");
const savedRole = localStorage.getItem("ips_role");

if (savedToken && savedUser && savedRole) {
  try {
    initialToken = savedToken;
    initialUser = JSON.parse(savedUser);
    initialRole = savedRole;
  } catch {
    localStorage.removeItem("ips_token");
    localStorage.removeItem("ips_user");
    localStorage.removeItem("ips_role");
  }
}

export const useAuthStore = create((set) => ({
  user: initialUser,
  token: initialToken,
  role: initialRole,
  isAuthenticated: !!initialToken,

  login: (userData, jwtToken, userRole) => {
    localStorage.setItem("ips_token", jwtToken);
    localStorage.setItem("ips_user", JSON.stringify(userData));
    localStorage.setItem("ips_role", userRole);
    set({
      user: userData,
      token: jwtToken,
      role: userRole,
      isAuthenticated: true,
    });
  },

  logout: () => {
    localStorage.removeItem("ips_token");
    localStorage.removeItem("ips_user");
    localStorage.removeItem("ips_role");
    set({
      user: null,
      token: null,
      role: null,
      isAuthenticated: false,
    });
  },

  updateUser: (updatedData) =>
    set((state) => {
      const merged = { ...state.user, ...updatedData };
      localStorage.setItem("ips_user", JSON.stringify(merged));
      return { user: merged };
    }),
}));
