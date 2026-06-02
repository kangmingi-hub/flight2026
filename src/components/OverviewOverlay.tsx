import { useState, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { OverviewCoords, OverviewCoordKey, OverlayStyles } from '../types';

const OVERVIEW_IMAGE = '/images/overview.png';
const DEFAULT_COLOR = '#3a2a0a';
const DEFAULT_FONTSIZE = 13;

interface Totals {
  evangelism:          { current: number; target: number };
  effectiveEvangelism: { current: number; target: number };
  attendance:          { current: number; target: number };
  baptism:             { current: number; target: number };
}

interface Props {
  totals: Totals;
  coords: OverviewCoords;
  styles: OverlayStyles;
  dday: number;
  getRate: (current: number, target: number) => number;
  onUpdateCoord: (key: OverviewCoordKey, coords: number[]) => void;
  onUpdateStyle: (key: OverviewCoordKey, style: Partial<{ color: string; fontSize: number }>) => void;
  onUpdateDday: (value: number) => void;
}

function StylePanel({
  coordKey, color, fontSize, onChange, onClose,
}: {
  coordKey: OverviewCoordKey; color: string; fontSize: number;
  onChange: (s: Partial<{ color: string; fontSize: number }>) => void;
  onClose: () => void;
}) {
  const LABEL: Record<OverviewCoordKey, string> = {
    evHyun: '단순전도 현황', evMok: '단순전도 목표', evBogo: '단순전도 달성률', evGauge: '단순전도 게이지',
    effHyun: '유효전도 현황', effMok: '유효전도 목표', effInter: '유효전도 달성률', effGauge: '유효전도 게이지',
    attHyun: '출석 현황', attMok: '출석 목표', attEvent: '출석 달성률', attGauge: '출석 게이지',
    bapHyun: '침례 현황', bapMok: '침례 목표', bapReg: '침례 달성률', bapGauge: '침례 게이지',
    gauge: '전체 게이지', dday: 'D-Day', gaugePct: '전체 달성률',
  };
  return (
    <div style={{
      position: 'absolute', top: 8, right: 8, zIndex: 50,
      background: '#fff', border: '1px solid #4a90d9',
      borderRadius: 10, padding: '12px 14px', minWidth: 200,
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: '#4a90d9' }}>{LABEL[coordKey]}</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#888' }}>✕</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <label style={{ fontSize: 12, color: '#555', display: 'flex', alignItems: 'center', gap: 8 }}>
          글자 색상
          <input type="color" value={color} onChange={e => onChange({ color: e.target.value })}
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

function DraggableDisplay({
  coordKey, text, coords, style: overlayStyle, editMode, selectedKey, onDragEnd, onSelect,
}: {
  coordKey: OverviewCoordKey; text: string; coords: number[];
  style: { color: string; fontSize: number };
  editMode: boolean; selectedKey: OverviewCoordKey | null;
  onDragEnd: (key: OverviewCoordKey, newCoords: number[]) => void;
  onSelect: (key: OverviewCoordKey) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ mouseX: number; mouseY: number; origLeft: number; origTop: number } | null>(null);
  const isSelected = selectedKey === coordKey;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!editMode) return;
    e.preventDefault();
    onSelect(coordKey);
    const parent = (e.currentTarget as HTMLElement).closest('.overlay-container') as HTMLElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    drag.current = { mouseX: e.clientX, mouseY: e.clientY, origLeft: coords[0], origTop: coords[1] };
    const onMove = (mv: MouseEvent) => {
      if (!drag.current || !ref.current) return;
      ref.current.style.left = `${Math.max(0, drag.current.origLeft + ((mv.clientX - drag.current.mouseX) / rect.width) * 100)}%`;
      ref.current.style.top  = `${Math.max(0, drag.current.origTop  + ((mv.clientY - drag.current.mouseY) / rect.height) * 100)}%`;
    };
    const onUp = (mu: MouseEvent) => {
      if (!drag.current) return;
      onDragEnd(coordKey, [
        Math.max(0, drag.current.origLeft + ((mu.clientX - drag.current.mouseX) / rect.width) * 100),
        Math.max(0, drag.current.origTop  + ((mu.clientY - drag.current.mouseY) / rect.height) * 100),
        coords[2], coords[3],
      ]);
      drag.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [editMode, coords, coordKey, onDragEnd, onSelect]);

  return (
    <div ref={ref} style={{
      position: 'absolute', left: `${coords[0]}%`, top: `${coords[1]}%`,
      width: `${coords[2]}%`, height: `${coords[3]}%`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: overlayStyle.fontSize, fontWeight: 700, color: overlayStyle.color,
      zIndex: 10, cursor: editMode ? 'grab' : 'default', borderRadius: 3,
      outline: editMode ? (isSelected ? '2px solid #4a90d9' : '2px dashed #4a90d9') : 'none',
      background: editMode ? (isSelected ? 'rgba(74,144,217,0.15)' : 'rgba(74,144,217,0.06)') : 'transparent',
      userSelect: 'none',
    }} onMouseDown={handleMouseDown}>
      {text}
    </div>
  );
}

function DraggableGauge({
  coordKey, rate, coords, editMode, selectedKey, color, onDragEnd, onSelect,
}: {
  coordKey: OverviewCoordKey; rate: number; coords: number[];
  editMode: boolean; selectedKey: OverviewCoordKey | null;
  color: string;
  onDragEnd: (key: OverviewCoordKey, newCoords: number[]) => void;
  onSelect: (key: OverviewCoordKey) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ mouseX: number; mouseY: number; origLeft: number; origTop: number } | null>(null);
  const resize = useRef<{ edge: string; mouseX: number; mouseY: number; origLeft: number; origTop: number; origW: number; origH: number } | null>(null);
  const isSelected = selectedKey === coordKey;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!editMode) return;
    e.preventDefault();
    onSelect(coordKey);
    const parent = (e.currentTarget as HTMLElement).closest('.overlay-container') as HTMLElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    drag.current = { mouseX: e.clientX, mouseY: e.clientY, origLeft: coords[0], origTop: coords[1] };
    const onMove = (mv: MouseEvent) => {
      if (!drag.current || !ref.current) return;
      ref.current.style.left = `${Math.max(0, drag.current.origLeft + ((mv.clientX - drag.current.mouseX) / rect.width) * 100)}%`;
      ref.current.style.top  = `${Math.max(0, drag.current.origTop  + ((mv.clientY - drag.current.mouseY) / rect.height) * 100)}%`;
    };
    const onUp = (mu: MouseEvent) => {
      if (!drag.current) return;
      onDragEnd(coordKey, [
        Math.max(0, drag.current.origLeft + ((mu.clientX - drag.current.mouseX) / rect.width) * 100),
        Math.max(0, drag.current.origTop  + ((mu.clientY - drag.current.mouseY) / rect.height) * 100),
        coords[2], coords[3],
      ]);
      drag.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [editMode, coords, coordKey, onDragEnd, onSelect]);

  const handleResizeDown = useCallback((e: React.MouseEvent, edge: string) => {
    if (!editMode) return;
    e.preventDefault(); e.stopPropagation();
    const parent = (e.currentTarget as HTMLElement).closest('.overlay-container') as HTMLElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    resize.current = { edge, mouseX: e.clientX, mouseY: e.clientY, origLeft: coords[0], origTop: coords[1], origW: coords[2], origH: coords[3] };
    const onMove = (mv: MouseEvent) => {
      if (!resize.current || !ref.current) return;
      const dx = ((mv.clientX - resize.current.mouseX) / rect.width) * 100;
      const dy = ((mv.clientY - resize.current.mouseY) / rect.height) * 100;
      const { origLeft, origTop, origW, origH } = resize.current;
      if (edge === 'right')  ref.current.style.width  = `${Math.max(2, origW + dx)}%`;
      if (edge === 'bottom') ref.current.style.height = `${Math.max(0.5, origH + dy)}%`;
      if (edge === 'left')   { ref.current.style.left = `${Math.max(0, origLeft + dx)}%`; ref.current.style.width  = `${Math.max(2, origW - dx)}%`; }
      if (edge === 'top')    { ref.current.style.top  = `${Math.max(0, origTop  + dy)}%`; ref.current.style.height = `${Math.max(0.5, origH - dy)}%`; }
    };
    const onUp = (mu: MouseEvent) => {
      if (!resize.current) return;
      const dx = ((mu.clientX - resize.current.mouseX) / rect.width) * 100;
      const dy = ((mu.clientY - resize.current.mouseY) / rect.height) * 100;
      const { origLeft, origTop, origW, origH, edge: ed } = resize.current;
      let [nl, nt, nw, nh] = [origLeft, origTop, origW, origH];
      if (ed === 'right')  nw = Math.max(2, origW + dx);
      if (ed === 'bottom') nh = Math.max(0.5, origH + dy);
      if (ed === 'left')   { nl = Math.max(0, origLeft + dx); nw = Math.max(2, origW - dx); }
      if (ed === 'top')    { nt = Math.max(0, origTop  + dy); nh = Math.max(0.5, origH - dy); }
      onDragEnd(coordKey, [nl, nt, nw, nh]);
      resize.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [editMode, coords, coordKey, onDragEnd]);

  return (
    <div ref={ref} style={{
      position: 'absolute', left: `${coords[0]}%`, top: `${coords[1]}%`,
      width: `${coords[2]}%`, height: `${coords[3]}%`,
      overflow: 'hidden', borderRadius: 99, zIndex: 10,
      cursor: editMode ? 'grab' : 'default',
      outline: editMode ? (isSelected ? `2px solid ${color}` : `2px dashed ${color}`) : 'none',
      boxSizing: 'border-box',
    }} onMouseDown={handleMouseDown}>
      <div style={{
        height: '100%', width: `${rate}%`,
        background: `linear-gradient(90deg, ${color}aa, ${color})`,
        borderRadius: 99,
        transition: 'width 0.8s cubic-bezier(0.34,1.56,0.64,1)',
      }} />
      {editMode && (<>
        <div onMouseDown={e => handleResizeDown(e, 'right')}  style={{ position: 'absolute', right: 0,  top: 0, width: 8, height: '100%', cursor: 'ew-resize', zIndex: 30, background: `${color}66`, borderRadius: '0 99px 99px 0' }} />
        <div onMouseDown={e => handleResizeDown(e, 'left')}   style={{ position: 'absolute', left: 0,   top: 0, width: 8, height: '100%', cursor: 'ew-resize', zIndex: 30, background: `${color}66`, borderRadius: '99px 0 0 99px' }} />
        <div onMouseDown={e => handleResizeDown(e, 'bottom')} style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 4, cursor: 'ns-resize', zIndex: 30, background: `${color}66` }} />
        <div onMouseDown={e => handleResizeDown(e, 'top')}    style={{ position: 'absolute', top: 0,    left: 0, width: '100%', height: 4, cursor: 'ns-resize', zIndex: 30, background: `${color}66` }} />
      </>)}
    </div>
  );
}

// D-Day 입력 칸 (클릭하면 숫자 입력 가능, 편집모드에선 드래그)
function DraggableDday({
  coords, style: overlayStyle, editMode, selectedKey, dday, onDragEnd, onSelect, onUpdateDday,
}: {
  coords: number[]; style: { color: string; fontSize: number };
  editMode: boolean; selectedKey: OverviewCoordKey | null;
  dday: number;
  onDragEnd: (key: OverviewCoordKey, newCoords: number[]) => void;
  onSelect: (key: OverviewCoordKey) => void;
  onUpdateDday: (value: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ mouseX: number; mouseY: number; origLeft: number; origTop: number } | null>(null);
  const isSelected = selectedKey === 'dday';

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!editMode) return;
    e.preventDefault();
    onSelect('dday');
    const parent = (e.currentTarget as HTMLElement).closest('.overlay-container') as HTMLElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    drag.current = { mouseX: e.clientX, mouseY: e.clientY, origLeft: coords[0], origTop: coords[1] };
    const onMove = (mv: MouseEvent) => {
      if (!drag.current || !ref.current) return;
      ref.current.style.left = `${Math.max(0, drag.current.origLeft + ((mv.clientX - drag.current.mouseX) / rect.width) * 100)}%`;
      ref.current.style.top  = `${Math.max(0, drag.current.origTop  + ((mv.clientY - drag.current.mouseY) / rect.height) * 100)}%`;
    };
    const onUp = (mu: MouseEvent) => {
      if (!drag.current) return;
      onDragEnd('dday', [
        Math.max(0, drag.current.origLeft + ((mu.clientX - drag.current.mouseX) / rect.width) * 100),
        Math.max(0, drag.current.origTop  + ((mu.clientY - drag.current.mouseY) / rect.height) * 100),
        coords[2], coords[3],
      ]);
      drag.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [editMode, coords, onDragEnd, onSelect]);

  if (editing && !editMode) {
    return (
      <input autoFocus type="number" min={0} value={draft}
        style={{
          position: 'absolute', left: `${coords[0]}%`, top: `${coords[1]}%`,
          width: `${coords[2]}%`, height: `${coords[3]}%`,
          background: 'rgba(255,255,230,0.92)', border: '2px solid #4a90d9',
          borderRadius: 3, textAlign: 'center',
          fontSize: overlayStyle.fontSize, fontWeight: 700, color: '#333',
          padding: 0, outline: 'none', zIndex: 20,
        }}
        onChange={e => setDraft(e.target.value)}
        onBlur={() => { onUpdateDday(Math.max(0, Number(draft) || 0)); setEditing(false); }}
        onKeyDown={e => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          if (e.key === 'Escape') setEditing(false);
        }}
      />
    );
  }

  return (
    <div ref={ref} style={{
      position: 'absolute', left: `${coords[0]}%`, top: `${coords[1]}%`,
      width: `${coords[2]}%`, height: `${coords[3]}%`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: overlayStyle.fontSize, fontWeight: 700, color: overlayStyle.color,
      cursor: editMode ? 'grab' : 'pointer', zIndex: 10, borderRadius: 3,
      outline: editMode ? (isSelected ? '2px solid #4a90d9' : '2px dashed #4a90d9') : 'none',
      background: editMode ? (isSelected ? 'rgba(74,144,217,0.15)' : 'rgba(74,144,217,0.06)') : 'transparent',
      userSelect: 'none',
    }}
      title={editMode ? '드래그: 이동' : '클릭해서 D-Day 수정'}
      onMouseDown={handleMouseDown}
      onClick={() => { if (!editMode) { setDraft(String(dday)); setEditing(true); } }}
      onMouseEnter={e => { if (!editMode) e.currentTarget.style.background = 'rgba(200,220,255,0.5)'; }}
      onMouseLeave={e => { if (!editMode) e.currentTarget.style.background = 'transparent'; }}
    >
      {dday > 0 ? dday : ''}
    </div>
  );
}

export function OverviewOverlay({ totals, coords: c, styles, dday, getRate, onUpdateCoord, onUpdateStyle, onUpdateDday }: Props) {
  const [editMode, setEditMode] = useState(false);
  const [selectedKey, setSelectedKey] = useState<OverviewCoordKey | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const getStyle = (key: OverviewCoordKey) => ({
    color: styles[key]?.color ?? DEFAULT_COLOR,
    fontSize: styles[key]?.fontSize ?? DEFAULT_FONTSIZE,
  });

  const handleDragEnd = useCallback((key: OverviewCoordKey, newCoords: number[]) => {
    onUpdateCoord(key, newCoords);
  }, [onUpdateCoord]);

  const handleSelect = useCallback((key: OverviewCoordKey) => {
    setSelectedKey(prev => prev === key ? null : key);
  }, []);

  const handleSaveImage = useCallback(async () => {
    if (!containerRef.current) return;
    const canvas = await html2canvas(containerRef.current, { useCORS: true, scale: 2 });
    const link = document.createElement('a');
    link.download = 'flight2026_overview.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, []);

  const evRate  = getRate(totals.evangelism.current,          totals.evangelism.target);
  const effRate = getRate(totals.effectiveEvangelism.current, totals.effectiveEvangelism.target);
  const attRate = getRate(totals.attendance.current,          totals.attendance.target);
  const bapRate = getRate(totals.baptism.current,             totals.baptism.target);

  const validRates = [evRate, effRate, attRate, bapRate].filter((_, i) =>
    [totals.evangelism, totals.effectiveEvangelism, totals.attendance, totals.baptism][i].target > 0
  );
  const overallRate = validRates.length > 0
    ? Math.round(validRates.reduce((a, b) => a + b, 0) / validRates.length)
    : 0;

  const displayItems: { key: OverviewCoordKey; text: string }[] = [
    { key: 'evHyun',   text: totals.evangelism.current > 0          ? String(totals.evangelism.current) : '' },
    { key: 'evMok',    text: totals.evangelism.target > 0           ? String(totals.evangelism.target) : '' },
    { key: 'evBogo',   text: evRate > 0                             ? `${evRate}%` : '' },
    { key: 'effHyun',  text: totals.effectiveEvangelism.current > 0 ? String(totals.effectiveEvangelism.current) : '' },
    { key: 'effMok',   text: totals.effectiveEvangelism.target > 0  ? String(totals.effectiveEvangelism.target) : '' },
    { key: 'effInter', text: effRate > 0                            ? `${effRate}%` : '' },
    { key: 'attHyun',  text: totals.attendance.current > 0          ? String(totals.attendance.current) : '' },
    { key: 'attMok',   text: totals.attendance.target > 0           ? String(totals.attendance.target) : '' },
    { key: 'attEvent', text: attRate > 0                            ? `${attRate}%` : '' },
    { key: 'bapHyun',  text: totals.baptism.current > 0             ? String(totals.baptism.current) : '' },
    { key: 'bapMok',   text: totals.baptism.target > 0              ? String(totals.baptism.target) : '' },
    { key: 'bapReg',   text: bapRate > 0                            ? `${bapRate}%` : '' },
    { key: 'gaugePct', text: overallRate > 0                        ? `${overallRate}%` : '' },
  ];

  const gaugeItems: { key: OverviewCoordKey; rate: number; color: string }[] = [
    { key: 'evGauge',  rate: evRate,      color: '#e84393' },
    { key: 'effGauge', rate: effRate,     color: '#2ecc71' },
    { key: 'attGauge', rate: attRate,     color: '#e67e22' },
    { key: 'bapGauge', rate: bapRate,     color: '#3498db' },
    { key: 'gauge',    rate: overallRate, color: '#9b59b6' },
  ];

  const GAUGE_KEYS = new Set(['evGauge', 'effGauge', 'attGauge', 'bapGauge', 'gauge']);

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      {editMode && (
        <div style={{
          background: 'rgba(74,144,217,0.10)', border: '1px solid #4a90d9',
          borderRadius: 6, padding: '6px 12px', marginBottom: 8,
          fontSize: 13, color: '#4a90d9', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          ✏️ <strong>편집 모드</strong> — 드래그: 이동 / 클릭: 색상·크기 편집 / 게이지 테두리: 크기 조절
        </div>
      )}

      <div ref={containerRef} className="overlay-container" style={{ position: 'relative', width: '100%' }}>
        <img src={OVERVIEW_IMAGE} alt="전체 현황" style={{ width: '100%', height: 'auto', display: 'block' }} draggable={false} />

        {displayItems.map(({ key, text }) => (
          <DraggableDisplay
            key={key} coordKey={key} text={text}
            coords={c[key]} style={getStyle(key)}
            editMode={editMode} selectedKey={selectedKey}
            onDragEnd={handleDragEnd} onSelect={handleSelect}
          />
        ))}

        <DraggableDday
          coords={c.dday} style={getStyle('dday')}
          editMode={editMode} selectedKey={selectedKey}
          dday={dday}
          onDragEnd={handleDragEnd} onSelect={handleSelect}
          onUpdateDday={onUpdateDday}
        />

        {gaugeItems.map(({ key, rate, color }) => (
          <DraggableGauge
            key={key} coordKey={key} rate={rate}
            coords={c[key]} editMode={editMode} selectedKey={selectedKey}
            color={color}
            onDragEnd={handleDragEnd} onSelect={handleSelect}
          />
        ))}

        {editMode && selectedKey && !GAUGE_KEYS.has(selectedKey) && (
          <StylePanel
            coordKey={selectedKey}
            color={getStyle(selectedKey).color}
            fontSize={getStyle(selectedKey).fontSize}
            onChange={style => onUpdateStyle(selectedKey, style)}
            onClose={() => setSelectedKey(null)}
          />
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, padding: '8px 0', justifyContent: 'flex-end' }}>
        <button
          className="ov-btn"
          style={editMode ? { background: '#4a90d9', color: '#fff', border: 'none' } : {}}
          onClick={() => { setEditMode(!editMode); setSelectedKey(null); }}
        >
          {editMode ? '✅ 편집 완료' : '🎯 위치 편집'}
        </button>
        <button className="ov-btn" onClick={handleSaveImage}>
          📸 이미지 저장
        </button>
      </div>
    </div>
  );
}
