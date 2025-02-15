import React, { useRef, useEffect, useState } from 'react';
import paper from 'paper';
import PathManipulationButton from "./PathManipulationButton";

const EditorCanvas = () => {
  const canvasRef = useRef(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [rotationAngle, setRotationAngle] = useState(0);
  const originalSize = useRef(null);
  const BlueAnchorPoints = []; // 🔵 파란색으로 선택된 포인트 저장
  const [selectedPoint, setSelectedPoint] = useState(null); // 선택된 포인트
  const [position, setPosition] = useState({ x: 0, y: 0 }); // UI 입력 값


  // Panning States
  const isPanning = useRef(false);
  const lastMousePosition = useRef({ x: 0, y: 0 });
  const isSpacePressed = useRef(false);

  let showingPoints = false; 
  let activePath = null;

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



  //Ramer-Douglas-Peucker (RDP)
  const highlightSimplifiedKeyPoints = (epsilon = 3) => {
    if (typeof epsilon !== 'number' || isNaN(epsilon)) {
      console.error("🚨 Invalid epsilon value! Setting default value.");
      epsilon = 25; // 기본값 설정
    }
  
    const rdpSimplify = (points, epsilon) => {
      if (points.length < 3) return points;
  
      let dmax = 0;
      let index = 0;
  
      for (let i = 1; i < points.length - 1; i++) {
        let d = perpendicularDistance(points[i], points[0], points[points.length - 1]);
        if (d > dmax) {
          index = i;
          dmax = d;
        }
      }
  
      console.log(`🔥 Max Distance: ${dmax}, Epsilon Before Adjustment: ${epsilon}`);
  
      // ✅ epsilon을 maxDistance와 비교해서 최적화
      const adjustedEpsilon = Math.min(epsilon, dmax * 2); // 너무 큰 값 방지
      console.log(`🔄 Adjusted Epsilon: ${adjustedEpsilon}`);
  
      if (dmax > adjustedEpsilon) {
        const recResults1 = rdpSimplify(points.slice(0, index + 1), adjustedEpsilon);
        const recResults2 = rdpSimplify(points.slice(index), adjustedEpsilon);
        const result = recResults1.slice(0, -1).concat(recResults2);
  
        console.log(`✅ Simplified Points Count: ${result.length}`);
        return result;
      } else {
        console.log(`⚠️ Only keeping first & last points (Too few points kept!)`);
        return [points[0], points[points.length - 1]];
      }
    };
  
    const perpendicularDistance = (p, p1, p2) => {
      const num = Math.abs((p2.y - p1.y) * p.x - (p2.x - p1.x) * p.y + p2.x * p1.y - p2.y * p1.x);
      const den = Math.sqrt((p2.y - p1.y) ** 2 + (p2.x - p1.x) ** 2);
      return num / den;
    };
  
    // 기존 표시된 점 삭제
    paper.project.getItems({ name: "key-point" }).forEach(item => item.remove());
  
    const allPaths = paper.project.getItems({ class: paper.Path });
  
    allPaths.forEach((path) => {
      let originalPoints = path.segments.map(segment => segment.point);
  
      console.log(`🔍 Checking Path Bounds:`, path.bounds);
      if (!path.bounds || isNaN(path.bounds.width) || isNaN(path.bounds.height)) {
        console.warn("⚠️ Path bounds not found or invalid:", path.bounds);
        return; // bounds가 없으면 스킵
      }
  
      const boundingBox = path.bounds;
      const width = boundingBox.width;
      const height = boundingBox.height;
  
      if (isNaN(width) || isNaN(height)) {
        console.error("🚨 Invalid bounding box dimensions!", boundingBox);
        return;
      }
  
      // ✅ `Adjusted Epsilon`을 너무 크지 않게 제한
      const adjustedEpsilon = Math.min(epsilon, (width + height) / 10);
  
      console.log(`🔄 Final Adjusted Epsilon: ${adjustedEpsilon}`);
  
      let simplifiedPoints = rdpSimplify(originalPoints, adjustedEpsilon);
  
      // ✅ 필터링된 주요 포인트를 초록색으로 표시
      simplifiedPoints.forEach(point => {
        new paper.Path.Circle({
          center: point,
          radius: 3,
          fillColor: 'green',
          name: "key-point"
        });
      });
    });
  
    paper.view.update();
  };
  
  
  const enablePathManipulation = () => {
    if (!paper.project) {
        console.error("❌ Paper.js is not initialized!");
        return;
    }
  
    console.log("✅ Path Manipulation Tool Activated!");
  
    paper.tool = new paper.Tool();
    let selectedSegment = null; // 현재 선택된 Segment
    let selectedHandle = null;  // 현재 선택된 Handle
  
    // 🖱️ 마우스를 클릭하면 가장 가까운 Anchor / Handle 선택
    paper.tool.onMouseDown = (event) => {
        const hit = paper.project.hitTest(event.point, {
            segments: true,    
            stroke: true,      
            handles: true,     
            tolerance: 10,     
        });
  
        if (hit) {
            if (hit.type === "segment") {
                selectedSegment = hit.segment;
                setSelectedPoint(selectedSegment); // ✅ 선택된 포인트 저장
                setPosition({ x: selectedSegment.point.x, y: selectedSegment.point.y }); // ✅ 현재 좌표 UI에 반영
                selectedHandle = null;
                console.log("🎯 Selected Point:", selectedSegment.point);
                console.log("🎯 Anchor Selected:", selectedSegment.point);
  
                // 🔥 Straight Line이면 Handle 숨기기
                if (selectedSegment.handleIn.isZero() && selectedSegment.handleOut.isZero()) {
                    selectedSegment.selected = true; // Anchor만 선택
                    selectedSegment.handleIn = new paper.Point(0, 0);
                    selectedSegment.handleOut = new paper.Point(0, 0);
                    console.log("🚫 No Handles (Straight Line)");
                } else {
                    console.log("✅ Handles Available (Curve)");
                }
            } else if (hit.type === "handle-in") {
                if (!hit.segment.handleIn.isZero()) {
                    selectedSegment = hit.segment;
                    selectedHandle = "handleIn";
                    console.log("🔧 Handle-In Selected:", selectedSegment.handleIn);
                }
            } else if (hit.type === "handle-out") {
                if (!hit.segment.handleOut.isZero()) {
                    selectedSegment = hit.segment;
                    selectedHandle = "handleOut";
                    console.log("🔧 Handle-Out Selected:", selectedSegment.handleOut);
                }
            }
        } else {
            selectedSegment = null;
            selectedHandle = null;
            setSelectedPoint(null); // 클릭한 곳이 포인트가 아니면 UI 숨김
        }
    };
  
    // 🎯 마우스를 드래그하면 선택된 Anchor / Handle 이동
    paper.tool.onMouseDrag = (event) => {
        if (!selectedSegment) return;
  
        if (selectedHandle === "handleIn") {
            let newHandleIn = event.point.subtract(selectedSegment.point);
            let handleLength = selectedSegment.handleIn.length;
            selectedSegment.handleIn = newHandleIn.normalize().multiply(handleLength); // 길이 유지
        } 
        else if (selectedHandle === "handleOut") {
            let newHandleOut = event.point.subtract(selectedSegment.point);
            let handleLength = selectedSegment.handleOut.length;
            selectedSegment.handleOut = newHandleOut.normalize().multiply(handleLength); // 길이 유지
        } 
        else {
            let delta = event.delta;
            selectedSegment.point = selectedSegment.point.add(delta); // 🔥 Anchor 이동
            if (!selectedSegment.handleIn.isZero() || !selectedSegment.handleOut.isZero()) {
                selectedSegment.handleIn = selectedSegment.handleIn.add(delta); 
                selectedSegment.handleOut = selectedSegment.handleOut.add(delta);
            }
        }
        paper.view.update();
    };
  
    // 🟢 마우스를 움직이면 가까운 Anchor / Handle 하이라이트
    paper.tool.onMouseMove = (event) => {
        const hit = paper.project.hitTest(event.point, {
            segments: true,
            stroke: true,
            handles: true,
            tolerance: 10,
        });
  
        paper.project.activeLayer.selected = false;
        if (hit && hit.segment) {
            hit.segment.selected = true;
        }
    };
  };
  
  const handlePositionChange = (e) => {
    const { name, value } = e.target;
    setPosition((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
};

const applyPositionChange = () => {
    if (selectedPoint) {
        selectedPoint.point = new paper.Point(position.x, position.y);
        paper.view.update();
        console.log(`📌 Point moved to: (${position.x}, ${position.y})`);
    }
};

const enablePenTool = () => {
    // 🟢 Paper.js가 초기화되었는지 확인
    if (!paper.project) {
        console.error("❌ Paper.js is not initialized!");
        return;
    }

    console.log("✅ Pen Tool Activated!");

    paper.tool = new paper.Tool();

    // ✨ 클릭할 때 새로운 Anchor Point 추가
    paper.tool.onMouseDown = (event) => {
        if (!activePath) {
            activePath = new paper.Path({
                strokeColor: "black",
                strokeWidth: 2,
            });
        }

        // 🔴 새로운 Anchor Point 추가
        const segment = activePath.add(event.point);

        // ✨ 드래그 시작 시 Handle 설정을 위해 저장
        segment.handleIn = new paper.Point(0, 0);
        segment.handleOut = new paper.Point(0, 0);
    };

    // 🖱️ 마우스를 드래그하여 Bezier Handle 생성
    paper.tool.onMouseDrag = (event) => {
        if (!activePath || activePath.segments.length === 0) return;

        const lastSegment = activePath.lastSegment;
        if (!lastSegment) return;

        // 🎯 핸들 방향 설정 (Pen Tool처럼)
        lastSegment.handleOut = event.point.subtract(lastSegment.point);
        lastSegment.handleIn = lastSegment.handleOut.multiply(-1);
    };

    // 🛠 클릭된 점을 이동 가능하게 만듦
    paper.tool.onMouseMove = (event) => {
        const hit = paper.project.hitTest(event.point, {
            segments: true,
            stroke: true,
            tolerance: 10,
        });

        if (hit && hit.segment) {
            paper.project.activeLayer.selected = false;
            hit.segment.selected = true;
        } else {
            paper.project.activeLayer.selected = false;
        }
    };

    // // 🛑 우클릭하면 선택한 점 삭제 (선택 사항)
    // paper.tool.onKeyDown = (event) => {
    //     if (event.key === "delete" || event.key === "backspace") {
    //         const selectedItems = paper.project.selectedItems;
    //         selectedItems.forEach((item) => item.remove());
    //     }
    // };
};

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
  
    paper.view.update(); // 
  };
  

  const handleDeleteKey = (event) => {
    if (event.key === "Delete" || event.key === "Backspace") {
      console.log("🗑 Deleting Closest Point...");
  
      if (!paper.project || paper.project.activeLayer.children.length === 0) {
        console.warn("❌ No paths available to delete points from.");
        return;
      }
  
      
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
        <PathManipulationButton 
                    enablePathManipulation={enablePathManipulation} 
                />
      </div>
      <canvas ref={canvasRef} style={{ width: '100%', height: '80vh', background: '#f0f0f0', border: '2px dashed red' }} />
      {selectedPoint && (
                <div style={{
                    position: "absolute",
                    top: `${position.y}px`,
                    left: `${position.x}px`,
                    background: "white",
                    padding: "5px",
                    border: "1px solid black",
                    borderRadius: "5px"
                }}>
                    <label>X: <input type="number" name="x" value={position.x} onChange={handlePositionChange} /></label>
                    <label>Y: <input type="number" name="y" value={position.y} onChange={handlePositionChange} /></label>
                    <button onClick={applyPositionChange}>Move</button>
                </div>
            )}
    </div>
  );
};

export default EditorCanvas;
