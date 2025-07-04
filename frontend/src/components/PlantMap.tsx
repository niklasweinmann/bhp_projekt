import React from "react";
import { Stage, Layer } from "react-konva";

const WIDTH = 800;
const HEIGHT = 600;

export const PlantMap: React.FC = () => {
  return (
    <Stage width={WIDTH} height={HEIGHT} style={{ border: "1px solid #ccc" }}>
      <Layer>
        {/* Hier werden später Pflanzen und Designs gerendert */}
      </Layer>
    </Stage>
  );
};

export default PlantMap;
