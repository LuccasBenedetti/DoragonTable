import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Scene, MapToken, GridType, ElevationZone, WallSegment } from '../../types';
import { 
  Grid, 
  Layers, 
  Eye, 
  EyeOff, 
  Plus, 
  Minus, 
  ShieldAlert, 
  Move, 
  Ruler, 
  Maximize2, 
  ZoomIn, 
  ZoomOut,
  MapPin,
  Mountain
} from 'lucide-react';

interface TacticalMapProps {
  scene: Scene;
  isGM: boolean;
  selectedTokenId?: string;
  onSelectToken: (tokenId: string) => void;
  onUpdateTokenPosition: (tokenId: string, x: number, y: number, elevation: number) => void;
  onUpdateScene: (scene: Scene) => void;
}

export const TacticalMap: React.FC<TacticalMapProps> = ({
  scene,
  isGM,
  selectedTokenId,
  onSelectToken,
  onUpdateTokenPosition,
  onUpdateScene,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  
  const [draggingTokenId, setDraggingTokenId] = useState<string | null>(null);
  const [measureStart, setMeasureStart] = useState<{ x: number; y: number } | null>(null);
  const [measureEnd, setMeasureEnd] = useState<{ x: number; y: number } | null>(null);
  const [isMeasuring, setIsMeasuring] = useState<boolean>(false);

  const [activeTool, setActiveTool] = useState<'select' | 'measure' | 'wall' | 'zone'>('select');
  const [newWallStart, setNewWallStart] = useState<{ x: number; y: number } | null>(null);

  const cellSize = scene.gridSize || 50;

  // Convert Screen pixel coordinates to Grid coordinate
  const screenToGrid = useCallback((screenX: number, screenY: number) => {
    const worldX = (screenX - pan.x) / zoom;
    const worldY = (screenY - pan.y) / zoom;

    if (scene.gridType === 'hex') {
      const q = ((Math.sqrt(3) / 3) * worldX - (1 / 3) * worldY) / (cellSize * 0.58);
      const r = ((2 / 3) * worldY) / (cellSize * 0.58);
      return { x: Math.round(q), y: Math.round(r) };
    } else {
      return {
        x: Math.floor(worldX / cellSize),
        y: Math.floor(worldY / cellSize),
      };
    }
  }, [pan, zoom, cellSize, scene.gridType]);

  // Convert Grid coordinate to World pixels
  const gridToWorld = useCallback((gx: number, gy: number) => {
    if (scene.gridType === 'hex') {
      const hSize = cellSize * 0.58;
      const wx = hSize * Math.sqrt(3) * (gx + gy / 2);
      const wy = hSize * (3 / 2) * gy;
      return { x: wx, y: wy };
    } else {
      return {
        x: gx * cellSize + cellSize / 2,
        y: gy * cellSize + cellSize / 2,
      };
    }
  }, [cellSize, scene.gridType]);

  // Raycasting Line of Sight from a point
  const checkLineOfSight = useCallback((
    fromX: number,
    fromY: number,
    fromElev: number,
    toX: number,
    toY: number
  ): boolean => {
    // Check if any wall intersects the ray (fromX,fromY) -> (toX,toY)
    for (const wall of scene.walls) {
      if (!wall.blocksSight) continue;
      // If observer has higher elevation than wall height, they can see OVER the wall!
      if (fromElev > wall.height) continue;

      if (linesIntersect(fromX, fromY, toX, toY, wall.x1, wall.y1, wall.x2, wall.y2)) {
        return false;
      }
    }
    return true;
  }, [scene.walls]);

  function linesIntersect(
    x1: number, y1: number, x2: number, y2: number,
    x3: number, y3: number, x4: number, y4: number
  ): boolean {
    const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    if (denom === 0) return false;
    const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
    const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;
    return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
  }

  // Draw Map Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    ctx.save();
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Apply pan and zoom
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    const cols = scene.width || 30;
    const rows = scene.height || 20;
    const totalW = cols * cellSize;
    const totalH = rows * cellSize;

    // Draw Map Background
    ctx.fillStyle = '#1e2024';
    ctx.fillRect(0, 0, totalW, totalH);

    // 1. Draw Elevation Zones
    scene.elevationZones.forEach(zone => {
      ctx.fillStyle = zone.color || 'rgba(59, 130, 246, 0.25)';
      ctx.fillRect(zone.x * cellSize, zone.y * cellSize, zone.width * cellSize, zone.height * cellSize);
      ctx.strokeStyle = zone.elevation > 0 ? '#3b82f6' : '#ef4444';
      ctx.lineWidth = 2;
      ctx.strokeRect(zone.x * cellSize, zone.y * cellSize, zone.width * cellSize, zone.height * cellSize);

      // Label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      const label = `${zone.name} (${zone.elevation > 0 ? '+' : ''}${zone.elevation}m)`;
      ctx.fillText(label, zone.x * cellSize + 6, zone.y * cellSize + 16);
    });

    // 2. Draw Grid (Square or Hex)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;

    if (scene.gridType === 'square') {
      for (let x = 0; x <= totalW; x += cellSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, totalH);
        ctx.stroke();
      }
      for (let y = 0; y <= totalH; y += cellSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(totalW, y);
        ctx.stroke();
      }
    } else {
      // Hexagonal Grid
      const hRadius = cellSize * 0.58;
      for (let q = 0; q < cols; q++) {
        for (let r = 0; r < rows; r++) {
          const pt = gridToWorld(q, r);
          drawHexagon(ctx, pt.x, pt.y, hRadius);
        }
      }
    }

    // 3. Draw Walls / Obstacles
    scene.walls.forEach(wall => {
      ctx.beginPath();
      ctx.moveTo(wall.x1, wall.y1);
      ctx.lineTo(wall.x2, wall.y2);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Wall height marker
      const midX = (wall.x1 + wall.x2) / 2;
      const midY = (wall.y1 + wall.y2) / 2;
      ctx.fillStyle = '#f59e0b';
      ctx.font = '10px sans-serif';
      ctx.fillText(`Muro ${wall.height}m`, midX + 4, midY - 4);
    });

    // 4. Line of Sight / Fog of War (if enabled)
    const selectedToken = scene.tokens.find(t => t.id === selectedTokenId) || scene.tokens[0];
    if (scene.fogOfWarEnabled && selectedToken && !isGM) {
      const tokenPos = gridToWorld(selectedToken.x, selectedToken.y);
      const sightDistPx = (selectedToken.sightRadius || 8) * cellSize;

      ctx.save();
      // Create radial darkness gradient
      const fovGrad = ctx.createRadialGradient(
        tokenPos.x, tokenPos.y, sightDistPx * 0.4,
        tokenPos.x, tokenPos.y, sightDistPx
      );
      fovGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      fovGrad.addColorStop(1, 'rgba(10, 11, 13, 0.95)');

      ctx.fillStyle = fovGrad;
      ctx.fillRect(0, 0, totalW, totalH);
      ctx.restore();
    }

    // 5. Draw Tokens
    scene.tokens.forEach(token => {
      if (token.isHidden && !isGM) return;

      const pos = gridToWorld(token.x, token.y);
      const radius = (cellSize / 2) * 0.8;
      const isSelected = token.id === selectedTokenId;

      // Elevation Ring (Gold for high ground, Blue for standard)
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius + 3, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? '#5865f2' : (token.elevation > 0 ? '#eab308' : '#3b82f6');
      ctx.fill();

      // Token Body
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = token.color || '#2b2d31';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Initial / Avatar text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(token.name.substring(0, 2).toUpperCase(), pos.x, pos.y);

      // Name & Elevation Tag under token
      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#dbdee1';
      const elevText = token.elevation ? ` [${token.elevation > 0 ? '+' : ''}${token.elevation}m]` : '';
      ctx.fillText(`${token.name}${elevText}`, pos.x, pos.y + radius + 14);

      // Status conditions badge
      if (token.statusConditions && token.statusConditions.length > 0) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(pos.x + radius - 4, pos.y - radius + 4, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // 6. Draw Measurement Ruler (if active)
    if (measureStart && measureEnd) {
      ctx.beginPath();
      ctx.moveTo(measureStart.x, measureStart.y);
      ctx.lineTo(measureEnd.x, measureEnd.y);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 6]);
      ctx.stroke();
      ctx.setLineDash([]);

      const dx = measureEnd.x - measureStart.x;
      const dy = measureEnd.y - measureStart.y;
      const distPx = Math.sqrt(dx * dx + dy * dy);
      const cells = (distPx / cellSize).toFixed(1);
      const meters = (parseFloat(cells) * 1.5).toFixed(1); // Standard 1.5m per cell

      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(`${cells} hex/sq (${meters}m)`, (measureStart.x + measureEnd.x) / 2, (measureStart.y + measureEnd.y) / 2 - 8);
    }

    // 7. Draw in-progress Wall creation
    if (newWallStart && measureEnd) {
      ctx.beginPath();
      ctx.moveTo(newWallStart.x, newWallStart.y);
      ctx.lineTo(measureEnd.x, measureEnd.y);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    ctx.restore();
  }, [scene, zoom, pan, selectedTokenId, isGM, measureStart, measureEnd, newWallStart, gridToWorld, cellSize]);

  function drawHexagon(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const hx = x + r * Math.cos(angle);
      const hy = y + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.stroke();
  }

  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Pan with Middle Mouse Button or Alt+Click
    if (e.button === 1 || e.altKey) {
      setIsPanning(true);
      setDragStart({ x: mouseX - pan.x, y: mouseY - pan.y });
      return;
    }

    const worldX = (mouseX - pan.x) / zoom;
    const worldY = (mouseY - pan.y) / zoom;

    if (activeTool === 'measure') {
      setIsMeasuring(true);
      setMeasureStart({ x: worldX, y: worldY });
      setMeasureEnd({ x: worldX, y: worldY });
      return;
    }

    if (activeTool === 'wall' && isGM) {
      if (!newWallStart) {
        setNewWallStart({ x: worldX, y: worldY });
      } else {
        // Complete wall
        const newWall: WallSegment = {
          id: 'w_' + Date.now(),
          x1: Math.round(newWallStart.x),
          y1: Math.round(newWallStart.y),
          x2: Math.round(worldX),
          y2: Math.round(worldY),
          height: 3, // 3m wall
          blocksSight: true,
          blocksMovement: true,
        };
        onUpdateScene({ ...scene, walls: [...scene.walls, newWall] });
        setNewWallStart(null);
      }
      return;
    }

    // Check if clicked on a token
    const clickedToken = scene.tokens.find(t => {
      const pos = gridToWorld(t.x, t.y);
      const dist = Math.sqrt(Math.pow(pos.x - worldX, 2) + Math.pow(pos.y - worldY, 2));
      return dist <= (cellSize / 2);
    });

    if (clickedToken) {
      onSelectToken(clickedToken.id);
      setDraggingTokenId(clickedToken.id);
    } else {
      // Clicked on empty space: start panning with left click
      setIsPanning(true);
      setDragStart({ x: mouseX - pan.x, y: mouseY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isPanning) {
      setPan({ x: mouseX - dragStart.x, y: mouseY - dragStart.y });
      return;
    }

    const worldX = (mouseX - pan.x) / zoom;
    const worldY = (mouseY - pan.y) / zoom;

    if (isMeasuring && measureStart) {
      setMeasureEnd({ x: worldX, y: worldY });
    }

    if (newWallStart) {
      setMeasureEnd({ x: worldX, y: worldY });
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsPanning(false);

    if (isMeasuring) {
      setIsMeasuring(false);
      // Keep ruler until clicked again or tool changed
    }

    if (draggingTokenId) {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const gridPos = screenToGrid(mouseX, mouseY);
        
        // Check if landing on an elevation zone
        const zone = scene.elevationZones.find(z => 
          gridPos.x >= z.x && gridPos.x < z.x + z.width &&
          gridPos.y >= z.y && gridPos.y < z.y + z.height
        );
        const currentToken = scene.tokens.find(t => t.id === draggingTokenId);
        const elev = zone ? zone.elevation : (currentToken?.elevation || 0);

        onUpdateTokenPosition(draggingTokenId, gridPos.x, gridPos.y, elev);
      }
      setDraggingTokenId(null);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom(prev => Math.min(Math.max(prev * zoomFactor, 0.4), 3.0));
  };

  // Selected Token elevation modifiers
  const selectedToken = scene.tokens.find(t => t.id === selectedTokenId);

  const changeTokenElevation = (delta: number) => {
    if (!selectedToken) return;
    const newElevation = Math.max(-5, (selectedToken.elevation || 0) + delta);
    onUpdateTokenPosition(selectedToken.id, selectedToken.x, selectedToken.y, newElevation);
  };

  const toggleGridType = () => {
    const nextType: GridType = scene.gridType === 'square' ? 'hex' : 'square';
    onUpdateScene({ ...scene, gridType: nextType });
  };

  const toggleFog = () => {
    onUpdateScene({ ...scene, fogOfWarEnabled: !scene.fogOfWarEnabled });
  };

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#111214] overflow-hidden flex flex-col">
      {/* Top Map Toolbar */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-[#2b2d31]/90 backdrop-blur-md p-1.5 rounded-lg border border-[#3f4147] shadow-xl">
        <button
          onClick={() => setActiveTool('select')}
          className={`p-2 rounded hover:bg-[#35373c] text-xs flex items-center gap-1.5 ${
            activeTool === 'select' ? 'bg-[#5865f2] text-white' : 'text-[#dbdee1]'
          }`}
          title="Selecionar e Mover Tokens"
        >
          <Move size={15} />
          Mover
        </button>

        <button
          onClick={() => {
            setActiveTool('measure');
            setMeasureStart(null);
            setMeasureEnd(null);
          }}
          className={`p-2 rounded hover:bg-[#35373c] text-xs flex items-center gap-1.5 ${
            activeTool === 'measure' ? 'bg-[#5865f2] text-white' : 'text-[#dbdee1]'
          }`}
          title="Régua de Medição"
        >
          <Ruler size={15} />
          Medir
        </button>

        <div className="h-4 w-[1px] bg-[#4e5058]" />

        {/* Grid Selector */}
        <button
          onClick={toggleGridType}
          className="p-2 rounded hover:bg-[#35373c] text-[#dbdee1] text-xs flex items-center gap-1.5"
          title={`Alternar Grid (Atual: ${scene.gridType === 'hex' ? 'Hexagonal' : 'Quadrado'})`}
        >
          <Grid size={15} />
          {scene.gridType === 'hex' ? 'Hexágonos' : 'Quadrados'}
        </button>

        {/* Fog of War Toggle */}
        <button
          onClick={toggleFog}
          className={`p-2 rounded hover:bg-[#35373c] text-xs flex items-center gap-1.5 ${
            scene.fogOfWarEnabled ? 'text-[#23a55a]' : 'text-[#949ba4]'
          }`}
          title="Alternar Névoa de Guerra / Linha de Visão"
        >
          {scene.fogOfWarEnabled ? <Eye size={15} /> : <EyeOff size={15} />}
          Visão
        </button>

        {/* GM Wall Creator */}
        {isGM && (
          <button
            onClick={() => {
              setActiveTool('wall');
              setNewWallStart(null);
            }}
            className={`p-2 rounded hover:bg-[#35373c] text-xs flex items-center gap-1.5 ${
              activeTool === 'wall' ? 'bg-[#eab308] text-black font-semibold' : 'text-[#dbdee1]'
            }`}
            title="Criar Muro que Bloqueia Linha de Visão"
          >
            <ShieldAlert size={15} />
            + Muro (LoS)
          </button>
        )}
      </div>

      {/* Zoom and Reset Controls (Top Right) */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-[#2b2d31]/90 backdrop-blur-md p-1 rounded-lg border border-[#3f4147] shadow-xl">
        <button
          onClick={() => setZoom(z => Math.min(z * 1.2, 3.0))}
          className="p-1.5 rounded hover:bg-[#35373c] text-[#dbdee1]"
          title="Aumentar Zoom"
        >
          <ZoomIn size={16} />
        </button>
        <button
          onClick={() => setZoom(z => Math.max(z / 1.2, 0.4))}
          className="p-1.5 rounded hover:bg-[#35373c] text-[#dbdee1]"
          title="Diminuir Zoom"
        >
          <ZoomOut size={16} />
        </button>
        <button
          onClick={() => { setZoom(1); setPan({ x: 50, y: 50 }); }}
          className="p-1.5 rounded hover:bg-[#35373c] text-[#dbdee1]"
          title="Resetar Câmera"
        >
          <Maximize2 size={16} />
        </button>
      </div>

      {/* Selected Token Elevation HUD (Bottom Center) */}
      {selectedToken && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 bg-[#2b2d31]/95 backdrop-blur-md px-4 py-2 rounded-xl border border-[#3f4147] shadow-2xl">
          <div className="flex items-center gap-2">
            <Mountain size={18} className="text-[#eab308]" />
            <span className="text-xs font-semibold text-white">{selectedToken.name}:</span>
            <span className="text-xs font-bold text-[#eab308]">
              {selectedToken.elevation > 0 ? `+${selectedToken.elevation}m (Terreno Alto)` : (selectedToken.elevation < 0 ? `${selectedToken.elevation}m (Fosso)` : '0m (Térreo)')}
            </span>
          </div>

          <div className="flex items-center gap-1 border-l border-[#4e5058] pl-2">
            <button
              onClick={() => changeTokenElevation(1)}
              className="p-1 px-2 rounded bg-[#35373c] hover:bg-[#404249] text-xs font-bold text-white flex items-center gap-0.5"
              title="Subir Altura (+1m)"
            >
              <Plus size={12} /> 1m
            </button>
            <button
              onClick={() => changeTokenElevation(-1)}
              className="p-1 px-2 rounded bg-[#35373c] hover:bg-[#404249] text-xs font-bold text-white flex items-center gap-0.5"
              title="Descer Altura (-1m)"
            >
              <Minus size={12} /> 1m
            </button>
          </div>
        </div>
      )}

      {/* Main Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      />
    </div>
  );
};
