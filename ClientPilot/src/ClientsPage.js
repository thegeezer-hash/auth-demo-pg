import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";


const ClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [newClient, setNewClient] = useState({ name: "", email: "", phone: "" });
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editClient, setEditClient] = useState({ name: "", email: "", phone: "" });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetch("http://localhost:5002/clients", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setClients(data))
      .catch(() => setError("Could not load clients"));
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();

    if (!newClient.name.trim()) {
      setError("Client name is required");
      return;
    }

    try {
      const res = await fetch("http://localhost:5002/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(newClient),
      });

      const added = await res.json();
      setClients([...clients, added]);
      setNewClient({ name: "", email: "", phone: "" });
      setError("");
    } catch (err) {
      setError("Failed to add client");
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`http://localhost:5002/clients/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setClients(clients.filter((client) => client.id !== id));
    } catch (err) {
      setError("Failed to delete client");
    }
  };

  const startEditing = (client) => {
    setEditingId(client.id);
    setEditClient({ name: client.name, email: client.email, phone: client.phone });
  };

  const handleEditSubmit = async (e, id) => {
    e.preventDefault();

    try {
      const res = await fetch(`http://localhost:5002/clients/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(editClient),
      });

      const updated = await res.json();
      setClients(clients.map((c) => (c.id === id ? updated : c)));
      setEditingId(null);
    } catch (err) {
      setError("Failed to update client");
    }
  };

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="container mt-5">
      <h2 className="text-center">
        <span role="img" aria-label="Clipboard">📋</span> Your Clients
      </h2>

      <form onSubmit={handleAdd} className="row g-2 mb-4 mt-4">
        <div className="col-md-3">
          <input
            type="text"
            className="form-control"
            placeholder="Name *"
            value={newClient.name}
            onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
          />
        </div>
        <div className="col-md-3">
          <input
            type="email"
            className="form-control"
            placeholder="Email"
            value={newClient.email}
            onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
          />
        </div>
        <div className="col-md-3">
          <input
            type="text"
            className="form-control"
            placeholder="Phone"
            value={newClient.phone}
            onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
          />
        </div>
        <div className="col-md-3">
          <button className="btn btn-primary w-100" type="submit">Add Client</button>
        </div>
      </form>

      {error && <p className="text-danger text-center">{error}</p>}

      <div className="mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Search clients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <ul className="list-group">
        {filteredClients.map((client) => (
          <li key={client.id} className="list-group-item">
            {editingId === client.id ? (
              <form onSubmit={(e) => handleEditSubmit(e, client.id)} className="row g-2">
                <div className="col-md-3">
                  <input
                    className="form-control"
                    value={editClient.name}
                    onChange={(e) => setEditClient({ ...editClient, name: e.target.value })}
                  />
                </div>
                <div className="col-md-3">
                  <input
                    className="form-control"
                    value={editClient.email}
                    onChange={(e) => setEditClient({ ...editClient, email: e.target.value })}
                  />
                </div>
                <div className="col-md-3">
                  <input
                    className="form-control"
                    value={editClient.phone}
                    onChange={(e) => setEditClient({ ...editClient, phone: e.target.value })}
                  />
                </div>
                <div className="col-md-3 d-flex gap-2">
                  <button type="submit" className="btn btn-success btn-sm">Save</button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
                </div>
              </form>
            ) : (
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <strong>{client.name}</strong><br />
                  {client.email && <small>Email: {client.email}</small>}<br />
                  {client.phone && <small>Phone: {client.phone}</small>}
                </div>
                <div>
                  <button className="btn btn-sm btn-outline-warning me-2" onClick={() => startEditing(client)}>Edit</button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(client.id)}>Delete</button>
                  <button className="btn btn-sm btn-outline-info me-2" onClick={() => window.location.href = `/clients/${client.id}`}>View</button>
                  <Link to={`/clients/${client.id}`} className="btn btn-sm btn-outline-info me-2">View</Link>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
    
  );
};

export default ClientsPage;
