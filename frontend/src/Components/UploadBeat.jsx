import React, { useState, useEffect, useRef } from "react";
import API from "../api/api";
import styles from "../css/UploadBeat.module.css";
import {
  FaMusic, FaImage, FaUpload, FaTimes, FaCrop,
  FaCheck, FaPlay, FaPause, FaFileArchive, FaFileAudio
} from "react-icons/fa";
import Cropper from "react-easy-crop";
import { useAuth } from '../context/AuthContext';

const UploadBeat = ({ onUploadComplete }) => {
  const { isLoggedIn } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  const [beatData, setBeatData] = useState({
    title: "", genre: "", bpm: "", key: "", tags: "", price: "", description: ""
  });

  const [licenseTypes, setLicenseTypes] = useState([
    {
      type: "basic", name: "Basic License", price: "4.99", selected: true,
      features: ["Tagged MP3 File", "Non-commercial use only", "Must credit producer"]
    },
    {
      type: "premium", name: "Premium License", price: "9.99", selected: true,
      features: ["Tagged MP3 + Full WAV", "Commercial use allowed", "Must credit producer"]
    },
    {
      type: "exclusive", name: "Exclusive License", price: "49.99", selected: true,
      features: ["Tagged MP3 + Full WAV + Stems", "Full ownership", "Beat removed from store"]
    }
  ]);

  // ── File state ─────────────────────────────────────────────────────────────
  // audioFile  → tagged MP3  (required) — public, used for streaming
  // wavFile    → full WAV    (required) — private, premium + exclusive buyers
  // stemsFile  → stems ZIP   (optional) — private, exclusive buyers only
  // coverImage → cover art   (required) — public
  const [audioFile,  setAudioFile]  = useState(null);
  const [wavFile,    setWavFile]    = useState(null);
  const [stemsFile,  setStemsFile]  = useState(null);
  const [coverImage, setCoverImage] = useState(null);

  const [audioPreview, setAudioPreview] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [errorMessage,   setErrorMessage]   = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  // Audio player
  const [isPlaying,   setIsPlaying]   = useState(false);
  const [duration,    setDuration]    = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);

  // Image cropper
  const [showCropper,        setShowCropper]        = useState(false);
  const [crop,               setCrop]               = useState({ x: 0, y: 0 });
  const [zoom,               setZoom]               = useState(1);
  const [croppedAreaPixels,  setCroppedAreaPixels]  = useState(null);
  const [rotation,           setRotation]           = useState(0);
  const [originalImage,      setOriginalImage]      = useState(null);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (audioPreview) URL.revokeObjectURL(audioPreview);
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [audioPreview, imagePreview]);

  // ── Input handlers ─────────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBeatData(prev => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleTagsKeyDown = (e) => {
    if (e.key === 'Enter') e.preventDefault();
  };

  const addSuggestedTag = (tag) => {
    const current = beatData.tags ? beatData.tags.split(',').map(t => t.trim()) : [];
    if (!current.includes(tag)) {
      setBeatData(prev => ({
        ...prev,
        tags: [...current, tag].filter(Boolean).join(', ')
      }));
    }
  };

  const handleLicensePriceChange = (index, price) => {
    setLicenseTypes(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], price };
      return updated;
    });
  };

  const handleLicenseToggle = (index) => {
    setLicenseTypes(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], selected: !updated[index].selected };
      return updated;
    });
  };

  // ── File change handlers ───────────────────────────────────────────────────
  const handleAudioChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('audio/')) {
      setValidationErrors(p => ({ ...p, audio: 'Please upload a valid audio file (MP3)' }));
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setValidationErrors(p => ({ ...p, audio: 'Tagged MP3 must be under 50 MB' }));
      return;
    }
    setAudioFile(file);
    if (audioPreview) URL.revokeObjectURL(audioPreview);
    setAudioPreview(URL.createObjectURL(file));
    setValidationErrors(p => ({ ...p, audio: null }));
  };

  const handleWavChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('audio/')) {
      setValidationErrors(p => ({ ...p, wav: 'Please upload a valid WAV audio file' }));
      return;
    }
    if (file.size > 200 * 1024 * 1024) {
      setValidationErrors(p => ({ ...p, wav: 'WAV file must be under 200 MB' }));
      return;
    }
    setWavFile(file);
    setValidationErrors(p => ({ ...p, wav: null }));
  };

  const handleStemsChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const isZip = file.type === 'application/zip'
      || file.type === 'application/x-zip-compressed'
      || file.name.endsWith('.zip');
    if (!isZip) {
      setValidationErrors(p => ({ ...p, stems: 'Stems must be a ZIP file' }));
      return;
    }
    if (file.size > 200 * 1024 * 1024) {
      setValidationErrors(p => ({ ...p, stems: 'Stems ZIP must be under 200 MB' }));
      return;
    }
    setStemsFile(file);
    setValidationErrors(p => ({ ...p, stems: null }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setValidationErrors(p => ({ ...p, coverImage: 'Please upload a valid image file' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setValidationErrors(p => ({ ...p, coverImage: 'Cover image must be under 5 MB' }));
      return;
    }
    setOriginalImage(file);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(URL.createObjectURL(file));
    setShowCropper(true);
    setValidationErrors(p => ({ ...p, coverImage: null }));
  };

  // ── Remove handlers ────────────────────────────────────────────────────────
  const removeAudioFile = () => {
    setAudioFile(null);
    if (audioPreview) { URL.revokeObjectURL(audioPreview); setAudioPreview(null); }
    setIsPlaying(false); setCurrentTime(0); setDuration(0);
  };

  const removeWavFile  = () => setWavFile(null);
  const removeStemsFile = () => setStemsFile(null);

  const removeImageFile = () => {
    setCoverImage(null); setOriginalImage(null);
    if (imagePreview) { URL.revokeObjectURL(imagePreview); setImagePreview(null); }
  };

  // ── Audio player ───────────────────────────────────────────────────────────
  const toggleAudioPlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); } else { audioRef.current.play(); }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate    = () => audioRef.current && setCurrentTime(audioRef.current.currentTime);
  const handleLoadedMetadata = () => audioRef.current && setDuration(audioRef.current.duration);
  const handleEnded         = () => {
    setIsPlaying(false); setCurrentTime(0);
    if (audioRef.current) audioRef.current.currentTime = 0;
  };
  const handleSeek = (e) => {
    const t = parseFloat(e.target.value);
    setCurrentTime(t);
    if (audioRef.current) audioRef.current.currentTime = t;
  };
  const formatTime = (t) => {
    if (isNaN(t)) return '0:00';
    return `${Math.floor(t / 60)}:${Math.floor(t % 60).toString().padStart(2, '0')}`;
  };

  // ── Image cropper ──────────────────────────────────────────────────────────
  const onCropComplete = (_, pixels) => setCroppedAreaPixels(pixels);

  const applyCrop = async () => {
    try {
      if (!originalImage || !croppedAreaPixels) return;
      const canvas = document.createElement('canvas');
      const ctx    = canvas.getContext('2d');
      const image  = new Image();
      image.src    = imagePreview;
      await new Promise(res => { image.onload = res; });

      canvas.width  = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
      ctx.drawImage(
        image,
        croppedAreaPixels.x, croppedAreaPixels.y,
        croppedAreaPixels.width, croppedAreaPixels.height,
        0, 0, croppedAreaPixels.width, croppedAreaPixels.height
      );

      canvas.toBlob(blob => {
        if (!blob) return;
        const croppedFile = new File([blob], originalImage.name, { type: originalImage.type });
        setCoverImage(croppedFile);
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImagePreview(URL.createObjectURL(blob));
        setShowCropper(false);
      }, originalImage.type);
    } catch (err) {
      console.error('Crop error:', err);
    }
  };

  const cancelCrop = () => {
    setShowCropper(false);
    if (!coverImage) { removeImageFile(); }
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  const validateForm = () => {
    const errors = {};

    if (!beatData.title.trim()) errors.title = 'Title is required';
    if (!beatData.genre)        errors.genre = 'Genre is required';

    if (!licenseTypes.some(l => l.selected)) {
      errors.licenseTypes = 'At least one license type must be selected';
    }

    if (!beatData.price) {
      const basic = licenseTypes.find(l => l.type === 'basic' && l.selected);
      if (basic) { beatData.price = basic.price; }
      else        { errors.price = 'Please enter a valid price'; }
    }

    licenseTypes.forEach((license, index) => {
      if (license.selected) {
        const price = parseFloat(license.price);
        if (isNaN(price) || price <= 0) {
          errors[`licensePrice${index}`] = `Please enter a valid price for ${license.name}`;
        }
      }
    });

    // All three audio files validated here
    if (!audioFile)  errors.audio = 'Tagged MP3 is required (this is the public streaming preview)';
    if (!wavFile)    errors.wav   = 'Full WAV is required (delivered to premium & exclusive buyers)';
    if (!coverImage) errors.coverImage = 'Cover image is required';

    // stems is optional — no error if missing

    return errors;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setErrorMessage('Please fix the errors below before submitting');
      return;
    }

    if (!isLoggedIn) {
      setErrorMessage('You must be logged in to upload beats');
      return;
    }

    setIsLoading(true);
    setUploadProgress('Preparing files...');

    try {
      const formData = new FormData();

      // ── Files ──────────────────────────────────────────────────────────────
      formData.append('audio',      audioFile);  // tagged MP3 — public
      formData.append('audioWav',   wavFile);    // full WAV   — private (authenticated)
      if (stemsFile) formData.append('audioStems', stemsFile); // stems ZIP — private, optional
      formData.append('coverImage', coverImage);

      // ── Metadata ───────────────────────────────────────────────────────────
      formData.append('title',       beatData.title.trim());
      formData.append('genre',       beatData.genre);
      formData.append('bpm',         beatData.bpm);
      formData.append('key',         beatData.key);
      formData.append('tags',        beatData.tags);
      formData.append('description', beatData.description);
      formData.append('price',       beatData.price);
      formData.append('licenseTypes', JSON.stringify(
        licenseTypes.filter(l => l.selected)
      ));

      setUploadProgress('Uploading files... this may take a moment for large WAV files');

      const response = await API.post('/api/beats', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        // Optional: show progress if your API instance supports it
        onUploadProgress: (e) => {
          const pct = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(`Uploading... ${pct}%`);
        },
      });

      setSuccessMessage(
        `"${response.data.beat?.title}" uploaded successfully! ` +
        `WAV: ✓  Stems: ${response.data.beat?.hasStems ? '✓' : '—'}`
      );
      setUploadProgress('');

      // Reset form
      setBeatData({ title: '', genre: '', bpm: '', key: '', tags: '', price: '', description: '' });
      setLicenseTypes([
        { type: 'basic',     name: 'Basic License',     price: '4.99',  selected: true, features: ['Tagged MP3 File', 'Non-commercial use only', 'Must credit producer'] },
        { type: 'premium',   name: 'Premium License',   price: '9.99',  selected: true, features: ['Tagged MP3 + Full WAV', 'Commercial use allowed', 'Must credit producer'] },
        { type: 'exclusive', name: 'Exclusive License', price: '49.99', selected: true, features: ['Tagged MP3 + Full WAV + Stems', 'Full ownership', 'Beat removed from store'] },
      ]);
      setAudioFile(null);  setWavFile(null);  setStemsFile(null);
      if (audioPreview) { URL.revokeObjectURL(audioPreview); setAudioPreview(null); }
      if (imagePreview) { URL.revokeObjectURL(imagePreview); setImagePreview(null); }
      setCoverImage(null); setOriginalImage(null);
      setIsPlaying(false); setCurrentTime(0); setDuration(0);
      setValidationErrors({});

      if (onUploadComplete) onUploadComplete(response.data);

    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress('');
      if (error.response?.status === 403) {
        setErrorMessage("You've reached your upload limit. Please upgrade your subscription.");
      } else {
        setErrorMessage(error.response?.data?.message || 'Failed to upload beat. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={styles.uploadContainer}>

      {errorMessage && <div className={styles.errorMessage}>{errorMessage}</div>}
      {successMessage && <div className={styles.successMessage}>{successMessage}</div>}
      {uploadProgress && (
        <div className={styles.progressMessage}>
          <span className={styles.progressSpinner} />
          {uploadProgress}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.uploadForm}>

        {/* ── Beat Files ──────────────────────────────────────────────────── */}
        <div className={styles.formSection}>
          <h3>Beat Files</h3>
          <p className={styles.sectionNote}>
            Buyers receive files based on their license tier: Basic → MP3, Premium → MP3 + WAV, Exclusive → MP3 + WAV + Stems
          </p>

          <div className={styles.fileUploads}>

            {/* 1. Tagged MP3 — required, PUBLIC */}
            <div className={styles.fileUpload}>
              <div className={styles.fileUploadLabel}>
                <FaMusic className={styles.icon} />
                <div>
                  <strong>Tagged MP3</strong>
                  <span className={styles.required}> *</span>
                  <p className={styles.fileHint}>Public preview — streamed on your beat page. Add your voice tag before uploading.</p>
                </div>
              </div>

              {!audioFile ? (
                <>
                  <label htmlFor="audioFile" className={`${styles.fileInputLabel} ${validationErrors.audio ? styles.errorBorder : ''}`}>
                    Choose MP3 file
                  </label>
                  <input
                    type="file" id="audioFile" name="audio"
                    accept="audio/mpeg,audio/mp3,.mp3"
                    onChange={handleAudioChange}
                    style={{ display: 'none' }}
                  />
                  {validationErrors.audio && (
                    <div className={styles.fieldError}>{validationErrors.audio}</div>
                  )}
                </>
              ) : (
                <div className={styles.filePreview}>
                  <div className={styles.fileInfo}>
                    <FaMusic className={styles.fileIcon} />
                    <div>
                      <span className={styles.fileName}>{audioFile.name}</span>
                      <span className={styles.fileSize}>{(audioFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                    </div>
                    <span className={styles.fileBadge} data-type="mp3">MP3</span>
                  </div>
                  <button type="button" className={styles.removeFile} onClick={removeAudioFile}>
                    <FaTimes />
                  </button>

                  {audioPreview && (
                    <div className={styles.audioPlayerContainer}>
                      <audio
                        ref={audioRef} src={audioPreview}
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleLoadedMetadata}
                        onEnded={handleEnded}
                        style={{ display: 'none' }}
                      />
                      <div className={styles.audioPlayerControls}>
                        <button type="button" className={styles.playPauseButton} onClick={toggleAudioPlay}>
                          {isPlaying ? <FaPause /> : <FaPlay />}
                        </button>
                        <div className={styles.audioProgress}>
                          <input
                            type="range" min="0" max={duration || 0}
                            value={currentTime} onChange={handleSeek}
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

            {/* 2. Full WAV — required, PRIVATE */}
            <div className={styles.fileUpload}>
              <div className={styles.fileUploadLabel}>
                <FaFileAudio className={styles.icon} />
                <div>
                  <strong>Full WAV</strong>
                  <span className={styles.required}> *</span>
                  <p className={styles.fileHint}>Private — delivered to Premium & Exclusive buyers via a secure expiring link.</p>
                </div>
              </div>

              {!wavFile ? (
                <>
                  <label htmlFor="wavFile" className={`${styles.fileInputLabel} ${validationErrors.wav ? styles.errorBorder : ''}`}>
                    Choose WAV file
                  </label>
                  <input
                    type="file" id="wavFile" name="audioWav"
                    accept="audio/wav,audio/x-wav,.wav"
                    onChange={handleWavChange}
                    style={{ display: 'none' }}
                  />
                  {validationErrors.wav && (
                    <div className={styles.fieldError}>{validationErrors.wav}</div>
                  )}
                </>
              ) : (
                <div className={styles.filePreview}>
                  <div className={styles.fileInfo}>
                    <FaFileAudio className={styles.fileIcon} />
                    <div>
                      <span className={styles.fileName}>{wavFile.name}</span>
                      <span className={styles.fileSize}>{(wavFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                    </div>
                    <span className={styles.fileBadge} data-type="wav">WAV</span>
                    <span className={styles.privateBadge}>🔒 Private</span>
                  </div>
                  <button type="button" className={styles.removeFile} onClick={removeWavFile}>
                    <FaTimes />
                  </button>
                </div>
              )}
            </div>

            {/* 3. Stems ZIP — optional, PRIVATE */}
            <div className={styles.fileUpload}>
              <div className={styles.fileUploadLabel}>
                <FaFileArchive className={styles.icon} />
                <div>
                  <strong>Stems ZIP</strong>
                  <span className={styles.optional}> (optional)</span>
                  <p className={styles.fileHint}>Private — delivered exclusively to Exclusive license buyers. ZIP your track stems before uploading.</p>
                </div>
              </div>

              {!stemsFile ? (
                <>
                  <label htmlFor="stemsFile" className={`${styles.fileInputLabel} ${validationErrors.stems ? styles.errorBorder : ''}`}>
                    Choose ZIP file
                  </label>
                  <input
                    type="file" id="stemsFile" name="audioStems"
                    accept=".zip,application/zip,application/x-zip-compressed"
                    onChange={handleStemsChange}
                    style={{ display: 'none' }}
                  />
                  {validationErrors.stems && (
                    <div className={styles.fieldError}>{validationErrors.stems}</div>
                  )}
                </>
              ) : (
                <div className={styles.filePreview}>
                  <div className={styles.fileInfo}>
                    <FaFileArchive className={styles.fileIcon} />
                    <div>
                      <span className={styles.fileName}>{stemsFile.name}</span>
                      <span className={styles.fileSize}>{(stemsFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                    </div>
                    <span className={styles.fileBadge} data-type="zip">ZIP</span>
                    <span className={styles.privateBadge}>🔒 Private</span>
                  </div>
                  <button type="button" className={styles.removeFile} onClick={removeStemsFile}>
                    <FaTimes />
                  </button>
                </div>
              )}
            </div>

            {/* 4. Cover Image — required, PUBLIC */}
            <div className={styles.fileUpload}>
              <div className={styles.fileUploadLabel}>
                <FaImage className={styles.icon} />
                <div>
                  <strong>Cover Image</strong>
                  <span className={styles.required}> *</span>
                  <p className={styles.fileHint}>Public — shown on the explore page and your beat card. Square images work best.</p>
                </div>
              </div>

              {!coverImage ? (
                <>
                  <label htmlFor="coverImage" className={`${styles.fileInputLabel} ${validationErrors.coverImage ? styles.errorBorder : ''}`}>
                    Choose image
                  </label>
                  <input
                    type="file" id="coverImage" name="coverImage"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                  {validationErrors.coverImage && (
                    <div className={styles.fieldError}>{validationErrors.coverImage}</div>
                  )}
                </>
              ) : (
                <div className={styles.filePreview}>
                  <div className={styles.fileInfo}>
                    <FaImage className={styles.fileIcon} />
                    <div>
                      <span className={styles.fileName}>{coverImage.name}</span>
                      <span className={styles.fileSize}>{(coverImage.size / (1024 * 1024)).toFixed(2)} MB</span>
                    </div>
                  </div>
                  <div className={styles.previewActions}>
                    <button type="button" className={styles.cropButton} onClick={() => setShowCropper(true)}>
                      <FaCrop /> Edit
                    </button>
                    <button type="button" className={styles.removeFile} onClick={removeImageFile}>
                      <FaTimes />
                    </button>
                  </div>
                  {imagePreview && !showCropper && (
                    <div className={styles.imagePreviewContainer}>
                      <img src={imagePreview} alt="Cover preview" className={styles.imagePreview} />
                    </div>
                  )}
                </div>
              )}

              {/* Image Cropper Modal */}
              {showCropper && imagePreview && (
                <div className={styles.cropperModal}>
                  <div className={styles.cropperContainer}>
                    <Cropper
                      image={imagePreview} crop={crop} zoom={zoom}
                      aspect={1} rotation={rotation}
                      onCropChange={setCrop}
                      onCropComplete={onCropComplete}
                      onZoomChange={setZoom}
                    />
                  </div>
                  <div className={styles.cropperControls}>
                    <label>
                      <span>Zoom</span>
                      <input type="range" min="1" max="3" step="0.1"
                        value={zoom} onChange={e => setZoom(parseFloat(e.target.value))} />
                    </label>
                    <label>
                      <span>Rotation</span>
                      <input type="range" min="0" max="360" step="1"
                        value={rotation} onChange={e => setRotation(parseInt(e.target.value))} />
                    </label>
                    <div className={styles.cropperActions}>
                      <button type="button" className={styles.cancelCropButton} onClick={cancelCrop}>
                        <FaTimes /> Cancel
                      </button>
                      <button type="button" className={styles.applyCropButton} onClick={applyCrop}>
                        <FaCheck /> Apply
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ── Beat Details ─────────────────────────────────────────────────── */}
        <div className={styles.formSection}>
          <h3>Beat Details</h3>
          <div className={styles.formGrid}>

            <div className={styles.formGroup}>
              <label htmlFor="title">Title <span className={styles.required}>*</span></label>
              <input
                type="text" id="title" name="title"
                className={validationErrors.title ? styles.errorInput : ''}
                value={beatData.title} onChange={handleInputChange}
                placeholder="Enter beat title"
              />
              {validationErrors.title && <div className={styles.fieldError}>{validationErrors.title}</div>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="genre">Genre <span className={styles.required}>*</span></label>
              <select
                id="genre" name="genre"
                className={validationErrors.genre ? styles.errorInput : ''}
                value={beatData.genre} onChange={handleInputChange}
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
              {validationErrors.genre && <div className={styles.fieldError}>{validationErrors.genre}</div>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="bpm">BPM</label>
              <input
                type="number" id="bpm" name="bpm"
                value={beatData.bpm} onChange={handleInputChange}
                placeholder="e.g. 140" min="40" max="300"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="key">Key</label>
              <select id="key" name="key" value={beatData.key} onChange={handleInputChange}>
                <option value="">Select Key</option>
                {['C','C#','D','D#','E','F','F#','G','G#','A','A#','B','Am','Em','Dm'].map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="tags">Tags</label>
              <input
                type="text" id="tags" name="tags"
                value={beatData.tags} onChange={handleInputChange}
                onKeyDown={handleTagsKeyDown}
                placeholder="e.g. dark, moody, aggressive (comma separated)"
                className={validationErrors.tags ? styles.errorInput : ''}
              />
              {validationErrors.tags && <div className={styles.fieldError}>{validationErrors.tags}</div>}
              {beatData.tags && (
                <div className={styles.tagsPreview}>
                  {beatData.tags.split(',').map((tag, i) =>
                    tag.trim() && <span key={i} className={styles.tagPreview}>{tag.trim()}</span>
                  )}
                </div>
              )}
              <div className={styles.tagsSuggestions}>
                <small>Popular tags:</small>
                {['trap', 'hip hop', 'drill', 'melodic', 'dark', 'chill', 'piano', 'emotional', 'hard', 'soft'].map(tag => (
                  <button key={tag} type="button" onClick={() => addSuggestedTag(tag)} className={styles.tagSuggestion}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="description">Description</label>
              <textarea
                id="description" name="description"
                value={beatData.description} onChange={handleInputChange}
                placeholder="Describe your beat (mood, inspiration, best uses, etc.)"
                rows="4"
              />
            </div>

          </div>
        </div>

        {/* ── License Types ────────────────────────────────────────────────── */}
        <div className={styles.formSection}>
          <h3>Available Licenses</h3>
          {validationErrors.licenseTypes && (
            <div className={styles.fieldError}>{validationErrors.licenseTypes}</div>
          )}

          <div className={styles.licenseOptions}>
            {licenseTypes.map((license, index) => (
              <div
                key={index}
                className={`${styles.licenseOption} ${license.selected ? styles.selectedLicense : ''}`}
              >
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
                    <label>Price (Rs)</label>
                    <input
                      type="number"
                      value={license.price}
                      onChange={e => handleLicensePriceChange(index, e.target.value)}
                      disabled={!license.selected}
                      min="0.99" step="0.01"
                      className={validationErrors[`licensePrice${index}`] ? styles.errorInput : ''}
                    />
                    {validationErrors[`licensePrice${index}`] && (
                      <div className={styles.fieldError}>{validationErrors[`licensePrice${index}`]}</div>
                    )}
                  </div>
                  {license.features && (
                    <div className={styles.licenseFeatures}>
                      <h5>What's Included:</h5>
                      <ul className={styles.featuresList}>
                        {license.features.map((feature, fi) => (
                          <li key={fi} className={styles.featureItem}>
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

        {/* ── Submit ───────────────────────────────────────────────────────── */}
        <div className={styles.submitSection}>
          <button type="submit" className={styles.submitBtn} disabled={isLoading}>
            {isLoading ? 'Uploading...' : 'Upload Beat'}
            {!isLoading && <FaUpload className={styles.btnIcon} />}
          </button>
        </div>

      </form>
    </div>
  );
};

export default UploadBeat;