import mqtt from 'mqtt';
import {fileURLToPath} from 'node:url';
import {catalogo,topicFor} from './ocupacion.mjs';
export function opciones(args){
 const value=(key)=>{const i=args.indexOf(key);return i<0?null:args[i+1];};
 const id=value('--tramo'),estado=value('--estado')||value('--plaza');
 if(id&&!catalogo.some(s=>s.id===id))throw new Error('Tramo desconocido. Usa --listar para ver los identificadores válidos.');
 if(estado&&!['libre','ocupado'].includes(estado))throw new Error('Estado permitido: libre u ocupado.');
 if(estado&&!id)throw new Error('Para un estado manual indica --tramo EM-ZB-PUERTO-RICO.');
 return {id,estado};
}
export function mensaje(id,estado){return {id,estado,origen:'simulador',timestamp:new Date().toISOString()};}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2);
 if(args.includes('--listar')){
  for(const s of catalogo)console.log(`${s.id} · ${s.direccion}`);
 }else{
  try{
   const {id,estado}=opciones(args);
   const client=mqtt.connect(process.env.MQTT_URL||'mqtt://127.0.0.1:1883',{
    username:process.env.MQTT_USERNAME,password:process.env.MQTT_PASSWORD,reconnectPeriod:2000,connectTimeout:5000});
   const targets=id?catalogo.filter(s=>s.id===id):catalogo;
   const states=new Map(targets.map(s=>[s.id,Math.random()<.5?'libre':'ocupado']));
   let timer;
   function publicar(tramo,status,done){
    const data=mensaje(tramo,status);
    client.publish(topicFor(tramo),JSON.stringify(data),{qos:1,retain:false},err=>{
     if(err)console.error('Error al publicar:',err.message);else console.log(topicFor(tramo),JSON.stringify(data));
     done?.(err);
    });
   }
   client.on('connect',()=>{
    clearInterval(timer);
    if(estado){publicar(id,estado,err=>{client.end();if(err)process.exitCode=1;});return;}
    const publishAll=()=>{for(const [key,status]of states)publicar(key,status);};
    publishAll();
    timer=setInterval(()=>{
     const tramo=targets[Math.floor(Math.random()*targets.length)];
     states.set(tramo.id,states.get(tramo.id)==='libre'?'ocupado':'libre');publishAll();
    },5000);
   });
   client.on('offline',()=>clearInterval(timer));
   client.on('close',()=>clearInterval(timer));
   client.on('error',err=>console.error('MQTT:',err.message));
   process.on('SIGINT',()=>{clearInterval(timer);client.end();});
  }catch(err){console.error(err.message);process.exitCode=1;}
 }
}
