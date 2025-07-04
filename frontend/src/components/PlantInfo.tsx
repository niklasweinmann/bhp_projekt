import React from "react";
import type { Plant } from "./PlantSelector";

interface PlantInfoProps {
  plant: Plant | null;
}

export const PlantInfo: React.FC<PlantInfoProps> = ({ plant }) => {
  if (!plant) return null;
  return (
    <div className="card plant-info-card" style={{ padding: 16, margin: '12px 0', background: '#fff8e1', border: '1.5px solid #e0c98c', borderRadius: 10 }}>
      <b style={{ fontSize: '1.1em', color: '#bfa76a' }}>Pflanzen-Info</b>
      <div><b>Name:</b> {plant["deutsche Bezeichnung"]}</div>
      <div><b>ID:</b> {plant.ID}</div>
      {/* Hier können später weitere Infos ergänzt werden */}
    </div>
  );
};

export default PlantInfo;
