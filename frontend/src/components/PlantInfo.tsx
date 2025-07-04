import React from "react";
import type { Plant } from "./PlantSelector";

interface PlantInfoProps {
  plant: Plant | null;
}

export const PlantInfo: React.FC<PlantInfoProps> = ({ plant }) => {
  if (!plant) return null;
  return (
    <div style={{ margin: '16px 0', padding: 12, background: '#f9f9f9', border: '1px solid #ccc', borderRadius: 6 }}>
      <b>Pflanzen-Info:</b>
      <div><b>Name:</b> {plant["deutsche Bezeichnung"]}</div>
      <div><b>ID:</b> {plant.ID}</div>
      {/* Hier können später weitere Infos ergänzt werden */}
    </div>
  );
};

export default PlantInfo;
