import React, { useEffect, useState } from "react";

const Dashboard = () => {
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await fetch("http://localhost:5001/dashboard", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        });

        if (!response.ok) throw new Error("Unauthorized or error fetching");

        const data = await response.json();
        setMessage(data.message);
      } catch (error) {
        setMessage("You must be logged in to view this.");
      }
    };

    fetchDashboard();
  }, []);

  return (
    <div>
      <h2>Dashboard</h2>
      <p>{message}</p>
    </div>
  );
};

export default Dashboard;

