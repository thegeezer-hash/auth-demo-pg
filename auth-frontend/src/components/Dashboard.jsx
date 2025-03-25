import React from "react";

const Dashboard = ({ user, setUser }) => {
  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    window.location.href = "/";
  };

  return (
    <div className="container text-center mt-5">
      <h1>Dashboard</h1>
      <h3>{user?.email || "No user loaded"}</h3>
      <button className="btn btn-danger mt-3" onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default Dashboard;
