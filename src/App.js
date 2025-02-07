import React, { useState } from "react";
import { Sandy } from "@freesewing/sandy"; // Import the pattern
import './App.css';

function App() {
  const [patternSVG, setPatternSVG] = useState("");

  const generatePattern = () => {
    try {
      const sandy = new Sandy({
        sa: 10, // Seam allowance (in mm)
        measurements: {
          waist: 780, 
          waistToFloor: 890,
          waistToHips: 90,
          hips: 860,
        },
      })
      .draft() // Generate the pattern
      .render(); // Convert to SVG

      console.log("Generated SVG:", sandy); // Debugging
      setPatternSVG(sandy); // Set the raw SVG output

    } catch (error) {
      console.error("Error generating pattern:", error);
    }
  };

  return (
    <div>
      <h1>Sandy Skirt Generator</h1>
      <button onClick={generatePattern}>Generate Sandy Pattern</button>
      <div dangerouslySetInnerHTML={{ __html: patternSVG }} />
    </div>
  );
}

export default App;