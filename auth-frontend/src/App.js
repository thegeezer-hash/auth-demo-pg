import React from "react";

const App = () => {
  const handleGitHubLogin = () => {
    window.location.href = "http://localhost:5001/auth/github"; // Redirect to backend
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>GitHub OAuth Demo</h1>
      <button 
        onClick={handleGitHubLogin} 
        style={{ padding: "10px 20px", fontSize: "18px", cursor: "pointer" }}
      >
        Login with GitHub
      </button>
    </div>
  );
};

export default App;
