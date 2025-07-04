import React from "react";

export interface Plant {
  ID: string | number;
  "deutsche Bezeichnung": string;
  Gattung?: string;
  Familie?: string;
  Art?: string;
  "Höhe max [cm]"?: string | number;
}

interface PlantSelectorProps {
  plants: Plant[];
  onSelect: (plant: Plant) => void;
}

export const PlantSelector: React.FC<PlantSelectorProps> = ({ plants, onSelect }) => {
  return (
    <div style={{ marginBottom: 16 }}>
      <label htmlFor="plant-select"><b>Pflanze auswählen:</b></label>
      <select id="plant-select" onChange={e => {
        const selected = plants.find(p => String(p.ID) === e.target.value);
        if (selected) onSelect(selected);
      }}>
        <option value="">-- bitte wählen --</option>
        {plants.map(plant => (
          <option key={plant.ID} value={plant.ID}>{plant["deutsche Bezeichnung"]}</option>
        ))}
      </select>
    </div>
  );
};

export default PlantSelector;
