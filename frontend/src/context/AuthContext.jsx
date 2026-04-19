import React, { createContext, useState, useEffect, useContext } from 'react';
import API, { setAuthTokens, clearAuthTokens, onUnauthorized } from '../api/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ─── Shared setter used by all login paths ────────────────────────────
  const applyAuth = (accessToken, refreshToken, userData) => {
    // Persist tokens (access + refresh) to survive page refresh
    localStorage.setItem("token", accessToken);
    localStorage.setItem("refreshToken", refreshToken);

    // Prime the API layer — no more reading localStorage in interceptors
    setAuthTokens(accessToken, refreshToken);

    setUser(userData);
    setIsLoggedIn(true);
    setError(null);
  };

  // ─── On mount: restore session from localStorage ──────────────────────
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const accessToken = localStorage.getItem("token");
        const refreshToken = localStorage.getItem("refreshToken");

        if (!accessToken || !refreshToken) {
          setLoading(false);
          return;
        }

        // Prime the API layer so the verify call carries the token
        setAuthTokens(accessToken, refreshToken);

        // Verify with server and get FRESH user data from DB
        const response = await API.get("/api/auth/verify");
        const freshUser = response.data.user;

        setUser(freshUser);
        setIsLoggedIn(true);
      } catch (err) {
        // verify failed — interceptor will attempt refresh automatically.
        // If refresh also fails, onUnauthorized fires and clears everything.
        console.warn("Session restore failed:", err.message);
        clearAuthTokens();
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        setIsLoggedIn(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    // Wire 401 → logout so the UI always reflects real auth state
    onUnauthorized(() => logout());

    restoreSession();
  }, []);

  // ─── Login ────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await API.post("/api/auth/login", { email, password });
      const { accessToken, refreshToken, user } = response.data;

      applyAuth(accessToken, refreshToken, user);
      return { success: true, user };
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Login failed";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // ─── Google Login ─────────────────────────────────────────────────────
  const googleLogin = async (googleData) => {
    try {
      setLoading(true);
      const response = await API.post("/api/auth/google-login", googleData);
      const { accessToken, refreshToken, user, isNewUser } = response.data;

      applyAuth(accessToken, refreshToken, user);
      return { success: true, user, isNewUser };
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Google login failed";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // ─── Logout ───────────────────────────────────────────────────────────
  const logout = async () => {
    try {
      // Tell server to invalidate the refresh token
      await API.post("/api/auth/logout");
    } catch {
      // Ignore — we still clear locally
    } finally {
      clearAuthTokens();
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("cart");

      setIsLoggedIn(false);
      setUser(null);
      setError(null);
    }
  };

  // ─── Update user in state only (no localStorage) ─────────────────────
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    // Server is source of truth — don't cache user object in localStorage
  };

  const value = {
    user,
    isLoggedIn,
    loading,
    error,
    login,
    logout,
    googleLogin,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};