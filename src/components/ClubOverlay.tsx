import { useState, useRef, useCallback } from 'react';
import { Club, StatKey, DailyRecord, CoordKey } from '../types';

const DEFAULT_COLOR = '#3a2a0a';
const DEFAULT_FONTSIZE = 13;

interface Props {
  club: Club;
  overallRate: number;
  getRate: (current: number, target: number) => number;
  onUpdateStat: (stat: StatKey, field: 'current' | 'target', value: number) => void;
  onUpdateCoord: (key: CoordKey, coords: number[]) => void;
  onUpdateStyle: (key: CoordKey, style: Partial<{ color: string; fontSize: number }>) => void;
  onAddRecord: (record: DailyRecord) => void;
}

// 선택된 칸의 스타일 편집 패널
function StylePanel({
  coordKey,
  color,
  fontSize,
  onChange,
  onClose,
}: {
  coordKey: CoordKey;
  color: string;
  fontSize: number;
  onChange: (style: Partial<{ color: string; fontSize: number }>) => void;
  onClose: () => void;
}) {
  const LABEL: Record<CoordKey, string> = {
    evHyun: '단순전도 현황', evMok: '단순전도 목표', evBogo: '단순전도 달성률',
    effHyun: '유효전도 현황', effMok: '유효전도 목표', effInter: '유효전도 달성률',
    attHyun: '출석 현황', attMok: '출석 목표', attEvent: '출석 달성률',
    bapHyun: '침례 현황', bapMok: '침례 목표', bapReg: '침례 달성률',
    gauge: '게이지바', gaugePct: '달성률 숫자',
  };
  return (
    <div style={{
      position: 'absolute', top: 8, right: 8, zIndex: 50,
      background: '#fff', border: '1px solid #e84393',
      borderRadius: 10, padding: '12px 14px', minWidth: 200,
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: '#e84393' }}>{LABEL[coordKey]}</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#888' }}>✕</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <label style={{ fontSize: 12, color: '#555', display: 'flex', alignItems: 'center', gap: 8 }}>
          글자 색상
          <input type="color" value={color}
            onChange={e => onChange({ color: e.target.value })}
            style={{ width: 36, height: 28, border: 'none', cursor: 'pointer', borderRadius: 4 }} />
          <span style={{ fontSize: 11, color: '#999' }}>{color}</span>
        </label>
        <label style={{ fontSize: 12, color: '#555', display: 'flex', flexDirection: 'column', gap: 4 }}>
          글자 크기: <strong>{fontSize}px</strong>
          <input type="range" min={8} max={40} value={fontSize}
            onChange={e => onChange({ fontSize: Number(e.target.value) })}
            style={{ width: '100%' }} />
        </label>
      </div>
    </div>
  );
}

function DraggableOverlayNumber({
  coordKey, value, coords, style: overlayStyle, editMode, selectedKey,
  onChange, onDragEnd, onSelect,
}: {
  coordKey: CoordKey; value: number; coords: number[];
  style: { color: string; fontSize: number };
  editMode: boolean; selectedKey: CoordKey | null;
  onChange: (v: number) => void;
  onDragEnd: (key: CoordKey, newCoords: number[]) => void;
  onSelect: (key: CoordKey) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ mouseX: number; mouseY: number; origLeft: number; origTop: number } | null>(null);
  const isSelected = selectedKey === coordKey;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!editMode) return;
    e.preventDefault();
    onSelect(coordKey);
    const parent = (e.currentTarget as HTMLElement).closest('.overlay-container') as HTMLElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    dragStart.current = { mouseX: e.clientX, mouseY: e.clientY, origLeft: coords[0], origTop: coords[1] };
    const onMouseMove = (mv: MouseEvent) => {
      if (!dragStart.current || !containerRef.current) return;
      const dx = ((mv.clientX - dragStart.current.mouseX) / rect.width) * 100;
      const dy = ((mv.clientY - dragStart.current.mouseY) / rect.height) * 100;
      containerRef.current.style.left = `${Math.max(0, Math.min(95, dragStart.current.origLeft + dx))}%`;
      containerRef.current.style.top = `${Math.max(0, Math.min(95, dragStart.current.origTop + dy))}%`;
    };
    const onMouseUp = (mu: MouseEvent) => {
      if (!dragStart.current) return;
      const dx = ((mu.clientX - dragStart.current.mouseX) / rect.width) * 100;
      const dy = ((mu.clientY - dragStart.current.mouseY) / rect.height) * 100;
      onDragEnd(coordKey, [
        Math.max(0, Math.min(95, dragStart.current.origLeft + dx)),
        Math.max(0, Math.min(95, dragStart.current.origTop + dy)),
        coords[2], coords[3],
      ]);
      dragStart.current = null;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [editMode, coords, coordKey, onDragEnd, onSelect]);

  if (editing && !editMode) {
    return (
      <input autoFocus type="number" min={0} value={draft}
        style={{
          position: 'absolute', left: `${coords[0]}%`, top: `${coords[1]}%`,
          width: `${coords[2]}%`, height: `${coords[3]}%`,
          background: 'rgba(255,255,230,0.92)', border: '2px solid #c0820a',
          borderRadius: 3, textAlign: 'center',
          fontSize: overlayStyle.fontSize, fontWeight: 700, color: '#333',
          padding: 0, outline: 'none', zIndex: 20,
        }}
        onChange={e => setDraft(e.target.value)}
        onBlur={() => { onChange(Math.max(0, Number(draft) || 0)); setEditing(false); }}
        onKeyDown={e => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          if (e.key === 'Escape') setEditing(false);
        }}
      />
    );
  }

  return (
    <div ref={containerRef} style={{
      position: 'absolute', left: `${coords[0]}%`, top: `${coords[1]}%`,
      width: `${coords[2]}%`, height: `${coords[3]}%`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: overlayStyle.fontSize, fontWeight: 700, color: overlayStyle.color,
      cursor: editMode ? 'grab' : 'pointer', zIndex: 10, borderRadius: 3,
      outline: editMode ? (isSelected ? '2px solid #e84393' : '2px dashed #e84393') : 'none',
      background: editMode ? (isSelected ? 'rgba(232,67,147,0.15)' : 'rgba(232,67,147,0.06)') : 'transparent',
      userSelect: 'none',
    }}
      title={editMode ? '드래그: 이동 / 클릭: 스타일 편집' : '클릭해서 수정'}
      onMouseDown={handleMouseDown}
      onClick={() => { if (!editMode) { setDraft(String(value)); setEditing(true); } }}
      onMouseEnter={e => { if (!editMode) e.currentTarget.style.background = 'rgba(255,255,200,0.7)'; }}
      onMouseLeave={e => { if (!editMode) e.currentTarget.style.background = 'transparent'; }}
    >
      {value || ''}
    </div>
  );
}

function DraggableDisplay({
  coordKey, text, coords, style: overlayStyle, editMode, selectedKey,
  onDragEnd, onSelect,
}: {
  coordKey: CoordKey; text: string; coords: number[];
  style: { color: string; fontSize: number };
  editMode: boolean; selectedKey: CoordKey | null;
  onDragEnd: (key: CoordKey, newCoords: number[]) => void;
  onSelect: (key: CoordKey) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ mouseX: number; mouseY: number; origLeft: number; origTop: number } | null>(null);
  const isSelected = selectedKey === coordKey;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!editMode) return;
    e.preventDefault();
    onSelect(coordKey);
    const parent = (e.currentTarget as HTMLElement).closest('.overlay-container') as HTMLElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    dragStart.current = { mouseX: e.clientX, mouseY: e.clientY, origLeft: coords[0], origTop: coords[1] };
    const onMouseMove = (mv: MouseEvent) => {
      if (!dragStart.current || !containerRef.current) return;
      const dx = ((mv.clientX - dragStart.current.mouseX) / rect.width) * 100;
      const dy = ((mv.clientY - dragStart.current.mouseY) / rect.height) * 100;
      containerRef.current.style.left = `${Math.max(0, dragStart.current.origLeft + dx)}%`;
      containerRef.current.style.top = `${Math.max(0, dragStart.current.origTop + dy)}%`;
    };
    const onMouseUp = (mu: MouseEvent) => {
      if (!dragStart.current) return;
      const dx = ((mu.clientX - dragStart.current.mouseX) / rect.width) * 100;
      const dy = ((mu.clientY - dragStart.current.mouseY) / rect.height) * 100;
      onDragEnd(coordKey, [Math.max(0, dragStart.current.origLeft + dx), Math.max(0, dragStart.current.origTop + dy), coords[2], coords[3]]);
      dragStart.current = null;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [editMode, coords, coordKey, onDragEnd, onSelect]);

  return (
    <div ref={containerRef} style={{
      position: 'absolute', left: `${coords[0]}%`, top: `${coords[1]}%`,
      width: `${coords[2]}%`, height: `${coords[3]}%`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: overlayStyle.fontSize, fontWeight: 700, color: overlayStyle.color,
      zIndex: 10, cursor: editMode ? 'grab' : 'default',
      outline: editMode ? (isSelected ? '2px solid #c0820a' : '2px dashed #c0820a') : 'none',
      background: editMode ? (isSelected ? 'rgba(192,130,10,0.15)' : 'rgba(192,130,10,0.06)') : 'transparent',
      userSelect: 'none',
    }}
      onMouseDown={handleMouseDown}
    >
      {text}
    </div>
  );
}

export function ClubOverlay({ club, overallRate, getRate, onUpdateStat, onUpdateCoord, onUpdateStyle, onAddRecord }: Props) {
  const [showInput, setShowInput] = useState(false);
  const [showRecords, setShowRecords] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedKey, setSelectedKey] = useState<CoordKey | null>(null);
  const c = club.coords;

  const getStyle = (key: CoordKey) => ({
    color: club.styles[key]?.color ?? DEFAULT_COLOR,
    fontSize: club.styles[key]?.fontSize ?? DEFAULT_FONTSIZE,
  });

  const handleDragEnd = useCallback((key: CoordKey, newCoords: number[]) => {
    onUpdateCoord(key, newCoords);
  }, [onUpdateCoord]);

  const handleSelect = useCallback((key: CoordKey) => {
    setSelectedKey(prev => prev === key ? null : key);
  }, []);

  // 게이지 드래그 + 리사이즈
  const gaugeRef = useRef<HTMLDivElement>(null);
  const gaugeDrag = useRef<{ mouseX: number; mouseY: number; origLeft: number; origTop: number } | null>(null);
  const gaugeResize = useRef<{
    edge: 'right' | 'bottom' | 'left' | 'top';
    mouseX: number; mouseY: number;
    origLeft: number; origTop: number; origW: number; origH: number;
  } | null>(null);

  const handleGaugeMouseDown = useCallback((e: React.MouseEvent) => {
    if (!editMode) return;
    e.preventDefault();
    setSelectedKey('gauge');
    const parent = (e.currentTarget as HTMLElement).closest('.overlay-container') as HTMLElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    gaugeDrag.current = { mouseX: e.clientX, mouseY: e.clientY, origLeft: c.gauge[0], origTop: c.gauge[1] };
    const onMouseMove = (mv: MouseEvent) => {
      if (!gaugeDrag.current || !gaugeRef.current) return;
      const dx = ((mv.clientX - gaugeDrag.current.mouseX) / rect.width) * 100;
      const dy = ((mv.clientY - gaugeDrag.current.mouseY) / rect.height) * 100;
      gaugeRef.current.style.left = `${Math.max(0, gaugeDrag.current.origLeft + dx)}%`;
      gaugeRef.current.style.top = `${Math.max(0, gaugeDrag.current.origTop + dy)}%`;
    };
    const onMouseUp = (mu: MouseEvent) => {
      if (!gaugeDrag.current) return;
      const dx = ((mu.clientX - gaugeDrag.current.mouseX) / rect.width) * 100;
      const dy = ((mu.clientY - gaugeDrag.current.mouseY) / rect.height) * 100;
      onUpdateCoord('gauge', [Math.max(0, gaugeDrag.current.origLeft + dx), Math.max(0, gaugeDrag.current.origTop + dy), c.gauge[2], c.gauge[3]]);
      gaugeDrag.current = null;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [editMode, c.gauge, onUpdateCoord]);

  // 리사이즈 핸들 (4방향)
  const handleResizeMouseDown = useCallback((e: React.MouseEvent, edge: 'right' | 'bottom' | 'left' | 'top') => {
    if (!editMode) return;
    e.preventDefault();
    e.stopPropagation();
    const parent = (e.currentTarget as HTMLElement).closest('.overlay-container') as HTMLElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    gaugeResize.current = { edge, mouseX: e.clientX, mouseY: e.clientY, origLeft: c.gauge[0], origTop: c.gauge[1], origW: c.gauge[2], origH: c.gauge[3] };
    const onMouseMove = (mv: MouseEvent) => {
      if (!gaugeResize.current || !gaugeRef.current) return;
      const dx = ((mv.clientX - gaugeResize.current.mouseX) / rect.width) * 100;
      const dy = ((mv.clientY - gaugeResize.current.mouseY) / rect.height) * 100;
      const { origLeft, origTop, origW, origH } = gaugeResize.current;
      if (edge === 'right') gaugeRef.current.style.width = `${Math.max(2, origW + dx)}%`;
      if (edge === 'bottom') gaugeRef.current.style.height = `${Math.max(0.5, origH + dy)}%`;
      if (edge === 'left') {
        gaugeRef.current.style.left = `${Math.max(0, origLeft + dx)}%`;
        gaugeRef.current.style.width = `${Math.max(2, origW - dx)}%`;
      }
      if (edge === 'top') {
        gaugeRef.current.style.top = `${Math.max(0, origTop + dy)}%`;
        gaugeRef.current.style.height = `${Math.max(0.5, origH - dy)}%`;
      }
    };
    const onMouseUp = (mu: MouseEvent) => {
      if (!gaugeResize.current) return;
      const dx = ((mu.clientX - gaugeResize.current.mouseX) / rect.width) * 100;
      const dy = ((mu.clientY - gaugeResize.current.mouseY) / rect.height) * 100;
      const { origLeft, origTop, origW, origH, edge: ed } = gaugeResize.current;
      let newLeft = origLeft, newTop = origTop, newW = origW, newH = origH;
      if (ed === 'right')  { newW = Math.max(2, origW + dx); }
      if (ed === 'bottom') { newH = Math.max(0.5, origH + dy); }
      if (ed === 'left')   { newLeft = Math.max(0, origLeft + dx); newW = Math.max(2, origW - dx); }
      if (ed === 'top')    { newTop = Math.max(0, origTop + dy); newH = Math.max(0.5, origH - dy); }
      onUpdateCoord('gauge', [newLeft, newTop, newW, newH]);
      gaugeResize.current = null;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [editMode, c.gauge, onUpdateCoord]);

  const gaugeWidth = overallRate;

  const numberFields: { key: CoordKey; stat: StatKey; field: 'current' | 'target' }[] = [
    { key: 'evHyun',  stat: 'evangelism',          field: 'current' },
    { key: 'evMok',   stat: 'evangelism',          field: 'target'  },
    { key: 'effHyun', stat: 'effectiveEvangelism', field: 'current' },
    { key: 'effMok',  stat: 'effectiveEvangelism', field: 'target'  },
    { key: 'attHyun', stat: 'attendance',          field: 'current' },
    { key: 'attMok',  stat: 'attendance',          field: 'target'  },
    { key: 'bapHyun', stat: 'baptism',             field: 'current' },
    { key: 'bapMok',  stat: 'baptism',             field: 'target'  },
  ];

  const displayFields: { key: CoordKey; text: string }[] = [
    { key: 'evBogo',   text: getRate(club.stats.evangelism.current, club.stats.evangelism.target) > 0 ? `${getRate(club.stats.evangelism.current, club.stats.evangelism.target)}%` : '' },
    { key: 'effInter', text: getRate(club.stats.effectiveEvangelism.current, club.stats.effectiveEvangelism.target) > 0 ? `${getRate(club.stats.effectiveEvangelism.current, club.stats.effectiveEvangelism.target)}%` : '' },
    { key: 'attEvent', text: getRate(club.stats.attendance.current, club.stats.attendance.target) > 0 ? `${getRate(club.stats.attendance.current, club.stats.attendance.target)}%` : '' },
    { key: 'bapReg',   text: getRate(club.stats.baptism.current, club.stats.baptism.target) > 0 ? `${getRate(club.stats.baptism.current, club.stats.baptism.target)}%` : '' },
    { key: 'gaugePct', text: overallRate > 0 ? String(overallRate) : '' },
  ];

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      {editMode && (
        <div style={{
          background: 'rgba(232,67,147,0.10)', border: '1px solid #e84393',
          borderRadius: 6, padding: '6px 12px', marginBottom: 8,
          fontSize: 13, color: '#e84393', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          ✏️ <strong>편집 모드</strong> — 드래그: 이동 / 클릭: 색상·크기 편집 / 게이지 테두리: 크기 조절
        </div>
      )}

      <div className="overlay-container" style={{ position: 'relative', width: '100%' }}>
        <img src={club.image} alt={club.name} style={{ width: '100%', height: 'auto', display: 'block' }} draggable={false} />

        {/* 숫자 입력 칸들 */}
        {numberFields.map(({ key, stat, field }) => (
          <DraggableOverlayNumber
            key={key} coordKey={key}
            value={club.stats[stat][field]}
            coords={c[key]} style={getStyle(key)}
            editMode={editMode} selectedKey={selectedKey}
            onChange={v => onUpdateStat(stat, field, v)}
            onDragEnd={handleDragEnd} onSelect={handleSelect}
          />
        ))}

        {/* 달성률 표시 칸들 */}
        {displayFields.map(({ key, text }) => (
          <DraggableDisplay
            key={key} coordKey={key} text={text}
            coords={c[key]} style={getStyle(key)}
            editMode={editMode} selectedKey={selectedKey}
            onDragEnd={handleDragEnd} onSelect={handleSelect}
          />
        ))}

        {/* 게이지바 */}
        <div ref={gaugeRef} style={{
          position: 'absolute', left: `${c.gauge[0]}%`, top: `${c.gauge[1]}%`,
          width: `${c.gauge[2]}%`, height: `${c.gauge[3]}%`,
          overflow: 'hidde
