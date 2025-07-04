import { useEffect, useState, useMemo } from 'react'
import './App.css'
import PlantMap from './components/PlantMap'
import PlantSelector from './components/PlantSelector'
import type { Plant } from './components/PlantSelector'
import PlantInfo from './components/PlantInfo'
import LoginForm from './components/LoginForm'
import logo from './assets/permhub_logo_fleave.png'

function App() {
  const [arten, setArten] = useState<Plant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'))
  const [username, setUsername] = useState<string | null>(localStorage.getItem('auth_user'))
  // Filter-States
  const [filterFamilie, setFilterFamilie] = useState('')
  const [filterGattung, setFilterGattung] = useState('')
  const [filterLicht, setFilterLicht] = useState('')

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

  // Filteroptionen generieren
  const familien = useMemo(() => Array.from(new Set(arten.map(a => a.Familie).filter(Boolean))), [arten])
  const gattungen = useMemo(() => Array.from(new Set(arten.map(a => a.Gattung).filter(Boolean))), [arten])
  const lichtzahlen = useMemo(() => Array.from(new Set(arten.map(a => a['Lichtzahl (L)']).filter(Boolean))), [arten])

  // Gefilterte Pflanzenliste
  const gefilterteArten = useMemo(() => {
    return arten.filter(a =>
      (!filterFamilie || a.Familie === filterFamilie) &&
      (!filterGattung || a.Gattung === filterGattung) &&
      (!filterLicht || a['Lichtzahl (L)'] === filterLicht)
    )
  }, [arten, filterFamilie, filterGattung, filterLicht])

  return (
    <div className="app-root">
      <header className="app-header">
        <img src={logo} alt="PermHub Logo" className="header-logo" />
        <div className="header-title">Permakultur 2D-Editor</div>
        <div className="header-filters">
          <select value={filterFamilie} onChange={e => setFilterFamilie(e.target.value)}>
            <option value="">Familie (alle)</option>
            {familien.map(f => <option key={f} value={f as string}>{f}</option>)}
          </select>
          <select value={filterGattung} onChange={e => setFilterGattung(e.target.value)}>
            <option value="">Gattung (alle)</option>
            {gattungen.map(g => <option key={g} value={g as string}>{g}</option>)}
          </select>
          <select value={filterLicht} onChange={e => setFilterLicht(e.target.value)}>
            <option value="">Lichtzahl (alle)</option>
            {lichtzahlen.map(l => <option key={l} value={l as string}>{l}</option>)}
          </select>
        </div>
        {token && username && (
          <div className="header-user">
            Eingeloggt als <b>{username}</b> <button className="button-custom" onClick={handleLogout}>Logout</button>
          </div>
        )}
      </header>
      <main className="app-main">
        {!token ? (
          <LoginForm onAuth={handleAuth} />
        ) : (
          <div className="main-content">
            <aside className="sidebar">
              <PlantSelector plants={gefilterteArten} onSelect={setSelectedPlant} />
            </aside>
            <section className="editor-area">
              {loading && <p>Lade Pflanzenarten...</p>}
              {error && <p style={{color:'red'}}>{error}</p>}
              {!loading && !error && <PlantMap selectedPlant={selectedPlant} />}
              <PlantInfo plant={selectedPlant} />
            </section>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
