# 천국행 FLIGHT 2026 탑승현황

대학 동아리별 전도/출석/침례 목표 달성률 관리 대시보드

## 기능

- 10개 동아리 탭 전환 (Blossom, Evergreen, A to Z, TOY, The First, Pearlfect, BPM, Psallo, YITC, EBS)
- 각 동아리별 4개 항목 목표 설정: 단순전도, 유효전도, 출석, 침례
- 일별 수치 입력 → 누적 자동 계산
- 전체 탑승 완료율 게이지 표시
- 동아리 배경 이미지 표시
- 데이터 localStorage 자동 저장

## 이미지 파일 추가

`public/images/` 폴더에 각 동아리 이미지를 아래 이름으로 저장하세요:

```
public/images/blossom.png
public/images/evergreen.png
public/images/atoz.png
public/images/toy.png
public/images/thefirst.png
public/images/pearlfect.png
public/images/bpm.png
public/images/psallo.png
public/images/yitc.png
public/images/ebs.png
```

## 로컬 실행

```bash
npm install
npm run dev
```

## Cloudflare Pages 배포

1. GitHub에 레포지토리 생성 후 이 코드 업로드
2. Cloudflare Pages → "Create a project" → GitHub 레포 연결
3. 빌드 설정:
   - **Framework preset**: Vite
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. "Save and Deploy" 클릭

이후 `main` 브랜치에 push할 때마다 자동 배포됩니다.
