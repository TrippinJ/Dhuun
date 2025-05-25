import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "../css/Register.module.css"; 
import API from "../api/api";

const Register = () => {

  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  
  // ✅ Get role from URL or set default as 'buyer'
  const [role, setRole] = useState(queryParams.get("role") || "buyer"); 

  const [formData, setFormData] = useState({
    fullname: "",
    username: "",
    phonenumber: "",
    email: "",
    password: "",
    confirmpassword: "",
    role: role,
  });

  const [errorMessage, setErrorMessage] = useState("");

    // ✅ Update role when URL changes
    useEffect(() => {
      const params = new URLSearchParams(location.search);
      const newRole = queryParams.get("role") || "buyer";
      setRole(newRole);
      setFormData((prev) => ({ ...prev, role: newRole })); // ✅ Update formData with role
    }, [location.search]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("🔄 Attempting to register with:", formData);

    // Password validation
    if (formData.password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    if (formData.password !== formData.confirmpassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      // Construct payload based on backend expectations
      const payload = {
        name: formData.fullname,  
        username: formData.username,
        phonenumber: formData.phonenumber, // Ensure backend expects "phonenumber"
        email: formData.email,
        password: formData.password,
        role: formData.role,
      };

      // Send request
      const response = await API.post("/api/auth/register", payload, {
        headers: { "Content-Type": "application/json" },
      });

      console.log("✅ Registration successful:", response.data);
      
      if (response.data.verificationRequired) {
        // Save email to use in verification page
        localStorage.setItem("pendingVerificationEmail", formData.email);
        
        // Show success message before redirecting
        alert("Registration successful! Please verify your email with the code we sent you.");
        
        // Redirect to verification page
        navigate("/verify-otp", { state: { email: formData.email } });
      } else {
        // Fallback for cases where verification might be disabled
        alert(response.data.message || "Registered successfully!");
        
        // Redirect users based on role
        if (formData.role === "seller") {
          navigate("/dashboard");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (error) {
      console.error("❌ Registration Error:", error.response?.data || error.message);
      setErrorMessage(error.response?.data?.message || "An error occurred during registration.");
    }
  };

  const togglePassword = (fieldId) => {
    const passwordField = document.getElementById(fieldId);
    if (passwordField.type === "password") {
      passwordField.type = "text";
    } else {
      passwordField.type = "password";
    }
  };

  return (
    <div className={styles.registerBody}>
      <div className={styles.wrapper}>
        <button className={styles.iconClose} onClick={() => navigate("/")}>
          ✕
        </button>
        <div className={`${styles.formBox} ${styles.register}`}>
          <h2>Registration</h2>
          <form onSubmit={handleSubmit} autoComplete="off">
            <div className={styles.inputBox}>
              <span className={styles.icon}>
                <ion-icon name="person"></ion-icon>
              </span>
              <input
                type="text"
                name="fullname"
                value={formData.fullname}
                onChange={handleChange}
                required
              />
              <label>Fullname</label>
            </div>
            <div className={styles.inputBox}>
              <span className={styles.icon}>
                <ion-icon name="person"></ion-icon>
              </span>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
              />
              <label>Username</label>
            </div>
            <div className={styles.inputBox}>
              <span className={styles.icon}>
                <ion-icon name="call"></ion-icon>
              </span>
              <input
                type="text"
                name="phonenumber"
                value={formData.phonenumber}
                onChange={handleChange}
                required
              />
              <label>Phone number</label>
            </div>
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
                type="password"
                name="password"
                id="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <label>Password</label>
              <span
                className={styles.togglePassword}
                onClick={() => togglePassword("password")}
              >
                👁
              </span>
            </div>
            <div className={styles.inputBox}>
              <span className={styles.icon}>
                <ion-icon name="lock-closed"></ion-icon>
              </span>
              <input
                type="password"
                name="confirmpassword"
                id="confirmpassword"
                value={formData.confirmpassword}
                onChange={handleChange}
                required
              />
              <label>Confirm Password</label>
              <span
                className={styles.togglePassword}
                onClick={() => togglePassword("confirmpassword")}
              >
                👁
              </span>
            </div>
            {errorMessage && <span className={styles.errorMessage}>{errorMessage}</span>}
            <button type="submit" className={styles.btn}>Register</button>
            <div className={styles.loginRegister}>
              <p>
                Already have an account?{" "}
                <a href="/login" className={styles.loginLink}>
                  Login
                </a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;