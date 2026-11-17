const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const html=readFileSync(require('node:path').join(__dirname,'../CarPark-FUNCIONA/index.html'),'utf8');
function browser(fetcher){
 const nodes=new Map();
 const node=id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',innerHTML:'',value:id==='demoSpeed'?'3000':'',checked:false,hidden:false,
  classList:{add(){},remove(){}},addEventListener(){},setAttribute(){},scrollIntoView(){}});return nodes.get(id);};
 const context=vm.createContext({document:{getElementById:node,querySelectorAll:()=>[],createElement:()=>({})},
  window:{addEventListener(){}},location:{protocol:'http:',search:''},localStorage:{getItem:()=>null,removeItem(){}},
  setTimeout:()=>1,clearTimeout(){},setInterval:()=>1,clearInterval(){},AbortController,URLSearchParams,fetch:fetcher,console});
 vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],context);
 return {node,run:code=>vm.runInContext(code,context)};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));
const fixture=estado=>({id:'EM-ZB-PUERTO-RICO',estado,direccion:'Puerto Rico',latitud:41.4815,longitud:2.3284,ultima_actualizacion:new Date().toISOString()});
test('El frontend consulta la API, refleja cambios y conserva su selección',async()=>{
 let estado='libre';const requests=[];
 const b=browser(async(url,options)=>{requests.push({url,options});return {ok:true,json:async()=>({sitios:[fixture(estado)]})};});
 await settle();assert.equal(b.node('freeNum').textContent,1);
 b.run("selectSpot('EM-ZB-PUERTO-RICO')");estado='ocupado';await b.run('refreshApi()');
 assert.equal(b.node('occupiedNum').textContent,1);assert.equal(b.node('freeNum').textContent,0);
 assert.match(b.node('detailStatus').textContent,/Ocupado/);
 assert.match(b.node('changeLog').innerHTML,/Libre.*Ocupado/);
 assert.match(requests[0].url,/\/api\/sitios\?zona=/);assert.equal(requests[0].options.cache,'no-store');
});
test('Un fallo de API retira la disponibilidad confirmada y no introduce datos de demo',async()=>{
 let fail=false;const b=browser(async()=>{if(fail)throw Error('fallo');return {ok:true,json:async()=>({sitios:[fixture('libre')]})};});
 await settle();fail=true;await b.run('refreshApi()');
 assert.equal(b.node('freeNum').textContent,0);assert.equal(b.node('busyNum').textContent,1);
 assert.match(b.node('connectionStatus').textContent,/Reintento automático/);
 assert.equal(b.run('spots[0].estado'),'sin_conexion');
});
test('Cambiar a demo cancela la petición y rechaza una respuesta tardía de API',async()=>{
 let resolve,signal;const pending=new Promise(r=>resolve=r);
 const b=browser(async(_,options)=>{signal=options.signal;return pending;});
 b.run('startDemo()');assert.equal(signal.aborted,true);
 resolve({ok:true,json:async()=>({sitios:[fixture('ocupado')]})});await settle();
 assert.equal(b.run('mode'),'demo');assert.equal(b.run('spots.length'),13);
 assert.equal(b.run('spots.every(s=>s.origen==="demo")'),true);
});
test('Las dos entradas muestran el mismo modelo, sin dibujar líneas en el mapa',()=>{
 assert.equal(readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8'),html);
 assert.match(html,/L\.divIcon/);assert.doesNotMatch(html,/L\.(geoJSON|circleMarker)\(/);
});
