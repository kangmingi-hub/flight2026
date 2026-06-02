import { useState, useRef, useCallback } from 'react';
import { Club, StatKey, DailyRecord, CoordKey } from '../types';

interface Props {
  club: Club;
  overallRate: number;
  getRate: (current: number, target: number) => number;
  onUpdateStat: (stat: StatKey, field: 'current' | 'target', value: number) => void;
  onUpdateCoord: (key: CoordKey, coords: number[]) => void;
  onAddRecord: (record: DailyRecord) => void;
}

// 드래그 가능한 오버레이 숫자 입력 칸
function DraggableOverlayNumber({
  coordKey,
  value,
  coords,
  editMode,
  onChange,
  onDragEnd,
}: {
  coordKey: CoordKey;
  value: number;
  coords: number[];
  editMode: boolean;
  onChange: (v: number) => void;
  onDragEnd: (key: CoordKey, newCoords: number[]) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const dragStart = useRef<{ mouseX: number; mouseY: number; origLeft: number; origTop: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!editMode) return;
    e.preventDefault();
    const parent = (e.currentTarget as HTMLElement).closest('.overlay-container') as HTMLElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    dragStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      origLeft: coords[0],
      origTop: coords[1],
    };

    const onMouseMove = (mv: MouseEvent) => {
      if (!dragStart.current) return;
      const dx = ((mv.clientX - dragStart.current.mouseX) / rect.width) * 100;
      const dy = ((mv.clientY - dragStart.current.mouseY) / rect.height) * 100;
      const newLeft = Math.max(0, Math.min(95, dragStart.current.origLeft + dx));
      const newTop = Math.max(0, Math.min(95, dragStart.current.origTop + dy));
      if (containerRef.current) {
        containerRef.current.style.left = `${newLeft}%`;
        containerRef.current.style.top = `${newTop}%`;
      }
    };

    const onMouseUp = (mu: MouseEvent) => {
      if (!dragStart.current) return;
      const dx = ((mu.clientX - dragStart.current.mouseX) / rect.width) * 100;
      const dy = ((mu.clientY - dragStart.current.mouseY) / rect.height) * 100;
      const newLeft = Math.max(0, Math.min(95, dragStart.current.origLeft + dx));
      const newTop = Math.max(0, Math.min(95, dragStart.current.origTop + dy));
      onDragEnd(coordKey, [newLeft, newTop, coords[2], coords[3]]);
      dragStart.current = null;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [editMode, coords, coordKey, onDragEnd]);

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${coords[0]}%`,
    top: `${coords[1]}%`,
    width: `${coords[2]}%`,
    height: `${coords[3]}%`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 'clamp(9px, 1.4vw, 15px)',
    fontWeight: 700,
    zIndex: 10,
    borderRadius: 3,
    cursor: editMode ? 'grab' : 'pointer',
    outline: editMode ? '2px dashed #e84393' : 'none',
    background: editMode ? 'rgba(232,67,147,0.08)' : 'transparent',
    userSelect: 'none',
  };

  if (editing && !editMode) {
    return (
      <input
        autoFocus
        type="number"
        min={0}
        value={draft}
        style={{
          position: 'absolute',
          left: `${coords[0]}%`,
          top: `${coords[1]}%`,
          width: `${coords[2]}%`,
          height: `${coords[3]}%`,
          background: 'rgba(255,255,230,0.92)',
          border: '2px solid #c0820a',
          borderRadius: 3,
          textAlign: 'center',
          fontSize: 'clamp(9px, 1.4vw, 15px)',
          fontWeight: 700,
          color: '#333',
          padding: 0,
          outline: 'none',
          zIndex: 20,
        }}
        onChange={e => setDraft(e.target.value)}
        onBlur={() => {
          onChange(Math.max(0, Number(draft) || 0));
          setEditing(false);
        }}
        onKeyDown={e => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          if (e.key === 'Escape') setEditing(false);
        }}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      style={style}
      title={editMode ? '드래그해서 위치 조정' : '클릭해서 수정'}
      onMouseDown={handleMouseDown}
      onClick={() => { if (!editMode) { setDraft(String(value)); setEditing(true); } }}
      onMouseEnter={e => { if (!editMode) e.currentTarget.style.background = 'rgba(255,255,200,0.7)'; }}
      onMouseLeave={e => { if (!editMode) e.currentTarget.style.background = 'transparent'; }}
    >
      {editMode ? (coordKey as string).slice(0, 3) : (value || '')}
    </div>
  );
}

// 드래그 가능한 표시 전용 칸 (달성률%)
function DraggableDisplay({
  coordKey,
  text,
  coords,
  editMode,
  onDragEnd,
}: {
  coordKey: CoordKey;
  text: string;
  coords: number[];
  editMode: boolean;
  onDragEnd: (key: CoordKey, newCoords: number[]) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ mouseX: number; mouseY: number; origLeft: number; origTop: number } | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!editMode) return;
    e.preventDefault();
    const parent = (e.currentTarget as HTMLElement).closest('.overlay-container') as HTMLElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    dragStart.current = { mouseX: e.clientX, mouseY: e.clientY, origLeft: coords[0], origTop: coords[1] };

    const onMouseMove = (mv: MouseEvent) => {
      if (!dragStart.current) return;
      const dx = ((mv.clientX - dragStart.current.mouseX) / rect.width) * 100;
      const dy = ((mv.clientY - dragStart.current.mouseY) / rect.height) * 100;
      if (containerRef.current) {
        containerRef.current.style.left = `${Math.max(0, dragStart.current.origLeft + dx)}%`;
        containerRef.current.style.top = `${Math.max(0, dragStart.current.origTop + dy)}%`;
      }
    };
    const onMouseUp = (mu: MouseEvent) => {
      if (!dragStart.current) return;
      const dx = ((mu.clientX - dragStart.current.mouseX) / rect.width) * 100;
      const dy = ((mu.clientY - dragStart.current.mouseY) / rect.height) * 100;
      const newLeft = Math.max(0, dragStart.current.origLeft + dx);
      const newTop = Math.max(0, dragStart.current.origTop + dy);
      onDragEnd(coordKey, [newLeft, newTop, coords[2], coords[3]]);
      dragStart.current = null;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [editMode, coords, coordKey, onDragEnd]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        left: `${coords[0]}%`,
        top: `${coords[1]}%`,
        width: `${coords[2]}%`,
        height: `${coords[3]}%`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 'clamp(8px, 1.2vw, 13px)',
        fontWeight: 700,
        color: '#3a2a0a',
        zIndex: 10,
        cursor: editMode ? 'grab' : 'default',
        outline: editMode ? '2px dashed #c0820a' : 'none',
        background: editMode ? 'rgba(192,130,10,0.08)' : 'transparent',
        userSelect: 'none',
      }}
      onMouseDown={handleMouseDown}
    >
      {editMode ? (coordKey as string).slice(0, 5) : text}
    </div>
  );
}

export function ClubOverlay({ club, overallRate, getRate, onUpdateStat, onUpdateCoord, onAddRecord }: Props) {
  const [showInput, setShowInput] = useState(false);
  const [showRecords, setShowRecords] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const c = club.coords;

  const handleDragEnd = useCallback((key: CoordKey, newCoords: number[]) => {
    onUpdateCoord(key, newCoords);
  }, [onUpdateCoord]);

  const gaugeWidth = overallRate;

  // 게이지 드래그
  const gaugeRef = useRef<HTMLDivElement>(null);
  const gaugeDragStart = useRef<{ mouseX: number; mouseY: number; origLeft: number; origTop: number } | null>(null);

  const handleGaugeMouseDown = useCallback((e: React.MouseEvent) => {
    if (!editMode) return;
    e.preventDefault();
    const parent = (e.currentTarget as HTMLElement).closest('.overlay-container') as HTMLElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    gaugeDragStart.current = { mouseX: e.clientX, mouseY: e.clientY, origLeft: c.gauge[0], origTop: c.gauge[1] };
    const onMouseMove = (mv: MouseEvent) => {
      if (!gaugeDragStart.current || !gaugeRef.current) return;
      const dx = ((mv.clientX - gaugeDragStart.current.mouseX) / rect.width) * 100;
      const dy = ((mv.clientY - gaugeDragStart.current.mouseY) / rect.height) * 100;
      gaugeRef.current.style.left = `${Math.max(0, gaugeDragStart.current.origLeft + dx)}%`;
      gaugeRef.current.style.top = `${Math.max(0, gaugeDragStart.current.origTop + dy)}%`;
    };
    const onMouseUp = (mu: MouseEvent) => {
      if (!gaugeDragStart.current) return;
      const dx = ((mu.clientX - gaugeDragStart.current.mouseX) / rect.width) * 100;
      const dy = ((mu.clientY - gaugeDragStart.current.mouseY) / rect.height) * 100;
      onUpdateCoord('gauge', [Math.max(0, gaugeDragStart.current.origLeft + dx), Math.max(0, gaugeDragStart.current.origTop + dy), c.gauge[2], c.gauge[3]]);
      gaugeDragStart.current = null;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [editMode, c.gauge, onUpdateCoord]);

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      {/* 편집 모드 배너 */}
      {editMode && (
        <div style={{
          background: 'rgba(232,67,147,0.12)',
          border: '1px solid #e84393',
          borderRadius: 6,
          padding: '6px 12px',
          marginBottom: 8,
          fontSize: 13,
          color: '#e84393',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          ✏️ <strong>편집 모드</strong> — 각 칸을 드래그해서 위치를 맞추세요. 완료 후 "편집 완료"를 누르면 저장됩니다.
        </div>
      )}

      <div className="overlay-container" style={{ position: 'relative', width: '100%' }}>
        <img
          src={club.image}
          alt={club.name}
          style={{ width: '100%', height: 'auto', display: 'block' }}
          draggable={false}
        />

        {/* 단순전도 현황 */}
        <DraggableOverlayNumber coordKey="evHyun" value={club.stats.evangelism.current} coords={c.evHyun} editMode={editMode} onChange={v => onUpdateStat('evangelism', 'current', v)} onDragEnd={handleDragEnd} />
        {/* 단순전도 목표 */}
        <DraggableOverlayNumber coordKey="evMok" value={club.stats.evangelism.target} coords={c.evMok} editMode={editMode} onChange={v => onUpdateStat('evangelism', 'target', v)} onDragEnd={handleDragEnd} />
        {/* 단순전도 달성률 */}
        <DraggableDisplay coordKey="evBogo" text={getRate(club.stats.evangelism.current, club.stats.evangelism.target) > 0 ? `${getRate(club.stats.evangelism.current, club.stats.evangelism.target)}%` : ''} coords={c.evBogo} editMode={editMode} onDragEnd={handleDragEnd} />

        {/* 유효전도 현황 */}
        <DraggableOverlayNumber coordKey="effHyun" value={club.stats.effectiveEvangelism.current} coords={c.effHyun} editMode={editMode} onChange={v => onUpdateStat('effectiveEvangelism', 'current', v)} onDragEnd={handleDragEnd} />
        {/* 유효전도 목표 */}
        <DraggableOverlayNumber coordKey="effMok" value={club.stats.effectiveEvangelism.target} coords={c.effMok} editMode={editMode} onChange={v => onUpdateStat('effectiveEvangelism', 'target', v)} onDragEnd={handleDragEnd} />
        {/* 유효전도 달성률 */}
        <DraggableDisplay coordKey="effInter" text={getRate(club.stats.effectiveEvangelism.current, club.stats.effectiveEvangelism.target) > 0 ? `${getRate(club.stats.effectiveEvangelism.current, club.stats.effectiveEvangelism.target)}%` : ''} coords={c.effInter} editMode={editMode} onDragEnd={handleDragEnd} />

        {/* 출석 현황 */}
        <DraggableOverlayNumber coordKey="attHyun" value={club.stats.attendance.current} coords={c.attHyun} editMode={editMode} onChange={v => onUpdateStat('attendance', 'current', v)} onDragEnd={handleDragEnd} />
        {/* 출석 목표 */}
        <DraggableOverlayNumber coordKey="attMok" value={club.stats.attendance.target} coords={c.attMok} editMode={editMode} onChange={v => onUpdateStat('attendance', 'target', v)} onDragEnd={handleDragEnd} />
        {/* 출석 달성률 */}
        <DraggableDisplay coordKey="attEvent" text={getRate(club.stats.attendance.current, club.stats.attendance.target) > 0 ? `${getRate(club.stats.attendance.current, club.stats.attendance.target)}%` : ''} coords={c.attEvent} editMode={editMode} onDragEnd={handleDragEnd} />

        {/* 침례 현황 */}
        <DraggableOverlayNumber coordKey="bapHyun" value={club.stats.baptism.current} coords={c.bapHyun} editMode={editMode} onChange={v => onUpdateStat('baptism', 'current', v)} onDragEnd={handleDragEnd} />
        {/* 침례 목표 */}
        <DraggableOverlayNumber coordKey="bapMok" value={club.stats.baptism.target} coords={c.bapMok} editMode={editMode} onChange={v => onUpdateStat('baptism', 'target', v)} onDragEnd={handleDragEnd} />
        {/* 침례 달성률 */}
        <DraggableDisplay coordKey="bapReg" text={getRate(club.stats.baptism.current, club.stats.baptism.target) > 0 ? `${getRate(club.stats.baptism.current, club.stats.baptism.target)}%` : ''} coords={c.bapReg} editMode={editMode} onDragEnd={handleDragEnd} />

        {/* 게이지바 */}
        <div
          ref={gaugeRef}
          style={{
            position: 'absolute',
            left: `${c.gauge[0]}%`,
            top: `${c.gauge[1]}%`,
            width: `${c.gauge[2]}%`,
            height: `${c.gauge[3]}%`,
            overflow: 'hidden',
            borderRadius: 99,
            zIndex: 10,
            cursor: editMode ? 'grab' : 'default',
            outline: editMode ? '2px dashed #e84393' : 'none',
          }}
          onMouseDown={handleGaugeMouseDown}
        >
          <div style={{
            height: '100%',
            width: `${gaugeWidth}%`,
            background: 'linear-gradient(90deg, #e84393, #ff6b35)',
            borderRadius: 99,
            transition: 'width 0.8s cubic-bezier(0.34,1.56,0.64,1)',
          }} />
        </div>

        {/* % 숫자 */}
        <DraggableDisplay
          coordKey="gaugePct"
          text={String(overallRate)}
          coords={c.gaugePct}
          editMode={editMode}
          onDragEnd={handleDragEnd}
        />
      </div>

      {/* 하단 버튼 */}
      <div style={{ display: 'flex', gap: 8, padding: '8px 0', justifyContent: 'flex-end' }}>
        <button
          className={`ov-btn ${editMode ? 'ov-btn-primary' : ''}`}
          style={editMode ? { background: '#e84393', color: '#fff', border: 'none' } : {}}
          onClick={() => setEditMode(!editMode)}
        >
          {editMode ? '✅ 편집 완료' : '🎯 위치 편집'}
        </button>
        <button className="ov-btn" onClick={() => setShowRecords(!showRecords)}>📋 기록</button>
        <button className="ov-btn ov-btn-primary" onClick={() => setShowInput(true)}>✏️ 오늘 수치 입력</button>
      </div>

      {/* 기록 테이블 */}
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

      {/* 일별 입력 모달 */}
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
