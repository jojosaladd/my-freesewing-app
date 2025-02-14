import React, { useRef, useEffect, useState } from 'react';
import paper from 'paper';

const EditorCanvas = () => {
  const canvasRef = useRef(null);
  const [zoomLevel, setZoomLevel] = useState(100); // Zoom percentage
  const [rotationAngle, setRotationAngle] = useState(0); // Rotation state
  const originalSize = useRef(null); // Store original size persistently

  useEffect(() => {
    paper.setup(canvasRef.current);
    const svgData = localStorage.getItem("uploadedSVG");

    if (svgData) {
      paper.project.importSVG(svgData, {
        expandShapes: true,
        onLoad: (item) => {
          console.log("🔍 Imported SVG:", item);

          // Store original dimensions
          originalSize.current = item.bounds.clone(); // Save persistently

          // Fit to Canvas (90%)
          item.fitBounds(paper.view.bounds.scale(0.9));

          // Calculate shrink percentage
          const scaleFactor = item.bounds.width / originalSize.current.width;
          setZoomLevel(Math.round(scaleFactor * 100)); // Correct zoom

          // Center the item
          item.position = paper.view.center;
        },
        onError: (message) => {
          console.error('Error loading SVG:', message);
        },
      });
    }

    return () => {
      paper.project.clear();
    };
  }, []);

  // Zoom In Function
  const handleZoomIn = () => {
    if (paper.view.zoom < 10) {
      paper.view.zoom *= 1.2; // Increase zoom by 20%
      setZoomLevel((prevZoom) => Math.round(prevZoom * 1.2)); // Fix state update
    }
  };

  // Zoom Out Function
  const handleZoomOut = () => {
    if (paper.view.zoom > 0.2) {
      paper.view.zoom *= 0.8; // Decrease zoom by 20%
      setZoomLevel((prevZoom) => Math.round(prevZoom * 0.8)); // Fix state update
    }
  };

  // Fit to Screen Function
  const handleFitToScreen = () => {
    const item = paper.project.activeLayer;
    if (item) {
      item.fitBounds(paper.view.bounds.scale(0.9)); // Rescale to fit screen
      const scaleFactor = item.bounds.width / originalSize.current.width;
      setZoomLevel(Math.round(scaleFactor * 100)); // Update zoom level
      item.position = paper.view.center; // Re-center
    }
  };

  // Rotate 90° Function
  const handleRotate = () => {
    const item = paper.project.activeLayer;
    if (item) {
      const newAngle = (rotationAngle + 90) % 360; // Rotate in 90° steps
      setRotationAngle(newAngle);
      item.rotate(90);
    }
  };

  // Reset Rotation Function
  const handleResetRotation = () => {
    const item = paper.project.activeLayer;
    if (item) {
      item.rotate(-rotationAngle); // Reset back to 0°
      setRotationAngle(0);
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ marginBottom: '10px' }}>
        <button onClick={handleZoomOut} style={{ marginRight: '5px' }}>➖ Zoom Out</button>
        {/* <span>{zoomLevel}%</span>  Now correctly updates zoom percentage */}
        <button onClick={handleFitToScreen} style={{ marginRight: '5px' }}>🔲 Fit to Screen</button>
        <button onClick={handleZoomIn} style={{ marginRight: '5px' }}>➕ Zoom In</button>
        <button onClick={handleRotate} style={{ marginRight: '5px' }}>⟳ Rotate 90°</button>
        <button onClick={handleResetRotation}>↺ Reset Rotation</button>
      </div>
      <canvas ref={canvasRef} style={{ width: '100%', height: '80vh', border: '2px dashed red' }} />
    </div>
  );
};

export default EditorCanvas;
