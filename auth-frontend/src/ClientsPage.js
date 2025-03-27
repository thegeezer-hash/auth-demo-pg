import React, { useState, useEffect } from 'react';

const ClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for add client form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', email: '' });

  // State for editing a client
  const [editingClientId, setEditingClientId] = useState(null);
  const [editedClient, setEditedClient] = useState({ name: '', email: '' });

  // Fetch clients from the /clients endpoint when the component mounts
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch("http://localhost:5002/clients");
        if (!response.ok) throw new Error('Failed to fetch clients');
        const data = await response.json();
        setClients(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  // --- Add Client Handlers ---
  const handleAddClientClick = () => {
    setShowAddForm(true);
  };

  const handleAddFormChange = (e) => {
    setNewClient({ ...newClient, [e.target.name]: e.target.value });
  };

  const handleAddFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient),
      });
      if (!response.ok) throw new Error('Failed to add client');
      const addedClient = await response.json();
      setClients([...clients, addedClient]);
      setShowAddForm(false);
      setNewClient({ name: '', email: '' });
    } catch (err) {
      console.error(err);
    }
  };

  // --- Edit Client Handlers ---
  const handleEditClick = (client) => {
    setEditingClientId(client.id);
    setEditedClient({ name: client.name, email: client.email });
  };

  const handleEditChange = (e) => {
    setEditedClient({ ...editedClient, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (clientId) => {
    try {
      const response = await fetch(`/clients/${clientId}`, {
        method: 'PUT', // or PATCH if that's what your API expects
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedClient),
      });
      if (!response.ok) throw new Error('Failed to update client');
      const updatedClient = await response.json();
      setClients(clients.map(client => client.id === clientId ? updatedClient : client));
      setEditingClientId(null);
      setEditedClient({ name: '', email: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditCancel = () => {
    setEditingClientId(null);
    setEditedClient({ name: '', email: '' });
  };

  // --- Delete Client Handler ---
  const handleDeleteClient = async (clientId) => {
    if (!window.confirm('Are you sure you want to delete this client?')) return;
    try {
      const response = await fetch(`/clients/${clientId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete client');
      setClients(clients.filter(client => client.id !== clientId));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <p>Loading clients...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <h1>Clients</h1>
      {/* Add Client Form */}
      {!showAddForm && <button onClick={handleAddClientClick}>Add Client</button>}
      {showAddForm && (
        <form onSubmit={handleAddFormSubmit} style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={newClient.name}
            onChange={handleAddFormChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={newClient.email}
            onChange={handleAddFormChange}
            required
          />
          <button type="submit">Submit</button>
          <button type="button" onClick={() => setShowAddForm(false)}>
            Cancel
          </button>
        </form>
      )}

      {/* Clients Table */}
      <table border="1" cellPadding="8" cellSpacing="0">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {clients.map(client => (
            <tr key={client.id}>
              <td>{client.id}</td>
              <td>
                {editingClientId === client.id ? (
                  <input
                    type="text"
                    name="name"
                    value={editedClient.name}
                    onChange={handleEditChange}
                    required
                  />
                ) : (
                  client.name
                )}
              </td>
              <td>
                {editingClientId === client.id ? (
                  <input
                    type="email"
                    name="email"
                    value={editedClient.email}
                    onChange={handleEditChange}
                    required
                  />
                ) : (
                  client.email
                )}
              </td>
              <td>
                {editingClientId === client.id ? (
                  <>
                    <button onClick={() => handleEditSubmit(client.id)}>Save</button>
                    <button onClick={handleEditCancel}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handleEditClick(client)}>Edit</button>
                    <button onClick={() => handleDeleteClient(client.id)}>Delete</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ClientsPage;
