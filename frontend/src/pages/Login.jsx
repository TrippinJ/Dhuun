import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import styles from "../css/Login.module.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import API from "../api/api";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  /// Handle form submission (Login Request)
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      console.log("Logging in with:", formData.email);
      const response = await API.post("/api/auth/login", formData, {
        headers: { "Content-Type": "application/json" },
      });

      // Store token in local storage
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      // Log user data to verify role
      console.log("User data:", response.data.user);
      console.log("User role:", response.data.user.role);

      // Improved role check with fallback
      const userRole = response.data.user.role?.toLowerCase() || "buyer";
      console.log("Redirecting based on role:", userRole);

      if (userRole === "admin") {
        console.log("Redirecting to Admin Dashboard");
        navigate("/admin/dashboard");
      } else if (userRole === "seller") {
        console.log("Redirecting to Dashboard");
        navigate("/Dashboard");
      } else {
        console.log("Redirecting to BeatExplorePage");
        navigate("/BeatExplorePage");
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage(error.response?.data?.message || "Invalid credentials. Try again.");
    }
  };

  // Toggle password visibility
  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  // in frontend/src/pages/Login.js

  // In frontend/src/pages/Login.js
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (response) => {
      try {
        console.log("Google auth success, getting user info...");
        const { data } = await axios.get(`https://www.googleapis.com/oauth2/v3/userinfo`, {
          headers: {
            Authorization: `Bearer ${response.access_token}`,
          },
        });

        console.log("Google User Info:", data);

        // Send data to backend for storing user info
        const backendResponse = await API.post("/api/auth/google-login", {
          name: data.name,
          email: data.email,
          googleId: data.sub, // Unique Google ID
          avatar: data.picture, // Profile picture URL
        });

        console.log("Backend response:", backendResponse.data);

        // Store token and user details
        localStorage.setItem("token", backendResponse.data.token);
        localStorage.setItem("user", JSON.stringify(backendResponse.data.user));

        // Check if this is a new user needing to select a role
        if (backendResponse.data.isNewUser) {
          console.log("This is a new user - redirecting to role selection");
          navigate("/chooserole");
          return;
        }

        // For existing users, check their role and redirect appropriately
        const userRole = backendResponse.data.user.role?.toLowerCase() || "buyer";
        console.log("Existing user with role:", userRole);

        if (userRole === "admin") {
          console.log("Redirecting to Admin Dashboard");
          navigate("/admin/dashboard");
        } else if (userRole === "seller") {
          console.log("Redirecting to Dashboard");
          navigate("/Dashboard");
        } else {
          console.log("Redirecting to BeatExplorePage");
          navigate("/BeatExplorePage");
        }
      } catch (error) {
        console.error("Google login error:", error);
        console.error("Error details:", error.response?.data || error.message);
        setErrorMessage(`Google login failed: ${error.response?.data?.error || error.message}`);
      }
    },
    onError: (error) => {
      console.error("Google OAuth error:", error);
      setErrorMessage("Google login was unsuccessful. Please try again.");
    },
  });

  return (
    <div className={styles.wrapper}>
      {/* Cross button to navigate back to home */}
      <button className={styles.iconClose} onClick={() => navigate("/")}>
        ✕
      </button>
      <div className={`${styles.formBox} ${styles.login}`}>
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.inputBox}>
            <span className={styles.icon}>
              <ion-icon name="mail"></ion-icon>
            </span>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <label>Email</label>
          </div>
          <div className={styles.inputBox}>
            <span className={styles.icon}>
              <ion-icon name="lock-closed"></ion-icon>
            </span>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <label>Password</label>
            <span className={styles.togglePassword} onClick={handleTogglePassword}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}
          <button type="submit" className={styles.btn}>Login</button>

          {/* Google Login */}
          <div className={styles.googleLogin}>
            <button
              type="button"
              className={`${styles.btn} ${styles.googleBtn}`}
              onClick={handleGoogleLogin}
            >
              <ion-icon
                name="logo-google"
                style={{ fontSize: "1.2em", marginRight: "8px", verticalAlign: "middle" }}
              ></ion-icon>
              Login with Google
            </button>
          </div>

          <div className={styles.forgotPassword}>
            <p>
              <Link to="/forgot-password" className={styles.forgotPasswordLink}>
                Forgot Password?
              </Link>
            </p>
          </div>
          
          <div className={styles.loginRegister}>
            <p>
              Don't have an account?{" "}
              <Link to="/Register" className={styles.registerLink}>
                Register
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
