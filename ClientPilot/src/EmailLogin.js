import React, { useState } from "react";

const EmailLogin = ({ setUser }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState(""); // only used in register
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isRegistering ? "register" : "login";

    const body = isRegistering
      ? { email, password, username }
      : { email, password };

    try {
      const res = await fetch(`http://localhost:5002/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Error occurred");
        return;
      }

      if (!isRegistering && data.token) {
        localStorage.setItem("token", data.token);
        window.location.href = "/dashboard"; // force reload & redirect
      } else {
        setIsRegistering(false); // go back to login after register
      }
    } catch (err) {
      setError("Server error");
    }
  };

  return (
    <div className="container text-center mt-5">
      <h2>{isRegistering ? "Register" : "Login"} with Email</h2>
      <form onSubmit={handleSubmit} className="mt-3">
        {isRegistering && (
          <input
            className="form-control mb-2"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        )}
        <input
          className="form-control mb-2"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="form-control mb-2"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="btn btn-primary w-100" type="submit">
          {isRegistering ? "Register" : "Login"}
        </button>
        <button
          type="button"
          className="btn btn-link mt-2"
          onClick={() => setIsRegistering(!isRegistering)}
        >
          {isRegistering ? "Already have an account?" : "Need an account? Register"}
        </button>
        {error && <p className="text-danger mt-2">{error}</p>}
      </form>
    </div>
  );
};

export default EmailLogin;
