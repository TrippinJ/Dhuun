import React, { useState } from "react";
import Navbar from "../Components/Navbar"; // Include Navbar
import styles from "../css/BeatExplorePage.module.css";
import { FaPlay, FaPause, FaShoppingCart } from "react-icons/fa";

const beatsData = [
  {
    id: 1,
    title: "Trap Anthem",
    producer: "DJ Beats",
    price: 19.99,
    genre: "Trap",
    bpm: 140,
    mood: "Aggressive",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    coverArt: "https://via.placeholder.com/100", // Replace with real image
  },
  {
    id: 2,
    title: "Lo-Fi Vibes",
    producer: "ChillMaster",
    price: 29.99,
    genre: "Lo-Fi",
    bpm: 90,
    mood: "Relaxing",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    coverArt: "https://via.placeholder.com/100",
  },
  {
    id: 3,
    title: "Hip Hop Classic",
    producer: "Beat King",
    price: 24.99,
    genre: "Hip Hop",
    bpm: 120,
    mood: "Energetic",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    coverArt: "https://via.placeholder.com/100",
  },
];

const BeatExplorePage = () => {
  const [beats, setBeats] = useState(beatsData);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [playing, setPlaying] = useState(false);

  const playAudio = (audioUrl) => {
    if (currentAudio && currentAudio.src === audioUrl) {
      if (playing) {
        currentAudio.pause();
        setPlaying(false);
      } else {
        currentAudio.play();
        setPlaying(true);
      }
    } else {
      if (currentAudio) {
        currentAudio.pause();
      }
      const newAudio = new Audio(audioUrl);
      newAudio.play();
      setCurrentAudio(newAudio);
      setPlaying(true);
    }
  };

  return (
    <div>
      <Navbar /> {/* Navbar at the top */}
      <div className={styles.container}>
        <h1 className={styles.heading}>Explore Beats</h1>
        <div className={styles.beatList}>
          {beats.map((beat) => (
            <div key={beat.id} className={styles.beatRow}>
              <img src={beat.coverArt} alt={beat.title} className={styles.coverArt} />
              <div className={styles.beatInfo}>
                <h3>{beat.title}</h3>
                <p>Producer: {beat.producer}</p>
                <p>Genre: {beat.genre} | BPM: {beat.bpm} | Mood: {beat.mood}</p>
                <p className={styles.price}>${beat.price}</p>
              </div>
              <div className={styles.controls}>
                <button
                  className={styles.playButton}
                  onClick={() => playAudio(beat.audioUrl)}
                >
                  {playing && currentAudio?.src === beat.audioUrl ? <FaPause /> : <FaPlay />}
                </button>
                <button className={styles.cartButton}>
                  <FaShoppingCart /> Buy
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BeatExplorePage;
