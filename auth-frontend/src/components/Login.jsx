import React from "react";

const Login = () => {
  const handleGitHubLogin = () => {
    console.log("🔁 Redirecting to GitHub..."); // Debugging
    window.location.href = "http://localhost:5002/auth/github";
  };

  return (
    <div className="container text-center mt-5">
      <h1>GitHub OAuth Demo</h1>
      <button className="btn btn-dark btn-lg" onClick={handleGitHubLogin}>
        <i className="fab fa-github"></i> Login with GitHub
      </button>
    </div>
  );
};

export default Login;
