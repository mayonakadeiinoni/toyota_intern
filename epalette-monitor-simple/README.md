# e-パレット運行モニタ（シンプル版）

- できるだけ **やさしい構造** と **コメント** にしました。
- 見た目（色・余白）は **ほぼ CSS** で調整しています。
- **mockApi** により本番APIが無くても動きます。

## 構成
- `index.html` …… 一覧ページ（全車）
- `vehicle.html` …… 専用ページ（?id=VIN）
- `styles.css` …… 見た目（赤アクセント、ボタン、テーブル、ドロワー）
- `config.js` …… 設定（車両ID、停留所、間隔、半径）
- `apiClient.js` …… APIの入口（mock ⇄ 本番を差し替え）
- `mockApi.js` …… モックデータ（停留所を巡回）
- `scheduler.js` …… データ取得のタイミング管理（UIには触らない）
- `map.js` …… 地図の描画（停留所円、車両マーカー、ズーム）
- `app.js` …… ページ制御（単一/全車の切替、テーブル、ログ、音声）

## 使い方
1. 適当なローカルサーバで `index.html` を開く（VSCode拡張のLive Serverなど）
2. 右上「詳細」でドロワーを開く。赤い縦バーをドラッグで **横幅リサイズ** 可能。
3. 専用ページ例：`vehicle.html?id=V1001`

## 本番APIに差し替え
- `app.js` 冒頭の `setApiProvider(mockProvider)` を、本番の provider に変更
- 本番 provider の `callApi(vehicleId, apiKind)` は、以下の形で返してください：
  - `apiKind === 'location'` → `{ vin, datetime, latitude, longitude }`
  - `apiKind === 'charge_status'` → `{ 'remaining-charge-time': 0..100, 'plug-status': 'Other' or 'Charging' }`
