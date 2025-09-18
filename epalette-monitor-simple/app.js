// ★ ここが全体の司令塔。URLに ?id= があれば単一車両モード、なければ全車モード。
//   初心者でも読みやすいように、短い関数だけで構成しています。

import { initMap, drawBusStops, upsertVehicleMarker, fitToAllMarkers } from './map.js';
import { setApiProvider } from './apiClient.js';
import { mockProvider } from './mockApi.js';
import { Scheduler } from './scheduler.js';
import { ACTIVE_VEHICLE_IDS, STANDBY_VEHICLE_IDS, VEHICLES, CHARGE_POLL_MS_DEFAULT } from './config.js';

// ------ 共通初期化 ------
const map = initMap();
drawBusStops();
fitToAllMarkers();        // 最初は全体が入るズームに
setApiProvider(mockProvider);

const drawer = document.getElementById('drawer');
const logBox = document.getElementById('logBox');
const tableEl = document.getElementById('vehicleTable');

// ドロワー開閉
document.getElementById('toggleDrawerBtn').addEventListener('click', ()=>drawer.classList.toggle('hidden'));
document.getElementById('closeDrawerBtn').addEventListener('click', ()=>drawer.classList.add('hidden'));

// ドロワー横幅のドラッグ調整（シンプル）
(function setupDrawerResize(){
  if(!drawer) return;
  const saved = localStorage.getItem('drawerWidthPx');
  if(saved) drawer.style.width = Math.min(720, Math.max(320, parseInt(saved,10)||420)) + 'px';
  const h = drawer.querySelector('.resize-handle');
  let dragging=false, startX=0, startW=0;
  function onMove(e){
    if(!dragging) return;
    const x = (e.touches? e.touches[0].clientX : e.clientX);
    const next = Math.min(720, Math.max(320, startW + (startX - x)));
    drawer.style.width = next + 'px';
  }
  function onUp(){
    if(!dragging) return; dragging=false;
    localStorage.setItem('drawerWidthPx', parseInt(drawer.style.width,10));
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('touchend', onUp);
  }
  function onDown(e){
    dragging=true;
    startX=(e.touches? e.touches[0].clientX : e.clientX);
    startW=parseInt(getComputedStyle(drawer).width,10);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove, {passive:false});
    document.addEventListener('touchend', onUp);
    e.preventDefault();
  }
  h.addEventListener('mousedown', onDown);
  h.addEventListener('touchstart', onDown, {passive:false});
})();

// ------ ユーティリティ ------
function getParam(name){ const u=new URL(location.href); return u.searchParams.get(name); }
function log(msg){ if(!logBox) return; const now=new Date().toLocaleTimeString('ja-JP'); logBox.textContent = `[${now}] ${msg}\n` + logBox.textContent; }
function speak(text){ try{ const u=new SpeechSynthesisUtterance(text); u.lang='ja-JP'; speechSynthesis.speak(u); }catch{} }

// ------ モード判定 ------
const vid = getParam('id');
const mode = vid ? 'single' : 'all';
let scheduler;
let firstFitDone=false;
const latestLoc = new Map();
const latestChg = new Map();

// ------ 表示テーブル ------
function renderAllTable(ids){
  const rows = [];
  rows.push('<table><thead><tr><th>VIN（専用ページ）</th><th>区分</th><th>緯度</th><th>経度</th><th>残量(%)</th><th>状態</th></tr></thead><tbody>');
  for(const id of ids){
    const role = ACTIVE_VEHICLE_IDS.includes(id)? '走行' : '待機';
    const loc = latestLoc.get(id);
    const ch  = latestChg.get(id);
    const lat = loc? loc.latitude.toFixed(6) : '—';
    const lng = loc? loc.longitude.toFixed(6) : '—';
    const bat = ch? ch['remaining-charge-time'] : '—';
    const st  = ch? ((ch['plug-status']==='Other')?'走行中':'充電中') : '—';
    rows.push(`<tr><td><a href="vehicle.html?id=${id}">${id}</a></td><td>${role}</td><td>${lat}</td><td>${lng}</td><td>${bat}</td><td>${st}</td></tr>`);
  }
  rows.push('</tbody></table>');
  if(tableEl) tableEl.innerHTML = rows.join('');
}

function renderSingleTable(id){
  const loc = latestLoc.get(id);
  const ch  = latestChg.get(id);
  const lat = loc? loc.latitude.toFixed(6) : '—';
  const lng = loc? loc.longitude.toFixed(6) : '—';
  const bat = ch? ch['remaining-charge-time'] : '—';
  const st  = ch? ((ch['plug-status']==='Other')?'走行中':'充電中') : '—';
  if(tableEl) tableEl.innerHTML = `<table><tbody>
    <tr><th>VIN</th><td>${id}</td></tr>
    <tr><th>緯度</th><td>${lat}</td></tr>
    <tr><th>経度</th><td>${lng}</td></tr>
    <tr><th>残量</th><td>${bat}%</td></tr>
    <tr><th>状態</th><td>${st}</td></tr>
  </tbody></table>`;
}

// ------ モード別処理 ------
if(mode==='single'){
  if(!VEHICLES.includes(vid)){ alert('不明な車両です'); location.href='./index.html'; }
  const titleEl = document.getElementById('pageTitle'); if(titleEl) titleEl.textContent = 'Vehicle ' + vid;

  const a = ACTIVE_VEHICLE_IDS.includes(vid)? [vid] : [];
  const s = STANDBY_VEHICLE_IDS.includes(vid)? [vid] : [];
  scheduler = new Scheduler({ activeIds:a, standbyIds:s });

  scheduler.onLocation((id, loc)=>{
    latestLoc.set(id, loc);
    upsertVehicleMarker(id, loc, latestChg.get(id));
    if(!firstFitDone){ fitToAllMarkers(); firstFitDone=true; }
    renderSingleTable(id);
  });
  scheduler.onCharge((id, ch)=>{
    latestChg.set(id, ch);
    const loc = latestLoc.get(id);
    if(loc) upsertVehicleMarker(id, loc, ch);
    const isRun = (ch['plug-status']==='Other');
    if(isRun && ch['remaining-charge-time']<=40) speak(`警告。車両 ${id} のバッテリー残量が40パーセント以下です。`);
    log(`[charge] ${id} ${ch['remaining-charge-time']}% 状態:${ch['plug-status']}`);
    renderSingleTable(id);
  });

  scheduler.start();

}else{
  scheduler = new Scheduler(); // 全車
  const all = scheduler.allIds;

  const standbyInput = document.getElementById('standbyIntervalSec');
  const applyBtn = document.getElementById('applyIntervalBtn');
  if(standbyInput && applyBtn){
    standbyInput.value = Math.round(CHARGE_POLL_MS_DEFAULT/1000);
    applyBtn.addEventListener('click', ()=>{
      const sec = Math.max(1, parseInt(standbyInput.value,10) || 10);
      scheduler.setStandbyChargeIntervalMs(sec*1000);
      log(`待機車の充電取得間隔を ${sec} 秒に設定しました。`);
    });
  }

  scheduler.onLocation((id, loc)=>{
    latestLoc.set(id, loc);
    upsertVehicleMarker(id, loc, latestChg.get(id));
    if(!firstFitDone){ fitToAllMarkers(); firstFitDone=true; }
    renderAllTable(all);
  });
  scheduler.onCharge((id, ch)=>{
    latestChg.set(id, ch);
    const loc = latestLoc.get(id);
    if(loc) upsertVehicleMarker(id, loc, ch);
    const isRun = (ch['plug-status']==='Other');
    if(isRun && ch['remaining-charge-time']<=40) speak(`警告。車両 ${id} のバッテリー残量が40パーセント以下です。`);
    log(`[charge] ${id} ${ch['remaining-charge-time']}% 状態:${ch['plug-status']}`);
    renderAllTable(all);
  });

  scheduler.start();
}
