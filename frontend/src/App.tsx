import { useEffect, useState } from 'react'
import { Stage, Layer, Circle } from 'react-konva'
import './App.css'
import PlantMap from './components/PlantMap'
import PlantSelector from './components/PlantSelector'
import PlantInfo from './components/PlantInfo'
import type { Plant } from './components/PlantSelector'
import LoginForm from './components/LoginForm'

function App() {
  const [arten, setArten] = useState<Plant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'))
  const [username, setUsername] = useState<string | null>(localStorage.getItem('auth_user'))

  useEffect(() => {
    fetch('http://localhost:9000/api/plants')
      .then((res) => res.json())
      .then((data) => {
        setArten(data)
        setLoading(false)
      })
      .catch(() => {
        setError('Fehler beim Laden der Arten')
        setLoading(false)
      })
  }, [])

  const handleAuth = (tok: string, user: string) => {
    setToken(tok)
    setUsername(user)
    localStorage.setItem('auth_token', tok)
    localStorage.setItem('auth_user', user)
  }

  const handleLogout = () => {
    setToken(null)
    setUsername(null)
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#f5ecd7', color: '#222' }}>
      <h1>Permakultur 2D-Editor (react-konva)</h1>
      {token && username && (
        <div style={{ position: 'absolute', top: 10, right: 20, background: '#fff8e1', color: '#222', border: '1px solid #bfa76a', borderRadius: 6, padding: '6px 16px' }}>
          Eingeloggt als <b>{username}</b> <button onClick={handleLogout} style={{ marginLeft: 8 }}>Logout</button>
        </div>
      )}
      {!token ? (
        <LoginForm onAuth={handleAuth} />
      ) : (
        <>
          {loading && <p>Lade Pflanzenarten...</p>}
          {error && <p style={{color:'red'}}>{error}</p>}
          {!loading && !error && (
            <>
              <PlantSelector plants={arten} onSelect={setSelectedPlant} />
              <PlantInfo plant={selectedPlant} />
              <PlantMap selectedPlant={selectedPlant} />
            </>
          )}
        </>
      )}
    </div>
  )
}

export default App
