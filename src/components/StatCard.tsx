import React from 'react';
import { StatKey } from '../types';
import { STAT_LABELS, STAT_SUBLABELS } from '../data/clubs';

interface StatCardProps {
  statKey: StatKey;
  current: number;
  target: number;
  icon: React.ReactNode;
  onCurrentChange: (value: number) => void;
  onTargetChange: (value: number) => void;
  accentColor: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  statKey,
  current,
  target,
  icon,
  onCurrentChange,
  onTargetChange,
  accentColor,
}) => {
  const rate = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;

  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <span className="stat-icon">{icon}</span>
        <div>
          <p className="stat-label">{STAT_LABELS[statKey]}</p>
          <p className="stat-sublabel">{STAT_SUBLABELS[statKey]}</p>
        </div>
        <span
          className="stat-rate-badge"
          style={{ backgroundColor: `${accentColor}22`, color: accentColor }}
        >
          {rate}%
        </span>
      </div>

      <div className="stat-inputs">
        <label className="input-group">
          <span>현황</span>
          <input
            type="number"
            min={0}
            value={current}
            onChange={e => onCurrentChange(Number(e.target.value))}
          />
        </label>
        <label className="input-group">
          <span>목표</span>
          <input
            type="number"
            min={0}
            value={target}
            onChange={e => onTargetChange(Number(e.target.value))}
          />
        </label>
      </div>

      <div className="stat-progress-bar">
        <div
          className="stat-progress-fill"
          style={{ width: `${rate}%`, backgroundColor: accentColor }}
        />
      </div>
    </div>
  );
};
