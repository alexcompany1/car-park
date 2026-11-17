import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import mqtt from 'mqtt';
import {catalogo,prefijo,validar} from './ocupacion.mjs';

export function crearServidor(client) {
 const states=new Map(catalogo.map(s=>[s.id,{...s}]));
 const listeners=new Set(); let connected=false;
 const conexion=()=>({mqtt:connected});
 const send=(res,name,data)=>res.write(`event: ${name}\ndata: ${JSON.stringify(data)}\n\n`);
 const snapshot=()=>({tramos:[...states.values()],conexion:conexion()});
 const broadcast=()=>{for(const res of listeners)send(res,'snapshot',snapshot());};
 function disconnected(){
  connected=false;
  for(const s of states.values())if(s.ultima_actualizacion)s.estado='sin_conexion';
  broadcast();
 }
 client.on('connect',()=>{
  client.subscribe(`${prefijo}/+/estado`,{qos:1},err=>{
   if(err){console.error('No se puede suscribir al topic MQTT:',err.message);disconnected();return;}
   connected=true;broadcast();
  });
 });
 client.on('message',(topic,payload)=>{
  if(!connected)return;
  const update=validar(topic,payload);if(!update)return;
  const current=states.get(update.id);
  if(current.ultima_actualizacion && Date.parse(update.ultima_actualizacion)<=Date.parse(current.ultima_actualizacion))return;
  states.set(update.id,{...current,...update});broadcast();
 });
 client.on('offline',disconnected);client.on('close',disconnected);
 client.on('error',err=>console.error('MQTT:',err.message));
 // Una lectura sin nuevas mediciones caduca aunque el broker siga conectado.
 const expiry=setInterval(()=>{
  let changed=false;
  for(const s of states.values())if(s.ultima_actualizacion && s.estado!=='sin_conexion' && Date.now()-Date.parse(s.ultima_actualizacion)>60000){s.estado='sin_conexion';changed=true;}
  if(changed)broadcast();
 },5000);expiry.unref();
 const server=http.createServer(async(req,res)=>{
  const path=req.url?.split('?')[0];
  if(req.method!=='GET'){res.writeHead(405);res.end();return;}
  if(path==='/api/eventos'){
   res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive','X-Accel-Buffering':'no'});
   res.write('retry: 2000\n\n');listeners.add(res);send(res,'snapshot',snapshot());
   const heartbeat=setInterval(()=>res.write(': keepalive\n\n'),15000);
   req.on('close',()=>{clearInterval(heartbeat);listeners.delete(res);});return;
  }
  if(path==='/api/tramos'){
   res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
   res.end(JSON.stringify(snapshot()));return;
  }
  if(path==='/CarPark-FUNCIONA/assets/rotulo-carpark.webp'){
   try{const img=await readFile(new URL('../CarPark-FUNCIONA/assets/rotulo-carpark.webp',import.meta.url));res.writeHead(200,{'Content-Type':'image/webp'});res.end(img);}
   catch{res.writeHead(404);res.end();}return;
  }
  if(path==='/'||path==='/index.html'){
   try{const html=await readFile(new URL('./public/index.html',import.meta.url));res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-cache'});res.end(html);}
   catch{res.writeHead(500);res.end('No se puede cargar index.html');}return;
  }
  res.writeHead(404);res.end('No encontrado');
 });
 server.on('close',()=>{clearInterval(expiry);for(const res of listeners)res.end();});
 return server;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const url=process.env.MQTT_URL||'mqtt://127.0.0.1:1883';
 const client=mqtt.connect(url,{username:process.env.MQTT_USERNAME,password:process.env.MQTT_PASSWORD,
  reconnectPeriod:2000,connectTimeout:5000});
 const server=crearServidor(client);
 const portFlag=process.argv.indexOf('--port');
 const port=Number(process.env.PORT||(portFlag>=0?process.argv[portFlag+1]:8080));
 server.on('error',err=>{console.error('No se puede abrir la web:',err.message);client.end(true);process.exitCode=1;});
 server.listen(port,'127.0.0.1',()=>console.log(`CarPark: http://localhost:${port} · Esperando MQTT`));
 function stop(){client.end(true);server.close();server.closeAllConnections();}
 process.on('SIGINT',stop);process.on('SIGTERM',stop);
}
