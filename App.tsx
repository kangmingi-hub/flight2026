import { useState } from 'react';
import { useClubs } from './hooks/useClubs';
import { ClubDashboard } from './components/ClubDashboard';
import { StatKey } from './types';

const CLUB_COLORS: Record<string, string> = {
  blossom: '#e84393',
  evergreen: '#2ecc71',
  atoz: '#c0820a',
  toy: '#e74c3c',
  thefirst: '#f1c40f',
  pearlfect: '#9b59b6',
  bpm: '#e74c3c',
  psallo: '#d4a017',
  yitc: '#e67e22',
  ebs: '#3498db',
};

export default function App() {
  const { clubs, updateTarget, updateCurrent, addDailyRecord, resetClub, getOverallRate } = useClubs();
  const [activeTab, setActiveTab] = useState(clubs[0]?.id ?? '');

  const activeClub = clubs.find(c => c.id === activeTab);

  return (
    <div className="app">
      {/* Tab Bar */}
      <nav className="tab-bar">
        <div className="tab-title">
          <span className="tab-title-icon">✈️</span>
          <span>천국행 FLIGHT 2026</span>
        </div>
        <div className="tab-list">
          {clubs.map(club => {
            const rate = getOverallRate(club);
            const color = CLUB_COLORS[club.id] ?? '#888';
            return (
              <button
                key={club.id}
                className={`tab-btn ${activeTab === club.id ? 'active' : ''}`}
                style={activeTab === club.id ? { borderBottomColor: color, color } : {}}
                onClick={() => setActiveTab(club.id)}
              >
                {club.name}
                {rate > 0 && (
                  <span className="tab-badge" style={{ backgroundColor: `${color}22`, color }}>
                    {rate}%
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Dashboard */}
      {activeClub && (
        <ClubDashboard
          key={activeClub.id}
          club={activeClub}
          overallRate={getOverallRate(activeClub)}
          onCurrentChange={(stat: StatKey, value: number) =>
            updateCurrent(activeClub.id, stat, value)
          }
          onTargetChange={(stat: StatKey, value: number) =>
            updateTarget(activeClub.id, stat, value)
          }
          onAddRecord={record => addDailyRecord(activeClub.id, record)}
          onReset={() => resetClub(activeClub.id)}
          accentColor={CLUB_COLORS[activeClub.id] ?? '#888'}
        />
      )}
    </div>
  );
}
