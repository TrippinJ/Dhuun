import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../css/Register.module.css"; 
import API from "../api/api";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullname: "",
    username: "",
    phonenumber: "",
    email: "",
    password: "",
    confirmpassword: "",
  });

  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("🔄 Attempting to register with:", formData);

    // Password validation
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
      };

      // Send request
      const response = await API.post("/api/auth/register", payload, {
        headers: { "Content-Type": "application/json" },
      });

      console.log("✅ Registration successful:", response.data);
      alert(response.data.message || "Registered successfully!");
      navigate("/login"); // Redirect after successful registration
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
                <ion-icon name="call"></ion-icon>
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
