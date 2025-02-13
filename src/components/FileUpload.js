import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import navigation function

const FileUpload = () => {
  const [fileURL, setFileURL] = useState("");
  const navigate = useNavigate(); // Hook for navigation

  // Load file from localStorage if it exists
  useEffect(() => {
    const savedFile = localStorage.getItem("uploadedFile");
    if (savedFile) {
      setFileURL(savedFile);
    } else {
        setFileURL("");
    }
  }, []);

  // Handle file selection & store it properly
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];

    // If no file is selected, do nothing
    if (!selectedFile) return;

    // Generate a preview URL and store it
    const fileURL = URL.createObjectURL(selectedFile);
    setFileURL(fileURL);
    localStorage.setItem("uploadedFile", fileURL); // ✅ Save to localStorage
  };

  //when you press next button
  const handleNext = () => {
    if (fileURL) {
      navigate("/editor"); // Navigate to Editor Page
    } else {
      alert("❌ Please upload a file first!");
    }
  };


  return (
    <div style={{ textAlign: "center", margin: "20px" }}>
      <h2>Upload Your Pattern File</h2>
      <input type="file" accept=".svg" onChange={handleFileChange} />
      
      {fileURL && (
        <div>
          <p>Local Preview:</p>
          <iframe src={fileURL} width="300" height="300" title="SVG Preview"></iframe>
        </div>
      )}

      {/* ✅ Add a "Next" Button for Navigation */}
      <button 
        onClick={handleNext} 
        style={{ 
          marginTop: "10px", 
          padding: "10px", 
          background: fileURL ? "#4CAF50" : "#d3d3d3", 
          borderRadius: "10px", 
          cursor: fileURL ? "pointer" : "not-allowed", 
          color: "white",
          border: "none"
        }}
        disabled={!fileURL} // ✅ Disable button if no file is uploaded
      >
        Next
      </button>
    </div>
  );
};

export default FileUpload;
