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
  // Each: [left%, top%, width%, height%]
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
  gauge: number[];      // [left%, top%, width%, height%]
  gaugePct: number[];   // [left%, top%, width%, height%]
}

export interface Club {
  id: string;
  name: string;
  slogan: string;
  image: string;
  coords: OverlayCoords;
  stats: {
    evangelism: ClubStats;
    effectiveEvangelism: ClubStats;
    attendance: ClubStats;
    baptism: ClubStats;
  };
  records: DailyRecord[];
}

export type StatKey = 'evangelism' | 'effectiveEvangelism' | 'attendance' | 'baptism';
