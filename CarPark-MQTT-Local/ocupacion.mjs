import tramos from './tramos.json' with {type:'json'};
export const catalogo = tramos;
export const prefijo = process.env.MQTT_TOPIC_PREFIX || 'carpark/elmasnou/tramos';
export const topicFor = id => `${prefijo}/${id}/estado`;
export function validar(topic, payload) {
  let data;
  try { data=JSON.parse(payload.toString()); } catch { return null; }
  if (!data || typeof data !== 'object' || !catalogo.some(s=>s.id===data.id)) return null;
  if (topic !== topicFor(data.id) || !['libre','ocupado'].includes(data.estado)) return null;
  const time=Date.parse(data.timestamp);
  // Los retenidos antiguos no deben mostrarse como disponibilidad actual.
  if (!Number.isFinite(time) || time>Date.now()+30000 || time<Date.now()-60000) return null;
  return {id:data.id,estado:data.estado,ultima_actualizacion:new Date(time).toISOString(),
    origen:data.origen==='simulador'?'simulador':'mqtt'};
}
