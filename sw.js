/* ARCHIV · service worker : l'appli fonctionne sans réseau après la première ouverture. */
const PFX="archivp-v";const V=PFX+"1.3.5";
const SHELL=["./","index.html","manifest.webmanifest","icons/icon-180.png","icons/icon-192.png","icons/icon-512.png","icons/favicon-32.png"];
const CDN=["https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js","https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js","https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(async c=>{await c.addAll(SHELL.map(u=>new Request(u,{cache:"reload"})));
  await Promise.all(CDN.map(u=>fetch(u,{mode:"no-cors"}).then(r=>c.put(u,r)).catch(()=>{})));}).then(()=>self.skipWaiting()));});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith(PFX)&&k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",e=>{const req=e.request;if(req.method!=="GET")return;const url=new URL(req.url);
  if(req.mode==="navigate"){ // page : réseau d'abord (3 s), sinon la copie gardée
    e.respondWith(new Promise(res=>{let done=false;const fb=()=>caches.open(V).then(c=>c.match("index.html")).then(r=>{if(!done){done=true;res(r||Response.error());}});
      const t=setTimeout(fb,3000);fetch(req,{cache:"no-cache"}).then(r=>{clearTimeout(t);if(r&&r.ok){const cp=r.clone();caches.open(V).then(c=>c.put("index.html",cp));}if(!done){done=true;res(r);}}).catch(()=>{clearTimeout(t);fb();});}));return;}
  // bibliothèques, polices, icônes : copie gardée d'abord, mise à jour en arrière-plan
  e.respondWith(caches.open(V).then(c=>c.match(req)).then(hit=>{const net=fetch(req).then(r=>{if(r&&(r.ok||r.type==="opaque")){const cp=r.clone();caches.open(V).then(c=>c.put(req,cp));}return r;}).catch(()=>hit);
    return hit||net;}));});
