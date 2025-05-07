import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from "react-router-dom";
import Profile from "./Profile";
import EmailLogin from "./EmailLogin";
import ClientsPage from "./ClientsPage";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import "bootstrap/dist/css/bootstrap.min.css";
import ClientDetails from "./ClientDetails";

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get("token");
    const savedToken = localStorage.getItem("token");

    const token = tokenFromUrl || savedToken;

    if (token) {
      try {
        const decoded = jwtDecode(token);
        const now = Date.now() / 1000;

        if (decoded.exp < now) {
          console.warn("Token expired");
          localStorage.removeItem("token");
          setUser(null);
          setLoading(false);
        } else {
          localStorage.setItem("token", token);
          window.history.replaceState({}, document.title, "/dashboard");

          axios
            .get("http://localhost:5002/user", {
              headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => {
              setUser(res.data);
              setLoading(false);
            })
            .catch(() => {
              localStorage.removeItem("token");
              setUser(null);
              setLoading(false);
            });
        }
      } catch (err) {
        console.error("Invalid token", err);
        localStorage.removeItem("token");
        setUser(null);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login user={user} loading={loading} />} />
        <Route
          path="/dashboard"
          element={user ? <Dashboard user={user} setUser={setUser} /> : <Navigate to="/" />}
        />
        <Route
          path="/clients"
          element={user ? <ClientsPage /> : <Navigate to="/" />}
        />
        <Route
          path="/profile"
          element={user ? <Profile /> : <Navigate to="/" />}
        />
        <Route path="/clients/:id" element={user ? <ClientDetails /> : <Navigate to="/" />} />
        <Route path="*" element={<h2 className="text-center mt-5">404 - Page Not Found</h2>} />
      </Routes>
    </Router>
  );
};

const Login = ({ user, loading }) => {
  const handleGitHubLogin = () => {
    window.location.href = "http://localhost:5002/auth/github";
  };

  if (loading) return <p className="text-center mt-5">Checking session...</p>;

  return (
    <div className="container text-center mt-5">
      <h1>GitHub OAuth Demo</h1>
      {user ? (
        <p>
          You're already logged in. Go to <Link to="/dashboard">Dashboard</Link>.
        </p>
      ) : (
        <>
          <button className="btn btn-dark btn-lg mb-3" onClick={handleGitHubLogin}>
            <i className="fab fa-github"></i> Login with GitHub
          </button>
          <EmailLogin setUser={null} />
        </>
      )}
    </div>
  );
};

const Dashboard = ({ user, setUser }) => {
  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    window.location.href = "/";
  };

  return (
    <div className="container text-center mt-5">
      <h1>Dashboard</h1>
      
      <img src={user.avatar} className="rounded-circle mb-3" width="100" alt="Avatar" />
      <h3>{user.email}</h3>
      <div className="mt-3">
        <Link to="/clients" className="btn btn-primary me-2">Clients</Link>
        <Link to="/profile" className="btn btn-secondary me-2">Profile</Link>
        <button className="btn btn-danger" onClick={handleLogout}>Logout</button>
        
      </div>
    </div>
  );
};

export default App;