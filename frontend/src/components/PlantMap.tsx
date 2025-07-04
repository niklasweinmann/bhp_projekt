import React, { useState } from "react";
import { Stage, Layer, Text, Circle, Group } from "react-konva";
import type { Plant } from "./PlantSelector";
import { saveDesign, loadDesign } from '../utils/designStorage';

const WIDTH = 800;
const HEIGHT = 600;

interface PlantMapProps {
  selectedPlant: Plant | null;
}

export interface PlacedPlant {
  plant: Plant;
  x: number;
  y: number;
}

export const PlantMap: React.FC<PlantMapProps> = ({ selectedPlant }) => {
  const [placedPlants, setPlacedPlants] = useState<PlacedPlant[]>([]);

  const handleStageClick = (e: any) => {
    if (!selectedPlant) return;
    const stage = e.target.getStage();
    const pointerPosition = stage.getPointerPosition();
    if (pointerPosition) {
      setPlacedPlants([
        ...placedPlants,
        { plant: selectedPlant, x: pointerPosition.x, y: pointerPosition.y },
      ]);
    }
  };

  const handleSave = () => {
    saveDesign(placedPlants);
    alert('Design gespeichert!');
  };

  const handleLoad = () => {
    const loaded = loadDesign();
    setPlacedPlants(loaded);
  };

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <button onClick={handleSave} style={{ marginRight: 8 }}>Design speichern</button>
        <button onClick={handleLoad}>Design laden</button>
      </div>
      <Stage
        width={WIDTH}
        height={HEIGHT}
        style={{ border: "1px solid #ccc" }}
        onClick={handleStageClick}
      >
        <Layer>
          {selectedPlant && (
            <Text
              text={`Ausgewählt: ${selectedPlant["deutsche Bezeichnung"]}`}
              x={20}
              y={20}
              fontSize={20}
              fill="#333"
            />
          )}
          {placedPlants.map((pp, i) => (
            <Group key={i} x={pp.x} y={pp.y}>
              <Circle radius={20} fill="#7fc97f" stroke="#333" strokeWidth={2} />
              <Text
                text={pp.plant["deutsche Bezeichnung"]}
                fontSize={12}
                fill="#222"
                x={-40}
                y={25}
                width={80}
                align="center"
              />
            </Group>
          ))}
        </Layer>
      </Stage>
    </div>
  );
};

export default PlantMap;
