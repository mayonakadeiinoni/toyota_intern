
import { ACTIVE_VEHICLE_IDS, STANDBY_VEHICLE_IDS, BUS_STOPS, STOP_RADIUS_M } from './config.js';

let map;
const markers = new Map();  // 車両用
let stopLayer;              // 停留所用

export function initMap(){
  map = L.map('map').setView([35.6315,139.7765], 15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom:19, attribution:'&copy; OpenStreetMap contributors'}).addTo(map);
  drawBusStops(); // 停留所を円で表示
  return map;
}

// 停留所ははっきり見えるように、太い青円＋薄い塗り
export function drawBusStops(){
  if(stopLayer){ map.removeLayer(stopLayer); }
  stopLayer = L.layerGroup();
  BUS_STOPS.forEach(s=>{
    const circle = L.circle([s.lat, s.lng], {
      radius: STOP_RADIUS_M,
      color: '#2563eb',        // 線（濃い青）
      weight: 3,               // 太め
      fillColor: '#60a5fa',    // 塗り（明るい青）
      fillOpacity: 0.15
    }).bindTooltip(s.name, {permanent:true, direction:'top', offset:[0,-6]});
    circle.addTo(stopLayer);
  });
  stopLayer.addTo(map);
}

// 車両マーカーは「丸い点」にして色で区別。VINは常時ラベル表示。
function ensureMarker(vid, lat, lng){
  if(markers.has(vid)) return markers.get(vid);
  const isActive = ACTIVE_VEHICLE_IDS.includes(vid);
  const color = isActive ? '#0ea5e9' : '#22c55e'; // 走行=水色 / 待機=緑
  const m = L.circleMarker([lat,lng], {
    radius: 10, color: '#fff', weight: 3, fillColor: color, fillOpacity: 1
  }).addTo(map);
  m.bindTooltip(vid, {permanent:true, direction:'top', offset:[0,-12]});
  markers.set(vid, m);
  return m;
}

export function upsertVehicleMarker(vid, loc, charge){
  const { latitude, longitude } = loc;
  const m = ensureMarker(vid, latitude, longitude);
  m.setLatLng([latitude, longitude]);

  const role = ACTIVE_VEHICLE_IDS.includes(vid) ? '走行車' : '待機車';
  const bat = charge ? charge['remaining-charge-time'] : '—';
  const plug= charge ? charge['plug-status'] : '—';
  const state = (plug==='Other') ? '走行中' : '充電中';

  const html = `<div style="min-width:180px">
    <div><strong><a href="vehicle.html?id=${vid}">${vid}</a></strong>（${role}）</div>
    <div>緯度: ${latitude.toFixed(6)} / 経度: ${longitude.toFixed(6)}</div>
    <div>残量: ${bat}% / 状態: ${state}</div>
  </div>`;
  m.bindPopup(html);
}


// すべての車両がちょうど収まるズームにする
export function fitToAllMarkers({
  minZoom = 15,
  maxZoom = 19,
  padding = [10, 10],
} = {}) {
  const ms = Array.from(markers.values());
  const layers = [];

  if (ms.length > 0) layers.push(...ms);
  if (stopLayer) layers.push(...stopLayer.getLayers());

  if (layers.length === 0) return;

  const g = L.featureGroup(layers);
  map.fitBounds(g.getBounds(), {padding, maxZoom});
}
