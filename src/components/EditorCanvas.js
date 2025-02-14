import React, { useRef, useEffect, useState } from 'react';
import paper from 'paper';

const EditorCanvas = () => {
  const canvasRef = useRef(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [rotationAngle, setRotationAngle] = useState(0);
  const originalSize = useRef(null);
  const BlueAnchorPoints = []; // 🔵 파란색으로 선택된 포인트 저장

  // Panning States
  const isPanning = useRef(false);
  const lastMousePosition = useRef({ x: 0, y: 0 });
  const isSpacePressed = useRef(false);

  let showingPoints = false; // 🔴 점들이 현재 보이는 상태인지 추적

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
         //  logAllElements(); //debug- all paths will be red stroke/ log on console
         // showAnchorPoints();// show points

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


  const showAnchorPoints = () => {
    if (showingPoints) {
      // 🔥 기존에 생성한 빨간색 점들만 삭제 (SVG는 유지)
      const allCircles = paper.project.getItems({ name: "anchor-point" });
      allCircles.forEach((circle) => circle.remove());
  
      showingPoints = false; // ❌ 점들이 사라진 상태로 변경
      console.log("🔴 Anchor Points Hidden");
    } else {
      // 🔥 점들을 다시 표시
      const allPaths = paper.project.getItems({ class: paper.Path });
  
      allPaths.forEach((path) => {
        path.segments.forEach((segment) => {
          const point = segment.point;
  
          const circle = new paper.Path.Circle({
            center: point,
            radius: 3,
            fillColor: 'red',
            name: "anchor-point", // 🔥 점들을 그룹화하여 나중에 쉽게 삭제 가능
          });
  
          circle.data.clicked = false;
  
          circle.onClick = () => {
            circle.data.clicked = !circle.data.clicked;
            circle.fillColor = circle.data.clicked ? 'blue' : 'red';
  
            if (circle.data.clicked) {
              if (!BlueAnchorPoints.some(p => p.equals(point))) {
                BlueAnchorPoints.push(point);
              }
            } else {
              const index = BlueAnchorPoints.findIndex(p => p.equals(point));
              if (index !== -1) {
                BlueAnchorPoints.splice(index, 1);
              }
            }
  
            console.log("🔵 Important Anchor Points:", BlueAnchorPoints.map(p => p.toString()));
          };
        });
      });
  
      showingPoints = true; // ✅ 점들이 표시된 상태로 변경
      console.log("🔴 Anchor Points Shown");
    }
  
    paper.view.update(); // 🔥 캔버스 업데이트 확실히 실행
  };
  

/// TO-BE : DELETE KEY FUNCTION
const handleDeleteKey = (event) => {
  if (event.key === "Delete") {
    console.log("🗑 Deleting NOT YET IMPLEMENTED");
  }
};

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
    window.addEventListener("keydown", handleDeleteKey);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", () => {
      isPanning.current = false;
      canvasRef.current.style.cursor = "default";
    });

    return () => {
      window.removeEventListener("keydown", handleDeleteKey);
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
        <button onClick={handleResetRotation} style={{ marginRight: '5px' }}>↺ Reset Rotation</button>
        <button onClick={showAnchorPoints} style={{ marginRight: '5px' }}>🔴 Show Anchor Points</button>

      </div>
      <canvas ref={canvasRef} style={{ width: '100%', height: '80vh', background: '#f0f0f0', border: '2px dashed red' }} />
    </div>
  );
};

export default EditorCanvas;
