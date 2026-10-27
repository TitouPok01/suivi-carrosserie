const P=d=>`<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const IC={
  pcl:P('<path d="M3 21V9l9-6 9 6v12"/><path d="M8 21v-6h8v6"/>'),
  reparation:P('<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>'),
  finition:P('<path d="M12 3l1.8 4.7L18.5 9l-4.7 1.8L12 15.5l-1.8-4.7L5.5 9l4.7-1.3z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>'),
  controle:P('<path d="M9 3h6v3H9z"/><path d="M8 4H6a1 1 0 0 0-1 1v15a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-2"/><path d="M9 14l2 2 4-4"/>'),
  lavage:P('<path d="M12 3c3 4 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 3-7 6-11z"/>'),
  pret:P('<path d="M5 13l4 4L19 7"/>'),
  plus:P('<path d="M12 5v14M5 12h14"/>'),
  x:P('<path d="M6 6l12 12M18 6L6 18"/>'),
  arrow:P('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  urg:P('<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17v.5"/>'),
  late:P('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  truck:P('<path d="M2 7h11v9H2zM13 10h5l3 3v3h-8z"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>'),
  cam:P('<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>'),
  img:P('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 17l-5-5-9 8"/>'),
  check:P('<path d="M5 12l5 5 9-10"/>'),
  gear:P('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>'),
  send:P('<path d="M4 12l16-8-6 16-3-7z"/>'),
  bell:P('<path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>'),
  car:P('<path d="M5 16l1.5-5h11L19 16"/><path d="M3 16h18v3H3z"/><circle cx="7" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>')};
const STAGES=[
  {k:'pcl',l:'Entrée au PCL',c:'--s1'},{k:'reparation',l:'Réparation',c:'--s2'},{k:'finition',l:'Finition',c:'--s3'},
  {k:'controle',l:'Contrôle final',c:'--s4'},{k:'lavage',l:'Lavage',c:'--s5'},{k:'pret',l:'Prête',c:'--s6'}];
const OLD={reception:'pcl',demontage:'reparation',tolerie:'reparation',preparation:'reparation',peinture:'reparation',remontage:'reparation'};
const CAUSES=['Pièce en retard','Pièce manquante / erreur de commande','Attente accord expert','Dégâts en plus découverts','Chez un sous-traitant','Attente client','Trop de travail à l\'atelier','Autre'];
const QC=[['ajustage','Ajustage / alignement'],['peinture','Contrôle qualité peinture'],['teinte','Contrôle teinte du véhicule'],['diag','Mise sur ordinateur après réparation'],['camera','Contrôle calibrage caméra'],['phares','Réglage phares'],['ouvrants','Contrôle facilité ouverture/fermeture'],['finitions','Finitions'],['poussiere','Poussière vérifiée'],['brouillard','Brouillard vérifié'],['proprete','Qualité et propreté du travail/réparation']];
const WASH=[['ext','Extérieur lavé'],['int','Intérieur aspiré'],['vitres','Vitres et jantes'],['protect','Protections retirées']];
const ROLES={atelier:'Atelier',deviseur:'Deviseur'};
const MODELS=['911 Carrera','911 Carrera S','911 Carrera 4S','911 Turbo S','911 GT3','718 Cayman','718 Boxster','Taycan','Taycan 4S','Taycan Cross Turismo','Macan','Macan Electric','Cayenne','Cayenne E-Hybrid','Cayenne Coupé','Panamera','Panamera 4 E-Hybrid'];
const DEF_CFG={name:'Atelier carrosserie',staff:[]};

const S={vehicles:[],photos:[],tasks:[],messages:[],config:structuredClone(DEF_CFG),ready:false,offline:false,canWrite:true,
  sheet:null,lb:null,confirmDel:false,uploading:0,me:'',justDragged:0,kind:'piece',forR:'deviseur',seen:{}};
/* ---------- Supabase : mémoire commune ---------- */
const CFG=window.APP_CONFIG||{};
const sb=window.supabase.createClient(CFG.supabaseUrl,CFG.supabaseKey,{auth:{persistSession:true,autoRefreshToken:true}});
const BUCKET='photos';
const LISTS=['vehicles','tasks','messages','photos'];
function chk(res){if(res.error)throw res.error;return res.data}
function applyLocal(t,id,data,del){
  if(t==='config'){if(!del)S.config=normCfg(data||{});return}
  const arr=S[t];if(!arr)return;const i=arr.findIndex(x=>x.id===id);
  if(del){if(i>=0)arr.splice(i,1);return}
  const row={id,...data};if(i>=0)arr[i]=row;else arr.push(row);
}
function rawOf(t,id){if(t==='config')return S.config;const r=(S[t]||[]).find(x=>x.id===id);if(!r)return null;const {id:_,...d}=r;return d}
const now=()=>new Date().toISOString();
const db={
  doc(path){const [t,id]=path.split('/');return {
    async set(data){chk(await sb.from(t).upsert({id,data,updated_at:now()}));applyLocal(t,id,data);live()},
    async update(patch){const cur=rawOf(t,id);if(!cur)throw {code:'not_found'};const data={...cur,...patch};applyLocal(t,id,data);live();
      try{chk(await sb.from(t).update({data,updated_at:now()}).eq('id',id))}catch(e){loadAll().catch(()=>{});throw e}},
    async delete(){applyLocal(t,id,null,true);live();chk(await sb.from(t).delete().eq('id',id))}
  }},
  collection(t){return {async add(data){const id=crypto.randomUUID();chk(await sb.from(t).insert({id,data,updated_at:now()}));applyLocal(t,id,data);live();return {id}}}}
};
const assets={
  async upload(blob,{type}){const ext=type==='image/png'?'png':type==='image/webp'?'webp':type==='image/gif'?'gif':'jpg';
    const path=`${new Date().toISOString().slice(0,7)}/${crypto.randomUUID()}.${ext}`;
    chk(await sb.storage.from(BUCKET).upload(path,blob,{contentType:type,upsert:false,cacheControl:'31536000'}));return {id:path}},
  async delete(path){await sb.storage.from(BUCKET).remove([path])}
};
/* photo links are private: ask Supabase for temporary links, a batch at a time */
const URLS={};let urlBusy=false;
const BLANK='data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
function photoUrl(path){const u=URLS[path];if(u&&u.exp>Date.now())return u.url;queueUrls();return BLANK}
function queueUrls(){if(urlBusy)return;urlBusy=true;setTimeout(async()=>{
  const need=[...new Set(S.photos.map(p=>p.asset).filter(p=>p&&!(URLS[p]&&URLS[p].exp>Date.now())))];
  for(let i=0;i<need.length;i+=100){const part=need.slice(i,i+100);
    try{const {data}=await sb.storage.from(BUCKET).createSignedUrls(part,43200);const got=new Set();
      (data||[]).forEach(d=>{if(d&&d.signedUrl&&d.path){URLS[d.path]={url:d.signedUrl,exp:Date.now()+42000e3};got.add(d.path)}});
      part.forEach(p=>{if(!got.has(p))URLS[p]={url:BLANK,exp:Date.now()+60e3}})}
    catch(e){part.forEach(p=>URLS[p]={url:BLANK,exp:Date.now()+60e3})}}
  urlBusy=false;if(need.length)live()},40)}
try{S.me=localStorage.getItem('atelier.me')||''}catch(e){}
try{S.seen=JSON.parse(localStorage.getItem('atelier.seen')||'{}')||{}}catch(e){S.seen={}}

const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const online=()=>S.ready&&!S.offline;
const meOK=()=>!!S.me&&S.config.staff.some(p=>p.name===S.me);
const W=()=>online()&&meOK();
const stageOf=v=>STAGES.some(s=>s.k===v.stage)?v.stage:(OLD[v.stage]||'pcl');
const active=()=>S.vehicles.filter(v=>!v.delivered);
const byId=id=>S.vehicles.find(v=>v.id===id);
const sIdx=k=>Math.max(0,STAGES.findIndex(s=>s.k===k));
const st=k=>STAGES[sIdx(k)];
const cvar=k=>`--c:var(${st(k).c});--cbg:var(${st(k).c}-bg)`;
const myRole=()=>(S.config.staff.find(p=>p.name===S.me)||{}).role||'atelier';
const photosOf=id=>S.photos.filter(p=>p.vehicle===id&&!!p.asset).sort((a,b)=>(a.t||0)-(b.t||0));
const tasksOf=id=>S.tasks.filter(t=>t.vehicle===id).sort((a,b)=>(a.done-b.done)||(a.t||0)-(b.t||0));
const openTasks=id=>S.tasks.filter(t=>t.vehicle===id&&!t.done);
const allOpen=()=>S.tasks.filter(t=>!t.done&&byId(t.vehicle)&&!byId(t.vehicle).delivered);
const msgsOf=id=>S.messages.filter(m=>m.vehicle===id).sort((a,b)=>(a.t||0)-(b.t||0));
const unread=id=>msgsOf(id).filter(m=>(m.t||0)>(S.seen[id]||0)&&m.by!==S.me).length;
function todayISO(off=0){const d=new Date();d.setDate(d.getDate()+off);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function daysTo(iso){if(!iso)return null;const [y,m,d]=iso.split('-').map(Number);const t=new Date(y,m-1,d);const n=new Date();n.setHours(0,0,0,0);return Math.round((t-n)/864e5)}
function fmtDate(iso){if(!iso)return '';const [y,m,d]=iso.split('-').map(Number);return new Date(y,m-1,d).toLocaleDateString('fr-BE',{weekday:'long',day:'numeric',month:'short'})}
function fmtTime(t){return new Date(t).toLocaleString('fr-BE',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}
function dayTxt(iso){const d=daysTo(iso);return d===0?"Aujourd'hui":d===1?'Demain':d===-1?'Hier':fmtDate(iso)}
function overdue(v){const d=daysTo(v.due);return sIdx(stageOf(v))<2&&d!==null&&d<0}
function isLate(v){return !v.delivered&&((v.delay&&v.delay.on)||overdue(v))}
function soonOut(v){return !v.delivered&&stageOf(v)==='finition'}
function ago(t){const m=Math.round((Date.now()-t)/60000);if(m<1)return "à l'instant";if(m<60)return `il y a ${m} min`;const h=Math.round(m/60);if(h<24)return `il y a ${h} h`;return fmtTime(t)}
const initials=n=>esc(String(n||'?').trim().split(/\s+/).map(w=>w[0]||'').join('').slice(0,2).toUpperCase()||'?');
const whoName=n=>n?esc(n):"Quelqu'un";
const ckOn=x=>!!x;const ckWho=x=>x&&typeof x==='object'?`<small class="ck-who">${whoName(x.by)} · ${fmtTime(x.t)}</small>`:'';
function addDays(iso,n){const [y,m,d]=iso.split('-').map(Number);const t=new Date(y,m-1,d+n);return t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0')}
function dlTxt(n){return n<7||n%7?n+' j':(n/7)+' sem.'}
function fmtShort(iso){const [y,m,d]=iso.split('-').map(Number);return new Date(y,m-1,d).toLocaleDateString('fr-BE',{weekday:'short',day:'numeric',month:'short'})}
function dueLine(v,big){
  if(!v.due||v.delivered)return '';const k=stageOf(v);const d=daysTo(v.due);
  if(sIdx(k)>=2)return '';
  const warn=d<=1;const when=d===0?"aujourd'hui":d===1?'demain':d<0?`prévue ${big?'le '+fmtDate(v.due):fmtShort(v.due)} (+${-d} j)`:(big?'le '+fmtDate(v.due):fmtShort(v.due));
  const txt=d<0?when.charAt(0).toUpperCase()+when.slice(1):`Finie pour ${when}`;
  return `<span class="${big?'due-big':'due'} ${warn?'warn':''}">${IC.late}${esc(txt)}</span>`;
}
function plate(p,big){return `<span class="plate${big?' big':''}"><span class="eu">B</span><span class="pt">${esc(p||'—')}</span></span>`}
function normPlate(p){p=String(p||'').toUpperCase().replace(/[\s.]/g,'');const m=p.replace(/-/g,'').match(/^(\d)([A-Z]{3})(\d{3})$/);return m?`${m[1]}-${m[2]}-${m[3]}`:p}
function toastUndo(msg,fn){const r=$('#toast-root');r.innerHTML=`<div class="toast undo" role="status"><span>${esc(msg)}</span><button type="button" id="undo-btn">Annuler</button></div>`;
  const b=$('#undo-btn');b.onclick=async()=>{r.innerHTML='';clearTimeout(toast.t);await fn()};clearTimeout(toast.t);toast.t=setTimeout(()=>r.innerHTML='',6000)}
function toast(msg){const r=$('#toast-root');r.innerHTML=`<div class="toast" role="status">${esc(msg)}</div>`;clearTimeout(toast.t);toast.t=setTimeout(()=>r.innerHTML='',2600)}
function dbErr(e){const c=e&&e.code;if(c==='quota_exceeded')return "Stockage plein : supprimez d'anciennes voitures livrées.";if(c==='invalid_argument')return "Vous n'avez pas le droit de modifier.";return 'Pas enregistré. Réessayez.'}
function markSeen(id){S.seen[id]=Date.now();try{localStorage.setItem('atelier.seen',JSON.stringify(S.seen))}catch(e){}}
const signer=()=>S.me||'';

const queues={};
function q(path,fn){const p=(queues[path]||Promise.resolve()).then(fn,fn);queues[path]=p.catch(()=>{});return p}
function askName(){S.viewOnly=false;render();toast('Choisissez d\'abord votre nom')}
async function patch(id,data,ev){
  if(!W()){askName();return}
  const v=byId(id);if(!v)return;const upd={...data,updatedAt:Date.now(),updatedBy:signer()};
  if(ev===undefined&&Object.keys(data).length)ev='Fiche modifiée';
  if(ev){const h=(v.history||[]).slice(-49);h.push({t:Date.now(),by:signer(),txt:ev});upd.history=h}
  try{await q('vehicles/'+id,()=>db.doc('vehicles/'+id).update(upd))}catch(e){toast(dbErr(e))}
}
async function saveConfig(cfg){if(!online())return;cfg={...cfg,updatedBy:signer(),updatedAt:Date.now()};try{await q('config/main',()=>db.doc('config/main').set(cfg));toast('Enregistré')}catch(e){toast(dbErr(e))}}

/* actions */
async function moveStage(id,k,undo){const v=byId(id);if(!v||stageOf(v)===k)return;const prev=stageOf(v);await patch(id,{stage:k},undo?`Annulé : retour à ${st(k).l}`:`Étape : ${st(k).l}`);
  if(undo)toast(`${v.plate} remise en ${st(k).l}`);else toastUndo(`${v.plate} → ${st(k).l}`,()=>moveStage(id,prev,true))}
async function deliver(id){const v=byId(id);await patch(id,{delivered:true,deliveredAt:Date.now()},'Livrée au client');S.sheet=null;render();toast(`${v.plate} livrée 👍`)}
async function addVehicle(f){
  if(!W())return;
  const doc={plate:normPlate(f.plate),model:f.model.trim(),color:'',client:'',damages:f.damages.trim(),due:f.due||'',back:'',transport:'',stage:'pcl',
    delay:{on:false,cause:'',note:''},qc:{},wash:{},delivered:false,createdAt:Date.now(),updatedAt:Date.now(),history:[{t:Date.now(),by:signer(),txt:'Entrée au PCL'}]};
  try{const ref=await db.collection('vehicles').add(doc);S.sheet={mode:'detail',id:ref.id,tab:'photos'};markSeen(ref.id);render();toast('Voiture ajoutée. Prenez les photos d\'entrée.')}catch(e){toast(dbErr(e))}
}
async function addTask(vid,text,kind,forR){
  if(!W()){askName();return false}if(!text.trim())return false;if(!byId(vid)){toast('Choisissez la voiture.');return false}
  try{await db.collection('tasks').add({vehicle:vid,text:text.trim(),kind,for:forR,by:signer(),role:myRole(),t:Date.now(),done:false});
    await patch(vid,{},`Urgence : ${text.trim()}`);toast('Urgence ajoutée');return true}catch(e){toast(dbErr(e));return false}
}
async function toggleTask(tid){const t=S.tasks.find(x=>x.id===tid);if(!t)return;if(!W()){askName();return}const done=!t.done;
  try{await q('tasks/'+tid,()=>db.doc('tasks/'+tid).update({done,doneBy:done?signer():'',doneAt:done?Date.now():0}));if(done){await patch(t.vehicle,{},`Urgence réglée : ${t.text}`);toast('Réglé ✓')}else{await patch(t.vehicle,{},`Urgence rouverte : ${t.text}`)}}catch(e){toast(dbErr(e))}}
async function sendMsg(vid,text){if(!W()){askName();return false}if(!text.trim())return false;
  try{await db.collection('messages').add({vehicle:vid,text:text.trim(),by:signer(),role:myRole(),t:Date.now()});markSeen(vid);const tx=text.trim();await patch(vid,{},`Message : ${tx.length>60?tx.slice(0,60)+'…':tx}`);return true}catch(e){toast(dbErr(e));return false}}
async function deleteVehicle(id){
  for(const p of photosOf(id)){try{await db.doc('photos/'+p.id).delete()}catch(e){} if(assets){try{await assets.delete(p.asset)}catch(e){}}}
  for(const t of S.tasks.filter(t=>t.vehicle===id)){try{await db.doc('tasks/'+t.id).delete()}catch(e){}}
  for(const m of msgsOf(id)){try{await db.doc('messages/'+m.id).delete()}catch(e){}}
  try{await db.doc('vehicles/'+id).delete();S.sheet=null;render();toast('Voiture supprimée')}catch(e){toast(dbErr(e))}
}
async function shrink(file){
  try{const bmp=await createImageBitmap(file);const s=Math.min(1,1800/Math.max(bmp.width,bmp.height));
    const c=document.createElement('canvas');c.width=Math.round(bmp.width*s);c.height=Math.round(bmp.height*s);
    c.getContext('2d').drawImage(bmp,0,0,c.width,c.height);
    const b=await new Promise((res,rej)=>c.toBlob(x=>x?res(x):rej(new Error('blob')),'image/jpeg',.82));return {blob:b,type:'image/jpeg'}}
  catch(e){const ok=['image/png','image/jpeg','image/webp','image/gif'];return {blob:file,type:ok.includes(file.type)?file.type:'image/jpeg'}}
}
async function uploadPhotos(id,files){
  if(!assets){toast("Photos indisponibles avec votre accès.");return}
  const v=byId(id);if(!v)return;let n=0;S.uploading+=files.length;renderSheet();
  for(const f of files){
    try{const {blob,type}=await shrink(f);const r=await assets.upload(blob,{type});
      await db.collection('photos').add({vehicle:id,asset:r.id,stage:stageOf(v),by:signer(),t:Date.now()});n++}
    catch(e){const c=e&&e.code;toast(c==='too_large'?'Photo trop lourde.':c==='quota_or_state'?'Stockage photos plein.':"Photo pas envoyée. Réessayez.")}
    finally{S.uploading--;renderSheet()}
  }
  if(n){await patch(id,{},`${n} photo${n>1?'s':''} (${st(stageOf(v)).l})`);toast(`${n} photo${n>1?'s':''} ajoutée${n>1?'s':''}`)}
}
async function deletePhoto(pid){const p=S.photos.find(x=>x.id===pid);if(!p)return;if(!W()){askName();return}
  try{await db.doc('photos/'+pid).delete()}catch(e){toast(dbErr(e));return}
  if(assets){try{await assets.delete(p.asset)}catch(e){}}await patch(p.vehicle,{},'Photo supprimée');S.lb=null;render();toast('Photo supprimée')}
async function loadExamples(){
  const ex=[
    ['1-GTS-911','911 Carrera S','Gris craie','Choc avant droit : pare-chocs, aile, phare, capteur de stationnement.','reparation',5,'',null,[['Phare avant droit : confirmer la référence','piece','deviseur']],['Phare commandé ce matin, livré jeudi.','deviseur']],
    ['2-MCN-404','Macan','Bleu gentiane','Rayure profonde porte arrière gauche.','pcl',8,'',null,[],null],
    ['1-TAY-220','Taycan 4S','Blanc','Hayon enfoncé, pare-chocs arrière, radar à recalibrer.','finition',1,todayISO(1),null,[['Calibrage radar à planifier','action','atelier']],["Finie demain midi, rapatriement possible l'après-midi.",'atelier']],
    ['1-CYN-118','Cayenne E-Hybrid','Noir','Grêle sur capot et toit, environ 40 impacts.','reparation',-2,'',{on:true,cause:'Attente accord expert',note:'Supplément toit envoyé le 20/10'},[["Relancer l'expert",'action','deviseur']],null],
    ['2-PAN-731','Panamera 4','Argent','Jante avant gauche voilée, bas de pare-chocs.','controle',0,todayISO(0),null,[],null],
    ['1-BXT-982','718 Cayman','Jaune','Aile arrière gauche et bouclier.','lavage',0,'',null,[],null]];
  try{for(const [p,m,c,dmg,s,d,back,delay,tasks,msg] of ex){
    const ref=await db.collection('vehicles').add({plate:p,model:m,color:c,client:'',damages:dmg,due:todayISO(d),back,transport:back?'Plateau':'',stage:s,
      delay:delay||{on:false,cause:'',note:''},qc:s==='lavage'?Object.fromEntries(QC.map(x=>[x[0],true])):{},wash:{},example:true,delivered:false,
      createdAt:Date.now(),updatedAt:Date.now(),history:[{t:Date.now(),by:'',txt:"Voiture d'exemple"}]});
    for(const [txt,kind,fr] of tasks)await db.collection('tasks').add({vehicle:ref.id,text:txt,kind,for:fr,by:'',role:'',t:Date.now(),done:false});
    if(msg)await db.collection('messages').add({vehicle:ref.id,text:msg[0],by:'',role:msg[1],t:Date.now()});
  }toast('Exemples chargés')}catch(e){toast(dbErr(e))}
}
async function clearExamples(){for(const v of S.vehicles.filter(v=>v.example)){
  for(const t of S.tasks.filter(t=>t.vehicle===v.id)){try{await db.doc('tasks/'+t.id).delete()}catch(e){}}
  for(const m of msgsOf(v.id)){try{await db.doc('messages/'+m.id).delete()}catch(e){}}
  try{await db.doc('vehicles/'+v.id).delete()}catch(e){}}toast('Exemples supprimés')}

/* render */
function render(){$('#atelier-name').textContent=S.config.name||'Atelier carrosserie';renderPicker();renderTop();renderNote();renderAlerts();renderView();renderSheet();renderLb()}
function renderTop(){
  const sf=S.config.staff;
  $('#top-r').innerHTML=`${sf.length?`<label class="who${S.me?'':' need'}">Je suis<select id="me-sel"><option value="">Choisir</option>${sf.map(p=>`<option value="${esc(p.name)}" ${p.name===S.me?'selected':''}>${esc(p.name)}</option>`).join('')}</select></label>`:''}
    ${installEvt?`<button class="btn" data-act="install">Installer l'appli</button>`:''}
    ${S.push==='off'?`<button class="btn" data-act="push-on">${IC.bell}Notifications</button>`:''}
    <button class="btn icon-only" data-act="settings" aria-label="Réglages" title="Réglages">${IC.gear}</button>
    ${W()?`<button class="btn go" data-act="add">${IC.plus}Nouvelle voiture</button>`:''}`;
}
function renderPicker(){
  const r=$('#pick-root');if(!r)return;
  if(!online()||meOK()||S.viewOnly||(S.sheet&&S.sheet.mode==='settings')){r.innerHTML='';return}
  const sf=S.config.staff;
  r.innerHTML=`<div class="picker"><div class="picker-card"><h1>Qui êtes-vous ?</h1>
    ${sf.length?`<p class="muted">Touchez votre nom. Toutes vos actions seront signées avec.</p>
      <div class="names">${sf.map(p=>`<button class="name-btn" data-pickme="${esc(p.name)}"><span class="av">${initials(p.name)}</span><span><b>${esc(p.name)}</b><small>${esc(ROLES[p.role]||'')}</small></span></button>`).join('')}</div>`
      :`<p class="muted">Ajoutez d'abord l'équipe (carrossiers et deviseur) pour pouvoir signer les actions.</p><button class="btn go" data-act="settings">${IC.gear}Ajouter l'équipe</button>`}
    <button class="btn ghost-btn" data-act="viewonly">Juste regarder, sans rien modifier</button></div></div>`;
}
function renderNote(){
  let h='';
  if(S.offline)h=`<div class="note warn">Pas de connexion internet. Vérifiez le wifi de la tablette.</div>`;
  else if(!S.canWrite)h=`<div class="note">Vous pouvez regarder, mais pas modifier.</div>`;
  else if(online()&&!meOK()&&S.viewOnly)h=`<div class="note">👀 Mode lecture : vous ne pouvez rien modifier.<button class="btn sm" data-act="pick" style="background:var(--bg)">Choisir mon nom</button></div>`;
  $('#note').innerHTML=h;
}
function renderAlerts(){
  const a=active();const u=allOpen().length;const l=a.filter(isLate).length;const o=a.filter(soonOut).length;
  if(!S.ready||!S.vehicles.length){$('#alerts').innerHTML='';return}
  $('#alerts').innerHTML=`
    <button class="alert urg ${u?'on':''}" data-list="urg"><span class="ic">${IC.urg}</span><span><b>${u}</b><span>${u===1?'Urgence':'Urgences'}</span></span></button>
    <button class="alert late ${l?'on':''}" data-list="late"><span class="ic">${IC.late}</span><span><b>${l}</b><span>En retard</span></span></button>
    <button class="alert out ${o?'on':''}" data-list="out"><span class="ic">${IC.truck}</span><span><b>${o}</b><span>Bientôt finies</span></span></button>`;
}
function card(v){
  const k=stageOf(v);const nx=STAGES[sIdx(k)+1];const ot=openTasks(v.id).length;const un=unread(v.id);
  const pills=[ot?`<span class="pill urg">Urgent</span>`:'',isLate(v)?`<span class="pill late">Retard${v.delay&&v.delay.on&&v.delay.days?' +'+dlTxt(v.delay.days):''}</span>`:'',un?`<span class="pill msg">${un} message${un>1?'s':''}</span>`:'',
    v.example?'<span class="pill ex">Exemple</span>':''].join('');
  const last=photosOf(v.id).slice(-1)[0];
  const nextBtn=W()?(nx?`<button class="card-next" style="--nc:var(${nx.c});--nbg:var(${nx.c}-bg)" data-next="${esc(v.id)}" aria-label="Passer à ${nx.l}">${nx.l} ${IC.arrow}</button>`
    :`<button class="card-next" style="--nc:var(--s6);--nbg:var(--s6-bg)" data-deliver="${esc(v.id)}" aria-label="Livrée au client">${IC.check} Livrée</button>`):'';
  return `<article class="card"><button class="card-open" data-open="${esc(v.id)}" ${W()?`data-drag="${esc(v.id)}"`:''}><span class="card-top">${plate(v.plate)}${last?`<img class="thumb" src="${photoUrl(last.asset)}" alt="" loading="lazy" draggable="false">`:''}</span><span class="model">${esc(v.model||'')}</span>${dueLine(v,false)}${pills?`<span class="pills">${pills}</span>`:''}</button>${nextBtn}</article>`;
}
function renderView(){
  const el=$('#view');
  if(!S.ready&&!S.offline){el.innerHTML=`<div class="empty"><p>Chargement…</p></div>`;return}
  const a=active();
  if(!a.length){el.innerHTML=`<div class="empty"><span class="big-ic">${IC.car}</span><h2>Aucune voiture</h2><p>Quand une voiture arrive au PCL, appuyez sur « Nouvelle voiture ».</p>
    ${W()?`<div class="acts"><button class="btn go" data-act="add">${IC.plus}Nouvelle voiture</button>${!S.vehicles.length?`<button class="btn" data-act="examples">Voir avec des exemples</button>`:''}</div>`:''}</div>${doneList()}`;return}
  el.innerHTML=`<div class="board">${STAGES.map(s=>{const vs=a.filter(v=>stageOf(v)===s.k).sort((x,y)=>(x.due||'9').localeCompare(y.due||'9'));
    return `<section class="col" style="${cvar(s.k)}" data-col="${s.k}"><div class="col-h"><span class="dot">${IC[s.k]}</span><h2>${s.l}</h2><span class="n">${vs.length}</span></div>
      ${vs.map(card).join('')||'<div class="col-empty">Vide</div>'}</section>`}).join('')}</div>${doneList()}`;
}
function doneList(){const d=S.vehicles.filter(v=>v.delivered).sort((x,y)=>(y.deliveredAt||0)-(x.deliveredAt||0)).slice(0,15);
  return d.length?`<details class="done" style="margin-top:22px"><summary>Voitures livrées (${d.length})</summary><div class="items" style="padding:0 14px 14px">${d.map(v=>`<button class="row" data-open="${esc(v.id)}" style="background:var(--bg)">${plate(v.plate)}<span class="txt"><b>${esc(v.model)}</b><span>Livrée le ${v.deliveredAt?fmtTime(v.deliveredAt):''}</span></span></button>`).join('')}</div></details>`:''}

function renderSheet(){
  const root=$('#sheet-root');const sh=S.sheet;
  if(!sh){root.innerHTML='';return}
  const ae=document.activeElement;
  if(root.contains(ae)&&/INPUT|TEXTAREA/.test(ae.tagName)&&ae.type!=='file'){S.sheetDirty=true;return}
  const old=root.querySelector('.sheet');const scroll=old?old.scrollTop:0;
  let body='';
  if(sh.mode==='add')body=addForm();
  else if(sh.mode==='settings')body=settingsForm();
  else if(sh.mode==='list')body=listSheet(sh.kind);
  else{const v=byId(sh.id);if(!v){S.sheet=null;root.innerHTML='';return}body=detail(v);if((sh.tab||'infos')==='msg')markSeen(v.id)}
  root.innerHTML=`<div class="scrim" data-act="close"></div><aside class="sheet${sh.keep?'':' anim'}" role="dialog" aria-modal="true">${body}</aside>`;
  const s=root.querySelector('.sheet');if(sh.keep)s.scrollTop=sh.toBottom?s.scrollHeight:scroll;sh.keep=true;sh.toBottom=false;
}
function closeBtn(){return `<button class="close" data-act="close" aria-label="Fermer">${IC.x}</button>`}
function detail(v){
  const k=stageOf(v);const i=sIdx(k);const nx=STAGES[i+1];const w=W();const dis=w?'':'disabled';const tab=S.sheet.tab||'infos';
  const ot=openTasks(v.id).length;const ms=msgsOf(v.id).length;const un=unread(v.id);const ph=photosOf(v.id);
  const head=`<div class="sh-top"><div class="t">${plate(v.plate,true)}<h2>${esc(v.model||'')}${v.color?` <span style="font-weight:400;color:var(--ink-2);font-size:16px">· ${esc(v.color)}</span>`:''}</h2>${dueLine(v,true)}</div>${closeBtn()}</div>
  <div class="steps">${STAGES.map((s,j)=>`<button class="step ${j<i?'done':j===i?'cur':''}" style="${cvar(s.k)}" data-stage="${s.k}" ${dis} aria-label="${s.l}"><span class="c">${IC[s.k]}</span>${s.l}</button>`).join('')}</div>
  ${v.delivered?`<div class="flag done">${IC.check}<span>Livrée${v.deliveredAt?' le '+fmtTime(v.deliveredAt):''}</span>${w?`<button class="btn sm" data-restore="${esc(v.id)}" style="margin-left:auto;background:var(--bg)">Remettre</button>`:''}</div>`
   :w?`<div class="go-row">${nx?`<button class="big-go" style="${cvar(nx.k)}" data-next="${esc(v.id)}">Passer à : ${nx.l} ${IC.arrow}</button>`:`<button class="big-go" style="${cvar('pret')}" data-deliver="${esc(v.id)}">${IC.check} Livrée au client</button>`}
     ${assets?`<label class="cam-btn upl" title="Prendre une photo">${IC.cam}${S.uploading?'Envoi…':'Photo'}<input type="file" accept="image/*" capture="environment" data-upload="${esc(v.id)}"></label>`:''}</div>`:''}
  ${(()=>{const h=(v.history||[]).slice(-1)[0];return h?`<button class="last" data-tab="hist"><span class="av">${initials(h.by||'?')}</span><span><b>${whoName(h.by)}</b> · ${esc(h.txt)}</span><time>${esc(ago(h.t))}</time></button>`:''})()}
  ${isLate(v)?`<div class="flag late">${IC.late}<span><b>En retard${v.delay&&v.delay.on&&v.delay.days?' de '+dlTxt(v.delay.days):''}</b> · ${v.delay&&v.delay.on&&v.delay.cause?esc(v.delay.cause):'cause à indiquer dans Infos'}</span></div>`:''}
  <div class="tabs" role="tablist">
    <button role="tab" data-tab="infos" aria-selected="${tab==='infos'}">Infos</button>
    <button role="tab" data-tab="urg" aria-selected="${tab==='urg'}">Urgences${ot?`<span class="n red">${ot}</span>`:''}</button>
    <button role="tab" data-tab="msg" aria-selected="${tab==='msg'}">Messages${un?`<span class="n blue">${un}</span>`:ms?`<span class="n">${ms}</span>`:''}</button>
    <button role="tab" data-tab="ctrl" aria-selected="${tab==='ctrl'}">Contrôle</button>
    <button role="tab" data-tab="photos" aria-selected="${tab==='photos'}">Photos${ph.length?`<span class="n">${ph.length}</span>`:''}</button>
    <button role="tab" data-tab="hist" aria-selected="${tab==='hist'}">Historique</button>
  </div>`;
  let pane='';
  if(tab==='infos'){const dl=v.delay||{};const od=overdue(v);const hist=[...(v.history||[])].reverse();
    pane=`<label class="f">Dégâts<textarea id="d-damages" placeholder="Qu'est-ce qui est abîmé ?" ${dis}>${esc(v.damages||'')}</textarea></label>
    <div class="two"><label class="f">Finie pour le<input type="date" id="d-due" value="${esc(v.due||'')}" ${dis}></label>
      <label class="f">Rapatriement le<input type="date" id="d-back" value="${esc(v.back||'')}" ${dis}></label></div>
    <label class="f">Transport<input id="d-transport" value="${esc(v.transport||'')}" placeholder="Plateau, chauffeur…" ${dis}></label>
    <button class="toggle ${dl.on?'on':''}" data-act="delay" ${dis}><span class="k"></span>${dl.on?'En retard':'Signaler un retard'}</button>
    ${dl.on||od?`<div class="two"><label class="f">Pourquoi ?<select id="d-cause" ${dis}><option value="">Choisir</option>${CAUSES.map(c=>`<option ${dl.cause===c?'selected':''}>${esc(c)}</option>`).join('')}</select></label>
      <label class="f">Détail<input id="d-cnote" value="${esc(dl.note||'')}" placeholder="Ex. livré lundi" ${dis}></label></div>
      <p class="lbl">De combien ?</p><div class="delays">${[1,2,3,7,14].map(n=>`<button class="${(dl.days||0)===n?'on':''}" data-delay="${n}" ${dis}>+${dlTxt(n)}</button>`).join('')}</div>
      ${dl.days&&dl.origDue?`<p class="muted" style="margin:0;font-size:14px">Finie pour le ${esc(fmtDate(v.due))} au lieu du ${esc(fmtDate(dl.origDue))}</p>`:''}`:''}
    <div class="two"><label class="f">Couleur<input id="d-color" value="${esc(v.color||'')}" ${dis}></label><label class="f">N° de dossier<input id="d-client" value="${esc(v.client||'')}" ${dis}></label></div>
    ${w?(S.confirmDel?`<div class="confirm">Supprimer cette voiture ?<button class="btn red sm" data-del="${esc(v.id)}">Oui, supprimer</button><button class="btn sm" data-act="nodel" style="background:var(--bg)">Non</button></div>`:`<button class="btn red sm" data-act="askdel" style="align-self:flex-start">Supprimer la voiture</button>`):''}`;}
  else if(tab==='urg'){const ts=tasksOf(v.id);
    pane=`${ts.length?`<div class="items">${ts.map(t=>taskItem(t,false)).join('')}</div>`:`<p class="muted" style="margin:0">Rien d'urgent pour cette voiture.</p>`}
    ${w?`<form class="add" id="task-form"><input id="t-text" placeholder="Ex. clip de pare-chocs à commander" autocomplete="off">${choices()}<button class="btn go" type="submit">${IC.plus}Ajouter l'urgence</button></form>`:''}`;}
  else if(tab==='msg'){const msgs=msgsOf(v.id);
    pane=`<div class="chat">${msgs.map(m=>`<div class="bubble ${m.role==='deviseur'?'dev':''} ${m.by&&m.by===S.me?'mine':''}"><span class="by">${esc(m.by||ROLES[m.role]||'')}${m.role&&m.by?' · '+ROLES[m.role]:''} · ${fmtTime(m.t||0)}</span>${esc(m.text)}</div>`).join('')||`<p class="muted" style="margin:0">Pas encore de message. Écrivez ${myRole()==='deviseur'?"à l'atelier":'au deviseur'} ici.</p>`}</div>
    ${w?`<form class="say" id="msg-form"><textarea id="m-text" rows="1" placeholder="Écrire un message…"></textarea><button class="btn go icon-only" type="submit" aria-label="Envoyer">${IC.send}</button></form>`:''}`;}
  else if(tab==='ctrl'){const qc=v.qc||{};const wa=v.wash||{};const qn=QC.filter(x=>qc[x[0]]).length;const wn=WASH.filter(x=>wa[x[0]]).length;
    pane=`<p class="lbl">Contrôle final · ${qn}/${QC.length}</p><div class="checks">${QC.map(([kk,l])=>`<button class="chk-row ${qc[kk]?'on':''}" data-qc="${kk}" ${dis}><span class="box-ck ${qc[kk]?'on':''}">${qc[kk]?IC.check:''}</span><span class="ck-l">${esc(l)}${ckWho(qc[kk])}</span></button>`).join('')}</div>
    ${w&&k==='controle'&&qn===QC.length?`<button class="big-go" style="${cvar('lavage')}" data-stagego="lavage">Contrôle OK → Lavage ${IC.arrow}</button>`:''}
    <p class="lbl">Lavage · ${wn}/${WASH.length}</p><div class="checks">${WASH.map(([kk,l])=>`<button class="chk-row ${wa[kk]?'on':''}" data-wash="${kk}" ${dis}><span class="box-ck ${wa[kk]?'on':''}">${wa[kk]?IC.check:''}</span><span class="ck-l">${esc(l)}${ckWho(wa[kk])}</span></button>`).join('')}</div>
    ${w&&k==='lavage'&&wn===WASH.length?`<button class="big-go" style="${cvar('pret')}" data-stagego="pret">Lavage fait → Prête ${IC.arrow}</button>`:''}`;}
  else if(tab==='hist'){const hist=[...(v.history||[])].reverse();
    pane=hist.length?`<ul class="timeline">${hist.map(h=>`<li><span class="av">${initials(h.by||'?')}</span><span class="tl-b"><b>${whoName(h.by)}</b><span>${esc(h.txt)}</span><time>${fmtTime(h.t)} · ${esc(ago(h.t))}</time></span></li>`).join('')}</ul>`:`<p class="muted" style="margin:0">Aucune action pour l'instant.</p>`;}
  else{pane=`${assets&&w?`<div class="photo-btns"><label class="btn go upl">${IC.cam}Photo<input type="file" accept="image/*" capture="environment" data-upload="${esc(v.id)}"></label>
      <label class="btn upl">${IC.img}Galerie<input type="file" accept="image/*" multiple data-upload="${esc(v.id)}"></label></div>`:''}
    ${S.uploading?`<p class="muted" style="margin:0">Envoi de ${S.uploading} photo${S.uploading>1?'s':''}…</p>`:''}
    ${ph.length?`<div class="photos">${ph.slice().reverse().map(p=>`<button class="ph" data-lb="${esc(p.id)}"><img src="${photoUrl(p.asset)}" alt="" loading="lazy"><span>${esc(st(OLD[p.stage]||p.stage||'pcl').l)}${p.by?' · '+esc(p.by):''}</span></button>`).join('')}</div>`:`<p class="muted" style="margin:0">Pas encore de photo.</p>`}`;}
  return head+`<div class="pane">${pane}</div>`;
}
function choices(){return `<div class="choice">${[['piece','Pièce à commander'],['action','Chose à faire']].map(([k,l])=>`<button type="button" data-kind="${k}" aria-pressed="${S.kind===k}">${l}</button>`).join('')}</div>
  <div class="choice">${Object.entries(ROLES).map(([k,l])=>`<button type="button" data-forr="${k}" aria-pressed="${S.forR===k}">Pour ${l.toLowerCase()}</button>`).join('')}</div>`}
function taskItem(t,withCar){const v=byId(t.vehicle);
  return `<div class="item ${t.done?'done':'red'}"><button class="box-ck ${t.done?'on':''}" data-task="${esc(t.id)}" aria-label="Réglé" ${W()?'':'disabled'}>${t.done?IC.check:''}</button>
    <span class="txt"><b>${esc(t.text)}</b><span>${withCar&&v?esc(v.plate)+' · '+esc(v.model)+' · ':''}${t.kind==='piece'?'Pièce à commander':'À faire'} · pour <b>${esc((ROLES[t.for]||'').toLowerCase())}</b></span>
      <span class="who-line">Demandée par <b>${whoName(t.by)}</b> · ${fmtTime(t.t||0)}</span>
      ${t.done?`<span class="who-line ok">✓ Réglée par <b>${whoName(t.doneBy)}</b>${t.doneAt?' · '+fmtTime(t.doneAt):''}</span>`:''}</span>
    ${withCar&&v?`<button class="btn sm" data-open="${esc(v.id)}" style="background:var(--bg)">Voir</button>`:''}</div>`}
function listSheet(kind){
  const a=active();
  if(kind==='urg'){const ts=allOpen();
    return `<div class="sh-top"><div class="t"><h2>Urgences</h2><p>Pièces à commander et choses à faire vite.</p></div>${closeBtn()}</div>
    ${ts.length?`<div class="items">${ts.map(t=>taskItem(t,true)).join('')}</div>`:`<p class="muted" style="margin:0">Rien d'urgent 👍</p>`}
    ${W()&&a.length?`<form class="add" id="quick-form"><p class="lbl">Nouvelle urgence</p><select id="q-veh">${a.map(v=>`<option value="${esc(v.id)}">${esc(v.plate)} · ${esc(v.model)}</option>`).join('')}</select>
      <input id="q-text" placeholder="Qu'est-ce qui est urgent ?" autocomplete="off">${choices()}<button class="btn go" type="submit">${IC.plus}Ajouter</button></form>`:''}
    ${(()=>{const done=S.tasks.filter(t=>t.done&&t.doneAt&&Date.now()-t.doneAt<36e5*24).sort((x,y)=>y.doneAt-x.doneAt);return done.length?`<p class="lbl">Réglées ces dernières 24 h</p><div class="items">${done.map(t=>taskItem(t,true)).join('')}</div>`:''})()}`;}
  if(kind==='late'){const ls=a.filter(isLate).sort((x,y)=>(x.due||'9').localeCompare(y.due||'9'));
    return `<div class="sh-top"><div class="t"><h2>En retard</h2><p>Et pourquoi.</p></div>${closeBtn()}</div>
    <div class="items">${ls.map(v=>{const c=v.delay&&v.delay.on&&v.delay.cause;return `<button class="row" data-open="${esc(v.id)}">${plate(v.plate)}<span class="txt"><b>${esc(v.model)}</b><span style="${c?'':'color:var(--orange);font-weight:600'}">${c?(v.delay.days?'+'+dlTxt(v.delay.days)+' · ':'')+esc(v.delay.cause)+(v.delay.note?' · '+esc(v.delay.note):''):'Pourquoi ? À indiquer'}</span></span>${v.due?`<span class="when late">${esc(dayTxt(v.due))}</span>`:''}</button>`}).join('')||'<p class="muted" style="margin:0">Aucune voiture en retard 👍</p>'}</div>`;}
  const os=a.filter(soonOut).sort((x,y)=>(x.back||x.due||'9').localeCompare(y.back||y.due||'9'));
  return `<div class="sh-top"><div class="t"><h2>Bientôt finies</h2><p>Pour organiser les sorties et les rapatriements.</p></div>${closeBtn()}</div>
  <div class="items">${os.map(v=>`<button class="row" data-open="${esc(v.id)}">${plate(v.plate)}<span class="txt"><b>${esc(v.model)}</b><span>${esc(st(stageOf(v)).l)}${v.transport?' · '+esc(v.transport):''}</span></span><span class="when">${stageOf(v)==='reparation'?'Sort '+esc(dayTxt(v.due).toLowerCase()):v.back?'Retour '+esc(dayTxt(v.back).toLowerCase()):'Retour à fixer'}</span></button>`).join('')||'<p class="muted" style="margin:0">Aucune voiture ne sort bientôt de la carrosserie.</p>'}</div>`;
}
function addForm(){
  return `<div class="sh-top"><div class="t"><h2>Nouvelle voiture</h2><p>Entrée au PCL</p></div>${closeBtn()}</div>
  <form id="add-form" class="pane">
    <label class="f">Plaque<input id="a-plate" name="plate" required placeholder="1-ABC-123" autocomplete="off" style="font-family:var(--f-mono);font-size:20px;text-transform:uppercase;color:var(--plate-red)"></label>
    <label class="f">Modèle<input id="a-model" name="model" list="models" required placeholder="911 Carrera S"></label>
    <label class="f">Dégâts<textarea id="a-damages" name="damages" required placeholder="Ex. choc avant droit : pare-chocs, aile, phare"></textarea></label>
    <label class="f">Finie pour le<input id="a-due" name="due" type="date" min="${todayISO()}"></label>
    <datalist id="models">${MODELS.map(m=>`<option value="${esc(m)}">`).join('')}</datalist>
    <button class="big-go" style="${cvar('pcl')}" type="submit">${IC.plus}Ajouter la voiture</button>
  </form>`;
}
function settingsForm(){
  const c=S.sheet.draft;const w=online();const hasEx=S.vehicles.some(v=>v.example);
  return `<div class="sh-top"><div class="t"><h2>Réglages</h2></div>${closeBtn()}</div>
  <div class="pane"><label class="f">Nom de l'atelier<input id="s-name" value="${esc(c.name)}" ${w?'':'disabled'}></label>
  <p class="lbl">L'équipe</p><div class="team">${c.staff.map((p,i)=>`<div class="li"><input id="s-staff-${i}" data-staffname="${i}" value="${esc(p.name)}" ${w?'':'disabled'}><select id="s-role-${i}" data-staffrole="${i}" ${w?'':'disabled'}>${Object.entries(ROLES).map(([k,l])=>`<option value="${k}" ${p.role===k?'selected':''}>${l}</option>`).join('')}</select>${w?`<button class="btn icon-only sm" data-delstaff="${i}" aria-label="Retirer">${IC.x}</button>`:''}</div>`).join('')||'<p class="muted" style="margin:0">Personne pour l\'instant.</p>'}
    ${w?`<div class="li"><input id="s-newstaff" placeholder="Prénom"><select id="s-newrole">${Object.entries(ROLES).map(([k,l])=>`<option value="${k}">${l}</option>`).join('')}</select><button class="btn sm" data-act="addstaff">Ajouter</button></div>`:''}</div>
  ${w?`<button class="btn go" data-act="savecfg">Enregistrer</button>`:''}
  ${w&&hasEx?`<button class="btn red sm" data-act="clearex" style="align-self:flex-start">Supprimer les exemples</button>`:''}
  <p class="lbl" style="margin-top:12px">Cette tablette</p>
  <div style="display:flex;flex-wrap:wrap;gap:10px"><button class="btn sm" data-act="install">Installer l'appli</button>
  ${S.push==='on'?`<button class="btn sm" data-act="push-off">${IC.bell}Couper les notifications</button>`:S.push==='off'?`<button class="btn sm" data-act="push-on">${IC.bell}Activer les notifications</button>`:''}
  <button class="btn sm" data-act="logout">Se déconnecter</button></div>
  <p class="muted" style="margin:0;font-size:13px">${S.push==='on'?`Notifications activées pour ${esc(S.me||'cette tablette')} (${esc((ROLES[myRole()]||'').toLowerCase())}).`:S.push==='denied'?'Notifications bloquées : autorisez-les dans les réglages de Chrome pour ce site.':S.push==='unsupported'?"Notifications non disponibles sur cet appareil (sur iPhone : ajoutez d'abord l'appli à l'écran d'accueil).":"Notifications désactivées sur cet appareil."}</p></div>`;
}
function renderLb(){const r=$('#lb-root');const p=S.lb&&S.photos.find(x=>x.id===S.lb);if(!p){r.innerHTML='';return}
  r.innerHTML=`<div class="lightbox" data-act="lbclose"><img src="${photoUrl(p.asset)}" alt="Photo"><div class="cap"><span>${esc(st(OLD[p.stage]||p.stage||'pcl').l)}${p.by?' · '+esc(p.by):''} · ${fmtTime(p.t||0)}</span>
    ${W()?`<button class="btn sm red" data-delphoto="${esc(p.id)}">Supprimer</button>`:''}<button class="btn sm" data-act="lbclose">Fermer</button></div></div>`}

/* events */
document.addEventListener('click',async e=>{
  if(Date.now()-S.justDragged<350){e.preventDefault();return}
  const t=e.target.closest('[data-act],[data-open],[data-next],[data-deliver],[data-restore],[data-stage],[data-stagego],[data-task],[data-qc],[data-wash],[data-kind],[data-forr],[data-tab],[data-list],[data-delay],[data-pickme],[data-lb],[data-delphoto],[data-del],[data-delstaff]');
  if(!t)return;const d=t.dataset;const sid=S.sheet&&S.sheet.mode==='detail'&&S.sheet.id;
  if(d.kind){S.kind=d.kind;t.parentNode.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b===t));return}
  if(d.forr){S.forR=d.forr;t.parentNode.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b===t));return}
  if(d.tab&&S.sheet){S.sheet.tab=d.tab;S.sheet.keep=false;S.confirmDel=false;if(d.tab==='msg'){S.sheet.toBottom=true;S.sheet.keep=true}renderSheet();renderView();return}
  if(d.pickme){S.me=d.pickme;S.viewOnly=false;try{localStorage.setItem('atelier.me',S.me)}catch(_){}render();refreshPush();toast(`Bonjour ${S.me} 👋`);return}
  if(d.list){S.sheet={mode:'list',kind:d.list};render();return}
  if(d.task){await toggleTask(d.task);return}
  if(d.next!==undefined){const v=byId(d.next);const nx=STAGES[sIdx(stageOf(v))+1];if(nx)await moveStage(v.id,nx.k);return}
  if(d.deliver!==undefined){await deliver(d.deliver);return}
  if(d.restore!==undefined){await patch(d.restore,{delivered:false},'Remise en cours');return}
  if(d.stage&&sid){await moveStage(sid,d.stage);return}
  if(d.stagego&&sid){await moveStage(sid,d.stagego);return}
  if(d.qc&&sid){const v=byId(sid);const qc={...(v.qc||{}),[d.qc]:(v.qc||{})[d.qc]?false:{by:signer(),t:Date.now()}};const all=QC.every(x=>qc[x[0]]);const lbl=(QC.find(x=>x[0]===d.qc)||[])[1]||'';await patch(sid,{qc,...(all?{qcBy:signer(),qcAt:Date.now()}:{})},all?'Contrôle final complet ✓':(qc[d.qc]?'Contrôle : '+lbl+' ✓':'Contrôle : '+lbl+' décoché'));return}
  if(d.wash&&sid){const v=byId(sid);const wash={...(v.wash||{}),[d.wash]:(v.wash||{})[d.wash]?false:{by:signer(),t:Date.now()}};const wl=(WASH.find(x=>x[0]===d.wash)||[])[1]||'';await patch(sid,{wash},WASH.every(x=>wash[x[0]])?'Lavage terminé ✓':(wash[d.wash]?'Lavage : '+wl+' ✓':'Lavage : '+wl+' décoché'));return}
  if(d.delay&&sid){const v=byId(sid);const dl=v.delay||{};const orig=dl.origDue||v.due||todayISO();const n=+d.delay;const nd=addDays(orig,n);
    await patch(sid,{due:nd,delay:{...dl,on:true,days:n,origDue:orig}},`Retard de ${dlTxt(n)} : finie pour le ${fmtDate(nd)}`);toast(`Retard de ${dlTxt(n)} enregistré`);return}
  if(d.lb){S.lb=d.lb;render();return}
  if(d.delphoto){e.stopPropagation();await deletePhoto(d.delphoto);return}
  if(d.del){await deleteVehicle(d.del);return}
  if(d.delstaff!==undefined){syncDraft();S.sheet.draft.staff.splice(+d.delstaff,1);renderSheet();return}
  if(d.open){S.sheet={mode:'detail',id:d.open,tab:unread(d.open)?'msg':openTasks(d.open).length?'urg':'infos'};S.confirmDel=false;render();return}
  switch(d.act){
    case 'close':S.sheet=null;S.confirmDel=false;render();break;
    case 'add':S.sheet={mode:'add'};render();setTimeout(()=>$('#a-plate')&&$('#a-plate').focus(),40);break;
    case 'settings':S.sheet={mode:'settings',draft:structuredClone(S.config)};render();break;
    case 'examples':await loadExamples();break;
    case 'install':await installApp();break;
    case 'pick':S.viewOnly=false;S.me='';render();break;
    case 'viewonly':S.viewOnly=true;render();break;
    case 'push-on':await enablePush();break;
    case 'push-off':await disablePush();break;
    case 'logout':await logout();break;
    case 'clearex':await clearExamples();break;
    case 'askdel':S.confirmDel=true;renderSheet();break;
    case 'nodel':S.confirmDel=false;renderSheet();break;
    case 'delay':{if(!sid)break;const v=byId(sid);const dl={...(v.delay||{cause:'',note:''}),on:!(v.delay&&v.delay.on)};await patch(sid,{delay:dl},dl.on?'Retard signalé':'Retard levé');break}
    case 'lbclose':if(e.target.closest('img'))return;S.lb=null;render();break;
    case 'addstaff':{syncDraft();const n=$('#s-newstaff').value.trim();if(!n)return;if(!S.sheet.draft.staff.some(p=>p.name===n))S.sheet.draft.staff.push({name:n,role:$('#s-newrole').value});renderSheet();$('#s-newstaff')&&$('#s-newstaff').focus();break}
    case 'savecfg':{syncDraft();const c=S.sheet.draft;S.sheet=null;await saveConfig({name:c.name.trim()||'Atelier carrosserie',staff:c.staff.map(p=>({name:p.name.trim(),role:p.role})).filter(p=>p.name)});render();break}
  }
});
function syncDraft(){const c=S.sheet&&S.sheet.draft;if(!c)return;const n=$('#s-name');if(n)c.name=n.value;
  document.querySelectorAll('[data-staffname]').forEach(i=>{c.staff[+i.dataset.staffname].name=i.value});
  document.querySelectorAll('[data-staffrole]').forEach(i=>{c.staff[+i.dataset.staffrole].role=i.value})}
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){if(S.lb){S.lb=null;render()}else if(S.sheet){S.sheet=null;render()}}
  if(e.key==='Enter'&&e.target.id==='s-newstaff'){e.preventDefault();document.querySelector('[data-act="addstaff"]').click()}
  if(e.key==='Enter'&&!e.shiftKey&&e.target.id==='m-text'){e.preventDefault();e.target.form.requestSubmit()}
});
document.addEventListener('change',async e=>{
  const t=e.target;
  if(t.id==='me-sel'){S.me=t.value;S.viewOnly=false;try{localStorage.setItem('atelier.me',S.me)}catch(_){}render();refreshPush();return}
  if(t.dataset.upload){const files=[...t.files];t.value='';if(files.length)await uploadPhotos(t.dataset.upload,files);return}
  const id=S.sheet&&S.sheet.mode==='detail'&&S.sheet.id;if(!id)return;const v=byId(id);
  if(t.id==='d-due'){await patch(id,{due:t.value},t.value?`Finie pour le ${fmtDate(t.value)}`:'Date retirée')}
  else if(t.id==='d-back'){await patch(id,{back:t.value},t.value?`Rapatriement le ${fmtDate(t.value)}`:'Rapatriement retiré')}
  else if(t.id==='d-transport'&&t.value!==(v.transport||'')){await patch(id,{transport:t.value.trim()},t.value.trim()?`Transport : ${t.value.trim()}`:'Transport retiré')}
  else if(t.id==='d-color'&&t.value!==(v.color||'')){await patch(id,{color:t.value.trim()},`Couleur : ${t.value.trim()||'retirée'}`)}
  else if(t.id==='d-client'&&t.value!==(v.client||'')){await patch(id,{client:t.value.trim()},`N° de dossier : ${t.value.trim()||'retiré'}`)}
  else if(t.id==='d-damages'&&t.value!==(v.damages||'')){await patch(id,{damages:t.value},'Dégâts modifiés')}
  else if(t.id==='d-cause'){await patch(id,{delay:{...(v.delay||{}),on:true,cause:t.value}},`Retard : ${t.value}`);t.blur()}
  else if(t.id==='d-cnote'&&t.value!==((v.delay||{}).note||'')){await patch(id,{delay:{...(v.delay||{}),on:true,note:t.value.trim()}},`Retard : ${t.value.trim()}`)}
});
document.addEventListener('focusout',()=>{setTimeout(()=>{if(S.sheetDirty&&!($('#sheet-root').contains(document.activeElement)&&/INPUT|TEXTAREA/.test(document.activeElement.tagName))){S.sheetDirty=false;renderSheet()}},60)});
document.addEventListener('submit',async e=>{
  e.preventDefault();const f=e.target;
  if(f.id==='add-form'){const d=Object.fromEntries(new FormData(f));if(!d.plate.trim()||!d.model.trim())return;await addVehicle(d)}
  else if(f.id==='quick-form'){const i=$('#q-text');const txt=i.value;const vid=$('#q-veh').value;i.value='';i.blur();if(!(await addTask(vid,txt,S.kind,S.forR))&&$('#q-text'))$('#q-text').value=txt;S.sheetDirty=false;renderSheet()}
  else if(f.id==='task-form'){const i=$('#t-text');const txt=i.value;i.value='';i.blur();if(!(await addTask(S.sheet.id,txt,S.kind,S.forR))&&$('#t-text'))$('#t-text').value=txt;S.sheetDirty=false;renderSheet()}
  else if(f.id==='msg-form'){const i=$('#m-text');const txt=i.value;i.value='';i.blur();if(!(await sendMsg(S.sheet.id,txt))&&$('#m-text'))$('#m-text').value=txt;S.sheetDirty=false;S.sheet.toBottom=true;renderSheet()}
});

/* drag between steps (finger or mouse) */
let drag=null;
const HOLD=450; // touch: hold the card ~0.5 s before it can be moved, so scrolling never moves a car
const colAt=(x,y)=>{const el=document.elementFromPoint(x,y);return el&&el.closest('[data-col]')};
function startLift(e){if(!drag||drag.active)return;drag.active=true;
  drag.ghost=drag.el.cloneNode(true);drag.ghost.classList.add('ghost');document.body.appendChild(drag.ghost);drag.el.classList.add('lift');
  try{navigator.vibrate&&navigator.vibrate(25)}catch(_){}
  moveGhost(drag.lx,drag.ly)}
function moveGhost(x,y){if(!drag||!drag.ghost)return;drag.ghost.style.transform=`translate(${x-115}px,${y-35}px) rotate(-2deg) scale(1.03)`;
  document.querySelectorAll('.col.drop').forEach(c=>c.classList.remove('drop'));const c=colAt(x,y);if(c)c.classList.add('drop')}
document.addEventListener('pointerdown',e=>{if(e.button>0)return;const c=e.target.closest('[data-drag]');if(!c||!W())return;
  drag={id:c.dataset.drag,el:c.closest('.card'),x0:e.clientX,y0:e.clientY,lx:e.clientX,ly:e.clientY,touch:e.pointerType!=='mouse',active:false,ghost:null,timer:null};
  if(drag.touch){drag.el.classList.add('press');drag.timer=setTimeout(()=>{if(drag){drag.el.classList.remove('press');startLift()}},HOLD)}});
document.addEventListener('pointermove',e=>{if(!drag)return;drag.lx=e.clientX;drag.ly=e.clientY;const dist=Math.hypot(e.clientX-drag.x0,e.clientY-drag.y0);
  if(!drag.active){
    if(drag.touch){if(dist>10)cancelDrag();return} // finger moved before the hold: it's a scroll
    if(dist<12)return;startLift();
  }
  e.preventDefault();moveGhost(e.clientX,e.clientY)},{passive:false});
// once a card is lifted, stop the page from scrolling under the finger
document.addEventListener('touchmove',e=>{if(drag&&drag.active)e.preventDefault()},{passive:false});
document.addEventListener('contextmenu',e=>{if(drag&&e.target.closest('[data-drag]'))e.preventDefault()});
function cancelDrag(){if(!drag)return;clearTimeout(drag.timer);drag.el.classList.remove('press','lift');if(drag.ghost)drag.ghost.remove();document.querySelectorAll('.col.drop').forEach(x=>x.classList.remove('drop'));drag=null}
async function endDrag(e,cancel){if(!drag)return;const d=drag;const was=d.active;cancelDrag();
  if(!was||cancel)return;S.justDragged=Date.now();const c=colAt(e.clientX,e.clientY);if(c)await moveStage(d.id,c.dataset.col)}
document.addEventListener('pointerup',e=>endDrag(e,false));
document.addEventListener('pointercancel',e=>endDrag(e,true));

/* boot */
function normCfg(d){return {name:typeof d.name==='string'?d.name:DEF_CFG.name,
  staff:Array.isArray(d.staff)?d.staff.map(p=>typeof p==='string'?{name:p,role:'atelier'}:p).filter(p=>p&&typeof p.name==='string').map(p=>({name:p.name,role:ROLES[p.role]?p.role:'atelier'})):[]}}
const live=()=>{if(!drag)render()};
async function loadAll(){
  const res=await Promise.all(LISTS.map(t=>sb.from(t).select('id,data')));
  res.forEach((r,i)=>{if(r.error)throw r.error;S[LISTS[i]]=r.data.map(x=>({id:x.id,...(x.data||{})}))});
  const c=await sb.from('config').select('id,data').eq('id','main').maybeSingle();if(c.error)throw c.error;
  S.config=c.data?normCfg(c.data.data||{}):structuredClone(DEF_CFG);
  S.ready=true;S.offline=false;if(S.sheet&&S.sheet.mode==='detail'&&!byId(S.sheet.id))S.sheet=null;live();
}
let chan=null;
function subscribe(){
  if(chan)sb.removeChannel(chan);
  chan=sb.channel('atelier').on('postgres_changes',{event:'*',schema:'public'},pl=>{
    const t=pl.table;if(pl.eventType==='DELETE'){if(pl.old&&pl.old.id)applyLocal(t,pl.old.id,null,true)}else if(pl.new&&pl.new.id)applyLocal(t,pl.new.id,pl.new.data||{});live();
  }).subscribe(st=>{if(st==='SUBSCRIBED')loadAll().catch(()=>{})});
}
/* ---------- notifications ---------- */
S.push='unsupported';
const pushOK=()=>'serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window&&!!CFG.vapidPublicKey;
function b64u(str){const pad='='.repeat((4-str.length%4)%4);const raw=atob((str+pad).replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from([...raw].map(c=>c.charCodeAt(0)))}
async function currentSub(){const r=await navigator.serviceWorker.ready;return r.pushManager.getSubscription()}
async function saveSub(sub){const j=sub.toJSON();const {error}=await sb.from('push_subs').upsert({endpoint:j.endpoint,sub:j,name:S.me||'',role:myRole(),updated_at:now()});if(error)toast("Notifications : pas enregistrées. Réessayez.")}
async function refreshPush(){
  if(!pushOK()){S.push='unsupported';renderTop();return}
  try{if(Notification.permission==='denied'){S.push='denied'}else{const sub=await currentSub();S.push=sub?'on':'off';if(sub&&S.ready)await saveSub(sub)}}catch(e){S.push='unsupported'}
  renderTop();if(S.sheet&&S.sheet.mode==='settings')renderSheet();
}
async function enablePush(){
  if(!meOK()){askName();return}
  if(!pushOK()){toast("Notifications impossibles ici. Sur iPhone : ajoutez d'abord l'appli à l'écran d'accueil.");return}
  const perm=await Notification.requestPermission();
  if(perm!=='granted'){S.push=perm==='denied'?'denied':'off';renderTop();toast('Notifications refusées. Autorisez-les dans les réglages de Chrome pour ce site.');return}
  try{let sub=await currentSub();if(!sub)sub=await (await navigator.serviceWorker.ready).pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64u(CFG.vapidPublicKey)});
    await saveSub(sub);S.push='on';renderTop();if(S.sheet&&S.sheet.mode==='settings')renderSheet();toast('Notifications activées')}
  catch(e){toast("Activation impossible. Vérifiez internet et réessayez.")}
}
async function disablePush(){try{const sub=await currentSub();if(sub){await sb.from('push_subs').delete().eq('endpoint',sub.endpoint);await sub.unsubscribe()}}catch(e){}
  S.push='off';renderTop();if(S.sheet&&S.sheet.mode==='settings')renderSheet();toast('Notifications désactivées')}
function openFromLink(url){const m=String(url||location.hash).match(/#v=([0-9a-f-]{36})/);if(m&&byId(m[1])){S.sheet={mode:'detail',id:m[1],tab:unread(m[1])?'msg':openTasks(m[1]).length?'urg':'infos'};render();history.replaceState(null,'',location.pathname)}}
if('serviceWorker' in navigator)navigator.serviceWorker.addEventListener('message',e=>{if(e.data&&e.data.open)openFromLink(e.data.open)});

/* login (one shared workshop account) */
function showLogin(msg){
  $('#login-root').innerHTML=`<div class="login"><form class="login-card" id="login-form">
    <span class="big-ic">${IC.car}</span><h1>Suivi carrosserie</h1><p class="muted">Connectez-vous avec l'identifiant de l'atelier.</p>
    <label class="f">E-mail<input id="l-email" type="email" autocomplete="username" required></label>
    <label class="f">Mot de passe<input id="l-pass" type="password" autocomplete="current-password" required></label>
    ${msg?`<p class="login-err">${esc(msg)}</p>`:''}
    <button class="big-go" style="${cvar('reparation')}" type="submit">Se connecter</button></form></div>`;
  setTimeout(()=>$('#l-email')&&$('#l-email').focus(),50);
}
document.addEventListener('submit',async e=>{
  if(e.target.id!=='login-form')return;e.preventDefault();e.stopImmediatePropagation();
  const btn=e.target.querySelector('button');btn.disabled=true;btn.textContent='Connexion…';
  const {error}=await sb.auth.signInWithPassword({email:$('#l-email').value.trim(),password:$('#l-pass').value});
  if(error){showLogin(/invalid/i.test(error.message)?'E-mail ou mot de passe incorrect.':'Connexion impossible. Vérifiez internet.');return}
  start();
},true);
async function logout(){await sb.auth.signOut();S.ready=false;S.vehicles=[];S.tasks=[];S.messages=[];S.photos=[];S.sheet=null;render();showLogin()}
async function start(){
  const {data:{session}}=await sb.auth.getSession();
  if(!session){showLogin();return}
  $('#login-root').innerHTML='';
  try{await loadAll()}catch(e){S.offline=true;render()}
  subscribe();
  openFromLink();
  refreshPush();
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&S.ready!==undefined)sb.auth.getSession().then(({data})=>{if(data.session)loadAll().catch(()=>{S.offline=true;render()})})});
window.addEventListener('online',()=>{S.offline=false;loadAll().catch(()=>{});render()});
window.addEventListener('offline',()=>{S.offline=true;render()});
/* "install the app" button on Android (Chrome) */
let installEvt=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvt=e;renderTop()});
async function installApp(){if(!installEvt){toast("Menu ⋮ de Chrome → « Installer l'application »");return}installEvt.prompt();await installEvt.userChoice.catch(()=>{});installEvt=null;renderTop()}
render();
start();
