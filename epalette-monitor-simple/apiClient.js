// API呼び出しの「窓口」。mock ⇄ 本番を差し替えできます。
let provider = null;

// モック or 本番の実装をセット
export function setApiProvider(p){ provider = p; }

// 共通呼び出し口
export async function callApi(vehicleId, apiKind){
  if(!provider) throw new Error('API provider not set.');
  return provider.callApi(vehicleId, apiKind);
}
