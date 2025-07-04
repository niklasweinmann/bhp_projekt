import React, { useState } from "react";

interface LoginFormProps {
  onAuth: (token: string, username: string) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onAuth }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const url = isRegister
      ? "http://localhost:9000/api/register"
      : "http://localhost:9000/api/login";
    const form = new URLSearchParams();
    form.append("username", username);
    form.append("password", password);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form.toString(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Fehler");
      if (isRegister) {
        setIsRegister(false);
        setError("Registrierung erfolgreich. Bitte einloggen.");
      } else {
        onAuth(data.access_token, username);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ background: '#f5ecd7', color: '#222', padding: 24, borderRadius: 8, boxShadow: '0 2px 8px #bfa76a33', maxWidth: 340, margin: '40px auto', border: '1px solid #bfa76a' }}>
      <h2>{isRegister ? "Registrieren" : "Login"}</h2>
      <div style={{ marginBottom: 12 }}>
        <input
          type="text"
          placeholder="Benutzername"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
          style={{ width: '100%', padding: 8, background: '#fff8e1', color: '#222', border: '1px solid #bfa76a' }}
        />
      </div>
      <div style={{ marginBottom: 12 }}>
        <input
          type="password"
          placeholder="Passwort"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={{ width: '100%', padding: 8, background: '#fff8e1', color: '#222', border: '1px solid #bfa76a' }}
        />
      </div>
      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
      <button
        className="button-custom"
        type="submit"
        disabled={loading}
        style={{ width: '100%' }}
      >
        {loading ? "Bitte warten..." : isRegister ? "Registrieren" : "Login"}
      </button>
      <div style={{ marginTop: 12, textAlign: 'center' }}>
        <a href="#" style={{ color: '#bfa76a' }} onClick={e => { e.preventDefault(); setIsRegister(!isRegister); setError(null); }}>
          {isRegister ? "Zum Login" : "Neu? Jetzt registrieren"}
        </a>
      </div>
      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <button
          className="button-custom"
          type="button"
          style={{ width: '100%' }}
          onClick={() => onAuth('guest', 'Gast')}
        >Als Gast fortfahren</button>
      </div>
    </form>
  );
};

export default LoginForm;
