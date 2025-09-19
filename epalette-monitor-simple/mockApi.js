// ★ モックAPI：本番が無くても動作確認できるように簡易な値を返します。
// 返す形は要件どおりに統一：
//  - location: { vin, datetime, latitude, longitude }
//  - charge_status: { 'remaining-charge-time': 0..100, 'plug-status': 'Other' or 'Charging' }

import { ACTIVE_VEHICLE_IDS, STANDBY_VEHICLE_IDS, BUS_STOPS, STOP_RADIUS_M, MOVE_STEP_M } from './config.js';

const state = new Map();

function metersToDegLat(m){ return m / 111320; }
function metersToDegLng(m, atLat){
  const metersPerDeg = 40075000 * Math.cos(atLat * Math.PI/180) / 360;
  return m / metersPerDeg;
}

function init(){
  if(state.size>0) return;
  // 停留所からスタート
  for(const vid of ACTIVE_VEHICLE_IDS){
    const s0 = BUS_STOPS[0];
    let r = Math.random()*0.005
    
    state.set(vid, { vin:vid, lat:s0.lat-r, lng:s0.lng-r, target:1% BUS_STOPS.length, battery: 80, plug:'Other' });
  }
  // 待機車は近くで充電中
  const seeds = { V2001:{lat:35.6330,lng:139.7780}, V2002:{lat:35.6290,lng:139.7795} };
  for(const vid of STANDBY_VEHICLE_IDS){
    const s = seeds[vid] || {lat:35.631, lng:139.778};
    state.set(vid, { vin:vid, lat:s.lat, lng:s.lng, target:null, battery: 90, plug:'Charging' });
  }
}
init();

// 状態遷移の記述
function stepActive(vid){
  const s = state.get(vid);
  if(!s) return;
  const dst = BUS_STOPS[s.target];
  const dLat = dst.lat - s.lat;
  const dLng = dst.lng - s.lng;
  const mX = dLat*111320;
  const mY = dLng*(40075000*Math.cos(s.lat*Math.PI/180)/360);
  const dist = Math.sqrt(mX*mX + mY*mY);

  if(dist <= STOP_RADIUS_M/2){
    // 到着：次へ
    s.lat = dst.lat; s.lng = dst.lng;
    s.target = (s.target+1) % BUS_STOPS.length;
    s.battery = Math.max(0, s.battery - 5);
    s.plug = 'Other';
    state.set(vid, s); return;
  }
  const step = MOVE_STEP_M;
  const ratio = Math.min(1, step / Math.max(1, dist));
  s.lat += dLat * ratio;
  s.lng += dLng * ratio;
  s.battery = Math.max(0, s.battery - 1);
  s.plug = 'Other';
  state.set(vid, s);
}

function stepStandby(vid){
  const s = state.get(vid);
  if(!s) return;
  s.battery = Math.min(100, s.battery + 1.5);
  s.plug = 'Charging';
  state.set(vid, s);
}

export const mockProvider = {
  async callApi(vehicleId, apiKind){
    if(ACTIVE_VEHICLE_IDS.includes(vehicleId)) stepActive(vehicleId);
    if(STANDBY_VEHICLE_IDS.includes(vehicleId)) stepStandby(vehicleId);
    const s = state.get(vehicleId);
    if(apiKind === 'location'){
      return { vin:s.vin, datetime:new Date().toISOString(), latitude:s.lat, longitude:s.lng };
    }
    if(apiKind === 'charge_status'){
      return { 'remaining-charge-time': Math.round(s.battery), 'plug-status': s.plug };
    }
    throw new Error('unknown apiKind');
  }
};
