import React, { useEffect, useRef } from "react";
import paper from "paper";

const PatternEditor = () => {
  const canvasRef = useRef(null);
  let selectedSegment = null;
  let selectedPath = null;
  let movePath = false;

  useEffect(() => {
    if (!canvasRef.current) return;

    paper.setup(canvasRef.current);

    // 클릭 감지 옵션 (점, 선, 패턴 내부 클릭 가능)
    const hitOptions = {
      segments: true,
      stroke: true,
      fill: true,
      tolerance: 5,
    };

    paper.project.importSVG("/slv.svg", {
      expandShapes: true,
      insert: true,
      applyMatrix: true,
      onLoad: function (item) {
        console.log("✅ SVG 로드 완료");
        item.fitBounds(paper.view.bounds);
        item.strokeColor = "black";

        // ✅ Group을 삭제하지 않고 유지 (삭제하면 SVG 사라짐!)
        if (item instanceof paper.Group) {
          item.children.forEach((path) => {
            path.strokeColor = "black";
          });
        }
      },
      onError: function (error) {
        console.error("❌ SVG 로드 실패:", error);
      },
    });

    // 🔹 마우스를 눌렀을 때 (객체 선택)
    paper.view.onMouseDown = function (event) {
      selectedSegment = null;
      selectedPath = null;
      movePath = false;

      let hitResult = paper.project.hitTest(event.point, hitOptions);
      if (!hitResult) return;

      selectedPath = hitResult.item;

      if (hitResult.type === "segment") {
        // ✅ 점(segment)을 클릭한 경우 개별 이동 가능
        selectedSegment = hitResult.segment;
      } else if (hitResult.type === "stroke") {
        // ✅ 선을 클릭하면 새로운 조절점 추가 가능
        let location = hitResult.location;
        selectedSegment = selectedPath.insert(location.index + 1, event.point);
        selectedPath.smooth();
      }

      // ✅ 패턴 내부를 클릭하면 전체 이동 가능
      movePath = hitResult.type === "fill" || hitResult.type === "stroke";
      if (movePath) {
        paper.project.activeLayer.addChild(hitResult.item);
      }
    };

    // 🔹 마우스를 드래그할 때 (점 또는 패스 이동)
    paper.view.onMouseDrag = function (event) {
      if (selectedSegment) {
        // ✅ 개별 점(segment) 이동
        selectedSegment.point = selectedSegment.point.add(event.delta);
      //  selectedPath.smooth();
      } else if (selectedPath) {
        // ✅ Path 전체 이동
        selectedPath.position = selectedPath.position.add(event.delta);
      }
    };

    return () => {
      paper.project.clear();
    };
  }, []);

  return (
    <div>
      <h1>Pattern Editor</h1>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        style={{ backgroundColor: "#f8f8f8", border: "1px solid black" }}
      />
    </div>
  );
};

export default PatternEditor;





// import React, { useState } from "react";
// import { Sandy } from "@freesewing/sandy"; // Import the pattern
// import paper from "paper";
// import './App.css';

// function App() {
//   const [patternSVG, setPatternSVG] = useState("");

//   const generatePattern = () => {
//     try {
//       const sandy = new Sandy({
//         sa: 10, // Seam allowance (in mm)
//         measurements: {
//           waist: 780, 
//           waistToFloor: 890,
//           waistToHips: 90,
//           hips: 860,
//         },
//       })
//       .draft() // Generate the pattern
//       .render(); // Convert to SVG

//       console.log("Generated SVG:", sandy); // Debugging
//       setPatternSVG(sandy); // Set the raw SVG output

//     } catch (error) {
//       console.error("Error generating pattern:", error);
//     }
//   };

//   return (
//     <div>
//       <h1>Sandy Skirt Generator</h1>
//       <button onClick={generatePattern}>Generate Sandy Pattern</button>
//       <div dangerouslySetInnerHTML={{ __html: patternSVG }} />
//     </div>
//   );
// }

// export default App;