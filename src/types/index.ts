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
  effHyun: number[];
  effMok: number[];
  effInter: number[];
  attHyun: number[];
  attMok: number[];
  attEvent: number[];
  bapHyun: number[];
  bapMok: number[];
  bapReg: number[];
  gauge: number[];
  gaugePct: number[];
}

// 각 칸의 스타일 (색상, 크기)
export interface OverlayStyle {
  color: string;
  fontSize: number; // px 단위
}
export type OverlayStyles = Partial<Record<keyof OverlayCoords, OverlayStyle>>;

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
