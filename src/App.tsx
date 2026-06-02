import { useState } from 'react';
import { useClubs } from './hooks/useClubs';
import { ClubOverlay } from './components/ClubOverlay';
import { StatKey, CoordKey } from './types';

const CLUB_COLORS: Record<string, string> = {
  blossom: '#e84393', evergreen: '#2ecc71', atoz: '#c0820a', toy: '#e74c3c',
  thefirst: '#f1c40f', pearlfect: '#9b59b6', bpm: '#e74c3c',
  psallo: '#d4a017', yitc: '#e67e22', ebs: '#3498db',
};

export default function App() {
  const { clubs, updateStat, updateCoord, addDailyRecord, getOverallRate, getRate } = useClubs();
  const [activeTab, setActiveTab] = useState(clubs[0]?.id ?? '');
  const activeClub = clubs.find(c => c.id === activeTab);

  return (
    <div className="app">
      <nav className="tab-bar">
        <div className="tab-title">✈️ 천국행 FLIGHT 2026</div>
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
                  <span className="tab-badge" style={{ background: `${color}22`, color }}>
                    {rate}%
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
      <main className="main-content">
        {activeClub && (
          <ClubOverlay
            key={activeClub.id}
            club={activeClub}
            overallRate={getOverallRate(activeClub)}
            getRate={getRate}
            onUpdateStat={(stat: StatKey, field: 'current' | 'target', value: number) =>
              updateStat(activeClub.id, stat, field, value)
            }
            onUpdateCoord={(key: CoordKey, coords: number[]) =>
              updateCoord(activeClub.id, key, coords)
            }
            onAddRecord={record => addDailyRecord(activeClub.id, record)}
          />
        )}
      </main>
    </div>
  );
}
