import React, { useState, useRef } from "react";
import { Stage, Layer, Text, Circle, Group, Rect, Line } from "react-konva";
import type { Plant } from "./PlantSelector";
import { saveDesign, loadDesign, saveDesignServer, loadDesignServer, listDesignsServer } from '../utils/designStorage';
import { saveAs } from 'file-saver';
import LayerToggle from './LayerToggle';
import { toPng } from 'html-to-image';

const WIDTH = 800;
const HEIGHT = 600;

interface PlantMapProps {
  selectedPlant: Plant | null;
}

export interface PlacedPlant {
  plant: Plant;
  x: number;
  y: number;
  radius?: number; // Einflussbereich
}

export const PlantMap: React.FC<PlantMapProps> = ({ selectedPlant }) => {
  const [placedPlants, setPlacedPlants] = useState<PlacedPlant[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [infoPos, setInfoPos] = useState<{x: number, y: number} | null>(null);
  const [showCircles, setShowCircles] = useState(true);
  const [layers, setLayers] = useState([
    { name: 'Raster', visible: true },
    { name: 'Pflanzen', visible: true },
    { name: 'Freihand', visible: false },
  ]);
  const [drawing, setDrawing] = useState(false);
  const [lines, setLines] = useState<{ points: number[]; color: string }[]>([]);
  const [currentColor, setCurrentColor] = useState('#0074d9');
  const [history, setHistory] = useState<any[]>([]);
  const [redoStack, setRedoStack] = useState<any[]>([]);
  const [textFields, setTextFields] = useState<{ x: number; y: number; text: string }[]>([]);
  const [editingTextIdx, setEditingTextIdx] = useState<number | null>(null);
  const [textInput, setTextInput] = useState('');
  const [tool, setTool] = useState<'pflanze' | 'freihand' | 'text' | 'rechteck' | 'polygon'>('pflanze');
  const stageRef = useRef<any>(null);
  const [rects, setRects] = useState<{ x: number; y: number; width: number; height: number }[]>([]);
  const [drawingRect, setDrawingRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [rectStart, setRectStart] = useState<{ x: number; y: number } | null>(null);
  const [polygons, setPolygons] = useState<{ points: number[] }[]>([]);
  const [drawingPoly, setDrawingPoly] = useState<number[] | null>(null);
  const [selectedObjects, setSelectedObjects] = useState<{ type: string; idx: number }[]>([]);
  const [serverDesigns, setServerDesigns] = useState<string[]>([]);
  const [designName, setDesignName] = useState('mein-design');

  // Helper für History
  const pushHistory = (newPlants: typeof placedPlants, newLines: typeof lines) => {
    setHistory(h => [...h, { plants: placedPlants, lines }]);
    setRedoStack([]);
  };

  // Undo/Redo
  const handleUndo = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory(history.slice(0, -1));
    setRedoStack(r => [...r, { plants: placedPlants, lines }]);
    setPlacedPlants(last.plants);
    setLines(last.lines);
  };
  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack(redoStack.slice(0, -1));
    setHistory(h => [...h, { plants: placedPlants, lines }]);
    setPlacedPlants(next.plants);
    setLines(next.lines);
  };

  // Textfeld platzieren
  const handleStageClick = (e: any) => {
    if (tool === 'polygon') {
      const pos = e.target.getStage().getPointerPosition();
      if (pos) {
        if (!drawingPoly) {
          setDrawingPoly([pos.x, pos.y]);
        } else {
          setDrawingPoly([...drawingPoly, pos.x, pos.y]);
        }
      }
      return;
    }
    if (tool === 'text') {
      const stage = e.target.getStage();
      const pointerPosition = stage.getPointerPosition();
      if (pointerPosition) {
        pushHistory(placedPlants, lines);
        setTextFields([...textFields, { x: pointerPosition.x, y: pointerPosition.y, text: 'Text' }]);
      }
      return;
    }
    if (!selectedPlant || tool !== 'pflanze') return;
    const stage = e.target.getStage();
    const pointerPosition = stage.getPointerPosition();
    if (pointerPosition) {
      // Default-Radius: 50 oder aus Pflanzendaten
      let defaultRadius = 50;
      const hoehe = Number(selectedPlant["Höhe max [cm]"]);
      if (!isNaN(hoehe)) defaultRadius = Math.max(30, Math.min(hoehe, 200));
      pushHistory([...placedPlants, { plant: selectedPlant, x: pointerPosition.x, y: pointerPosition.y, radius: defaultRadius }], lines);
      setPlacedPlants([
        ...placedPlants,
        { plant: selectedPlant, x: pointerPosition.x, y: pointerPosition.y, radius: defaultRadius },
      ]);
    }
  };

  const handleDrag = (idx: number, pos: {x: number, y: number}) => {
    pushHistory(placedPlants.map((pp, i) => i === idx ? { ...pp, ...pos } : pp), lines);
    setPlacedPlants(placedPlants.map((pp, i) => i === idx ? { ...pp, ...pos } : pp));
  };

  const handleRadiusDrag = (idx: number, pos: {x: number, y: number}) => {
    const plant = placedPlants[idx];
    const dx = pos.x - plant.x;
    const dy = pos.y - plant.y;
    const newRadius = Math.max(20, Math.sqrt(dx*dx + dy*dy));
    pushHistory(placedPlants.map((pp, i) => i === idx ? { ...pp, radius: newRadius } : pp), lines);
    setPlacedPlants(placedPlants.map((pp, i) => i === idx ? { ...pp, radius: newRadius } : pp));
  };

  const handlePlantClick = (idx: number, e: any) => {
    setSelectedIdx(idx);
    setInfoPos({ x: e.target.x(), y: e.target.y() });
  };

  const handleDelete = () => {
    if (selectedIdx !== null) {
      pushHistory(placedPlants.filter((_, i) => i !== selectedIdx), lines);
      setPlacedPlants(placedPlants.filter((_, i) => i !== selectedIdx));
      setSelectedIdx(null);
      setInfoPos(null);
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

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(placedPlants, null, 2)], { type: 'application/json' });
    saveAs(blob, 'permakultur_design.json');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target?.result as string);
        setPlacedPlants(Array.isArray(data) ? data : []);
      } catch {}
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    pushHistory([], []);
    setPlacedPlants([]);
    setLines([]);
    setSelectedIdx(null);
    setInfoPos(null);
  };

  const toggleLayer = (idx: number) => {
    setLayers(layers.map((l, i) => i === idx ? { ...l, visible: !l.visible } : l));
  };

  // Freihand-Zeichnen
  const handleMouseDown = (e: any) => {
    if (!layers[2].visible) return;
    setDrawing(true);
    const pos = e.target.getStage().getPointerPosition();
    if (pos) {
      pushHistory(placedPlants, [...lines, { points: [pos.x, pos.y], color: currentColor }]);
      setLines([...lines, { points: [pos.x, pos.y], color: currentColor }]);
    }
  };
  const handleMouseMove = (e: any) => {
    if (!drawing || !layers[2].visible) return;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    if (!point) return;
    setLines(prev => {
      const last = prev[prev.length - 1];
      if (!last) return prev;
      const newLines = prev.slice(0, -1);
      return [...newLines, { ...last, points: [...last.points, point.x, point.y] }];
    });
  };
  const handleMouseUp = () => {
    setDrawing(false);
  };
  const handleUndoLine = () => {
    pushHistory(placedPlants, lines.slice(0, -1));
    setLines(lines.slice(0, -1));
  };

  // Textfeld bearbeiten
  const handleTextDblClick = (idx: number) => {
    setEditingTextIdx(idx);
    setTextInput(textFields[idx].text);
  };
  const handleTextInputBlur = () => {
    if (editingTextIdx !== null) {
      setTextFields(textFields.map((tf, i) => i === editingTextIdx ? { ...tf, text: textInput } : tf));
      setEditingTextIdx(null);
      setTextInput('');
    }
  };

  // Rechteck-Werkzeug
  const handleStageMouseDown = (e: any) => {
    if (tool === 'rechteck') {
      const pos = e.target.getStage().getPointerPosition();
      if (pos) {
        setRectStart(pos);
        setDrawingRect({ x: pos.x, y: pos.y, width: 0, height: 0 });
      }
    } else {
      handleMouseDown(e);
    }
  };
  const handleStageMouseMove = (e: any) => {
    if (tool === 'rechteck' && rectStart) {
      const pos = e.target.getStage().getPointerPosition();
      if (pos) {
        setDrawingRect({
          x: rectStart.x,
          y: rectStart.y,
          width: pos.x - rectStart.x,
          height: pos.y - rectStart.y,
        });
      }
    } else {
      handleMouseMove(e);
    }
  };
  const handleStageMouseUp = () => {
    if (tool === 'rechteck' && drawingRect && (Math.abs(drawingRect.width) > 10 || Math.abs(drawingRect.height) > 10)) {
      setRects([...rects, drawingRect]);
      setDrawingRect(null);
      setRectStart(null);
    } else {
      handleMouseUp();
    }
  };
  const handleRectDrag = (idx: number, pos: { x: number; y: number }) => {
    setRects(rects.map((r, i) => i === idx ? { ...r, x: pos.x, y: pos.y } : r));
  };
  const handleRectDelete = (idx: number) => {
    setRects(rects.filter((_, i) => i !== idx));
  };

  const finishPolygon = () => {
    if (drawingPoly && drawingPoly.length > 5) {
      setPolygons([...polygons, { points: drawingPoly }]);
      setDrawingPoly(null);
    }
  };

  // Gruppieren/Verschieben/Löschen
  const handleObjectSelect = (type: string, idx: number, e: any) => {
    if (e.evt.shiftKey) {
      setSelectedObjects([...selectedObjects, { type, idx }]);
    } else {
      setSelectedObjects([{ type, idx }]);
    }
  };
  const handleDeleteSelected = () => {
    setPlacedPlants(placedPlants.filter((_, i) => !selectedObjects.some(o => o.type === 'pflanze' && o.idx === i)));
    setRects(rects.filter((_, i) => !selectedObjects.some(o => o.type === 'rect' && o.idx === i)));
    setPolygons(polygons.filter((_, i) => !selectedObjects.some(o => o.type === 'poly' && o.idx === i)));
    setTextFields(textFields.filter((_, i) => !selectedObjects.some(o => o.type === 'text' && o.idx === i)));
    setSelectedObjects([]);
  };

  // Export als PNG
  const handleExportPNG = () => {
    const node = document.getElementById('editor-stage');
    if (node) {
      toPng(node).then(dataUrl => {
        const link = document.createElement('a');
        link.download = 'permakultur_design.png';
        link.href = dataUrl;
        link.click();
      });
    }
  };

  const handleServerSave = async () => {
    await saveDesignServer(designName, { plants: placedPlants, lines, rects, polygons, textFields });
    alert('Design auf Server gespeichert!');
    setServerDesigns(await listDesignsServer());
  };
  const handleServerLoad = async (name: string) => {
    const data = await loadDesignServer(name);
    setPlacedPlants(data.plants || []);
    setLines(data.lines || []);
    setRects(data.rects || []);
    setPolygons(data.polygons || []);
    setTextFields(data.textFields || []);
  };
  const refreshServerDesigns = async () => {
    setServerDesigns(await listDesignsServer());
  };

  React.useEffect(() => { refreshServerDesigns(); }, []);

  return (
    <div>
      <LayerToggle layers={layers} onToggle={toggleLayer} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <label><input type="radio" checked={tool === 'pflanze'} onChange={() => setTool('pflanze')} />🌱 Pflanzen</label>
        <label><input type="radio" checked={tool === 'freihand'} onChange={() => setTool('freihand')} />✏️ Freihand</label>
        <label><input type="radio" checked={tool === 'text'} onChange={() => setTool('text')} />📝 Text</label>
        <label><input type="radio" checked={tool === 'rechteck'} onChange={() => setTool('rechteck')} />▭ Rechteck</label>
        <label><input type="radio" checked={tool === 'polygon'} onChange={() => setTool('polygon')} />🔺 Polygon</label>
        <button onClick={finishPolygon} disabled={!drawingPoly}>Polygon fertig</button>
        <button onClick={handleDeleteSelected} disabled={selectedObjects.length === 0}>Auswahl löschen</button>
        <button onClick={handleExportPNG}>Export als PNG</button>
        <button onClick={handleUndo} style={{ marginRight: 8 }}>Undo</button>
        <button onClick={handleRedo} style={{ marginRight: 16 }}>Redo</button>
        <label style={{ marginRight: 16 }}>
          <input type="checkbox" checked={showCircles} onChange={e => setShowCircles(e.target.checked)} />
          Einflussbereiche anzeigen
        </label>
        <button onClick={handleSave} style={{ marginRight: 8 }}>Design speichern</button>
        <button onClick={handleLoad} style={{ marginRight: 8 }}>Design laden</button>
        <button onClick={handleExport} style={{ marginRight: 8 }}>Exportieren</button>
        <label style={{ marginRight: 8 }}>
          <input type="file" accept="application/json" style={{ display: 'none' }} onChange={handleImport} />
          <span style={{ cursor: 'pointer', color: '#0074d9', textDecoration: 'underline' }}>Importieren</span>
        </label>
        <button onClick={handleReset}>Reset</button>
      </div>
      <div style={{ marginBottom: 8 }}>
        <input value={designName} onChange={e => setDesignName(e.target.value)} style={{ width: 140, marginRight: 8 }} placeholder="Design-Name" />
        <button onClick={handleServerSave} style={{ marginRight: 8 }}>Server speichern</button>
        <button onClick={refreshServerDesigns} style={{ marginRight: 8 }}>Liste aktualisieren</button>
        <select onChange={e => handleServerLoad(e.target.value)} style={{ marginRight: 8 }}>
          <option value="">Design laden...</option>
          {serverDesigns.map(name => <option key={name} value={name}>{name}</option>)}
        </select>
      </div>
      <Stage
        id="editor-stage"
        ref={stageRef}
        width={WIDTH}
        height={HEIGHT}
        style={{ border: "1px solid #ccc" }}
        onClick={handleStageClick}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
      >
        {/* Raster-Layer */}
        {layers[0].visible && (
          <Layer>
            {[...Array(Math.floor(WIDTH / 40))].map((_, i) => (
              <Rect key={i} x={i*40} y={0} width={1} height={HEIGHT} fill="#eee" />
            ))}
            {[...Array(Math.floor(HEIGHT / 40))].map((_, i) => (
              <Rect key={1000+i} x={0} y={i*40} width={WIDTH} height={1} fill="#eee" />
            ))}
          </Layer>
        )}
        {/* Pflanzen-Layer */}
        {layers[1].visible && (
          <Layer>
            {placedPlants.map((pp, i) => (
              <Group
                key={i}
                x={pp.x}
                y={pp.y}
                draggable
                onDragEnd={e => handleDrag(i, { x: e.target.x(), y: e.target.y() })}
                onClick={e => handleObjectSelect('pflanze', i, e)}
              >
                {showCircles && (
                  <Circle
                    radius={pp.radius || 50}
                    fill={selectedIdx === i ? "rgba(127,201,127,0.15)" : "rgba(127,201,127,0.08)"}
                    stroke="#7fc97f"
                    strokeWidth={2}
                  />
                )}
                {showCircles && selectedIdx === i && (
                  <Circle
                    x={pp.radius || 50}
                    y={0}
                    radius={8}
                    fill="#ffb347"
                    stroke="#333"
                    strokeWidth={1}
                    draggable
                    dragOnTop
                    onDragMove={e => handleRadiusDrag(i, { x: e.target.x(), y: e.target.y() })}
                    onDragEnd={e => e.target.position({ x: pp.radius || 50, y: 0 })}
                    style={{ cursor: 'ew-resize' }}
                  />
                )}
                <Circle radius={20} fill={selectedObjects.some(o => o.type === 'pflanze' && o.idx === i) ? "#fbb" : "#7fc97f"} stroke="#333" strokeWidth={2} />
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
            {/* Info-Popup */}
            {selectedIdx !== null && infoPos && (
              <Group x={infoPos.x+30} y={infoPos.y-10}>
                <Rect width={220} height={100} fill="#fff" stroke="#888" cornerRadius={8} shadowBlur={4} />
                <Text text={`Pflanze: ${placedPlants[selectedIdx].plant["deutsche Bezeichnung"]}`} x={10} y={8} fontSize={14} fill="#222" />
                <Text text={`ID: ${placedPlants[selectedIdx].plant.ID || ''}`} x={10} y={28} fontSize={12} fill="#555" />
                <Text text={`Gattung: ${placedPlants[selectedIdx].plant.Gattung || ''}`} x={10} y={44} fontSize={12} fill="#555" />
                <Text text={`Familie: ${placedPlants[selectedIdx].plant.Familie || ''}`} x={10} y={60} fontSize={12} fill="#555" />
                <Text text={`Art: ${placedPlants[selectedIdx].plant.Art || ''}`} x={10} y={76} fontSize={12} fill="#555" />
                <Text text={`Höhe: ${placedPlants[selectedIdx].plant["Höhe max [cm]"] || ''}`} x={110} y={28} fontSize={12} fill="#555" />
                <Text text="Löschen" x={110} y={60} fontSize={14} fill="#c00" onClick={handleDelete} style={{cursor:'pointer'}} />
              </Group>
            )}
          </Layer>
        )}
        {/* Freihand-Layer */}
        {layers[2].visible && (
          <Layer>
            {lines.map((line, i) => (
              <Line key={i} points={line.points} stroke={line.color} strokeWidth={3} tension={0.5} lineCap="round" globalCompositeOperation="source-over" />
            ))}
          </Layer>
        )}
        {/* Polygon-Layer */}
        <Layer>
          {polygons.map((poly, i) => (
            <Line
              key={i}
              points={poly.points}
              closed
              fill="rgba(255, 206, 86, 0.2)"
              stroke="#ffce56"
              strokeWidth={2}
              onClick={e => handleObjectSelect('poly', i, e)}
            />
          ))}
          {drawingPoly && (
            <Line
              points={drawingPoly}
              stroke="#ffce56"
              strokeWidth={2}
              dash={[6, 4]}
            />
          )}
        </Layer>
        {/* Rechtecke-Layer */}
        <Layer>
          {rects.map((rect, i) => (
            <Rect
              key={i}
              x={rect.x}
              y={rect.y}
              width={rect.width}
              height={rect.height}
              fill={selectedObjects.some(o => o.type === 'rect' && o.idx === i) ? "rgba(0, 116, 217, 0.4)" : "rgba(0, 116, 217, 0.2)"}
              stroke="#0074d9"
              strokeWidth={2}
              draggable
              onDragEnd={e => handleRectDrag(i, { x: e.target.x(), y: e.target.y() })}
              onClick={e => handleObjectSelect('rect', i, e)}
              onDblClick={() => handleRectDelete(i)}
            />
          ))}
          {drawingRect && (
            <Rect
              x={drawingRect.x}
              y={drawingRect.y}
              width={drawingRect.width}
              height={drawingRect.height}
              fill="rgba(0, 116, 217, 0.1)"
              stroke="#0074d9"
              strokeWidth={1}
              dash={[4, 4]}
            />
          )}
        </Layer>
        {/* Textfelder-Layer */}
        <Layer>
          {textFields.map((tf, i) => (
            editingTextIdx === i ? null : (
              <Text
                key={i}
                x={tf.x}
                y={tf.y}
                text={tf.text}
                fontSize={20}
                fill={selectedObjects.some(o => o.type === 'text' && o.idx === i) ? "#0074d9" : "#222"}
                draggable
                onDblClick={() => handleTextDblClick(i)}
                onClick={e => handleObjectSelect('text', i, e)}
                onDragEnd={e => setTextFields(textFields.map((t, j) => j === i ? { ...t, x: e.target.x(), y: e.target.y() } : t))}
              />
            )
          ))}
        </Layer>
        {/* Textfeld-Input (über Stage) */}
        {editingTextIdx !== null && (
          <input
            style={{
              position: 'absolute',
              left: textFields[editingTextIdx].x,
              top: textFields[editingTextIdx].y,
              fontSize: 20,
              zIndex: 10
            }}
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            onBlur={handleTextInputBlur}
            autoFocus
          />
        )}
      </Stage>
    </div>
  );
};

export default PlantMap;
