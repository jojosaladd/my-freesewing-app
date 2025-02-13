import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Editor from "./pages/Editor";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />  {/* Home Page */}
        <Route path="/editor" element={<Editor />} />  {/* Editor Page */}
      </Routes>
    </Router>
  );
};

export default App;
