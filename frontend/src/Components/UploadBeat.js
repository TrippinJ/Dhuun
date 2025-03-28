import React, { useState, useEffect } from "react";
import API from "../api/api";
import styles from "../css/UploadBeat.module.css";
import { FaMusic, FaImage, FaUpload, FaTimes } from "react-icons/fa";

const UploadBeat = ({ onUploadComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [beatData, setBeatData] = useState({
    title: "",
    genre: "",
    bpm: "",
    key: "",
    tags: "",
    price: "",
    licenseType: "non-exclusive",
    description: ""
  });
  const [audioFile, setAudioFile] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [audioPreview, setAudioPreview] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  // Clean up object URLs on component unmount
  useEffect(() => {
    return () => {
      if (audioPreview) URL.revokeObjectURL(audioPreview);
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [audioPreview, imagePreview]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBeatData({
      ...beatData,
      [name]: value
    });
    
    // Clear validation error when user fixes the field
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: null
      });
    }
  };

  const handleAudioChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 20MB)
      if (file.size > 20 * 1024 * 1024) {
        setValidationErrors({
          ...validationErrors,
          audio: "Audio file must be less than 20MB"
        });
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith("audio/")) {
        setValidationErrors({
          ...validationErrors,
          audio: "Please upload a valid audio file"
        });
        return;
      }
      
      setAudioFile(file);
      if (audioPreview) URL.revokeObjectURL(audioPreview);
      setAudioPreview(URL.createObjectURL(file));
      
      // Clear error if exists
      if (validationErrors.audio) {
        setValidationErrors({
          ...validationErrors,
          audio: null
        });
      }
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setValidationErrors({
          ...validationErrors,
          coverImage: "Cover image must be less than 5MB"
        });
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setValidationErrors({
          ...validationErrors,
          coverImage: "Please upload a valid image file"
        });
        return;
      }
      
      setCoverImage(file);
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview(URL.createObjectURL(file));
      
      // Clear error if exists
      if (validationErrors.coverImage) {
        setValidationErrors({
          ...validationErrors,
          coverImage: null
        });
      }
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!beatData.title.trim()) errors.title = "Title is required";
    if (!beatData.genre) errors.genre = "Genre is required";
    if (beatData.price === "" || isNaN(beatData.price) || parseFloat(beatData.price) <= 0) {
      errors.price = "Please enter a valid price";
    }
    if (!audioFile) errors.audio = "Audio file is required";
    if (!coverImage) errors.coverImage = "Cover image is required";
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous messages
    setErrorMessage("");
    setSuccessMessage("");
    
    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setErrorMessage("Please fix the errors before submitting");
      return;
    }
    
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setErrorMessage("You must be logged in to upload beats");
        setIsLoading(false);
        return;
      }

      // Create form data for file uploads
      const formData = new FormData();
      formData.append("audio", audioFile);
      formData.append("coverImage", coverImage);
      
      // Append beat metadata
      Object.keys(beatData).forEach(key => {
        formData.append(key, beatData[key]);
      });

      const response = await API.post("/api/beats", formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      console.log("Beat uploaded successfully:", response.data);
      setSuccessMessage("Beat uploaded successfully!");
      
      // Reset form after successful upload
      setBeatData({
        title: "",
        genre: "",
        bpm: "",
        key: "",
        tags: "",
        price: "",
        licenseType: "non-exclusive",
        description: ""
      });
      setAudioFile(null);
      setCoverImage(null);
      
      // Cleanup URLs
      if (audioPreview) {
        URL.revokeObjectURL(audioPreview);
        setAudioPreview(null);
      }
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
      }
      
      // Call the callback to notify parent component
      if (onUploadComplete) {
        onUploadComplete(response.data);
      }
      
    } catch (error) {
      console.error("Error uploading beat:", error);
      if (error.response?.status === 403) {
        setErrorMessage("You've reached your upload limit. Please upgrade your subscription.");
      } else {
        setErrorMessage(error.response?.data?.message || "Failed to upload beat. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const removeAudioFile = () => {
    setAudioFile(null);
    if (audioPreview) {
      URL.revokeObjectURL(audioPreview);
      setAudioPreview(null);
    }
  };

  const removeImageFile = () => {
    setCoverImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

  return (
    <div className={styles.uploadContainer}>
      {errorMessage && (
        <div className={styles.errorMessage}>
          {errorMessage}
        </div>
      )}
      
      {successMessage && (
        <div className={styles.successMessage}>
          {successMessage}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className={styles.uploadForm}>
        <div className={styles.formSection}>
          <h3>Beat Files</h3>
          <div className={styles.fileUploads}>
            <div className={styles.fileUpload}>
              {!audioFile ? (
                <>
                  <label htmlFor="audioFile" className={validationErrors.audio ? styles.errorBorder : ""}>
                    <FaMusic className={styles.icon} />
                    <span>Select Audio File</span>
                  </label>
                  <input
                    type="file"
                    id="audioFile"
                    name="audio"
                    accept="audio/*"
                    onChange={handleAudioChange}
                  />
                  {validationErrors.audio && (
                    <div className={styles.fieldError}>{validationErrors.audio}</div>
                  )}
                </>
              ) : (
                <div className={styles.filePreview}>
                  <div className={styles.fileInfo}>
                    <span>{audioFile.name}</span>
                    <span className={styles.fileSize}>
                      {(audioFile.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>
                  <button 
                    type="button" 
                    className={styles.removeFile}
                    onClick={removeAudioFile}
                  >
                    <FaTimes />
                  </button>
                  {audioPreview && (
                    <div className={styles.preview}>
                      <audio controls src={audioPreview}></audio>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className={styles.fileUpload}>
              {!coverImage ? (
                <>
                  <label htmlFor="coverImage" className={validationErrors.coverImage ? styles.errorBorder : ""}>
                    <FaImage className={styles.icon} />
                    <span>Select Cover Image</span>
                  </label>
                  <input
                    type="file"
                    id="coverImage"
                    name="coverImage"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  {validationErrors.coverImage && (
                    <div className={styles.fieldError}>{validationErrors.coverImage}</div>
                  )}
                </>
              ) : (
                <div className={styles.filePreview}>
                  <div className={styles.fileInfo}>
                    <span>{coverImage.name}</span>
                    <span className={styles.fileSize}>
                      {(coverImage.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>
                  <button 
                    type="button" 
                    className={styles.removeFile}
                    onClick={removeImageFile}
                  >
                    <FaTimes />
                  </button>
                  {imagePreview && (
                    <div className={styles.preview}>
                      <img src={imagePreview} alt="Cover preview" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.formSection}>
          <h3>Beat Details</h3>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="title">Title*</label>
              <input
                type="text"
                id="title"
                name="title"
                className={validationErrors.title ? styles.errorInput : ""}
                value={beatData.title}
                onChange={handleInputChange}
                placeholder="Enter beat title"
              />
              {validationErrors.title && (
                <div className={styles.fieldError}>{validationErrors.title}</div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="genre">Genre*</label>
              <select
                id="genre"
                name="genre"
                className={validationErrors.genre ? styles.errorInput : ""}
                value={beatData.genre}
                onChange={handleInputChange}
              >
                <option value="">Select Genre</option>
                <option value="Hip Hop">Hip Hop</option>
                <option value="Trap">Trap</option>
                <option value="R&B">R&B</option>
                <option value="Pop">Pop</option>
                <option value="EDM">EDM</option>
                <option value="Lo-Fi">Lo-Fi</option>
                <option value="Drill">Drill</option>
                <option value="Other">Other</option>
              </select>
              {validationErrors.genre && (
                <div className={styles.fieldError}>{validationErrors.genre}</div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="bpm">BPM</label>
              <input
                type="number"
                id="bpm"
                name="bpm"
                value={beatData.bpm}
                onChange={handleInputChange}
                placeholder="e.g. 140"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="key">Key</label>
              <select
                id="key"
                name="key"
                value={beatData.key}
                onChange={handleInputChange}
              >
                <option value="">Select Key</option>
                <option value="C">C</option>
                <option value="C#">C#</option>
                <option value="D">D</option>
                <option value="D#">D#</option>
                <option value="E">E</option>
                <option value="F">F</option>
                <option value="F#">F#</option>
                <option value="G">G</option>
                <option value="G#">G#</option>
                <option value="A">A</option>
                <option value="A#">A#</option>
                <option value="B">B</option>
                <option value="Am">Am</option>
                <option value="Em">Em</option>
                <option value="Dm">Dm</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="tags">Tags</label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={beatData.tags}
                onChange={handleInputChange}
                placeholder="e.g. dark, moody, aggressive (comma separated)"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="price">Price ($)*</label>
              <input
                type="number"
                id="price"
                name="price"
                className={validationErrors.price ? styles.errorInput : ""}
                min="0"
                step="0.01"
                value={beatData.price}
                onChange={handleInputChange}
                placeholder="e.g. 29.99"
              />
              {validationErrors.price && (
                <div className={styles.fieldError}>{validationErrors.price}</div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="licenseType">License Type*</label>
              <select
                id="licenseType"
                name="licenseType"
                value={beatData.licenseType}
                onChange={handleInputChange}
              >
                <option value="non-exclusive">Non-Exclusive</option>
                <option value="exclusive">Exclusive</option>
                <option value="both">Both (Different Pricing)</option>
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={beatData.description}
              onChange={handleInputChange}
              placeholder="Describe your beat (mood, inspiration, best uses, etc.)"
              rows="4"
            ></textarea>
          </div>
        </div>

        <div className={styles.submitSection}>
          <button type="submit" className={styles.submitBtn} disabled={isLoading}>
            {isLoading ? "Uploading..." : "Upload Beat"}
            {!isLoading && <FaUpload className={styles.btnIcon} />}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadBeat;