import { useState } from 'react';
import { useClubs } from './hooks/useClubs';
import { ClubOverlay } from './components/ClubOverlay';
import { OverviewOverlay } from './components/OverviewOverlay';
import { StatKey, CoordKey, OverviewCoordKey } from './types';

const CLUB_COLORS: Record<string, string> = {
  blossom: '#e84393', evergreen: '#2ecc71', atoz: '#c0820a', toy: '#e74c3c',
  thefirst: '#f1c40f', pearlfect: '#9b59b6', bpm: '#e74c3c',
  psallo: '#d4a017', yitc: '#e67e22', ebs: '#3498db',
};

export default function App() {
  const {
    clubs, updateStat, updateCoord, updateStyle,
    overviewCoords, overviewStyles, updateOverviewCoord, updateOverviewStyle,
    addDailyRecord, getOverallRate, getRate, getTotals,
  } = useClubs();
  const [activeTab, setActiveTab] = useState('overview');
  const activeClub = clubs.find(c => c.id === activeTab);

  return (
    <div className="app">
      <nav className="tab-bar">
        <div className="tab-title">✈️ 천국행 FLIGHT 2026</div>
        <div className="tab-list">
          {/* 전체 현황 탭 */}
          <button
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            style={activeTab === 'overview' ? { borderBottomColor: '#4a90d9', color: '#4a90d9' } : {}}
            onClick={() => setActiveTab('overview')}
          >
            🌐 전체 현황
          </button>
          {/* 동아리 탭들 */}
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
        {activeTab === 'overview' ? (
          <OverviewOverlay
            totals={getTotals()}
            coords={overviewCoords}
            styles={overviewStyles}
            getRate={getRate}
            onUpdateCoord={(key: OverviewCoordKey, coords: number[]) => updateOverviewCoord(key, coords)}
            onUpdateStyle={(key: OverviewCoordKey, style: Partial<{ color: string; fontSize: number }>) => updateOverviewStyle(key, style)}
          />
        ) : activeClub ? (
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
            onUpdateStyle={(key: CoordKey, style: Partial<{ color: string; fontSize: number }>) =>
              updateStyle(activeClub.id, key, style)
            }
            onAddRecord={record => addDailyRecord(activeClub.id, record)}
          />
        ) : null}
      </main>
    </div>
  );
}
