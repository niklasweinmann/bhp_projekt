import React from "react";

interface LayerToggleProps {
  layers: { name: string; visible: boolean }[];
  onToggle: (idx: number) => void;
}

const LayerToggle: React.FC<LayerToggleProps> = ({ layers, onToggle }) => (
  <div className="layer-toggle-bar">
    <b style={{ marginRight: 8, color: '#bfa76a' }}>Layer:</b>
    {layers.map((layer, i) => (
      <label key={layer.name} className="layer-switch">
        <input
          type="checkbox"
          checked={layer.visible}
          onChange={() => onToggle(i)}
        />
        <span>{layer.name}</span>
      </label>
    ))}
  </div>
);

export default LayerToggle;
