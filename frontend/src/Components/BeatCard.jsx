import React from "react";
import styles from "../css/BeatCard.modules.css";

const BeatCard = ({ beat }) => {
  return (
    <div className={styles.card}>
      <img src={beat.coverImage} alt={beat.title} className={styles.coverImage} />
      <h3 className={styles.title}>{beat.title}</h3>
      <p className={styles.artist}>
        {beat.artist} <span className={styles.verified}>✔</span>
      </p>
      <div className={styles.priceTag}>${beat.price.toFixed(2)}</div>
      <audio controls className={styles.audioPlayer}>
        <source src={beat.fileUrl} type="audio/mpeg" />
      </audio>
      <button className={styles.buyBtn}>Add to Cart</button>
    </div>
  );
};

export default BeatCard;
