import React, { useEffect } from "react";
import FileUpload from "../components/FileUpload";

const Home = () => {
  useEffect(() => {
    // Clear file when the Home page loads (but NOT when navigating away)
    localStorage.removeItem("uploadedFile");
  }, []);

  return (
    <div>
      <h1>Home Page</h1>
      <FileUpload />
    </div>
  );
};

export default Home;
