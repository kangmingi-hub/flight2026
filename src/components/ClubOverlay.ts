import { useState, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
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

function StylePanel({
  coordKey, color, fontSize, onChange, onClose,
}: {
  coordKey: CoordKey; color: string; fontSize: number;
  onChange: (s: Partial<{ color: string; fontSize: number }>) => void;
  onClose: () => void;
}) {
  const LABEL: Record<CoordKey, string> = {
    evHyun: '단순전도 현황', evMok: '단순전도 목표', evBogo: '단순전도 달성률', evGauge: '단순전도 게이지',
    effHyun: '유효전도 현황', effMok: '유효전도 목표', effInter: '유효전도 달성률', effGauge: '유효전도 게이지',
    attHyun: '출석 현황', attMok: '출석 목표', attEvent: '출석 달성률', attGauge: '출석 게이지',
    bapHyun: '침례 현황', bapMok: '침례 목표', bapReg: '침례 달성률', bapGauge: '침례 게이지',
    gauge: '전체 게이지', gaugePct: '전체 달성률', dday: 'D-Day',
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
      ref.current.style.left = `${Math.max(0, Math.min(95, drag.current.origLeft + ((mv.clientX - drag.current.mouseX) / rect.width) * 100))}%`;
      ref.current.style.top  = `${Math.max(0, Math.min(95, drag.current.origTop  + ((mv.clientY - drag.current.mouseY) / rect.height) * 100))}%`;
    };
    const onUp = (mu: MouseEvent) => {
      if (!drag.current) return;
      onDragEnd(coordKey, [
        Math.max(0, Math.min(95, drag.current.origLeft + ((mu.clientX - drag.current.mouseX) / rect.width) * 100)),
        Math.max(0, Math.min(95, drag.current.origTop  + ((mu.clientY - drag.current.mouseY) / rect.height) * 100)),
        coords[2], coords[3],
      ]);
      drag.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
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
    <div ref={ref} style={{
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
  coordKey, text, coords, style: overlayStyle, editMode, selectedKey, onDragEnd, onSelect,
}: {
  coordKey: CoordKey; text: string; coords: number[];
  style: { color: string; fontSize: number };
  editMode: boolean; selectedKey: CoordKey | null;
  onDragEnd: (key: CoordKey, newCoords: number[]) => void;
  onSelect: (key: CoordKey) => void;
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
      outline: editMode ? (isSelected ? '2px solid #c0820a' : '2px dashed #c0820a') : 'none',
      background: editMode ? (isSelected ? 'rgba(192,130,10,0.15)' : 'rgba(192,130,10,0.06)') : 'transparent',
      userSelect: 'none',
    }} onMouseDown={handleMouseDown}>
      {text}
    </div>
  );
}

function DraggableGauge({
  coordKey, rate, coords, editMode, selectedKey, color, onDragEnd, onSelect,
}: {
  coordKey: CoordKey; rate: number; coords: number[];
  editMode: boolean; selectedKey: CoordKey | null;
  color: string;
  onDragEnd: (key: CoordKey, newCoords: number[]) => void;
  onSelect: (key: CoordKey) => void;
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

export function ClubOverlay({ club, overallRate, getRate, onUpdateStat, onUpdateCoord, onUpdateStyle, onAddRecord }: Props) {
  const [showInput, setShowInput] = useState(false);
  const [showRecords, setShowRecords] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedKey, setSelectedKey] = useState<CoordKey | null>(null);
  const c = club.coords;

const containerRef = useRef<HTMLDivElement>(null);

const handleSaveImage = useCallback(async () => {
  if (!containerRef.current) return;
  const canvas = await html2canvas(containerRef.current, { useCORS: true, scale: 2 });
  const link = document.createElement('a');
  link.download = `flight2026_${club.id}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}, [club.id]);
  
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

  const gaugeFields: { key: CoordKey; rate: number; color: string }[] = [
    { key: 'evGauge',  rate: getRate(club.stats.evangelism.current, club.stats.evangelism.target),                   color: '#e84393' },
    { key: 'effGauge', rate: getRate(club.stats.effectiveEvangelism.current, club.stats.effectiveEvangelism.target), color: '#2ecc71' },
    { key: 'attGauge', rate: getRate(club.stats.attendance.current, club.stats.attendance.target),                   color: '#e67e22' },
    { key: 'bapGauge', rate: getRate(club.stats.baptism.current, club.stats.baptism.target),                         color: '#3498db' },
    { key: 'gauge',    rate: overallRate,                                                                             color: '#9b59b6' },
  ];

  const GAUGE_KEYS = new Set(['evGauge','effGauge','attGauge','bapGauge','gauge']);

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

      <div ref={containerRef} className="overlay-container" style={{ position: 'relative', width: '100%' }}>
        <img src={club.image} alt={club.name} style={{ width: '100%', height: 'auto', display: 'block' }} draggable={false} />

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

        {displayFields.map(({ key, text }) => (
          <DraggableDisplay
            key={key} coordKey={key} text={text}
            coords={c[key]} style={getStyle(key)}
            editMode={editMode} selectedKey={selectedKey}
            onDragEnd={handleDragEnd} onSelect={handleSelect}
          />
        ))}

        {gaugeFields.map(({ key, rate, color }) => (
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
          style={editMode ? { background: '#e84393', color: '#fff', border: 'none' } : {}}
          onClick={() => { setEditMode(!editMode); setSelectedKey(null); }}
        >
          {editMode ? '✅ 편집 완료' : '🎯 위치 편집'}
        </button>
        <button className="ov-btn" onClick={handleSaveImage}>📸 이미지 저장</button>
        <button className="ov-btn" onClick={() => setShowRecords(!showRecords)}>📋 기록</button>
        <button className="ov-btn ov-btn-primary" onClick={() => setShowInput(true)}>✏️ 오늘 수치 입력</button>
      </div>

      {showRecords && club.records.length > 0 && (
        <div className="records-panel">
          <table className="records-table">
            <thead>
              <tr><th>날짜</th><th>단순전도</th><th>유효전도</th><th>출석</th><th>침례</th></tr>
            </thead>
            <tbody>
              {[...club.records].reverse().map(r => (
                <tr key={r.date}>
                  <td>{r.date}</td><td>{r.evangelism}</td>
                  <td>{r.effectiveEvangelism}</td><td>{r.attendance}</td><td>{r.baptism}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showInput && (
        <DailyModal club={club} onSave={r => { onAddRecord(r); setShowInput(false); }} onClose={() => setShowInput(false)} />
      )}
    </div>
  );
}

function DailyModal({ club, onSave, onClose }: { club: Club; onSave: (r: DailyRecord) => void; onClose: () => void }) {
  const today = new Date().toISOString().split('T')[0];
  const existing = club.records.find(r => r.date === today);
  const [form, setForm] = useState<DailyRecord>({
    date: today,
    evangelism: existing?.evangelism ?? 0,
    effectiveEvangelism: existing?.effectiveEvangelism ?? 0,
    attendance: existing?.attendance ?? 0,
    baptism: existing?.baptism ?? 0,
  });
  const fields: { key: keyof Omit<DailyRecord, 'date'>; label: string }[] = [
    { key: 'evangelism', label: '단순전도' },
    { key: 'effectiveEvangelism', label: '유효전도' },
    { key: 'attendance', label: '출석' },
    { key: 'baptism', label: '침례' },
  ];
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>일일 수치 입력</h2>
          <p className="modal-subtitle">{club.name}</p>
        </div>
        <div className="modal-body">
          <label className="date-input-group">
            <span>날짜</span>
            <input type="date" value={form.date}
              onChange={e => {
                const d = e.target.value;
                const found = club.records.find(r => r.date === d);
                setForm(found ? { ...found } : { date: d, evangelism: 0, effectiveEvangelism: 0, attendance: 0, baptism: 0 });
              }} />
          </label>
          {fields.map(f => (
            <div key={f.key} className="daily-field">
              <span>{f.label}</span>
              <input type="number" min={0} value={form[f.key]}
                onChange={e => setForm(prev => ({ ...prev, [f.key]: Number(e.target.value) }))} />
            </div>
          ))}
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>취소</button>
          <button className="btn-primary" onClick={() => onSave(form)}>저장</button>
        </div>
      </div>
    </div>
  );
}
