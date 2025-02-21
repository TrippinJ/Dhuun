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

  // Handle form submission (Login Request)
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await API.post("/api/auth/login", formData, {
        headers: { "Content-Type": "application/json" },
      });

      // Store token in local storage
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      alert("Login successful!");
      navigate("/"); // Redirect to home
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Invalid credentials. Try again.");
    }
  };

  // Toggle password visibility
  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  // Google Login Handler
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (response) => {
      try {
        const { data } = await axios.get(`https://www.googleapis.com/oauth2/v3/userinfo`, {
          headers: {
            Authorization: `Bearer ${response.access_token}`,
          },
        });

        console.log("Google User Info:", data);
        alert(`Welcome, ${data.name}`);
        localStorage.setItem("user", JSON.stringify(data)); 
        navigate("/"); 
      } catch (error) {
        console.error("Google login failed:", error);
        setErrorMessage("Google login failed. Please try again.");
      }
    },
    onError: () => {
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
