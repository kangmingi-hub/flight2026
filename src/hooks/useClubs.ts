import { useState, useEffect, useCallback } from 'react';
import { Club, StatKey, DailyRecord, OverlayCoords, OverlayStyles, CoordKey } from '../types';
import { INITIAL_CLUBS } from '../data/clubs';

const STORAGE_KEY = 'flight2026_v2';
const COORDS_KEY = 'flight2026_coords';
const STYLES_KEY = 'flight2026_styles';

function loadClubs(): Club[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const rawCoords = localStorage.getItem(COORDS_KEY);
    const rawStyles = localStorage.getItem(STYLES_KEY);
    const savedCoords: Record<string, OverlayCoords> = rawCoords ? JSON.parse(rawCoords) : {};
    const savedStyles: Record<string, OverlayStyles> = rawStyles ? JSON.parse(rawStyles) : {};

    if (!raw) {
      return INITIAL_CLUBS.map(club => ({
        ...club,
        coords: savedCoords[club.id] ?? club.coords,
        styles: savedStyles[club.id] ?? club.styles,
      }));
    }
    const saved = JSON.parse(raw) as Club[];
    return INITIAL_CLUBS.map(init => {
      const found = saved.find(s => s.id === init.id);
      return found
        ? { ...init, stats: found.stats, records: found.records, coords: savedCoords[init.id] ?? init.coords, styles: savedStyles[init.id] ?? init.styles }
        : { ...init, coords: savedCoords[init.id] ?? init.coords, styles: savedStyles[init.id] ?? init.styles };
    });
  } catch {
    return INITIAL_CLUBS;
  }
}

export function useClubs() {
  const [clubs, setClubs] = useState<Club[]>(loadClubs);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clubs));
  }, [clubs]);

  const updateCoord = useCallback((clubId: string, key: CoordKey, coords: number[]) => {
    setClubs(prev => {
      const next = prev.map(club =>
        club.id === clubId
          ? { ...club, coords: { ...club.coords, [key]: coords } }
          : club
      );
      const coordMap: Record<string, OverlayCoords> = {};
      next.forEach(c => { coordMap[c.id] = c.coords; });
      localStorage.setItem(COORDS_KEY, JSON.stringify(coordMap));
      return next;
    });
  }, []);

  const updateStyle = useCallback((clubId: string, key: CoordKey, style: Partial<{ color: string; fontSize: number }>) => {
    setClubs(prev => {
      const next = prev.map(club => {
        if (club.id !== clubId) return club;
        const prevStyle = club.styles[key] ?? { color: '#3a2a0a', fontSize: 13 };
        return { ...club, styles: { ...club.styles, [key]: { ...prevStyle, ...style } } };
      });
      const styleMap: Record<string, OverlayStyles> = {};
      next.forEach(c => { styleMap[c.id] = c.styles; });
      localStorage.setItem(STYLES_KEY, JSON.stringify(styleMap));
      return next;
    });
  }, []);

  const updateStat = useCallback((clubId: string, stat: StatKey, field: 'current' | 'target', value: number) => {
    setClubs(prev =>
      prev.map(club =>
        club.id === clubId
          ? { ...club, stats: { ...club.stats, [stat]: { ...club.stats[stat], [field]: value } } }
          : club
      )
    );
  }, []);

  const addDailyRecord = useCallback((clubId: string, record: DailyRecord) => {
    setClubs(prev =>
      prev.map(club => {
        if (club.id !== clubId) return club;
        const existingIdx = club.records.findIndex(r => r.date === record.date);
        const newRecords = existingIdx >= 0
          ? club.records.map((r, i) => i === existingIdx ? record : r)
          : [...club.records, record].sort((a, b) => a.date.localeCompare(b.date));
        const totals = newRecords.reduce(
          (acc, r) => ({
            evangelism: acc.evangelism + r.evangelism,
            effectiveEvangelism: acc.effectiveEvangelism + r.effectiveEvangelism,
            attendance: acc.attendance + r.attendance,
            baptism: acc.baptism + r.baptism,
          }),
          { evangelism: 0, effectiveEvangelism: 0, attendance: 0, baptism: 0 }
        );
        return {
          ...club,
          records: newRecords,
          stats: {
            evangelism:          { current: totals.evangelism,          target: club.stats.evangelism.target },
            effectiveEvangelism: { current: totals.effectiveEvangelism, target: club.stats.effectiveEvangelism.target },
            attendance:          { current: totals.attendance,          target: club.stats.attendance.target },
            baptism:             { current: totals.baptism,             target: club.stats.baptism.target },
          },
        };
      })
    );
  }, []);

  const getOverallRate = useCallback((club: Club): number => {
    const stats = Object.values(club.stats);
    const valid = stats.filter(s => s.target > 0);
    if (valid.length === 0) return 0;
    const rates = valid.map(s => Math.min((s.current / s.target) * 100, 100));
    return Math.round(rates.reduce((a, b) => a + b, 0) / rates.length);
  }, []);

  const getRate = useCallback((current: number, target: number): number => {
    if (target === 0) return 0;
    return Math.min(Math.round((current / target) * 100), 100);
  }, []);

  return { clubs, updateStat, updateCoord, updateStyle, addDailyRecord, getOverallRate, getRate };
}
