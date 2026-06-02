import { useState } from 'react';
import { Club, StatKey, DailyRecord } from '../types';

interface Props {
  club: Club;
  overallRate: number;
  getRate: (current: number, target: number) => number;
  onUpdateStat: (stat: StatKey, field: 'current' | 'target', value: number) => void;
  onAddRecord: (record: DailyRecord) => void;
}

// Editable number that shows inline on the image
function OverlayNumber({
  value,
  style,
  onChange,
}: {
  value: number;
  style: React.CSSProperties;
  onChange: (v: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  if (editing) {
    return (
      <input
        autoFocus
        type="number"
        min={0}
        value={draft}
        style={{
          ...style,
          position: 'absolute',
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
          cursor: 'text',
        }}
        onChange={e => setDraft(e.target.value)}
        onBlur={() => {
          const v = Math.max(0, Number(draft) || 0);
          onChange(v);
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
      style={{
        ...style,
        position: 'absolute',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 'clamp(9px, 1.4vw, 15px)',
        fontWeight: 700,
        color: '#3a2a0a',
        cursor: 'pointer',
        zIndex: 10,
        borderRadius: 3,
        transition: 'background 0.15s',
      }}
      title="클릭해서 수정"
      onClick={() => { setDraft(String(value)); setEditing(true); }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,200,0.7)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {value || ''}
    </div>
  );
}

export function ClubOverlay({ club, overallRate, getRate, onUpdateStat, onAddRecord }: Props) {
  const [showInput, setShowInput] = useState(false);
  const [showRecords, setShowRecords] = useState(false);
  const c = club.coords;

  // helper: convert [left%, top%, w%, h%] to CSS
  const pos = (coords: number[]): React.CSSProperties => ({
    left: `${coords[0]}%`,
    top: `${coords[1]}%`,
    width: `${coords[2]}%`,
    height: `${coords[3]}%`,
  });

  // Gauge fill width capped at gauge width
  const gaugeWidth = overallRate; // 0-100% of gauge container

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      {/* The image — full width, aspect ratio preserved */}
      <div style={{ position: 'relative', width: '100%' }}>
        <img
          src={club.image}
          alt={club.name}
          style={{ width: '100%', height: 'auto', display: 'block' }}
          draggable={false}
        />

        {/* ── Overlay numbers ── */}

        {/* 단순전도 현황 */}
        <OverlayNumber
          value={club.stats.evangelism.current}
          style={pos(c.evHyun)}
          onChange={v => onUpdateStat('evangelism', 'current', v)}
        />
        {/* 단순전도 목표 */}
        <OverlayNumber
          value={club.stats.evangelism.target}
          style={pos(c.evMok)}
          onChange={v => onUpdateStat('evangelism', 'target', v)}
        />
        {/* 보고 수 (달성률%) */}
        <div style={{ ...pos(c.evBogo), position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'clamp(8px, 1.2vw, 13px)', fontWeight: 700, color: '#3a2a0a', zIndex: 10 }}>
          {getRate(club.stats.evangelism.current, club.stats.evangelism.target) > 0
            ? `${getRate(club.stats.evangelism.current, club.stats.evangelism.target)}%` : ''}
        </div>

        {/* 유효전도 현황 */}
        <OverlayNumber
          value={club.stats.effectiveEvangelism.current}
          style={pos(c.effHyun)}
          onChange={v => onUpdateStat('effectiveEvangelism', 'current', v)}
        />
        {/* 유효전도 목표 */}
        <OverlayNumber
          value={club.stats.effectiveEvangelism.target}
          style={pos(c.effMok)}
          onChange={v => onUpdateStat('effectiveEvangelism', 'target', v)}
        />
        {/* 인터뷰 수 (달성률%) */}
        <div style={{ ...pos(c.effInter), position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'clamp(8px, 1.2vw, 13px)', fontWeight: 700, color: '#3a2a0a', zIndex: 10 }}>
          {getRate(club.stats.effectiveEvangelism.current, club.stats.effectiveEvangelism.target) > 0
            ? `${getRate(club.stats.effectiveEvangelism.current, club.stats.effectiveEvangelism.target)}%` : ''}
        </div>

        {/* 출석 현황 */}
        <OverlayNumber
          value={club.stats.attendance.current}
          style={pos(c.attHyun)}
          onChange={v => onUpdateStat('attendance', 'current', v)}
        />
        {/* 출석 목표 */}
        <OverlayNumber
          value={club.stats.attendance.target}
          style={pos(c.attMok)}
          onChange={v => onUpdateStat('attendance', 'target', v)}
        />
        {/* 행사 참여 수 */}
        <div style={{ ...pos(c.attEvent), position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'clamp(8px, 1.2vw, 13px)', fontWeight: 700, color: '#3a2a0a', zIndex: 10 }}>
          {getRate(club.stats.attendance.current, club.stats.attendance.target) > 0
            ? `${getRate(club.stats.attendance.current, club.stats.attendance.target)}%` : ''}
        </div>

        {/* 침례 현황 */}
        <OverlayNumber
          value={club.stats.baptism.current}
          style={pos(c.bapHyun)}
          onChange={v => onUpdateStat('baptism', 'current', v)}
        />
        {/* 침례 목표 */}
        <OverlayNumber
          value={club.stats.baptism.target}
          style={pos(c.bapMok)}
          onChange={v => onUpdateStat('baptism', 'target', v)}
        />
        {/* 등록 완료 수 */}
        <div style={{ ...pos(c.bapReg), position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'clamp(8px, 1.2vw, 13px)', fontWeight: 700, color: '#3a2a0a', zIndex: 10 }}>
          {getRate(club.stats.baptism.current, club.stats.baptism.target) > 0
            ? `${getRate(club.stats.baptism.current, club.stats.baptism.target)}%` : ''}
        </div>

        {/* ── 게이지바 ── */}
        <div style={{ ...pos(c.gauge), position: 'absolute', overflow: 'hidden', borderRadius: 99, zIndex: 10 }}>
          <div style={{
            height: '100%',
            width: `${gaugeWidth}%`,
            background: 'linear-gradient(90deg, #e84393, #ff6b35)',
            borderRadius: 99,
            transition: 'width 0.8s cubic-bezier(0.34,1.56,0.64,1)',
          }} />
        </div>

        {/* ── % 숫자 ── */}
        <div style={{
          ...pos(c.gaugePct),
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 'clamp(9px, 1.3vw, 14px)',
          fontWeight: 900,
          color: '#c0820a',
          zIndex: 11,
        }}>
          {overallRate}
        </div>
      </div>

      {/* ── 하단 버튼 ── */}
      <div style={{ display: 'flex', gap: 8, padding: '8px 0', justifyContent: 'flex-end' }}>
        <button className="ov-btn" onClick={() => setShowRecords(!showRecords)}>📋 기록</button>
        <button className="ov-btn ov-btn-primary" onClick={() => setShowInput(true)}>✏️ 오늘 수치 입력</button>
      </div>

      {/* ── 기록 테이블 ── */}
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

      {/* ── 일별 입력 모달 ── */}
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
