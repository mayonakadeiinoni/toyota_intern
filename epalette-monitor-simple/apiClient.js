let provider = null;

export function setApiProvider(p){ provider = p; }

export async function callApi(vehicleId, apiKind) {
  if(!provider) throw new Error("APIの設定がないよ");
  return provider.callApi(vehicleId, apiKind);
  
}