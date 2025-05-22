import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import styles from "../css/Login.module.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import API from "../api/api";
import { useAuth } from "../context/AuthContext"; // Import AuthContext

const Login = () => {
  const navigate = useNavigate();
  const { login, googleLogin, isLoggedIn, loading } = useAuth(); // Use AuthContext
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn && !loading) {
      // Get user from localStorage to determine redirect
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const userRole = user.role?.toLowerCase() || "buyer";
      
      if (userRole === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else if (userRole === "seller") {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/BeatExplorePage", { replace: true });
      }
    }
  }, [isLoggedIn, loading, navigate]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle form submission using AuthContext
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      console.log("Logging in with:", formData.email);
      
      // Use AuthContext login function
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        console.log("Login successful:", result.user);
        
        // Navigate based on user role
        const userRole = result.user.role?.toLowerCase() || "buyer";
        console.log("Redirecting based on role:", userRole);

        if (userRole === "admin") {
          console.log("Redirecting to Admin Dashboard");
          navigate("/admin/dashboard", { replace: true });
        } else if (userRole === "seller") {
          console.log("Redirecting to Dashboard");
          navigate("/dashboard", { replace: true });
        } else {
          console.log("Redirecting to BeatExplorePage");
          navigate("/BeatExplorePage", { replace: true });
        }
      } else {
        setErrorMessage(result.error || "Login failed. Please try again.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle password visibility
  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  // Google login using AuthContext
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (response) => {
      try {
        setIsSubmitting(true);
        console.log("Google auth success, getting user info...");
        
        const { data } = await axios.get(`https://www.googleapis.com/oauth2/v3/userinfo`, {
          headers: {
            Authorization: `Bearer ${response.access_token}`,
          },
        });

        console.log("Google User Info:", data);

        // Use AuthContext googleLogin function
        const result = await googleLogin({
          name: data.name,
          email: data.email,
          googleId: data.sub,
          avatar: data.picture,
        });

        if (result.success) {
          console.log("Google login successful:", result.user);
          
          // Handle new user role selection
          if (result.isNewUser) {
            console.log("New user - redirecting to role selection");
            navigate("/chooserole", { replace: true });
            return;
          }

          // Navigate based on user role
          const userRole = result.user.role?.toLowerCase() || "buyer";
          console.log("Existing user with role:", userRole);

          if (userRole === "admin") {
            navigate("/admin/dashboard", { replace: true });
          } else if (userRole === "seller") {
            navigate("/dashboard", { replace: true });
          } else {
            navigate("/BeatExplorePage", { replace: true });
          }
        } else {
          setErrorMessage(result.error || "Google login failed. Please try again.");
        }
      } catch (error) {
        console.error("Google login error:", error);
        setErrorMessage(`Google login failed: ${error.response?.data?.error || error.message}`);
      } finally {
        setIsSubmitting(false);
      }
    },
    onError: (error) => {
      console.error("Google OAuth error:", error);
      setErrorMessage("Google login was unsuccessful. Please try again.");
    },
  });

  // Show loading state while auth is being verified
  if (loading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Verifying authentication...</p>
        </div>
      </div>
    );
  }

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
              disabled={isSubmitting}
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
              disabled={isSubmitting}
              required
            />
            <label>Password</label>
            <span className={styles.togglePassword} onClick={handleTogglePassword}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}
          
          <button 
            type="submit" 
            className={styles.btn}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Logging in..." : "Login"}
          </button>

          {/* Google Login */}
          <div className={styles.googleLogin}>
            <button
              type="button"
              className={`${styles.btn} ${styles.googleBtn}`}
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
            >
              <ion-icon
                name="logo-google"
                style={{ fontSize: "1.2em", marginRight: "8px", verticalAlign: "middle" }}
              ></ion-icon>
              {isSubmitting ? "Logging in..." : "Login with Google"}
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