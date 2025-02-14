import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import navigation function

const FileUpload = () => {
  const [fileURL, setFileURL] = useState("");
  const [svgContent, setSvgContent] = useState(""); // Store SVG content
  const [viewBox, setViewBox] = useState("0 0 200 200"); // Default viewBox
  const navigate = useNavigate(); // Hook for navigation

  // Load file from localStorage if it exists
  useEffect(() => {
    // Clear storage when entering Home page
    localStorage.removeItem("uploadedSVG");
    setSvgContent(""); // Reset state
  
    console.log("DEBUG:: LocalStorage cleared when entering Home Page");
  }, []);

  // Handle file selection & store it properly
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];

    if (!selectedFile) {
      console.log("DEBUG::::: ❌ No file selected.");
      return;
    }

    if (selectedFile.type === "image/svg+xml") {
      const reader = new FileReader();
      reader.onload = (e) => {
        let svgText = e.target.result;

        // Extract viewBox if it exists
        const viewBoxMatch = svgText.match(/viewBox="([\d\s.-]+)"/);
        if (viewBoxMatch) {
          setViewBox(viewBoxMatch[1]); // Update viewBox dynamically
        }

        // Store raw SVG content for preview
        localStorage.setItem("uploadedSVG", svgText);
        setSvgContent(svgText);
      };
      reader.readAsText(selectedFile);
    } else {
      alert("❌ Please upload an SVG file.");
    }
  };

  //when you press next button
  const handleNext = () => {
    if (svgContent) {
      navigate("/editor"); // Navigate to Editor Page
    } else {
      alert("❌ Please upload a file first!");
    }
  };

  return (
    <div style={{ textAlign: "center", margin: "20px" }}>
      <h2>Upload Your Pattern File</h2>
      <input type="file" accept=".svg" onChange={handleFileChange} />
      
      {svgContent && (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          minHeight: "1000px", // Increased height for better fit
          marginTop: "20px",
          border: "1px solid red"  
        }}>
          <p>Preview:</p>
          <iframe
            srcDoc={`
              <svg 
                width="100%" 
                height="100%" 
                viewBox="${viewBox}"  // Dynamic viewBox 
                preserveAspectRatio="xMidYMid meet"
                style="max-width: 100%; max-height: 100%;"
              >
                ${svgContent}
              </svg>
            `}
            width="500"
            height="950" //SMALL BOX 
            style={{ border: "none" }}
            title="SVG Preview"
          />
        </div>
      )}

      {/* Add a "Next" Button for Navigation */}
      <button 
        onClick={handleNext} 
        style={{ 
          marginTop: "10px", 
          padding: "10px", 
          background: svgContent ? "#4CAF50" : "#d3d3d3", 
          borderRadius: "10px", 
          cursor: svgContent ? "pointer" : "not-allowed", 
          color: "white",
          border: "none"
        }}
        disabled={!svgContent} // Disable button if no file is uploaded
      >
        Next
      </button>
    </div>
  );
};

export default FileUpload;
