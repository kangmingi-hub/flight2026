import { Club, OverlayCoords } from '../types';

const blossomCoords: OverlayCoords = {
  evHyun:  [30.18, 40.76, 6.39, 3.91],
  evMok:   [30.18, 45.57, 6.39, 3.65],
  evBogo:  [24.15, 51.82, 12.43, 3.26],
  effHyun: [82.03, 40.76, 6.61, 3.91],
  effMok:  [82.03, 45.57, 6.61, 3.65],
  effInter:[75.28, 51.82, 13.35, 3.26],
  attHyun: [30.18, 69.66, 6.39, 3.65],
  attMok:  [30.18, 74.22, 6.39, 3.52],
  attEvent:[24.15, 80.08, 12.43, 3.26],
  bapHyun: [82.03, 69.66, 6.61, 3.65],
  bapMok:  [82.03, 74.22, 6.61, 3.52],
  bapReg:  [75.28, 80.08, 13.35, 3.26],
  gauge:   [27.91, 75.39, 31.46, 2.47],
  gaugePct:[58.31, 74.35, 4.5,   3.65],
};
const campusCoords: OverlayCoords = blossomCoords;
const bpmCoords: OverlayCoords = { ...blossomCoords };

function makeClub(id: string, name: string, slogan: string, image: string, coords: OverlayCoords): Club {
  return {
    id, name, slogan, image, coords,
    styles: {},
    stats: {
      evangelism:          { current: 0, target: 0 },
      effectiveEvangelism: { current: 0, target: 0 },
      attendance:          { current: 0, target: 0 },
      baptism:             { current: 0, target: 0 },
    },
    records: [],
  };
}

export const INITIAL_CLUBS: Club[] = [
  makeClub('blossom',   'Blossom',   '캠퍼스에 생명의 꽃을 피우자',       '/images/blossom.png',   blossomCoords),
  makeClub('evergreen', 'Evergreen', '캠퍼스를 푸르게 물들이자',          '/images/evergreen.png', campusCoords),
  makeClub('atoz',      'A to Z',    'From A to Z! 세상을 바꾸는 한 사람', '/images/atoz.png',      campusCoords),
  makeClub('toy',       'TOY',       '캠퍼스를 빛내는 우리의 발걸음',      '/images/toy.png',       campusCoords),
  makeClub('thefirst',  'The First', '캠퍼스를 빛으로 물들이자',           '/images/thefirst.png',  campusCoords),
  makeClub('pearlfect', 'Pearlfect', '진주같은 열매로써 하나님께 봉헌하자', '/images/pearlfect.png', campusCoords),
  makeClub('bpm',       'BPM',       '캠퍼스의 심장을 뛰게 하자',          '/images/bpm.png',       bpmCoords),
  makeClub('psallo',    'Psallo',    '캠퍼스에서 하나님께 찬양을',          '/images/psallo.png',    campusCoords),
  makeClub('yitc',      'YITC',      '캠퍼스 복음 완성을 위하여',           '/images/yitc.png',      campusCoords),
  makeClub('ebs',       'EBS',       '캠퍼스에 영원한 하나님의 말씀을',     '/images/ebs.png',       bpmCoords),
];
