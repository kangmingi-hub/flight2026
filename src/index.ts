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

export interface Club {
  id: string;
  name: string;
  slogan: string;
  image: string;
  targets: {
    evangelism: number;
    effectiveEvangelism: number;
    attendance: number;
    baptism: number;
  };
  stats: {
    evangelism: ClubStats;
    effectiveEvangelism: ClubStats;
    attendance: ClubStats;
    baptism: ClubStats;
  };
  records: DailyRecord[];
}

export type StatKey = 'evangelism' | 'effectiveEvangelism' | 'attendance' | 'baptism';
