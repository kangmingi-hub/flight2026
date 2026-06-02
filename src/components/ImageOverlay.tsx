import React, { useState } from 'react';
import { Club, StatKey, DailyRecord } from '../types';
import { DailyInput } from './DailyInput';


// Layout variants - images have slightly different board positions
type LayoutType = 'standard' | 'bpm_ebs' | 'psallo_yitc';

interface Layout {
  // [stat]: { current: {l,t,w,h}, target: {l,t,w,h} }
  evangelism: { current: Box; target: Box };
  effectiveEvangelism: { current: Box; target: Box };
  attendance: { current: Box; target: Box };
  baptism: { current: Box; target: Box };
  gauge: Box;
}

interface Box { l: number; t: number; w: number; h: number }

// Coordinates tuned per layout (% of image dimensions)
const LAYOUTS: Record<LayoutType, Layout> = {
  // Blossom, Evergreen, A to Z, TOY, The First style
  standard: {
    evangelism: {
      current: { l: 23.5, t: 42.5, w: 6, h: 5.5 },
      target:  { l: 23.5, t: 50.5, w: 6, h: 5.5 },
    },
    effectiveEvangelism: {
      current: { l: 72.5, t: 42.5, w: 6, h: 5.5 },
      target:  { l: 72.5, t: 50.5, w: 6, h: 5.5 },
    },
    attendance: {
      current: { l: 23.5, t: 68.5, w: 6, h: 5.5 },
      target:  { l: 23.5, t: 76.5, w: 6, h: 5.5 },
    },
    baptism: {
      current: { l: 72.5, t: 68.5, w: 6, h: 5.5 },
      target:  { l: 72.5, t: 76.5, w: 6, h: 5.5 },
    },
    gauge: { l: 36, t: 77.5, w: 28, h: 4 },
  },
  // BPM, EBS style (slightly different positions)
  bpm_ebs: {
    evangelism: {
      current: { l: 22, t: 38, w: 7, h: 5.5 },
      target:  { l: 22, t: 46, w: 7, h: 5.5 },
    },
    effectiveEvangelism: {
      current: { l: 71, t: 38, w: 7, h: 5.5 },
      target:  { l: 71, t: 46, w: 7, h: 5.5 },
    },
    attendance: {
      current: { l: 22, t: 65, w: 7, h: 5.5 },
      target:  { l: 22, t: 73, w: 7, h: 5.5 },
    },
    baptism: {
      current: { l: 71, t: 65, w: 7, h: 5.5 },
      target:  { l: 71, t: 73, w: 7, h: 5.5 },
    },
    gauge: { l: 35, t: 74, w: 30, h: 4 },
  },
  // Psallo, YITC style
  psallo_yitc: {
    evangelism: {
      current: { l: 20, t: 42, w: 7, h: 5.5 },
      target:  { l: 20, t: 50, w: 7, h: 5.5 },
    },
    effectiveEvangelism: {
      current: { l: 70, t: 42, w: 7, h: 5.5 },
      target:  { l: 70, t: 50, w: 7, h: 5.5 },
    },
    attendance: {
      current: { l: 20, t: 66, w: 7, h: 5.5 },
      target:  { l: 20, t: 74, w: 7, h: 5.5 },
    },
    baptism: {
      current: { l: 70, t: 66, w: 7, h: 5.5 },
      target:  { l: 70, t: 74, w: 7, h: 5.5 },
    },
    gauge: { l: 33, t: 75, w: 30, h: 4 },
  },
};

const CLUB_LAYOUT: Record<string, LayoutType> = {
  blossom: 'standard',
  evergreen: 'standard',
  atoz: 'standard',
  toy: 'standard',
  thefirst: 'standard',
  pearlfect: 'standard',
  bpm: 'bpm_ebs',
  psallo: 'psallo_yitc',
  yitc: 'psallo_yitc',
  ebs: 'bpm_ebs',
};

interface Props {
  club: Club;
  onCurrentChange: (stat: StatKey, value: number) => void;
  onTargetChange: (stat: StatKey, value: number) => void;
  onAddRecord: (record: DailyRecord) => void;
  overallRate: number;
  accentColor: string;
}

const STAT_KEYS: StatKey[] = ['evangelism', 'effectiveEvangelism', 'attendance', 'baptism'];

export const ImageOverlay: React.FC<Props> = ({
  club,
  onCurrentChange,
  onTargetChange,
  onAddRecord,
  overallRate,
  accentColor,
}) => {
  const [showDaily, setShowDaily] = useState(false);
  const [editing, setEditing] = useState<{ stat: StatKey; type: 'current' | 'target' } | null>(null);
  const [tempVal, setTempVal] = useState('');

  const layout = LAYOUTS[CLUB_LAYOUT[club.id] ?? 'standard'];


  const startEdit = (stat: StatKey, type: 'current' | 'target', current: number) => {
    setEditing({ stat, type });
    setTempVal(String(current));
  };

  const commitEdit = () => {
    if (!editing) return;
    const val = Number(tempVal);
    if (!isNaN(val)) {
      if (editing.type === 'current') onCurrentChange(editing.stat, val);
      else onTargetChange(editing.stat, val);
    }
    setEditing(null);
  };

  const renderBox = (stat: StatKey, type: 'current' | 'target', box: Box) => {
    const val = type === 'current' ? club.stats[stat].current : club.stats[stat].target;
    const isEditing = editing?.stat === stat && editing?.type === type;

    return (
      <div
        key={`${stat}-${type}`}
        style={{
          position: 'absolute',
          left: `${box.l}%`,
          top: `${box.t}%`,
          width: `${box.w}%`,
          height: `${box.h}%`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
        onClick={() => !isEditing && startEdit(stat, type, val)}
      >
        {isEditing ? (
          <input
            autoFocus
            type="number"
            value={tempVal}
            onChange={e => setTempVal(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={e => e.key === 'Enter' && commitEdit()}
            style={{
              width: '100%',
              height: '100%',
              background: 'rgba(255,255,220,0.95)',
              border: `2px solid ${accentColor}`,
              borderRadius: 4,
              textAlign: 'center',
              fontWeight: 700,
              fontSize: 'clamp(10px, 1.4vw, 16px)',
              color: '#333',
              outline: 'none',
              padding: 0,
            }}
          />
        ) : (
          <span
            style={{
              background: 'rgba(255,255,220,0.85)',
              borderRadius: 3,
              padding: '1px 4px',
              fontWeight: 700,
              fontSize: 'clamp(10px, 1.3vw, 15px)',
              color: '#333',
              minWidth: '80%',
              textAlign: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              border: '1px solid rgba(0,0,0,0.1)',
              transition: 'background 0.15s',
            }}
          >
            {val}
          </span>
        )}
      </div>
    );
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* The image */}
      <img
        src={club.image}
        alt={club.name}
        style={{ width: '100%', display: 'block', userSelect: 'none' }}
        draggable={false}
      />

      {/* Overlay container - positioned absolutely over image */}
      <div style={{ position: 'absolute', inset: 0 }}>

        {/* Stat input boxes */}
        {STAT_KEYS.map(stat => (
          <React.Fragment key={stat}>
            {renderBox(stat, 'current', layout[stat].current)}
            {renderBox(stat, 'target', layout[stat].target)}
          </React.Fragment>
        ))}

        {/* Gauge bar */}
        <div
          style={{
            position: 'absolute',
            left: `${layout.gauge.l}%`,
            top: `${layout.gauge.t}%`,
            width: `${layout.gauge.w}%`,
            height: `${layout.gauge.h}%`,
            borderRadius: 999,
            overflow: 'hidden',
            background: 'rgba(0,0,0,0.15)',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${overallRate}%`,
              background: accentColor,
              borderRadius: 999,
              transition: 'width 0.6s cubic-bezier(0.34,1.56,0.64,1)',
            }}
          />
        </div>

        {/* Overall % text - right of gauge */}
        <div
          style={{
            position: 'absolute',
            left: `${layout.gauge.l + layout.gauge.w + 1}%`,
            top: `${layout.gauge.t - 1}%`,
            fontSize: 'clamp(9px, 1.2vw, 14px)',
            fontWeight: 700,
            color: accentColor,
            textShadow: '0 1px 3px rgba(0,0,0,0.5)',
          }}
        >
          {overallRate}%
        </div>

        {/* Daily input button - top right corner */}
        <button
          onClick={() => setShowDaily(true)}
          style={{
            position: 'absolute',
            top: '2%',
            right: '2%',
            background: accentColor,
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '4px 10px',
            fontSize: 'clamp(10px, 1.1vw, 13px)',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            fontFamily: 'Noto Sans KR, sans-serif',
          }}
        >
          ✏️ 오늘 입력
        </button>
      </div>

      {showDaily && (
        <DailyInput
          club={club}
          onSave={onAddRecord}
          onClose={() => setShowDaily(false)}
        />
      )}
    </div>
  );
};
