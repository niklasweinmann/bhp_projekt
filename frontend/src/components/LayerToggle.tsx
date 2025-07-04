import React from "react";

interface LayerToggleProps {
  layers: { name: string; visible: boolean }[];
  onToggle: (idx: number) => void;
}

const LayerToggle: React.FC<LayerToggleProps> = ({ layers, onToggle }) => (
  <div style={{ marginBottom: 8 }}>
    <b>Layer:</b>
    {layers.map((layer, i) => (
      <label key={layer.name} style={{ marginLeft: 12 }}>
        <input
          type="checkbox"
          checked={layer.visible}
          onChange={() => onToggle(i)}
        />
        {layer.name}
      </label>
    ))}
  </div>
);

export default LayerToggle;
