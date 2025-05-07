import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

const ClientDetails = () => {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`http://localhost:5002/clients/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setClient(data))
      .catch(() => setError("Failed to load client details"));
  }, [id]);

  if (error) return <p className="text-center text-danger mt-5">{error}</p>;
  if (!client) return <p className="text-center mt-5">Loading client...</p>;

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">Client Details</h2>
      <div className="card p-4 shadow-sm">
        <h4>{client.name}</h4>
        <p><strong>Email:</strong> {client.email || "N/A"}</p>
        <p><strong>Phone:</strong> {client.phone || "N/A"}</p>
      </div>
      <div className="text-center mt-4">
        <Link to="/clients" className="btn btn-secondary">← Back to Clients</Link>
      </div>
    </div>
  );
};

export default ClientDetails;
