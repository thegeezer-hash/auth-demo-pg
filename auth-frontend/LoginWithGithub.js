import React from "react";

const LoginWithGithub = () => {
const handleLogin = () => {
    window.location.href = "http://localhost:5002/auth/github";

};

return <button onClick={handleLogin}>Login with GitHub</button>;
};

export default LoginWithGitHub;

