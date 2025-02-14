import React, { useRef, useEffect, useState } from 'react';
import paper from 'paper';

const EditorCanvas = () => {
  const canvasRef = useRef(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [rotationAngle, setRotationAngle] = useState(0);
  const originalSize = useRef(null);

  // Panning States
  const isPanning = useRef(false);
  const lastMousePosition = useRef({ x: 0, y: 0 });
  const isSpacePressed = useRef(false);

  useEffect(() => {
    paper.setup(canvasRef.current);
    const svgData = localStorage.getItem("uploadedSVG");
    paper.project.currentStyle.strokeScaling = false; // 🔥 모든 strokeScaling을 false로 설정


    if (svgData) {
      paper.project.importSVG(svgData, {
        expandShapes: true,
        onLoad: (item) => {
          console.log("🔍 Imported SVG:", item);
          originalSize.current = item.bounds.clone();
          item.fitBounds(paper.view.bounds.scale(0.9));
          const scaleFactor = item.bounds.width / originalSize.current.width;
          setZoomLevel(Math.round(scaleFactor * 100));
          item.position = paper.view.center;
          logAllElements(); //debug- all paths will be red stroke/ log on console
          //enableHoverEffect(); // Activate hover effects

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

  // Debug to get all possible items 
  const logAllElements = () => {
    const allItems = paper.project.getItems({}); // Get all items as an array
    console.log("🔍 Listing all elements in Paper.js:", allItems);
    
    allItems.forEach((item, index) => {
      console.log(`📌 ${index}: ${item.className} - Name: ${item.name || "No Name"}`);
      if (item instanceof paper.Path || item instanceof paper.PointText) {
        item.strokeColor = new paper.Color(0, 0, 1); // Set stroke color to blue
      }
    });
  };

  // Zoom In Function
  const handleZoomIn = () => {
    if (paper.view.zoom < 10) {
      paper.view.zoom *= 1.2;
      setZoomLevel((prevZoom) => Math.round(prevZoom * 1.2));
    }
  };

  // Zoom Out Function
  const handleZoomOut = () => {
    if (paper.view.zoom > 0.2) {
      paper.view.zoom *= 0.8;
      setZoomLevel((prevZoom) => Math.round(prevZoom * 0.8));
    }
  };

  const handleFitToScreen = () => {
    const item = paper.project.activeLayer;
    if (!item) return;
  
    const bounds = item.bounds;
    const viewBounds = paper.view.bounds.scale(0.9);
  
    // 🔥 Calculate scaling factor for Fit to Screen
    const scaleX = viewBounds.width / bounds.width;
    const scaleY = viewBounds.height / bounds.height;
    const scaleFactor = Math.min(scaleX, scaleY);
  
    // 🔥 Store the previous zoom value before scaling
    const prevZoom = paper.view.zoom;
  
    // ✅ Adjust zoom instead of using fitBounds()
    paper.view.zoom *= scaleFactor;
    setZoomLevel(Math.round(paper.view.zoom * 100));
  
    // ✅ Center the item on the screen
    const offset = paper.view.center.subtract(item.bounds.center);
    item.translate(offset);
  
    // ✅ Maintain stroke width by adjusting it based on zoom change
    item.children.forEach((child) => {
      if (child instanceof paper.Path) {
        child.strokeScaling = false;
        child.strokeWidth *= prevZoom / paper.view.zoom; // 🔥 Adjust stroke width based on zoom ratio
      }
    });
  
    paper.view.update(); // 🔄 Force view update
  };


  // Rotate 90° Function
  const handleRotate = () => {
    const item = paper.project.activeLayer;
    if (item) {
      const newAngle = (rotationAngle + 90) % 360;
      setRotationAngle(newAngle);
      item.rotate(90);
    }
  };

  // Reset Rotation Function
  const handleResetRotation = () => {
    const item = paper.project.activeLayer;
    if (item) {
      item.rotate(-rotationAngle);
      setRotationAngle(0);
    }
  };

  //  Panning Functions (Hold SPACE + Drag to Move Canvas)
  const handleKeyDown = (event) => {
    if (event.key === " ") {
      isSpacePressed.current = true;
      canvasRef.current.style.cursor = "grab";
    }
  };

  const handleKeyUp = (event) => {
    if (event.key === " ") {
      isSpacePressed.current = false;
      isPanning.current = false;
      canvasRef.current.style.cursor = "default";
    }
  };

  const handleMouseDown = (event) => {
    if (isSpacePressed.current) {
      isPanning.current = true;
      lastMousePosition.current = { x: event.clientX, y: event.clientY };
    }
  };

  const handleMouseMove = (event) => {
    if (isPanning.current) {
      const deltaX = event.clientX - lastMousePosition.current.x;
      const deltaY = event.clientY - lastMousePosition.current.y;
      paper.view.center = new paper.Point(
        paper.view.center.x - deltaX / paper.view.zoom,
        paper.view.center.y - deltaY / paper.view.zoom
      );
      lastMousePosition.current = { x: event.clientX, y: event.clientY };
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", () => {
      isPanning.current = false;
      canvasRef.current.style.cursor = "default";
    });

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", () => {
        isPanning.current = false;
        canvasRef.current.style.cursor = "default";
      });
    };
  }, []);

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ marginBottom: '10px' }}>
        <button onClick={handleZoomOut} style={{ marginRight: '5px' }}>➖ Zoom Out</button>
        {/* <span>{zoomLevel}%</span> */}
        <button onClick={handleFitToScreen} style={{ marginRight: '5px' }}>🔲 Fit to Screen</button>
        <button onClick={handleZoomIn} style={{ marginRight: '5px' }}>➕ Zoom In</button>
        <button onClick={handleRotate} style={{ marginRight: '5px' }}>⟳ Rotate 90°</button>
        <button onClick={handleResetRotation}>↺ Reset Rotation</button>
      </div>
      <canvas ref={canvasRef} style={{ width: '100%', height: '80vh', background: '#f0f0f0', border: '2px dashed red' }} />
    </div>
  );
};

export default EditorCanvas;
