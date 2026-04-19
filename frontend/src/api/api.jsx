import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "https://dhuun-backend.onrender.com",
});

// ─── In-memory token store (never read localStorage in interceptors) ───────
let _accessToken = null;
let _refreshToken = null;
let _onUnauthorized = null;
let _isRefreshing = false;
let _failedQueue = []; // requests waiting while token refreshes

export const setAuthTokens = (accessToken, refreshToken) => {
  _accessToken = accessToken;
  _refreshToken = refreshToken;
};

export const clearAuthTokens = () => {
  _accessToken = null;
  _refreshToken = null;
};

export const onUnauthorized = (cb) => {
  _onUnauthorized = cb;
};

// Drain the queue of requests that were waiting for a token refresh
const processQueue = (error, token = null) => {
  _failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  _failedQueue = [];
};

// ─── Request interceptor ───────────────────────────────────────────────────
API.interceptors.request.use(
  (config) => {
    if (_accessToken) {
      config.headers.Authorization = `Bearer ${_accessToken}`;
    }
    if (import.meta.env.DEV) {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    if (!(config.data instanceof FormData)) {
      config.headers["Content-Type"] = "application/json";
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor — auto refresh on 401 ───────────────────────────
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh on 401, and not on the refresh route itself
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh-token")
    ) {
      if (_isRefreshing) {
        // Another request already triggered a refresh — queue this one
        return new Promise((resolve, reject) => {
          _failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return API(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      _isRefreshing = true;

      try {
        if (!_refreshToken) throw new Error("No refresh token available");

        const { data } = await axios.post(
          `${API.defaults.baseURL}/api/auth/refresh-token`,
          { refreshToken: _refreshToken }
        );

        const { accessToken, refreshToken } = data;

        // Update in-memory tokens
        setAuthTokens(accessToken, refreshToken);

        // Persist new tokens to localStorage
        localStorage.setItem("token", accessToken);
        localStorage.setItem("refreshToken", refreshToken);

        // Retry all queued requests with new token
        processQueue(null, accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return API(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);

        // Refresh failed — full logout
        clearAuthTokens();
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("cart");

        if (_onUnauthorized) _onUnauthorized();
        return Promise.reject(refreshError);
      } finally {
        _isRefreshing = false;
      }
    }

    if (import.meta.env.DEV) {
      console.error("API Error:", {
        url: error.config?.url,
        status: error.response?.status,
        data: error.response?.data,
      });
    }

    return Promise.reject(error);
  }
);

// ─── Profile helpers ───────────────────────────────────────────────────────
API.getUserProfile = async function () {
  const response = await this.get("/api/profile");
  return response.data;
};

API.getProfileByUsername = async function (username) {
  const response = await this.get(`/api/profile/user/${username}`);
  return response.data;
};

API.updateUserProfile = async function (profileData) {
  const formData = new FormData();
  Object.keys(profileData).forEach((key) => {
    if (key === "avatar" && profileData[key] instanceof File) {
      formData.append("avatar", profileData[key]);
    } else if (key === "socialLinks" && typeof profileData[key] === "object") {
      Object.keys(profileData[key]).forEach((social) => {
        formData.append(`socialLinks[${social}]`, profileData[key][social]);
      });
    } else if (key !== "avatar") {
      formData.append(key, profileData[key]);
    }
  });

  if (import.meta.env.DEV) {
    for (let [key, value] of formData.entries()) {
      console.log(`FormData: ${key} = ${value instanceof File ? `File: ${value.name}` : value}`);
    }
  }

  const response = await this.put("/api/profile", formData);
  return response.data;
};

export default API;