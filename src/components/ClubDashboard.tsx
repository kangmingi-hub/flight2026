import React, { useState } from 'react';
import { Club, StatKey } from '../types';
import { StatCard } from './StatCard';
import { DailyInput } from './DailyInput';

interface ClubDashboardProps {
  club: Club;
  overallRate: number;
  onCurrentChange: (stat: StatKey, value: number) => void;
  onTargetChange: (stat: StatKey, value: number) => void;
  onAddRecord: (record: import('../types').DailyRecord) => void;
  onReset: () => void;
  accentColor: string;
}

const STAT_ICONS: Record<StatKey, string> = {
  evangelism: '🧳',
  effectiveEvangelism: '🚪',
  attendance: '📍',
  baptism: '💧',
};

export const ClubDashboard: React.FC<ClubDashboardProps> = ({
  club,
  overallRate,
  onCurrentChange,
  onTargetChange,
  onAddRecord,
  onReset,
  accentColor,
}) => {
  const [showDailyInput, setShowDailyInput] = useState(false);
  const [showRecords, setShowRecords] = useState(false);

  const statKeys: StatKey[] = ['evangelism', 'effectiveEvangelism', 'attendance', 'baptism'];

  return (
    <div className="club-dashboard">
      {/* Background image overlay */}
      <div
        className="dashboard-bg"
        style={{ backgroundImage: `url(${club.image})` }}
      />
      <div className="dashboard-overlay" />

      <div className="dashboard-content">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1 className="club-title">천국행 FLIGHT 2026</h1>
            <p className="club-slogan">{club.slogan}</p>
          </div>
          <div className="header-actions">
            <button className="btn-action" onClick={() => setShowRecords(!showRecords)}>
              📋 기록 보기
            </button>
            <button className="btn-action btn-primary-action" onClick={() => setShowDailyInput(true)}>
              ✏️ 오늘 수치 입력
            </button>
          </div>
        </div>

        {/* Stat Cards Grid */}
        <div className="stats-grid">
          {statKeys.map(key => (
            <StatCard
              key={key}
              statKey={key}
              current={club.stats[key].current}
              target={club.stats[key].target}
              icon={STAT_ICONS[key]}
              onCurrentChange={v => onCurrentChange(key, v)}
              onTargetChange={v => onTargetChange(key, v)}
              accentColor={accentColor}
            />
          ))}
        </div>

        {/* Overall Progress */}
        <div className="overall-progress">
          <div className="overall-info">
            <span className="overall-label">전체 탑승 완료율</span>
            <span className="overall-rate" style={{ color: accentColor }}>
              {overallRate}%
            </span>
          </div>
          <div className="overall-bar">
            <div
              className="overall-fill"
              style={{ width: `${overallRate}%`, backgroundColor: accentColor }}
            />
            <span className="progress-plane" style={{ left: `${overallRate}%` }}>✈️</span>
          </div>
        </div>

        {/* Records Table */}
        {showRecords && club.records.length > 0 && (
          <div className="records-panel">
            <div className="records-header">
              <h3>일별 기록</h3>
              <button className="btn-danger-sm" onClick={onReset}>초기화</button>
            </div>
            <div className="records-table-wrapper">
              <table className="records-table">
                <thead>
                  <tr>
                    <th>날짜</th>
                    <th>단순전도</th>
                    <th>유효전도</th>
                    <th>출석</th>
                    <th>침례</th>
                  </tr>
                </thead>
                <tbody>
                  {[...club.records].reverse().map(r => (
                    <tr key={r.date}>
                      <td>{r.date}</td>
                      <td>{r.evangelism}</td>
                      <td>{r.effectiveEvangelism}</td>
                      <td>{r.attendance}</td>
                      <td>{r.baptism}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showDailyInput && (
        <DailyInput
          club={club}
          onSave={onAddRecord}
          onClose={() => setShowDailyInput(false)}
        />
      )}
    </div>
  );
};
