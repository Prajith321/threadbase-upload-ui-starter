import { useState, useRef, useEffect } from "react";
import apiClient from "../services/apiClient.js";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default function AvatarUploader() {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  // Task 2: Validate file type and size
  function handleFile(selectedFile) {
    if (!selectedFile) return;

    if (!ALLOWED.includes(selectedFile.type)) {
      setError("Only image files are allowed");
      setFile(null);
      return;
    }

    if (selectedFile.size > MAX_SIZE) {
      setError("File too large (max 5MB)");
      setFile(null);
      return;
    }

    setError(null);
    setSuccess(null);
    setProgress(0);
    setFile(selectedFile);
  }

  // Task 1: Drag-and-drop handlers
  function handleDragOver(e) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFile(droppedFile);
  }

  function handleChange(e) {
    const selectedFile = e.target.files[0];
    handleFile(selectedFile);
    e.target.value = "";
  }

  // Task 3: Local image preview with memory leak prevention
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  // Task 4: Upload with Axios and progress tracking
  async function upload() {
    if (!file) return;

    setProgress(0);
    setError(null);
    setSuccess(null);
    setUploading(true);

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      await apiClient.post("/api/upload", formData, {
        onUploadProgress: (event) => {
          const percent = Math.round((event.loaded * 100) / event.total);
          setProgress(percent);
        },
      });

      setSuccess("Upload successful!");
    } catch (err) {
      const message =
        err.response?.data?.error || err.message || "Upload failed";
      setError(message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div
        className={`drop-zone${isDragging ? " dragging" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        {preview && (
          <img
            src={preview}
            alt="Preview"
            className="preview"
            draggable={false}
          />
        )}
        <p>Drag an image here, or click to choose</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleChange}
        />
      </div>

      {error && <p className="error">{error}</p>}

      <div className="bar">
        <div className="fill" style={{ width: `${progress}%` }} />
      </div>

      {success && (
        <p style={{ color: "#16a34a", fontSize: "0.875rem", margin: "0.75rem 0" }}>
          {success}
        </p>
      )}

      <button onClick={upload} disabled={!file || uploading}>
        Upload
      </button>
    </div>
  );
}
