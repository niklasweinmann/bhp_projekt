import { useEffect, useState } from 'react'
import { Stage, Layer, Circle } from 'react-konva'
import './App.css'
import PlantMap from './components/PlantMap'
import PlantSelector from './components/PlantSelector'
import PlantInfo from './components/PlantInfo'
import type { Plant } from './components/PlantSelector'

function App() {
  const [arten, setArten] = useState<Plant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null)

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

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#f0f0f0' }}>
      <h1>Permakultur 2D-Editor (react-konva)</h1>
      {loading && <p>Lade Pflanzenarten...</p>}
      {error && <p style={{color:'red'}}>{error}</p>}
      {!loading && !error && (
        <>
          <PlantSelector plants={arten} onSelect={setSelectedPlant} />
          <PlantInfo plant={selectedPlant} />
          <PlantMap selectedPlant={selectedPlant} />
        </>
      )}
    </div>
  )
}

export default App
