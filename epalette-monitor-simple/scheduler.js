// 非同期処理を管理するやつです．

import { callApi } from './apiClient.js';
import { ACTIVE_VEHICLE_IDS, STANDBY_VEHICLE_IDS,
  LOCATION_POLL_MS_DEFAULT, CHARGE_POLL_MS_DEFAULT, BUS_STOPS, STOP_RADIUS_M } from './config.js';

function toRad(d){ return d*Math.PI/180; }
function distanceM(a,b){
  const R=6371000;
  const dLat=toRad(b.lat-a.lat), dLng=toRad(b.lng-a.lng);
  const lat1=toRad(a.lat), lat2=toRad(b.lat);
  const h=Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2;
  return 2*R*Math.asin(Math.sqrt(h));
}

export class Scheduler{
  constructor(opts={}){
    this.activeIds = opts.activeIds || ACTIVE_VEHICLE_IDS;
    this.standbyIds = opts.standbyIds || STANDBY_VEHICLE_IDS;
    this.allIds = [...this.activeIds, ...this.standbyIds];

    this.locationHandlers=new Set();
    this.chargeHandlers=new Set();
    this.tLoc=null; this.tChg=null;
    this.wasAtStop=new Map();
    this.locationPollMs=LOCATION_POLL_MS_DEFAULT;
    this.chargeStandbyPollMs=CHARGE_POLL_MS_DEFAULT;
  }
  onLocation(fn){ this.locationHandlers.add(fn); }
  onCharge(fn){ this.chargeHandlers.add(fn); }
  setStandbyChargeIntervalMs(ms){
    this.chargeStandbyPollMs = ms;
    if(this.tChg){ clearInterval(this.tChg); this.tChg=setInterval(()=>this.pollStandbyCharge(), ms); }
  }
  start(){
    this.stop();
    this.tLoc = setInterval(()=>this.pollLocations(), this.locationPollMs);
    this.tChg = setInterval(()=>this.pollStandbyCharge(), this.chargeStandbyPollMs);
    this.pollLocations(); this.pollStandbyCharge();
  }
  stop(){ if(this.tLoc) clearInterval(this.tLoc); if(this.tChg) clearInterval(this.tChg); }
  async pollLocations(){
    for(const vid of this.allIds){
      try{
        const loc = await callApi(vid, 'location');
        this.locationHandlers.forEach(fn=>fn(vid, loc));
        // 走行車：到着時のみ充電を取得
        if(this.activeIds.includes(vid)){
          const atStop = BUS_STOPS.some(s=> distanceM({lat:loc.latitude,lng:loc.longitude},{lat:s.lat,lng:s.lng}) <= STOP_RADIUS_M);
          const prev = this.wasAtStop.get(vid) || false;
          if(atStop && !prev){
            const ch = await callApi(vid, 'charge_status');
            this.chargeHandlers.forEach(fn=>fn(vid, ch, 'on-arrival'));
          }
          this.wasAtStop.set(vid, atStop);
        }
      }catch(e){ console.error(e); }
    }
  }
  async pollStandbyCharge(){
    for(const vid of this.standbyIds){
      try{
        const ch = await callApi(vid, 'charge_status');
        this.chargeHandlers.forEach(fn=>fn(vid, ch, 'standby-interval'));
      }catch(e){ console.error(e); }
    }
  }
}
