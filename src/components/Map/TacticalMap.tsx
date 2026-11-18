import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Scene, MapToken, GridType, ElevationZone, WallSegment } from '../../types';
import { 
  Grid, 
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
  Mountain,
  Trash2,
  Undo2,
  HelpCircle,
  X,
  Check,
  Image as ImageIcon,
  AlertCircle,
  Sparkles,
  User,
  Shield,
  Lock,
  Heart,
  Layers,
  Swords
} from 'lucide-react';

interface TacticalMapProps {
  scene: Scene;
  isGM: boolean;
  playerCharacterId?: string;
  selectedTokenId?: string;
  activeCombatTokenId?: string;
  onSelectToken: (tokenId: string) => void;
  onUpdateTokenPosition: (tokenId: string, x: number, y: number, elevation: number) => void;
  onUpdateScene: (scene: Scene) => void;
  onOpenSheet?: (characterId: string) => void;
}

const PRESET_BATTLEMAPS = [
  { name: 'Taverna do Corvo (Madeira)', url: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=1600&q=80' },
  { name: 'Masmorra de Pedra', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80' },
  { name: 'Floresta Noturna', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1600&q=80' },
  { name: 'Beco Cyberpunk Neon', url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1600&q=80' },
  { name: 'Grid Tático Neutro', url: '' },
];

const RPG_CONDITIONS = [
  { id: 'ferido', label: 'Ferido', icon: '🩸', color: '#ef4444' },
  { id: 'caido', label: 'Caído / Inconsciente', icon: '💤', color: '#a855f7' },
  { id: 'acelerado', label: 'Acelerado / Buff', icon: '⚡', color: '#eab308' },
  { id: 'invisivel', label: 'Invisível', icon: '👁️', color: '#3b82f6' },
  { id: 'defesa', label: 'Defesa Total', icon: '🛡️', color: '#10b981' },
  { id: 'marcado', label: 'Alvo Marcado', icon: '🎯', color: '#f97316' },
  { id: 'morto', label: 'Derrotado', icon: '💀', color: '#64748b' },
];

export const TacticalMap: React.FC<TacticalMapProps> = ({
  scene,
  isGM,
  playerCharacterId,
  selectedTokenId,
  activeCombatTokenId,
  onSelectToken,
  onUpdateTokenPosition,
  onUpdateScene,
  onOpenSheet,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const bgImageRef = useRef<HTMLImageElement | null>(null);

  // Pan & Zoom
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);

  // Tools & State
  const [activeTool, setActiveTool] = useState<'select' | 'measure' | 'wall' | 'zone'>('select');
  const [draggingTokenId, setDraggingTokenId] = useState<string | null>(null);
  const [selectedWallId, setSelectedWallId] = useState<string | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [newWallStart, setNewWallStart] = useState<{ x: number; y: number } | null>(null);
  const [mouseWorldPos, setMouseWorldPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Zone Creation State
  const [zoneStartGrid, setZoneStartGrid] = useState<{ x: number; y: number } | null>(null);
  const [zoneEndGrid, setZoneEndGrid] = useState<{ x: number; y: number } | null>(null);
  const [showZoneConfigModal, setShowZoneConfigModal] = useState<boolean>(false);
  const [pendingZone, setPendingZone] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [newZoneName, setNewZoneName] = useState<string>('Mezanino Superior');
  const [newZoneElevation, setNewZoneElevation] = useState<number>(3);
  const [newZoneColor, setNewZoneColor] = useState<string>('rgba(59, 130, 246, 0.25)');

  // Measurement
  const [measureStart, setMeasureStart] = useState<{ x: number; y: number } | null>(null);
  const [measureEnd, setMeasureEnd] = useState<{ x: number; y: number } | null>(null);
  const [isMeasuring, setIsMeasuring] = useState<boolean>(false);

  // UI Modals & Popovers
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [showBgModal, setShowBgModal] = useState<boolean>(false);
  const [customBgInput, setCustomBgInput] = useState<string>('');
  const [showConditionsPopover, setShowConditionsPopover] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  const cellSize = scene.gridSize || 50;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  // Preload Background Image if defined
  useEffect(() => {
    if (!scene.backgroundUrl) {
      bgImageRef.current = null;
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = scene.backgroundUrl;
    img.onload = () => {
      bgImageRef.current = img;
    };
    img.onerror = () => {
      bgImageRef.current = null;
    };
  }, [scene.backgroundUrl]);

  // Handle Container Resizing
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Keyboard Shortcuts (Space for Pan, Escape to Cancel, Ctrl+Z to undo wall, Delete to remove wall)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'Space' && !e.repeat) {
        setIsSpacePressed(true);
      }

      if (e.key === 'Escape') {
        // Cancel active tool or selections
        setNewWallStart(null);
        setMeasureStart(null);
        setMeasureEnd(null);
        setSelectedWallId(null);
        setSelectedZoneId(null);
        setZoneStartGrid(null);
        setZoneEndGrid(null);
        setShowZoneConfigModal(false);
        setShowConditionsPopover(false);
        setActiveTool('select');
      }

      // Undo last wall
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && isGM) {
        if (scene.walls.length > 0) {
          e.preventDefault();
          const nextWalls = [...scene.walls];
          nextWalls.pop();
          onUpdateScene({ ...scene, walls: nextWalls });
          showToast('Desfez o último muro colocado.');
        }
      }

      // Delete selected wall
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedWallId && isGM) {
        e.preventDefault();
        onUpdateScene({
          ...scene,
          walls: scene.walls.filter((w) => w.id !== selectedWallId),
        });
        setSelectedWallId(null);
        showToast('Muro excluído com sucesso.');
      }

      // Delete selected zone
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedZoneId && isGM) {
        e.preventDefault();
        onUpdateScene({
          ...scene,
          elevationZones: scene.elevationZones.filter((z) => z.id !== selectedZoneId),
        });
        setSelectedZoneId(null);
        showToast('Zona de elevação excluída com sucesso.');
      }

      // Delete selected elevation zone
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedZoneId && isGM) {
        e.preventDefault();
        onUpdateScene({
          ...scene,
          elevationZones: scene.elevationZones.filter((z) => z.id !== selectedZoneId),
        });
        setSelectedZoneId(null);
        showToast('Zona de elevação excluída com sucesso.');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [scene, selectedWallId, isGM]);

  // Screen to Grid and Grid to Screen helpers
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

  // Distance from point to line segment
  function distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    const projX = x1 + t * (x2 - x1);
    const projY = y1 + t * (y2 - y1);
    return Math.hypot(px - projX, py - projY);
  }

  // Draw Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    ctx.save();
    ctx.clearRect(0, 0, rect.width, rect.height);

    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    const cols = scene.width || 30;
    const rows = scene.height || 20;
    const totalW = cols * cellSize;
    const totalH = rows * cellSize;

    // 1. Background (Image or Dark Palette)
    if (bgImageRef.current && bgImageRef.current.complete) {
      ctx.drawImage(bgImageRef.current, 0, 0, totalW, totalH);
      // Subtle darkening overlay so grid & tokens pop
      ctx.fillStyle = 'rgba(10, 12, 16, 0.4)';
      ctx.fillRect(0, 0, totalW, totalH);
    } else {
      ctx.fillStyle = '#0f1218';
      ctx.fillRect(0, 0, totalW, totalH);
    }

    // 2. Elevation Zones
    scene.elevationZones.forEach(zone => {
      const isSelectedZone = zone.id === selectedZoneId;
      ctx.fillStyle = zone.color || 'rgba(59, 130, 246, 0.25)';
      ctx.fillRect(zone.x * cellSize, zone.y * cellSize, zone.width * cellSize, zone.height * cellSize);
      
      if (isSelectedZone) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(zone.x * cellSize, zone.y * cellSize, zone.width * cellSize, zone.height * cellSize);
        ctx.setLineDash([]);
      } else {
        ctx.strokeStyle = zone.elevation > 0 ? '#d4af37' : '#ef4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(zone.x * cellSize, zone.y * cellSize, zone.width * cellSize, zone.height * cellSize);
      }

      ctx.fillStyle = isSelectedZone ? '#93c5fd' : '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      const label = `${zone.name} (${zone.elevation > 0 ? '+' : ''}${zone.elevation}m)`;
      ctx.fillText(label, zone.x * cellSize + 6, zone.y * cellSize + 15);
    });

    // 2.1 Dragging Zone Creation Preview
    if (activeTool === 'zone' && zoneStartGrid && zoneEndGrid) {
      const minX = Math.min(zoneStartGrid.x, zoneEndGrid.x);
      const minY = Math.min(zoneStartGrid.y, zoneEndGrid.y);
      const w = Math.abs(zoneEndGrid.x - zoneStartGrid.x) + 1;
      const h = Math.abs(zoneEndGrid.y - zoneStartGrid.y) + 1;

      ctx.save();
      ctx.fillStyle = newZoneColor || 'rgba(59, 130, 246, 0.35)';
      ctx.fillRect(minX * cellSize, minY * cellSize, w * cellSize, h * cellSize);
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(minX * cellSize, minY * cellSize, w * cellSize, h * cellSize);
      ctx.setLineDash([]);

      ctx.fillStyle = '#60a5fa';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(`Nova Zona: ${w}x${h} células (${(w * 1.5).toFixed(1)}m × ${(h * 1.5).toFixed(1)}m)`, minX * cellSize + 8, minY * cellSize + 20);
      ctx.restore();
    }

    // 3. Grid Lines
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
      const hRadius = cellSize * 0.58;
      for (let q = 0; q < cols; q++) {
        for (let r = 0; r < rows; r++) {
          const pt = gridToWorld(q, r);
          drawHexagon(ctx, pt.x, pt.y, hRadius);
        }
      }
    }

    // 4. Walls / Obstacles
    scene.walls.forEach(wall => {
      const isWallSelected = wall.id === selectedWallId;
      ctx.beginPath();
      ctx.moveTo(wall.x1, wall.y1);
      ctx.lineTo(wall.x2, wall.y2);
      ctx.strokeStyle = isWallSelected ? '#ff9f1c' : '#f59e0b';
      ctx.lineWidth = isWallSelected ? 6 : 4;
      ctx.stroke();

      // Endpoints handles if selected
      if (isWallSelected) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(wall.x1, wall.y1, 4, 0, Math.PI * 2);
        ctx.arc(wall.x2, wall.y2, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Height Tag
      const midX = (wall.x1 + wall.x2) / 2;
      const midY = (wall.y1 + wall.y2) / 2;
      ctx.fillStyle = isWallSelected ? '#ff9f1c' : '#f59e0b';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText(`Muro ${wall.height}m`, midX + 4, midY - 4);
    });

    // 5. In-Progress Wall Preview
    if (newWallStart) {
      ctx.beginPath();
      ctx.moveTo(newWallStart.x, newWallStart.y);
      ctx.lineTo(mouseWorldPos.x, mouseWorldPos.y);
      ctx.strokeStyle = '#e63946';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      const distM = (Math.hypot(mouseWorldPos.x - newWallStart.x, mouseWorldPos.y - newWallStart.y) / cellSize * 1.5).toFixed(1);
      ctx.fillStyle = '#ff4d5a';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(`${distM}m`, (newWallStart.x + mouseWorldPos.x) / 2 + 5, (newWallStart.y + mouseWorldPos.y) / 2 - 5);
    }

    // 6. Fog of War (Player view)
    const selectedToken = scene.tokens.find(t => t.id === selectedTokenId) || scene.tokens[0];
    if (scene.fogOfWarEnabled && selectedToken && !isGM) {
      const tokenPos = gridToWorld(selectedToken.x, selectedToken.y);
      const sightDistPx = (selectedToken.sightRadius || 8) * cellSize;

      ctx.save();
      const fovGrad = ctx.createRadialGradient(
        tokenPos.x, tokenPos.y, sightDistPx * 0.4,
        tokenPos.x, tokenPos.y, sightDistPx
      );
      fovGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      fovGrad.addColorStop(1, 'rgba(8, 10, 14, 0.96)');

      ctx.fillStyle = fovGrad;
      ctx.fillRect(0, 0, totalW, totalH);
      ctx.restore();
    }

    // 7. Tokens
    scene.tokens.forEach(token => {
      // If hidden and not GM, completely invisible!
      if (token.isHidden && !isGM) return;

      const pos = gridToWorld(token.x, token.y);
      const radius = (cellSize / 2) * 0.82;
      const isSelected = token.id === selectedTokenId;

      ctx.save();

      // Ghostly appearance for GM if token is hidden
      if (token.isHidden && isGM) {
        ctx.globalAlpha = 0.55;
      }

      // Active Combat Turn Ring
      const isCurrentTurn = activeCombatTokenId === token.id;
      if (isCurrentTurn) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius + 7, 0, Math.PI * 2);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Outer Glow & Elevation Ring
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius + 3, 0, Math.PI * 2);
      ctx.fillStyle = isSelected
        ? '#e63946'
        : token.elevation > 0
        ? '#d4af37'
        : token.elevation < 0
        ? '#ef4444'
        : '#3b82f6';
      ctx.fill();

      // Token Body
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = token.color || '#161922';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Token Initials
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(token.name.substring(0, 2).toUpperCase(), pos.x, pos.y);

      // Name & Elevation Tag
      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#e2e8f0';
      const elevText = token.elevation ? ` [${token.elevation > 0 ? '+' : ''}${token.elevation}m]` : '';
      const hiddenTag = token.isHidden && isGM ? ' 👁️[OCULTO]' : '';
      ctx.fillText(`${token.name}${elevText}${hiddenTag}`, pos.x, pos.y + radius + 14);

      // Status conditions indicators around token
      if (token.statusConditions && token.statusConditions.length > 0) {
        token.statusConditions.slice(0, 3).forEach((condId, cIdx) => {
          const condObj = RPG_CONDITIONS.find(c => c.id === condId);
          if (condObj) {
            const angle = -Math.PI / 4 + cIdx * 0.4;
            const badgeX = pos.x + radius * Math.cos(angle);
            const badgeY = pos.y + radius * Math.sin(angle);

            ctx.fillStyle = condObj.color;
            ctx.beginPath();
            ctx.arc(badgeX, badgeY, 6, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }

      ctx.restore();
    });

    // 8. Distance Ruler (Measure Tool)
    if (measureStart && measureEnd) {
      ctx.beginPath();
      ctx.moveTo(measureStart.x, measureStart.y);
      ctx.lineTo(measureEnd.x, measureEnd.y);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      const dx = measureEnd.x - measureStart.x;
      const dy = measureEnd.y - measureStart.y;
      const distPx = Math.hypot(dx, dy);
      const cells = (distPx / cellSize).toFixed(1);
      const meters = (parseFloat(cells) * 1.5).toFixed(1);

      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${cells} quad (${meters}m)`, (measureStart.x + measureEnd.x) / 2, (measureStart.y + measureEnd.y) / 2 - 10);
    }

    ctx.restore();
  }, [
    scene, 
    zoom, 
    pan, 
    selectedTokenId, 
    selectedWallId, 
    isGM, 
    measureStart, 
    measureEnd, 
    newWallStart, 
    mouseWorldPos, 
    gridToWorld, 
    cellSize, 
    dimensions
  ]);

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

  // Tool Click Handler (Toggle back to select if clicked again)
  const handleSelectTool = (tool: 'select' | 'measure' | 'wall') => {
    if (activeTool === tool) {
      setActiveTool('select');
      setNewWallStart(null);
      setMeasureStart(null);
      setMeasureEnd(null);
    } else {
      setActiveTool(tool);
      setNewWallStart(null);
      setMeasureStart(null);
      setMeasureEnd(null);
    }
  };

  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Right Click during wall creation cancels it!
    if (e.button === 2) {
      if (newWallStart) {
        setNewWallStart(null);
        showToast('Traçado de muro cancelado.');
        return;
      }
      // Right click drag also pans the map!
      setIsPanning(true);
      setDragStart({ x: mouseX - pan.x, y: mouseY - pan.y });
      return;
    }

    // Pan with Middle Click or Space + Left Click
    if (e.button === 1 || isSpacePressed || e.altKey) {
      setIsPanning(true);
      setDragStart({ x: mouseX - pan.x, y: mouseY - pan.y });
      return;
    }

    const worldX = (mouseX - pan.x) / zoom;
    const worldY = (mouseY - pan.y) / zoom;

    // Measuring Tool
    if (activeTool === 'measure') {
      setIsMeasuring(true);
      setMeasureStart({ x: worldX, y: worldY });
      setMeasureEnd({ x: worldX, y: worldY });
      return;
    }

    // Wall Tool (GM Only)
    if (activeTool === 'wall' && isGM) {
      if (!newWallStart) {
        setNewWallStart({ x: worldX, y: worldY });
      } else {
        const newWall: WallSegment = {
          id: 'w_' + Date.now(),
          x1: Math.round(newWallStart.x),
          y1: Math.round(newWallStart.y),
          x2: Math.round(worldX),
          y2: Math.round(worldY),
          height: 3,
          blocksSight: true,
          blocksMovement: true,
        };
        onUpdateScene({ ...scene, walls: [...scene.walls, newWall] });
        setNewWallStart(null);
        showToast('Muro colocado! Pressione Esc para sair.');
      }
      return;
    }

    // Zone Tool (GM Only)
    if (activeTool === 'zone' && isGM) {
      const gridPos = screenToGrid(mouseX, mouseY);
      setZoneStartGrid(gridPos);
      setZoneEndGrid(gridPos);
      return;
    }

    // Select Tool: Check if clicked on a Token
    const clickedToken = scene.tokens.find(t => {
      if (t.isHidden && !isGM) return false;
      const pos = gridToWorld(t.x, t.y);
      const dist = Math.hypot(pos.x - worldX, pos.y - worldY);
      return dist <= (cellSize / 2);
    });

    if (clickedToken) {
      // Permission check: GM can move all; Player can only move assigned token!
      const canMove = isGM || !playerCharacterId || clickedToken.characterId === playerCharacterId;

      onSelectToken(clickedToken.id);
      setSelectedWallId(null);

      if (canMove) {
        setDraggingTokenId(clickedToken.id);
      } else {
        showToast('🛡️ Você só pode mover seu próprio personagem!');
      }
      return;
    }

    // Select Tool: Check if clicked on a Wall Segment to select/delete
    if (isGM) {
      const clickedWall = scene.walls.find(w => distToSegment(worldX, worldY, w.x1, w.y1, w.x2, w.y2) <= 12);
      if (clickedWall) {
        setSelectedWallId(clickedWall.id);
        setSelectedZoneId(null);
        return;
      }

      // Check if clicked inside an Elevation Zone to select/adjust
      const clickedZone = [...scene.elevationZones].reverse().find(z => {
        return (
          worldX >= z.x * cellSize &&
          worldX <= (z.x + z.width) * cellSize &&
          worldY >= z.y * cellSize &&
          worldY <= (z.y + z.height) * cellSize
        );
      });
      if (clickedZone) {
        setSelectedZoneId(clickedZone.id);
        setSelectedWallId(null);
        return;
      }
    }

    // Clicked empty space: Deselect and pan
    setSelectedWallId(null);
    setSelectedZoneId(null);
    setShowConditionsPopover(false);
    setIsPanning(true);
    setDragStart({ x: mouseX - pan.x, y: mouseY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldX = (mouseX - pan.x) / zoom;
    const worldY = (mouseY - pan.y) / zoom;
    setMouseWorldPos({ x: worldX, y: worldY });

    if (isPanning) {
      setPan({ x: mouseX - dragStart.x, y: mouseY - dragStart.y });
      return;
    }

    if (activeTool === 'zone' && zoneStartGrid) {
      const gridPos = screenToGrid(mouseX, mouseY);
      setZoneEndGrid(gridPos);
      return;
    }

    if (isMeasuring && measureStart) {
      setMeasureEnd({ x: worldX, y: worldY });
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsPanning(false);

    if (activeTool === 'zone' && zoneStartGrid && zoneEndGrid) {
      const minX = Math.min(zoneStartGrid.x, zoneEndGrid.x);
      const minY = Math.min(zoneStartGrid.y, zoneEndGrid.y);
      const w = Math.abs(zoneEndGrid.x - zoneStartGrid.x) + 1;
      const h = Math.abs(zoneEndGrid.y - zoneStartGrid.y) + 1;
      setPendingZone({ x: minX, y: minY, width: w, height: h });
      setShowZoneConfigModal(true);
      setZoneStartGrid(null);
      setZoneEndGrid(null);
      return;
    }

    if (isMeasuring) {
      setIsMeasuring(false);
    }

    if (draggingTokenId) {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const gridPos = screenToGrid(mouseX, mouseY);
        
        // Check elevation zone at drop
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

  // Fluid Zoom Anchored to Mouse Position (Native non-passive listener to prevent browser scroll conflicts)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomFactor = e.deltaY < 0 ? 1.14 : 0.86;
      setZoom((prevZoom) => {
        const newZoom = Math.min(Math.max(prevZoom * zoomFactor, 0.25), 4.0);
        setPan((prevPan) => {
          const newPanX = mouseX - (mouseX - prevPan.x) * (newZoom / prevZoom);
          const newPanY = mouseY - (mouseY - prevPan.y) * (newZoom / prevZoom);
          return { x: newPanX, y: newPanY };
        });
        return newZoom;
      });
    };

    canvas.addEventListener('wheel', onWheelNative, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheelNative);
  }, []);

  // Selected Token Operations
  const selectedToken = scene.tokens.find(t => t.id === selectedTokenId);
  const selectedZone = scene.elevationZones.find(z => z.id === selectedZoneId);

  const changeTokenElevation = (delta: number) => {
    if (!selectedToken) return;
    const newElevation = Math.max(-5, (selectedToken.elevation || 0) + delta);
    onUpdateTokenPosition(selectedToken.id, selectedToken.x, selectedToken.y, newElevation);
  };

  const setTokenExactElevation = (elev: number) => {
    if (!selectedToken) return;
    onUpdateTokenPosition(selectedToken.id, selectedToken.x, selectedToken.y, elev);
  };

  const toggleTokenCondition = (condId: string) => {
    if (!selectedToken) return;
    const currentConds = selectedToken.statusConditions || [];
    const nextConds = currentConds.includes(condId)
      ? currentConds.filter(c => c !== condId)
      : [...currentConds, condId];

    onUpdateScene({
      ...scene,
      tokens: scene.tokens.map(t => t.id === selectedToken.id ? { ...t, statusConditions: nextConds } : t),
    });
  };

  const toggleTokenVisibility = () => {
    if (!selectedToken || !isGM) return;
    onUpdateScene({
      ...scene,
      tokens: scene.tokens.map(t => t.id === selectedToken.id ? { ...t, isHidden: !t.isHidden } : t),
    });
    showToast(selectedToken.isHidden ? 'Token agora VISÍVEL para os jogadores.' : 'Token OCULTO dos jogadores.');
  };

  const handleDeleteSelectedToken = () => {
    if (!selectedToken || !isGM) return;
    onUpdateScene({
      ...scene,
      tokens: scene.tokens.filter(t => t.id !== selectedToken.id),
    });
    onSelectToken('');
    showToast('Token removido da cena.');
  };

  // Calculate screen position of selected token for floating Owlbear-style action bar
  const selectedTokenScreenPos = selectedToken ? {
    x: gridToWorld(selectedToken.x, selectedToken.y).x * zoom + pan.x,
    y: gridToWorld(selectedToken.x, selectedToken.y).y * zoom + pan.y,
  } : null;

  return (
    <div 
      ref={containerRef} 
      className={`relative w-full h-full bg-[#0a0c10] overflow-hidden flex flex-col select-none ${
        isSpacePressed ? 'cursor-grab active:cursor-grabbing' : ''
      }`}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* 1. Top Left Floating Toolbar */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-[#141822]/95 backdrop-blur-md p-1.5 rounded-2xl border border-[#232938] shadow-2xl">
        <button
          onClick={() => handleSelectTool('select')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
            activeTool === 'select'
              ? 'bg-[#e63946] text-white shadow-md shadow-[#e63946]/30'
              : 'text-[#94a3b8] hover:text-white hover:bg-[#1e2433]'
          }`}
          title="Modo Seleção e Movimento de Tokens (Esc)"
        >
          <Move size={14} />
          Mover
        </button>

        <button
          onClick={() => handleSelectTool('measure')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
            activeTool === 'measure'
              ? 'bg-[#e63946] text-white shadow-md shadow-[#e63946]/30'
              : 'text-[#94a3b8] hover:text-white hover:bg-[#1e2433]'
          }`}
          title="Régua de Medição de Distâncias"
        >
          <Ruler size={14} />
          Medir
        </button>

        <div className="h-4 w-[1px] bg-[#232938] mx-0.5" />

        {/* Grid Selector */}
        <button
          onClick={() => {
            const nextType: GridType = scene.gridType === 'square' ? 'hex' : 'square';
            onUpdateScene({ ...scene, gridType: nextType });
          }}
          className="px-2.5 py-1.5 rounded-xl hover:bg-[#1e2433] text-[#94a3b8] hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
          title={`Alternar Grid (Atual: ${scene.gridType === 'hex' ? 'Hexagonal' : 'Quadrado'})`}
        >
          <Grid size={14} />
          {scene.gridType === 'hex' ? 'Hex' : 'Quad'}
        </button>

        {/* Fog of War Toggle */}
        <button
          onClick={() => onUpdateScene({ ...scene, fogOfWarEnabled: !scene.fogOfWarEnabled })}
          className={`px-2.5 py-1.5 rounded-xl hover:bg-[#1e2433] text-xs font-bold flex items-center gap-1.5 transition-colors ${
            scene.fogOfWarEnabled ? 'text-[#10b981]' : 'text-[#64748b]'
          }`}
          title="Alternar Névoa de Guerra / Visão Dinâmica"
        >
          {scene.fogOfWarEnabled ? <Eye size={14} /> : <EyeOff size={14} />}
          Visão
        </button>

        {/* GM Tools: Wall and Background Image */}
        {isGM && (
          <>
            <div className="h-4 w-[1px] bg-[#232938] mx-0.5" />

            <button
              onClick={() => handleSelectTool('wall')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTool === 'wall'
                  ? 'bg-[#d4af37] text-black shadow font-black'
                  : 'text-[#d4af37] hover:bg-[#d4af37]/15'
              }`}
              title="Traçar Muro de Bloqueio de Visão (Clique para ativar/desativar)"
            >
              <ShieldAlert size={14} />
              + Muro
            </button>

            <button
              onClick={() => handleSelectTool('zone')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTool === 'zone'
                  ? 'bg-[#3b82f6] text-white shadow font-black'
                  : 'text-[#3b82f6] hover:bg-[#3b82f6]/15'
              }`}
              title="Criar Zona de Terreno / Elevação (Clique e arraste um retângulo no mapa)"
            >
              <Layers size={14} />
              + Zona
            </button>

            <button
              onClick={() => setShowBgModal(true)}
              className="p-1.5 rounded-xl hover:bg-[#1e2433] text-[#94a3b8] hover:text-white transition-colors"
              title="Trocar Mapa / Imagem de Fundo"
            >
              <ImageIcon size={15} />
            </button>
          </>
        )}
      </div>

      {/* 2. Top Banner when drawing Wall */}
      {activeTool === 'wall' && isGM && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-[#171b26]/95 backdrop-blur-md px-4 py-2 rounded-2xl border border-[#d4af37]/60 shadow-2xl animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-ping" />
            <span className="text-xs font-bold text-white">
              {newWallStart ? 'Clique para fixar o final do muro' : 'Clique para iniciar o traçado do muro'}
            </span>
          </div>
          <button
            onClick={() => {
              setNewWallStart(null);
              setActiveTool('select');
            }}
            className="px-2.5 py-1 bg-[#232938] hover:bg-[#e63946] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
          >
            <X size={12} /> Concluir (Esc)
          </button>
        </div>
      )}

      {/* 2.1 Top Banner when drawing Zone */}
      {activeTool === 'zone' && isGM && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-[#171b26]/95 backdrop-blur-md px-4 py-2 rounded-2xl border border-[#3b82f6]/60 shadow-2xl animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#3b82f6] animate-ping" />
            <span className="text-xs font-bold text-white">
              {zoneStartGrid ? 'Solte o mouse para definir a área' : 'Clique e arraste no grid para traçar uma nova zona de elevação'}
            </span>
          </div>
          <button
            onClick={() => {
              setZoneStartGrid(null);
              setZoneEndGrid(null);
              setActiveTool('select');
            }}
            className="px-2.5 py-1 bg-[#232938] hover:bg-[#e63946] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
          >
            <X size={12} /> Concluir (Esc)
          </button>
        </div>
      )}

      {/* 3. Selected Wall Action Popover */}
      {selectedWallId && isGM && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-[#171b26]/95 backdrop-blur-md px-4 py-2 rounded-2xl border border-[#ff9f1c] shadow-2xl animate-in fade-in">
          <span className="text-xs font-bold text-[#ff9f1c]">Muro Selecionado</span>
          <button
            onClick={() => {
              onUpdateScene({
                ...scene,
                walls: scene.walls.filter((w) => w.id !== selectedWallId),
              });
              setSelectedWallId(null);
              showToast('Muro excluído.');
            }}
            className="px-2.5 py-1 bg-[#ef4444] hover:bg-[#dc2626] text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-colors"
          >
            <Trash2 size={12} /> Excluir (Del)
          </button>
          <button
            onClick={() => setSelectedWallId(null)}
            className="text-[#94a3b8] hover:text-white p-1"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* 3.1 Selected Zone Action Popover */}
      {selectedZone && isGM && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-[#171b26]/95 backdrop-blur-md px-4 py-2 rounded-2xl border border-[#3b82f6] shadow-2xl animate-in fade-in">
          <div className="flex items-center gap-2">
            <Layers size={15} className="text-[#3b82f6]" />
            <span className="text-xs font-bold text-white">{selectedZone.name}:</span>
            <span className="text-xs font-bold text-[#d4af37]">
              {selectedZone.elevation > 0 ? `+${selectedZone.elevation}m` : `${selectedZone.elevation}m`}
            </span>
          </div>
          <div className="flex items-center gap-1 border-l border-[#262c3a] pl-2">
            <button
              onClick={() => {
                onUpdateScene({
                  ...scene,
                  elevationZones: scene.elevationZones.map(z => z.id === selectedZone.id ? { ...z, elevation: z.elevation + 1 } : z)
                });
              }}
              className="p-1 px-2 rounded-lg bg-[#232938] hover:bg-[#2f374a] text-xs font-bold text-white"
              title="Aumentar Elevação (+1m)"
            >
              +1m
            </button>
            <button
              onClick={() => {
                onUpdateScene({
                  ...scene,
                  elevationZones: scene.elevationZones.map(z => z.id === selectedZone.id ? { ...z, elevation: z.elevation - 1 } : z)
                });
              }}
              className="p-1 px-2 rounded-lg bg-[#232938] hover:bg-[#2f374a] text-xs font-bold text-white"
              title="Diminuir Elevação (-1m)"
            >
              -1m
            </button>
            <button
              onClick={() => {
                onUpdateScene({
                  ...scene,
                  elevationZones: scene.elevationZones.filter(z => z.id !== selectedZone.id)
                });
                setSelectedZoneId(null);
                showToast('Zona de elevação excluída.');
              }}
              className="p-1.5 rounded-lg bg-[#e63946]/20 hover:bg-[#e63946] text-[#e63946] hover:text-white text-xs font-bold transition-colors ml-1"
              title="Excluir Zona (Delete)"
            >
              <Trash2 size={13} />
            </button>
            <button
              onClick={() => setSelectedZoneId(null)}
              className="text-[#94a3b8] hover:text-white p-1 ml-1"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* 4. Top Right: Zoom, Reset & Help Controls */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-[#141822]/95 backdrop-blur-md p-1 rounded-2xl border border-[#232938] shadow-2xl">
        <button
          onClick={() => {
            const newZoom = Math.min(zoom * 1.2, 4.0);
            setZoom(newZoom);
          }}
          className="p-1.5 rounded-xl hover:bg-[#1e2433] text-[#94a3b8] hover:text-white transition-colors"
          title="Aumentar Zoom (+)"
        >
          <ZoomIn size={15} />
        </button>
        <button
          onClick={() => {
            const newZoom = Math.max(zoom / 1.2, 0.25);
            setZoom(newZoom);
          }}
          className="p-1.5 rounded-xl hover:bg-[#1e2433] text-[#94a3b8] hover:text-white transition-colors"
          title="Diminuir Zoom (-)"
        >
          <ZoomOut size={15} />
        </button>
        <button
          onClick={() => { setZoom(1); setPan({ x: 50, y: 50 }); }}
          className="p-1.5 rounded-xl hover:bg-[#1e2433] text-[#94a3b8] hover:text-white transition-colors"
          title="Resetar Câmera"
        >
          <Maximize2 size={15} />
        </button>
        <div className="h-4 w-[1px] bg-[#232938] mx-0.5" />
        <button
          onClick={() => setShowHelpModal(true)}
          className="p-1.5 rounded-xl hover:bg-[#1e2433] text-[#d4af37] hover:text-white transition-colors"
          title="Guia de Controles & Atalhos"
        >
          <HelpCircle size={15} />
        </button>
      </div>

      {/* 5. Floating Token Context Action Bar (Owlbear Rodeo style) */}
      {selectedToken && selectedTokenScreenPos && (
        <div
          className="absolute z-20 flex flex-col items-center pointer-events-auto select-none transition-all"
          style={{
            left: `${selectedTokenScreenPos.x}px`,
            top: `${selectedTokenScreenPos.y - 65}px`,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="flex items-center gap-1.5 bg-[#141822]/95 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-[#2a3142] shadow-2xl animate-in zoom-in-95">
            {/* Elevation Controls */}
            <div className="flex items-center gap-1 border-r border-[#2a3142] pr-2">
              <Mountain size={13} className="text-[#d4af37]" />
              <button
                onClick={() => changeTokenElevation(-1)}
                className="w-5 h-5 rounded bg-[#1e2433] hover:bg-[#e63946] text-[11px] font-bold text-white flex items-center justify-center"
                title="Descer 1m"
              >
                -
              </button>
              <span className="text-[11px] font-extrabold text-[#d4af37] px-1 font-mono min-w-[28px] text-center">
                {selectedToken.elevation > 0 ? `+${selectedToken.elevation}` : selectedToken.elevation}m
              </span>
              <button
                onClick={() => changeTokenElevation(1)}
                className="w-5 h-5 rounded bg-[#1e2433] hover:bg-[#e63946] text-[11px] font-bold text-white flex items-center justify-center"
                title="Subir 1m"
              >
                +
              </button>
            </div>

            {/* Conditions Button */}
            <div className="relative">
              <button
                onClick={() => setShowConditionsPopover(!showConditionsPopover)}
                className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                  selectedToken.statusConditions?.length > 0
                    ? 'bg-[#ef4444]/20 text-[#ff6b6b] border border-[#ef4444]/30'
                    : 'text-[#94a3b8] hover:text-white hover:bg-[#1e2433]'
                }`}
                title="Aplicar Condição / Status"
              >
                <span>{selectedToken.statusConditions?.length > 0 ? '🩸' : 'Condições'}</span>
                {selectedToken.statusConditions?.length > 0 && (
                  <span className="text-[10px] font-black">{selectedToken.statusConditions.length}</span>
                )}
              </button>

              {/* Conditions Dropdown Palette */}
              {showConditionsPopover && (
                <div className="absolute top-8 left-0 z-30 w-48 bg-[#141822] rounded-xl border border-[#2a3142] shadow-2xl p-1.5 space-y-1 animate-in fade-in">
                  <div className="text-[9px] font-extrabold uppercase text-[#64748b] px-2 py-0.5">
                    Condições do RPG
                  </div>
                  {RPG_CONDITIONS.map((cond) => {
                    const isChecked = selectedToken.statusConditions?.includes(cond.id);
                    return (
                      <button
                        key={cond.id}
                        onClick={() => toggleTokenCondition(cond.id)}
                        className={`w-full flex items-center justify-between px-2 py-1 rounded-lg text-xs font-semibold transition-colors ${
                          isChecked ? 'bg-[#e63946] text-white' : 'text-[#94a3b8] hover:bg-[#1e2433] hover:text-white'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <span>{cond.icon}</span>
                          <span>{cond.label}</span>
                        </span>
                        {isChecked && <Check size={12} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* GM Only Tools: Hide/Reveal & Delete */}
            {isGM && (
              <div className="flex items-center gap-1 border-l border-[#2a3142] pl-1.5">
                <button
                  onClick={toggleTokenVisibility}
                  className={`p-1.5 rounded-lg transition-colors ${
                    selectedToken.isHidden ? 'text-[#eab308] bg-[#eab308]/20' : 'text-[#94a3b8] hover:text-white'
                  }`}
                  title={selectedToken.isHidden ? 'Token está OCULTO (Clique p/ Revelar)' : 'Ocultar Token dos Jogadores'}
                >
                  {selectedToken.isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button
                  onClick={handleDeleteSelectedToken}
                  className="p-1.5 rounded-lg text-[#ef4444] hover:bg-[#ef4444]/20 transition-colors"
                  title="Remover Token da Cena"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. Animated Permission Denied / Action Toast */}
      {toastMessage && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-[#181c26]/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-[#e63946] shadow-2xl text-xs font-bold text-white animate-in slide-in-from-bottom-2">
          <AlertCircle size={15} className="text-[#e63946]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 7. Change Battlemap Background Popover (GM Only) */}
      {showBgModal && isGM && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in select-none">
          <div className="w-full max-w-md bg-[#141822] rounded-3xl border border-[#2a3142] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#222836] pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <ImageIcon size={18} className="text-[#e63946]" />
                Trocar Cenário / Mapa de Batalha
              </h3>
              <button onClick={() => setShowBgModal(false)} className="text-[#64748b] hover:text-white p-1">
                <X size={16} />
              </button>
            </div>

            {/* Presets List */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase text-[#64748b] tracking-wider block">
                Mapas Prontos Temáticos
              </span>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_BATTLEMAPS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => {
                      onUpdateScene({ ...scene, backgroundUrl: preset.url });
                      setShowBgModal(false);
                      showToast(`Cenário alterado para "${preset.name}".`);
                    }}
                    className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all ${
                      scene.backgroundUrl === preset.url
                        ? 'bg-[#e63946] border-[#e63946] text-white shadow'
                        : 'bg-[#181d28] border-[#222836] text-[#cbd5e1] hover:border-[#e63946]'
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom URL Input */}
            <div className="space-y-2 pt-2 border-t border-[#222836]">
              <span className="text-[10px] font-extrabold uppercase text-[#64748b] tracking-wider block">
                Ou cole uma URL de imagem externa:
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="https://exemplo.com/mapa.jpg"
                  value={customBgInput}
                  onChange={(e) => setCustomBgInput(e.target.value)}
                  className="flex-1 bg-[#0d0f14] px-3 py-2 rounded-xl text-xs text-white border border-[#242b3a] focus:outline-none focus:border-[#e63946]"
                />
                <button
                  onClick={() => {
                    if (customBgInput.trim()) {
                      onUpdateScene({ ...scene, backgroundUrl: customBgInput.trim() });
                      setShowBgModal(false);
                      showToast('Mapa customizado carregado!');
                    }
                  }}
                  className="px-4 py-2 bg-[#e63946] hover:bg-[#d02e3b] text-white text-xs font-bold rounded-xl transition-all shadow"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. Help / Onboarding Guide Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in select-none">
          <div className="w-full max-w-md bg-[#141822] rounded-3xl border border-[#2a3142] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#222836] pb-3">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <HelpCircle size={18} className="text-[#d4af37]" />
                Guia Rápido de Navegação Tática
              </h3>
              <button onClick={() => setShowHelpModal(false)} className="text-[#64748b] hover:text-white p-1">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#cbd5e1] leading-relaxed">
              <div className="flex items-start gap-2.5 bg-[#181d28] p-3 rounded-xl border border-[#222836]">
                <span className="text-base">✋</span>
                <div>
                  <strong className="text-white block font-bold">Mover a Câmera (Pan)</strong>
                  Segure a tecla <kbd className="px-1.5 py-0.5 rounded bg-[#252c3c] font-mono text-[10px] text-white">Espaço</kbd> e arraste com o mouse, ou use o <strong>botão do meio</strong> (scroll click) ou <strong>botão direito</strong>.
                </div>
              </div>

              <div className="flex items-start gap-2.5 bg-[#181d28] p-3 rounded-xl border border-[#222836]">
                <span className="text-base">🔍</span>
                <div>
                  <strong className="text-white block font-bold">Zoom Inteligente</strong>
                  Gire a roda do mouse. O zoom mira exatamente onde o seu ponteiro está apontando.
                </div>
              </div>

              <div className="flex items-start gap-2.5 bg-[#181d28] p-3 rounded-xl border border-[#222836]">
                <span className="text-base">🎯</span>
                <div>
                  <strong className="text-white block font-bold">Selecionar & Ações do Token</strong>
                  Clique no seu boneco para abrir a barra de ações: alterar altura (elevação 3D), condições (sangrando, caído) e vida.
                </div>
              </div>

              <div className="flex items-start gap-2.5 bg-[#181d28] p-3 rounded-xl border border-[#222836]">
                <span className="text-base">🧱</span>
                <div>
                  <strong className="text-white block font-bold">Muros & Linha de Visão (Mestre)</strong>
                  Use a ferramenta <strong>+ Muro</strong> para desenhar paredes. Pressione <kbd className="px-1.5 py-0.5 rounded bg-[#252c3c] font-mono text-[10px] text-white">Esc</kbd> para cancelar ou sair. Use <kbd className="px-1.5 py-0.5 rounded bg-[#252c3c] font-mono text-[10px] text-white">Ctrl+Z</kbd> para desfazer.
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2.5 bg-[#222838] hover:bg-[#2c3448] text-white text-xs font-bold rounded-xl transition-all"
            >
              Entendido!
            </button>
          </div>
        </div>
      )}

      {/* 8.1 Zone Configuration Modal (GM Only) */}
      {showZoneConfigModal && pendingZone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in select-none">
          <div className="w-full max-w-md bg-[#141720] rounded-3xl border border-[#262c3a] p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#232938] pb-3">
              <div className="flex items-center gap-2 text-white font-extrabold text-sm">
                <Layers className="text-[#3b82f6]" size={18} />
                <span>Configurar Zona de Elevação</span>
              </div>
              <button
                onClick={() => {
                  setShowZoneConfigModal(false);
                  setPendingZone(null);
                }}
                className="text-[#94a3b8] hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-[#94a3b8] mb-1 block">Nome da Zona / Área</label>
                <input
                  type="text"
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  placeholder="Ex: Mezanino, Torre, Fosso, Colina..."
                  className="w-full bg-[#1c222e] border border-[#2b3345] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#3b82f6]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#94a3b8] mb-1 block">
                  Elevação Vertical: <span className="font-bold text-[#d4af37]">{newZoneElevation > 0 ? `+${newZoneElevation}m (Alto)` : newZoneElevation < 0 ? `${newZoneElevation}m (Fosso)` : '0m (Térreo)'}</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="-6"
                    max="15"
                    step="1"
                    value={newZoneElevation}
                    onChange={(e) => setNewZoneElevation(parseInt(e.target.value) || 0)}
                    className="flex-1 accent-[#3b82f6]"
                  />
                  <div className="flex gap-1">
                    {[-2, 0, 3, 6, 9].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setNewZoneElevation(m)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                          newZoneElevation === m
                            ? 'bg-[#3b82f6] text-white shadow'
                            : 'bg-[#232938] text-[#94a3b8] hover:text-white'
                        }`}
                      >
                        {m > 0 ? `+${m}m` : `${m}m`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#94a3b8] mb-1 block">Cor da Área</label>
                <div className="flex items-center gap-2">
                  {[
                    { label: 'Azul', val: 'rgba(59, 130, 246, 0.28)' },
                    { label: 'Dourado', val: 'rgba(234, 179, 8, 0.28)' },
                    { label: 'Verde', val: 'rgba(16, 185, 129, 0.28)' },
                    { label: 'Vermelho (Fosso/Perigo)', val: 'rgba(239, 68, 68, 0.28)' },
                    { label: 'Roxo (Mágico)', val: 'rgba(168, 85, 247, 0.28)' },
                  ].map((colorOpt) => (
                    <button
                      key={colorOpt.val}
                      type="button"
                      onClick={() => setNewZoneColor(colorOpt.val)}
                      className={`w-7 h-7 rounded-lg border-2 transition-all ${
                        newZoneColor === colorOpt.val ? 'border-white scale-110 shadow-lg' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: colorOpt.val.replace(/0\.28/, '0.8') }}
                      title={colorOpt.label}
                    />
                  ))}
                </div>
              </div>

              <div className="text-[11px] text-[#64748b] bg-[#1a1f2c] p-2.5 rounded-xl border border-[#232a3b]">
                ℹ️ Área selecionada: {pendingZone.width}x{pendingZone.height} células ({(pendingZone.width * 1.5).toFixed(1)}m × {(pendingZone.height * 1.5).toFixed(1)}m).
                Tokens posicionados dentro desta área herdarão automaticamente os {newZoneElevation}m de elevação tática!
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#232938]">
              <button
                type="button"
                onClick={() => {
                  setShowZoneConfigModal(false);
                  setPendingZone(null);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#94a3b8] hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const newZone: ElevationZone = {
                    id: 'zone_' + Date.now(),
                    name: newZoneName.trim() || 'Zona de Elevação',
                    x: pendingZone.x,
                    y: pendingZone.y,
                    width: pendingZone.width,
                    height: pendingZone.height,
                    elevation: newZoneElevation,
                    color: newZoneColor,
                  };
                  onUpdateScene({
                    ...scene,
                    elevationZones: [...scene.elevationZones, newZone],
                  });
                  setShowZoneConfigModal(false);
                  setPendingZone(null);
                  setActiveTool('select');
                  showToast(`Zona "${newZone.name}" criada com sucesso!`);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#3b82f6] hover:bg-[#2563eb] text-white shadow-lg shadow-[#3b82f6]/30 flex items-center gap-1.5"
              >
                <Check size={14} />
                Salvar Zona
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-default"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
    </div>
  );
};
