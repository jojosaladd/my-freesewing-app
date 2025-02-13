import React, { useRef, useEffect } from 'react';
import paper from 'paper';

const EditorCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    paper.setup(canvasRef.current);

    const svgData = localStorage.getItem("uploadedSVG");
    if (svgData) {
      paper.project.importSVG(svgData, {
        expandShapes: true,
        onLoad: (item) => {
          item.position = paper.view.center;
          item.selected = true;
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

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />;
};

export default EditorCanvas;
