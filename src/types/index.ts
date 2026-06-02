export interface ClubStats {
  current: number;
  target: number;
}
export interface DailyRecord {
  date: string;
  evangelism: number;
  effectiveEvangelism: number;
  attendance: number;
  baptism: number;
}
export interface OverlayCoords {
  evHyun: number[];
  evMok: number[];
  evBogo: number[];
  evGauge: number[];
  effHyun: number[];
  effMok: number[];
  effInter: number[];
  effGauge: number[];
  attHyun: number[];
  attMok: number[];
  attEvent: number[];
  attGauge: number[];
  bapHyun: number[];
  bapMok: number[];
  bapReg: number[];
  bapGauge: number[];
  gauge: number[];
  gaugePct: number[];
  dday: number[];
}
export interface OverlayStyle {
  color: string;
  fontSize: number;
}
export type OverlayStyles = Partial<Record<keyof OverlayCoords, OverlayStyle>>;
export type OverviewCoords = OverlayCoords;
export type OverviewCoordKey = keyof OverviewCoords;
export interface Club {
  id: string;
  name: string;
  slogan: string;
  image: string;
  coords: OverlayCoords;
  styles: OverlayStyles;
  stats: {
    evangelism: ClubStats;
    effectiveEvangelism: ClubStats;
    attendance: ClubStats;
    baptism: ClubStats;
  };
  records: DailyRecord[];
}
export type StatKey = 'evangelism' | 'effectiveEvangelism' | 'attendance' | 'baptism';
export type CoordKey = keyof OverlayCoords;
