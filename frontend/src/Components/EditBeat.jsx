import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/api";
import styles from "../css/EditBeat.module.css";
import { FaImage, FaSave, FaTimes } from "react-icons/fa";

const EditBeat = () => {
  const { beatId } = useParams();
  const navigate = useNavigate();

  const [beat, setBeat] = useState(null);
  const [formData, setFormData] = useState({
    description: "",
    price: "",
    licenseTypes: []
  });
  const [coverImage, setCoverImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [originalCoverImage, setOriginalCoverImage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    const fetchBeat = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        // Interceptor handles Authorization header
        const response = await API.get(`/api/beats/${beatId}`);

        const beatData = response.data.data || response.data;
        setBeat(beatData);

        setFormData({
          description: beatData.description || "",
          price: beatData.price?.toString() || "",
          licenseTypes: beatData.licenseTypes || [
            { type: "basic", name: "Basic License", price: beatData.price || "4.99", selected: true },
            { type: "premium", name: "Premium License", price: (beatData.price * 2.5) || "9.99", selected: true },
            { type: "exclusive", name: "Exclusive License", price: (beatData.price * 10) || "49.99", selected: true }
          ]
        });

        setOriginalCoverImage(beatData.coverImage || "");
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching beat:", error);
        setError("Failed to load beat details. Please try again.");
        setIsLoading(false);
        if (error.response?.status === 401) {
          navigate("/login");
        }
      }
    };

    if (beatId) fetchBeat();

    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [beatId, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setValidationErrors(prev => ({ ...prev, coverImage: "Image must be less than 5MB" }));
      return;
    }
    if (!file.type.match('image.*')) {
      setValidationErrors(prev => ({ ...prev, coverImage: "Please select a valid image file" }));
      return;
    }

    setCoverImage(file);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(URL.createObjectURL(file));
    setValidationErrors(prev => ({ ...prev, coverImage: null }));
  };

  const removeSelectedImage = () => {
    setCoverImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.price) {
      errors.price = "Price is required";
    } else if (isNaN(formData.price) || parseFloat(formData.price) <= 0) {
      errors.price = "Price must be a positive number";
    }
    return errors;
  };

  const handleLicensePriceChange = (index, value) => {
    const updatedLicenseTypes = [...formData.licenseTypes];
    updatedLicenseTypes[index].price = value;
    setFormData({ ...formData, licenseTypes: updatedLicenseTypes });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const updateData = new FormData();
      updateData.append("description", formData.description);
      updateData.append("price", formData.price);
      if (coverImage) updateData.append("coverImage", coverImage);

      // Interceptor handles Authorization header
      // Content-Type for FormData is set automatically by the interceptor
      const response = await API.put(`/api/beats/${beatId}`, updateData);

      setSuccessMessage("Beat updated successfully!");
      if (response.data.beat) setBeat(response.data.beat);

      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (error) {
      console.error("Error updating beat:", error);
      setError(error.response?.data?.message || "Failed to update beat. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => navigate("/dashboard");

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading beat details...</p>
        </div>
      </div>
    );
  }

  if (error && !beat) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>{error}</p>
          <button onClick={() => navigate("/dashboard")} className={styles.backButton}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Edit Beat</h1>
        <button className={styles.backButton} onClick={handleCancel}>
          Back to Dashboard
        </button>
      </div>

      {error && <div className={styles.errorMessage}>{error}</div>}
      {successMessage && <div className={styles.successMessage}>{successMessage}</div>}

      <div className={styles.editForm}>
        <div className={styles.beatInfo}>
          <h2>{beat?.title || "Beat Details"}</h2>
          <p className={styles.beatMeta}>
            Genre: <span>{beat?.genre || "N/A"}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.formSection}>
            <h3>Update Cover Image</h3>
            <div className={styles.imageUploadSection}>
              <div className={styles.currentImage}>
                <h4>Current Cover</h4>
                <img
                  src={originalCoverImage || "/default-cover.jpg"}
                  alt="Current cover"
                  className={styles.coverPreview}
                />
              </div>

              <div className={styles.newImage}>
                <h4>New Cover</h4>
                {!coverImage ? (
                  <div className={styles.uploadContainer}>
                    <label
                      htmlFor="coverImage"
                      className={validationErrors.coverImage ? styles.errorBorder : ""}
                    >
                      <FaImage className={styles.uploadIcon} />
                      <span>Select New Image</span>
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
                  </div>
                ) : (
                  <div className={styles.previewContainer}>
                    <img
                      src={imagePreview}
                      alt="New cover preview"
                      className={styles.coverPreview}
                    />
                    <button
                      type="button"
                      className={styles.removeButton}
                      onClick={removeSelectedImage}
                    >
                      <FaTimes /> Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={styles.formSection}>
            <h3>License Options</h3>
            {formData.licenseTypes.map((license, index) => (
              <div key={index} className={styles.licenseOption}>
                <h4>{license.name}</h4>
                <div className={styles.formGroup}>
                  <label htmlFor={`license-${index}`}>Price (Rs)</label>
                  <input
                    type="number"
                    id={`license-${index}`}
                    value={license.price}
                    onChange={(e) => handleLicensePriceChange(index, e.target.value)}
                    step="0.01"
                    min="0.01"
                    className={styles.licenseInput}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe your beat"
              rows="4"
            ></textarea>
          </div>

          <div className={styles.formActions}>
            <button type="button" className={styles.cancelButton} onClick={handleCancel}>
              Cancel
            </button>
            <button type="submit" className={styles.saveButton} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
              {!isSaving && <FaSave className={styles.buttonIcon} />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBeat;