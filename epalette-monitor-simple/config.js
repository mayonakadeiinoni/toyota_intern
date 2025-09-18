// ★ 設定はここだけ直せばOK（初心者でも安心）

// 走行車（2台）と待機車（2台）
export const ACTIVE_VEHICLE_IDS = ['V1001', 'V1002'];
export const STANDBY_VEHICLE_IDS = ['V2001', 'V2002'];
export const VEHICLES = [...ACTIVE_VEHICLE_IDS, ...STANDBY_VEHICLE_IDS];

// 位置情報ポーリング（ミリ秒）
export const LOCATION_POLL_MS_DEFAULT = 2000;
// 待機車の充電取得サイクル（ミリ秒）
export const CHARGE_POLL_MS_DEFAULT = 10000;

// バス停（お台場の例）　※ 追加/削除は行を増減するだけ
export const BUS_STOPS = [
  { name: 'A停留所', lat: 35.6297, lng: 139.7762 },
  { name: 'B停留所', lat: 35.6320, lng: 139.7810 },
  { name: 'C停留所', lat: 35.6340, lng: 139.7765 },
  { name: 'D停留所', lat: 35.6305, lng: 139.7745 },
  { name: 'E停留所', lat: 35.6335, lng: 139.7830 },
  { name: 'F停留所', lat: 35.6350, lng: 139.7790 }
];
// 到着判定・円の半径（メートル）
export const STOP_RADIUS_M = 60;
// 走行車の移動量（1ステップあたりメートル相当）
export const MOVE_STEP_M = 25;
