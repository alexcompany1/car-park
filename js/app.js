const parkingSpots = [
  {id:"CP-014",address:"Carrer de València, 214",zone:"Eixample",status:"free",lat:41.3890,lng:2.1637,updated:"Hace 1 minuto",distance:180},
  {id:"CP-018",address:"Carrer d'Aribau, 112",zone:"Eixample",status:"free",lat:41.3907,lng:2.1608,updated:"Hace 2 minutos",distance:260},
  {id:"CP-021",address:"Carrer de Mallorca, 198",zone:"Eixample",status:"occupied",lat:41.3922,lng:2.1648,updated:"Hace 3 minutos",distance:320},
  {id:"CP-027",address:"Carrer de Muntaner, 86",zone:"Eixample",status:"unknown",lat:41.3898,lng:2.1581,updated:"Hace 12 minutos",distance:410},
  {id:"CP-032",address:"Carrer de Provença, 176",zone:"Eixample",status:"free",lat:41.3930,lng:2.1618,updated:"Hace 1 minuto",distance:520},
  {id:"CP-039",address:"Carrer de Balmes, 145",zone:"Eixample",status:"offline",lat:41.3926,lng:2.1588,updated:"Sin comunicación",distance:610},
  {id:"CP-044",address:"Carrer de Diputació, 205",zone:"Eixample",status:"reserved",lat:41.3874,lng:2.1632,updated:"Hace 4 minutos",distance:700},
  {id:"CP-051",address:"Carrer del Parlament, 24",zone:"Sant Antoni",status:"free",lat:41.3785,lng:2.1615,updated:"Hace 2 minutos",distance:820},
  {id:"CP-058",address:"Carrer de Rocafort, 65",zone:"Sant Antoni",status:"occupied",lat:41.3780,lng:2.1530,updated:"Hace 5 minutos",distance:910},
  {id:"CP-063",address:"Travessera de Gràcia, 18",zone:"Gràcia",status:"free",lat:41.4000,lng:2.1600,updated:"Hace 1 minuto",distance:1100}
];
const labels={free:"Libre",occupied:"Ocupada",unknown:"Desconocida",reserved:"Reservada",offline:"Sin conexión"};
const colors={free:"#169b62",occupied:"#e24b4b",unknown:"#d18a1b",reserved:"#8a63d2",offline:"#89939e"};
const $=id=>document.getElementById(id);
let activeStatus="all",selectedId=null,searchText="";
const map=L.map("map").setView([41.3898,2.1615],15);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"&copy; OpenStreetMap"}).addTo(map);
const markers=new Map();

parkingSpots.forEach(spot=>{
  const icon=L.divIcon({className:"",html:`<div style="background:${colors[spot.status]};color:white;width:32px;height:32px;border:3px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:bold;box-shadow:0 2px 8px #0005">${spot.id.slice(-2)}</div>`,iconSize:[32,32],iconAnchor:[16,16]});
  const marker=L.marker([spot.lat,spot.lng],{icon}).addTo(map);
  marker.bindTooltip(`${spot.id} - ${labels[spot.status]}`);
  marker.on("click",()=>selectSpot(spot.id,false));
  markers.set(spot.id,marker);
});

function getVisibleSpots(){
  const zone=$("zoneSelect").value;
  return parkingSpots.filter(spot=>{
    const matchesStatus=activeStatus==="all"||spot.status===activeStatus;
    const matchesZone=zone==="all"||spot.zone===zone;
    const text=`${spot.id} ${spot.address} ${spot.zone} ${labels[spot.status]}`.toLowerCase();
    return matchesStatus&&matchesZone&&text.includes(searchText);
  });
}

function render(){
  const visible=getVisibleSpots();
  $("resultCount").textContent=`${visible.length} resultados`;
  $("freeCount").textContent=parkingSpots.filter(s=>s.status==="free").length;
  $("occupiedCount").textContent=parkingSpots.filter(s=>s.status==="occupied").length;
  $("totalCount").textContent=parkingSpots.length;
  $("spotList").innerHTML=visible.length?visible.map(spot=>`
    <button class="spot ${selectedId===spot.id?"selected":""}" data-id="${spot.id}" type="button">
      <span class="spot-symbol ${spot.status}">${spot.status==="free"?"✓":spot.status==="occupied"?"×":spot.status==="unknown"?"?":spot.status==="reserved"?"R":"—"}</span>
      <span class="spot-info"><strong>${spot.address}</strong><small>${spot.zone} · ${spot.id}</small></span>
      <span class="spot-state">${labels[spot.status]}</span>
    </button>`).join(""):"<p>No hay plazas que coincidan con tu búsqueda.</p>";
  $("spotList").querySelectorAll("[data-id]").forEach(button=>button.addEventListener("click",()=>selectSpot(button.dataset.id,true)));
  const visibleIds=new Set(visible.map(s=>s.id));
  parkingSpots.forEach(spot=>{
    const marker=markers.get(spot.id);
    if(visibleIds.has(spot.id)){if(!map.hasLayer(marker))marker.addTo(map);}
    else if(map.hasLayer(marker))map.removeLayer(marker);
  });
}

function selectSpot(id,moveMap=true){
  const spot=parkingSpots.find(s=>s.id===id);
  if(!spot)return;
  selectedId=id;
  $("detailCard").innerHTML=`
    <button class="close" id="closeDetail" type="button" aria-label="Cerrar">×</button>
    <small>DETALLE DE PLAZA</small><h3>${spot.id}</h3>
    <p>${spot.address}<br>${spot.zone}, Barcelona</p>
    <p>Estado: <strong style="color:${colors[spot.status]}">${labels[spot.status]}</strong></p>
    <p>Distancia aproximada: ${spot.distance} m</p>
    <p>Actualización: ${spot.updated}</p>
    <a href="https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}" target="_blank" rel="noopener">Cómo llegar ↗</a>`;
  $("closeDetail").addEventListener("click",closeDetail);
  render();
  if(moveMap)map.panTo([spot.lat,spot.lng]);
}

function closeDetail(){
  selectedId=null;
  $("detailCard").innerHTML="<strong>Selecciona una plaza</strong><p>Pulsa un marcador del mapa o una plaza de la lista para ver sus detalles.</p>";
  render();
}

$("searchInput").addEventListener("input",event=>{searchText=event.target.value.trim().toLowerCase();render();});
$("zoneSelect").addEventListener("change",render);
$("filters").addEventListener("click",event=>{
  const button=event.target.closest("[data-status]");
  if(!button)return;
  activeStatus=button.dataset.status;
  document.querySelectorAll(".filters button").forEach(item=>item.classList.toggle("active",item===button));
  render();
});

$("locateBtn").addEventListener("click",()=>{
  if(!navigator.geolocation){alert("Tu navegador no permite obtener la ubicación.");return;}
  navigator.geolocation.getCurrentPosition(position=>{
    const lat=position.coords.latitude,lng=position.coords.longitude;
    map.setView([lat,lng],17);
    L.circleMarker([lat,lng],{radius:9,color:"white",weight:3,fillColor:"#2463eb",fillOpacity:1})
      .addTo(map).bindPopup("Tu ubicación").openPopup();
  },()=>alert("No se ha podido obtener tu ubicación. Revisa los permisos."));
});

render();
