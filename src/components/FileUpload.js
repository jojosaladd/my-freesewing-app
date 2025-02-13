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
  
    if (!selectedFile) {
        console.log("DEBUG::::: ❌ No file selected.");
        return;
      }

    // console.log("DEBUG 2:::: ✅ Selected File:", selectedFile);

  
    if (selectedFile.type === "image/svg+xml") {
      const reader = new FileReader();
      reader.onload = (e) => {
        // console.log("DEBUG:: FileReader Loaded:", e.target.result); // Debugging
        const svgContent = e.target.result;
        localStorage.setItem("uploadedSVG", svgContent); // Save SVG content to localStorage
        setFileURL(svgContent); // Update state with SVG content
      };
      reader.readAsText(selectedFile);
    } else {
      alert("❌ Please upload an SVG file.");
    }
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
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", marginTop: "20px", border: "1px solid black" }}>
            <p>Preview:</p>
            <iframe
            srcDoc={`<svg width="100%" height="100%" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet">${fileURL}</svg>`}
            width="200"
            height="200"
            style={{ border: "none" }}
            title="SVG Preview"
            />
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
