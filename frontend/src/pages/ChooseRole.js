import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "../css/ChooseRole.module.css";
import { FaUser, FaUserTie } from "react-icons/fa";
import Logo from "../Assets/DHUUN.png";  

const ChooseRole = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.roleContainer}>
      
      

      <div className={styles.content}>

      <img
       src={Logo} alt="Dhuun Logo" className={styles.logo}
        onClick={() => navigate("/")}
        style={{ cursor: "pointer" }} 
      />
        <h1>Welcome To Dhuun </h1>
        <p>"Where words fail, music speaks" - Hans Christian Andersen</p>

        <div className={styles.roleCards}>
          <div
            className={styles.roleCard}
            onClick={() => navigate("/register?role=buyer")}
          >
            <FaUser className={styles.icon} />
            <h3>Buy Beats </h3>
            <p>Purchase high-quality beats from producers worldwide.</p>
          </div>

          <div
            className={styles.roleCard}
            onClick={() => navigate("/register?role=seller")}
          >
            <FaUserTie className={styles.icon} />
            <h3>Sell Beats</h3>
            <p>Upload and sell your beats to artists worldwide.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChooseRole;
