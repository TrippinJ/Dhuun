import React, { useState, useEffect, useRef } from "react";
import API from "../api/api";
import styles from "../css/UploadBeat.module.css";
import { FaMusic, FaImage, FaUpload, FaTimes, FaCrop, FaCheck, FaPlay, FaPause } from "react-icons/fa";
import Cropper from "react-easy-crop";
import { useAuth } from '../context/AuthContext'; // Added AuthContext import

const UploadBeat = ({ onUploadComplete }) => {
  // Using AuthContext instead of direct localStorage access
  const { isLoggedIn, user } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [beatData, setBeatData] = useState({
    title: "",
    genre: "",
    bpm: "",
    key: "",
    tags: "",
    price: "",
    description: ""
  });

  // Add license types
  const [licenseTypes, setLicenseTypes] = useState([
    {
      type: "basic", name: "Basic License", price: "4.99", selected: true, features: [
        "MP3 File",
        "No royalties",
        "Must credit producer"
      ]
    },
    {
      type: "premium", name: "Premium License", price: "9.99", selected: true, features: [
        "WAV + MP3 Files",
        "No royalties",
        "Must credit producer"
      ]
    },
    {
      type: "exclusive", name: "Exclusive License", price: "49.99", selected: true, features: [
        "WAV + MP3 + Stems",
        "Full ownership",
        "Beat removed from store"
      ]
    }
  ]);

  const [audioFile, setAudioFile] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [audioPreview, setAudioPreview] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  // Audio player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);

  // Image cropper state
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [originalImage, setOriginalImage] = useState(null);

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

  // Handle license price changes
  const handleLicensePriceChange = (index, price) => {
    const updatedLicenseTypes = [...licenseTypes];
    updatedLicenseTypes[index].price = price;
    setLicenseTypes(updatedLicenseTypes);
  };

  // Toggle license selection
  const handleLicenseToggle = (index) => {
    const updatedLicenseTypes = [...licenseTypes];
    updatedLicenseTypes[index].selected = !updatedLicenseTypes[index].selected;
    setLicenseTypes(updatedLicenseTypes);
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

      // Save original file for cropping
      setOriginalImage(file);

      // Create URL for preview
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);

      // Show cropper on image select
      setShowCropper(true);

      // Clear error if exists
      if (validationErrors.coverImage) {
        setValidationErrors({
          ...validationErrors,
          coverImage: null
        });
      }
    }
  };

  // Audio player functions
  const toggleAudioPlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }

    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const handleSeek = (e) => {
    const seekTime = parseFloat(e.target.value);
    setCurrentTime(seekTime);
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
    }
  };

  // Format time for audio player
  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";

    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  // Crop image functions
  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  // Apply the crop
  const applyCrop = async () => {
    try {
      if (!originalImage || !croppedAreaPixels) return;

      // Create a canvas element to draw the cropped image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Load the image to get its dimensions
      const image = new Image();
      image.src = imagePreview;

      await new Promise((resolve) => {
        image.onload = resolve;
      });

      // Set canvas dimensions to the cropped size
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      // Apply rotation if needed
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);

      // Draw the cropped part of the image onto the canvas
      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      // Convert canvas to a Blob
      canvas.toBlob((blob) => {
        if (blob) {
          // Create file from blob
          const croppedFile = new File([blob], originalImage.name, {
            type: originalImage.type,
          });

          // Set the cropped image as the cover image
          setCoverImage(croppedFile);

          // Update the preview URL
          if (imagePreview) URL.revokeObjectURL(imagePreview);
          setImagePreview(URL.createObjectURL(blob));

          // Hide cropper
          setShowCropper(false);
        }
      }, originalImage.type);

    } catch (error) {
      console.error("Error applying crop:", error);
    }
  };

  // Cancel the crop
  const cancelCrop = () => {
    setShowCropper(false);

    // If no previous image, clear everything
    if (!coverImage) {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
      setOriginalImage(null);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!beatData.title.trim()) errors.title = "Title is required";
    if (!beatData.genre) errors.genre = "Genre is required";

    // Check if at least one license type is selected
    if (!licenseTypes.some(license => license.selected)) {
      errors.licenseTypes = "At least one license type must be selected";
    }

    // Get price from basic license if not set
    if (!beatData.price) {
      const basicLicense = licenseTypes.find(l => l.type === "basic" && l.selected);
      if (basicLicense) {
        beatData.price = basicLicense.price;
      } else {
        errors.price = "Please enter a valid price";
      }
    }

    // Validate prices for selected licenses
    licenseTypes.forEach((license, index) => {
      if (license.selected) {
        const price = parseFloat(license.price);
        if (isNaN(price) || price <= 0) {
          errors[`licensePrice${index}`] = `Please enter a valid price for ${license.name}`;
        }
      }
    });

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
      // Check if user is logged in using AuthContext
      if (!isLoggedIn) {
        setErrorMessage("You must be logged in to upload beats");
        setIsLoading(false);
        return;
      }

      // Create form data for file uploads
      const formData = new FormData();
      formData.append("audio", audioFile);
      formData.append("coverImage", coverImage);

      // Append basic beat metadata
      formData.append("title", beatData.title);
      formData.append("genre", beatData.genre);
      formData.append("bpm", beatData.bpm);
      formData.append("key", beatData.key);
      formData.append("tags", beatData.tags);
      formData.append("description", beatData.description);
      formData.append("price", beatData.price);
      formData.append("licenseType", beatData.licenseType);

      // Append license data as JSON string
      formData.append("licenseTypes", JSON.stringify(
        licenseTypes.filter(license => license.selected)
      ));

      // Debug log
      for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value instanceof File ? `File: ${value.name}` : value}`);
      }

      // Make API request (token is automatically added by the API interceptor)
      const response = await API.post("/api/beats", formData);

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
        description: ""
      });

      setLicenseTypes([
        { type: "basic", name: "Basic License", price: "4.99", selected: true },
        { type: "premium", name: "Premium License", price: "9.99", selected: true },
        { type: "exclusive", name: "Exclusive License", price: "49.99", selected: true }
      ]);

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

      // Reset audio player
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);

      // Call the callback to notify parent component
      if (onUploadComplete) {
        onUploadComplete(response.data);
      }

    } catch (error) {
      console.error("Error uploading beat:", error);
      console.error("Error response:", error.response?.data);

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
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  };

  const removeImageFile = () => {
    setCoverImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    setOriginalImage(null);
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

                  {/* Enhanced audio player */}
                  {audioPreview && (
                    <div className={styles.audioPlayerContainer}>
                      <audio
                        ref={audioRef}
                        src={audioPreview}
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleLoadedMetadata}
                        onEnded={handleEnded}
                        style={{ display: 'none' }}
                      />

                      <div className={styles.audioPlayerControls}>
                        <button
                          type="button"
                          className={styles.playPauseButton}
                          onClick={toggleAudioPlay}
                        >
                          {isPlaying ? <FaPause /> : <FaPlay />}
                        </button>

                        <div className={styles.audioProgress}>
                          <input
                            type="range"
                            min="0"
                            max={duration || 0}
                            value={currentTime}
                            onChange={handleSeek}
                            className={styles.progressBar}
                          />
                          <div className={styles.timeDisplay}>
                            <span>{formatTime(currentTime)}</span>
                            <span>{formatTime(duration)}</span>
                          </div>
                        </div>
                      </div>
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
                  <div className={styles.previewActions}>
                    <button
                      type="button"
                      className={styles.cropButton}
                      onClick={() => setShowCropper(true)}
                    >
                      <FaCrop /> Edit
                    </button>
                    <button
                      type="button"
                      className={styles.removeFile}
                      onClick={removeImageFile}
                    >
                      <FaTimes />
                    </button>
                  </div>

                  {/* Enhanced image preview */}
                  {imagePreview && !showCropper && (
                    <div className={styles.imagePreviewContainer}>
                      <img
                        src={imagePreview}
                        alt="Cover preview"
                        className={styles.imagePreview}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Image Cropper Modal */}
              {showCropper && imagePreview && (
                <div className={styles.cropperModal}>
                  <div className={styles.cropperContainer}>
                    <Cropper
                      image={imagePreview}
                      crop={crop}
                      zoom={zoom}
                      aspect={1}
                      onCropChange={setCrop}
                      onCropComplete={onCropComplete}
                      onZoomChange={setZoom}
                      rotation={rotation}
                    />
                  </div>

                  <div className={styles.cropperControls}>
                    <label>
                      <span>Zoom</span>
                      <input
                        type="range"
                        min="1"
                        max="3"
                        step="0.1"
                        value={zoom}
                        onChange={(e) => setZoom(parseFloat(e.target.value))}
                      />
                    </label>

                    <label>
                      <span>Rotation</span>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        step="1"
                        value={rotation}
                        onChange={(e) => setRotation(parseInt(e.target.value))}
                      />
                    </label>

                    <div className={styles.cropperActions}>
                      <button
                        type="button"
                        className={styles.cancelCropButton}
                        onClick={cancelCrop}
                      >
                        <FaTimes /> Cancel
                      </button>
                      <button
                        type="button"
                        className={styles.applyCropButton}
                        onClick={applyCrop}
                      >
                        <FaCheck /> Apply
                      </button>
                    </div>
                  </div>
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

        {/* Add License Types Section */}
        <div className={styles.formSection}>
          <h3>Available Licenses</h3>
          {validationErrors.licenseTypes && (
            <div className={styles.fieldError}>{validationErrors.licenseTypes}</div>
          )}

          <div className={styles.licenseOptions}>
            {licenseTypes.map((license, index) => (
              <div key={index} className={`${styles.licenseOption} ${license.selected ? styles.selectedLicense : ''}`}>
                <div className={styles.licenseHeader}>
                  <h4>{license.name}</h4>
                  <label className={styles.licenseToggle}>
                    <input
                      type="checkbox"
                      checked={license.selected}
                      onChange={() => handleLicenseToggle(index)}
                    />
                    <span>Offer this license</span>
                  </label>
                </div>

                <div className={styles.licenseContent}>
                  <div className={styles.licensePrice}>
                    <label>Price (Rs )</label>
                    <input
                      type="number"
                      value={license.price}
                      onChange={(e) => handleLicensePriceChange(index, e.target.value)}
                      disabled={!license.selected}
                      min="0.99"
                      step="0.01"
                      className={validationErrors[`licensePrice${index}`] ? styles.errorInput : ""}
                    />
                    {validationErrors[`licensePrice${index}`] && (
                      <div className={styles.fieldError}>{validationErrors[`licensePrice${index}`]}</div>
                    )}
                  </div>
                  {license.features && (
                    <div className={styles.licenseFeatures}>
                      <h5>What's Included:</h5>
                      <ul className={styles.featuresList}>
                        {license.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className={styles.featureItem}>
                            <span className={styles.featureIcon}>✓</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

              </div>
            ))}
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