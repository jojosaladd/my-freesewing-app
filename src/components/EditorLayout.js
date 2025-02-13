import React from "react";
import EditorCanvas from "./EditorCanvas";
import EditorPanel from "./EditorPanel";
import "./EditorLayout.css"; // 📌 Add styles for layout

const EditorLayout = () => {
  return (
    <div className="editor-container">
      {/* Left Panel - Pattern Editor Canvas */}
      <div className="editor-panel">
        <h2>Pattern Editor Canvas</h2>
        <EditorCanvas />
      </div>
      
      {/* Right Panel - Editor Panel Placeholder */}
      <div className="editor-panel">
        <h2>Editor Panel (Placeholder)</h2>
        <EditorPanel />
      </div>
    </div>
  );
};

export default EditorLayout;
