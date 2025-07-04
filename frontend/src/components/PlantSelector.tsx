import React from "react";

export interface Plant {
  ID: string | number;
  "deutsche Bezeichnung": string;
  Gattung?: string;
  Familie?: string;
  Art?: string;
  "Höhe max [cm]"?: string | number;
  "Lichtzahl (L)"?: string;
}

interface PlantSelectorProps {
  plants: Plant[];
  onSelect: (plant: Plant) => void;
}

export const PlantSelector: React.FC<PlantSelectorProps> = ({ plants, onSelect }) => {
  return (
    <div className="card plant-selector-card">
      <label htmlFor="plant-select" style={{ fontWeight: 600, marginBottom: 6, display: 'block' }}>Pflanze auswählen:</label>
      <select
        id="plant-select"
        className="select-custom"
        onChange={e => {
          const selected = plants.find(p => String(p.ID) === e.target.value);
          if (selected) onSelect(selected);
        }}
        style={{ width: '100%', maxWidth: 260, marginBottom: 0 }}
      >
        <option value="">-- bitte wählen --</option>
        {plants.map(plant => (
          <option key={plant.ID} value={plant.ID}>{plant["deutsche Bezeichnung"]}</option>
        ))}
      </select>
    </div>
  );
};

export default PlantSelector;
