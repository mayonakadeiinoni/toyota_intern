
// Mock APIの挙動に必要な値を入れている．
// 本番の車両の名前に変更するべきではある．

//　走行バス
export const ACTIVE_VEHICLE_IDS = ["V1001", "V1002"];
// 待機バス
export const STANDBY_VEHICLE_IDS = ["V2001", "V2002"];
// バス一覧の配列
export const VEHICLES = [...ACTIVE_VEHICLE_IDS, ...STANDBY_VEHICLE_IDS];

// 位置情報を何ミリ秒ごとに取得するか
export const LOCATION_POLL_MS_DEFAULT = 2000; //2s
// 待機車両の充電情報を何ミリ秒ごとに取得するか
export const CHARGE_POLL_MS_DEFAULT = 10000;

// 疑似的なバス停たち
export const BUS_STOPS = [
  { name: 'A停留所', lat: 35.6297, lng: 139.7762 },
  { name: 'B停留所', lat: 35.6320, lng: 139.7810 },
  { name: 'C停留所', lat: 35.6340, lng: 139.7765 },
  { name: 'D停留所', lat: 35.6305, lng: 139.7745 },
  { name: 'E停留所', lat: 35.6335, lng: 139.7830 },
  { name: 'F停留所', lat: 35.6350, lng: 139.7790 }
];
// 停留所の「到着判定の円」の半径
export const STOP_RADIUS_M = 60;

// モックAPIで車両が動くときの一歩あたりの移動距離
export const MOVE_STEP_M = 10;
