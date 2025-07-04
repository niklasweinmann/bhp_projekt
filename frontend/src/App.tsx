import { useEffect, useState } from 'react'
import { Stage, Layer, Circle } from 'react-konva'
import './App.css'
import PlantMap from './components/PlantMap'

interface Art {
  [key: string]: string | number | null
}

function App() {
  const [arten, setArten] = useState<Art[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('http://localhost:8000/api/plants')
      .then((res) => res.json())
      .then((data) => {
        setArten(data)
        setLoading(false)
      })
      .catch((err) => {
        setError('Fehler beim Laden der Arten')
        setLoading(false)
      })
  }, [])

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#f0f0f0' }}>
      <h1>Permakultur 2D-Editor (react-konva)</h1>
      {loading && <p>Lade Pflanzenarten...</p>}
      {error && <p style={{color:'red'}}>{error}</p>}
      {!loading && !error && (
        <div style={{marginBottom: 16}}>
          <b>Arten aus Backend:</b>
          <ul>
            {arten.map((art, i) => (
              <li key={i}>{art['deutsche Bezeichnung'] || JSON.stringify(art)}</li>
            ))}
          </ul>
        </div>
      )}
      <PlantMap />
    </div>
  )
}

export default App
