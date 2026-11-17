import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {readFile} from 'node:fs/promises';
import {catalogo,validar,topicFor} from './ocupacion.mjs';
import {opciones,mensaje} from './simulador.mjs';
import {crearServidor} from './server.mjs';
const id=catalogo[0].id;
test('El catálogo compartido coincide con los 13 tramos del mapa',async()=>{
 const html=await readFile(new URL('./public/index.html',import.meta.url),'utf8');
 const data=JSON.parse(html.match(/const localSpots = (\[.*?\]);/s)[1]);
 assert.deepEqual(data,catalogo);assert.equal(catalogo.length,13);
 assert.equal(new Set(catalogo.map(s=>s.id)).size,13);
});
test('Valida mensajes y rechaza demostración, estado inválido y topic incorrecto',()=>{
 const msg=mensaje(id,'libre');
 assert.equal(validar(topicFor(id),JSON.stringify(msg)).estado,'libre');
 for(const bad of [{...msg,id:'CP-001'},{...msg,estado:'inventado'},{...msg,timestamp:'ayer'},
 {...msg,timestamp:new Date(Date.now()-120000).toISOString()}])assert.equal(validar(topicFor(id),JSON.stringify(bad)),null);
 assert.equal(validar(topicFor(catalogo[1].id),JSON.stringify(msg)),null);
 assert.equal(validar(topicFor(id),'['),null);
});
test('Modo manual y alias --plaza usan identificadores reales',()=>{
 assert.deepEqual(opciones(['--tramo',id,'--estado','ocupado']),{id,estado:'ocupado'});
 assert.equal(opciones(['--tramo',id,'--plaza','libre']).estado,'libre');
 assert.throws(()=>opciones(['--tramo','CP-001']));
 assert.throws(()=>opciones(['--estado','libre']));
});
test('MQTT actualiza HTTP y SSE, rechaza datos antiguos y gestiona desconexión',async(t)=>{
 class Broker extends EventEmitter {subscribe(topic,options,cb){this.topic=topic;cb();}}
 const client=new Broker();const server=crearServidor(client);
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${server.address().port}`;
 const controller=new AbortController();
 t.after(()=>{controller.abort();server.closeAllConnections();server.close();});
 const response=await fetch(base+'/api/eventos',{signal:controller.signal});
 const reader=response.body.getReader();const decoder=new TextDecoder();
 const first=decoder.decode((await reader.read()).value);
 assert.match(first,/snapshot/);assert.match(first,/desconocido/);
 client.emit('connect');
 const msg=mensaje(id,'libre');client.emit('message',topicFor(id),Buffer.from(JSON.stringify(msg)));
 let received='';while(!received.includes('"origen":"simulador"'))received+=decoder.decode((await reader.read()).value);
 assert.match(received,/"estado":"libre"/);
 const state=async()=>(await(await fetch(base+'/api/tramos')).json()).tramos.find(s=>s.id===id);
 assert.equal((await state()).estado,'libre');
 client.emit('message',topicFor(id),Buffer.from(JSON.stringify({...msg,estado:'ocupado',timestamp:new Date(Date.parse(msg.timestamp)-1000).toISOString()})));
 assert.equal((await state()).estado,'libre');
 client.emit('offline');assert.equal((await state()).estado,'sin_conexion');
 client.emit('connect');
 client.emit('message',topicFor(id),Buffer.from(JSON.stringify({...msg,estado:'ocupado',timestamp:new Date(Date.parse(msg.timestamp)+1).toISOString()})));
 assert.equal((await state()).estado,'ocupado');
 assert.equal((await fetch(base+'/../server.mjs')).status,404);
 await reader.cancel();
});
