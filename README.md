# シティタワーズ東京ベイ シャトルバス

シティタワーズ東京ベイと豊洲駅を結ぶシャトルバスの時刻表アプリです。

## 技術スタック

- Vite 5 + TypeScript
- React 18
- shadcn/ui compatible components
- Tailwind CSS
- date-fns

## 開発

```bash
npm install
npm run dev
```

## データ

時刻表と運休日は `src/data/timetable.json` で管理します。

- `routes`: 方向別の発車時刻
- `notices`: 画面に表示する運行案内
- `calendar.suspendedWeekdays`: 運休する曜日。`0` が日曜、`6` が土曜です。
- `calendar.suspendedDates`: 祝日などの日別運休
- `calendar.suspendedRanges`: お盆、年末年始などの期間運休

祝日は年ごとに変わるため、公開前に対象年度の `suspendedDates` を更新してください。
