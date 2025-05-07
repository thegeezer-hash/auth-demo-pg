import React, { useEffect, useState } from "react";

const Profile = () => {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5002/profile", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setProfile(data))
      .catch(() => setProfile(null));
  }, []);

  if (!profile) return <p className="text-center mt-5">Loading profile...</p>;

  return (
    <div className="container text-center mt-5">
      <h2>👤 Profile</h2>
      <p><strong>ID:</strong> {profile.id}</p>
      <p><strong>Email:</strong> {profile.email}</p>
      <p><strong>Username:</strong> {profile.username}</p>
    </div>
  );
};

export default Profile;
