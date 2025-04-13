import React from "react";
import styles from "../css/Filters.module.css";

const Filters = ({ filters, setFilters }) => {
  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <div className={styles.filters}>
      <select name="genre" value={filters.genre} onChange={handleFilterChange} className={styles.filterSelect}>
        <option value="">All Genres</option>
        <option value="Trap">Trap</option>
        <option value="Hip-Hop">Hip-Hop</option>
        <option value="RnB">R&B</option>
      </select>
      <select name="price" value={filters.price} onChange={handleFilterChange} className={styles.filterSelect}>
        <option value="asc">Price: Low to High</option>
        <option value="desc">Price: High to Low</option>
      </select>
      <input
        type="text"
        name="artist"
        value={filters.artist}
        onChange={handleFilterChange}
        placeholder="Search Artist"
        className={styles.filterInput}
      />
    </div>
  );
};

export default Filters;
