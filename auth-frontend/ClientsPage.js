import React, { useState, useEffect } from 'react';

const ClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch('/clients');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
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

  // Placeholder functions for CRUD actions
  const handleAddClient = () => {
    // Code to add a client will go here
    console.log('Add Client');
  };

  const handleEditClient = (clientId) => {
    // Code to edit a client will go here
    console.log('Edit Client', clientId);
  };

  const handleDeleteClient = (clientId) => {
    // Code to delete a client will go here
    console.log('Delete Client', clientId);
  };

  if (loading) return <p>Loading clients...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <h1>Clients</h1>
      <button onClick={handleAddClient}>Add Client</button>
      <table border="1" cellPadding="8" cellSpacing="0" style={{ marginTop: '1rem' }}>
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
              <td>{client.name}</td>
              <td>{client.email}</td>
              <td>
                <button onClick={() => handleEditClient(client.id)}>Edit</button>
                <button onClick={() => handleDeleteClient(client.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ClientsPage;
