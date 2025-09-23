
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

let state = { passwordOk:false, password:"", data:{entries:[]}, selectedId:null };

function status(msg, ok=true){ const el=$("#status"); if(!el) return; el.textContent=msg; el.style.color= ok?"var(--ok)":"#ff7b7b"; if(msg) setTimeout(()=>el.textContent="",3000); }

async function unlock(){
  const pw = $("#pw").value.trim(); if(!pw) return status("Enter password", false);
  try{ const data = await CryptoJournal.decrypt(pw); state={...state, passwordOk:true, password:pw, data:data||{entries:[]}};
    $("#lock").style.display="none"; $("#app").style.display="block"; renderEntries(); status("Unlocked ✓"); }
  catch(err){ status(err.message, false); }
}
$("#unlockBtn")?.addEventListener("click", unlock);
$("#initBtn")?.addEventListener("click", async ()=>{ const pw=$("#pw").value.trim(); if(!pw) return status("Enter a new password", false);
  await CryptoJournal.encrypt(pw, {entries:[]}); status("Vault initialized. Unlocking…"); unlock(); });

const stage=$("#journalStage"); const svgNS="http://www.w3.org/2000/svg"; let current=null;
function createSVG(w,h){
  stage.innerHTML="";
  const svg=document.createElementNS(svgNS,"svg"); svg.setAttribute("width",w); svg.setAttribute("height",h); svg.setAttribute("viewBox",`0 0 ${w} ${h}`); svg.id="svgRoot";
  const defs=document.createElementNS(svgNS,"defs"); const pattern=document.createElementNS(svgNS,"pattern");
  pattern.setAttribute("id","grid"); pattern.setAttribute("width","20"); pattern.setAttribute("height","20"); pattern.setAttribute("patternUnits","userSpaceOnUse");
  const path=document.createElementNS(svgNS,"path"); path.setAttribute("d","M 20 0 L 0 0 0 20"); path.setAttribute("fill","none"); path.setAttribute("stroke","#eee"); path.setAttribute("stroke-width","1");
  pattern.appendChild(path); defs.appendChild(pattern); svg.appendChild(defs);
  const rect=document.createElementNS(svgNS,"rect"); rect.setAttribute("width","100%"); rect.setAttribute("height","100%");
  rect.setAttribute("fill","url(#grid)"); rect.setAttribute("opacity","0.6"); svg.appendChild(rect);
  svg.addEventListener("pointerdown", e=>{ const node=e.target.closest("[data-node]"); selectNode(node||null); });
  stage.appendChild(svg); return svg;
}
createSVG(1100,700);

function selectNode(node){ current=node; $$(".selected").forEach(n=>n.classList.remove("selected")); if(node) node.classList.add("selected"); }
function makeDraggable(node){
  let ox=0,oy=0,bx=0,by=0,moving=false; node.style.cursor="move";
  node.addEventListener("pointerdown",e=>{ moving=true; const tr=node.transform.baseVal.consolidate(); const m=tr?tr.matrix:{e:0,f:0};
    ox=e.clientX; oy=e.clientY; bx=m.e; by=m.f; node.setPointerCapture(e.pointerId); });
  node.addEventListener("pointermove",e=>{ if(!moving) return; const dx=e.clientX-ox, dy=e.clientY-oy; node.setAttribute("transform",`translate(${bx+dx}, ${by+dy})`); });
  node.addEventListener("pointerup",()=> moving=false);
}
function wrapTransform(el){ const g=document.createElementNS(svgNS,"g"); g.setAttribute("data-node",""); g.appendChild(el); $("#svgRoot").appendChild(g);
  makeDraggable(g); g.addEventListener("click",()=>selectNode(g)); return g; }

$("#addText").addEventListener("click", ()=>{ const txt=prompt("Text:"); if(!txt) return; const t=document.createElementNS(svgNS,"text");
  t.textContent=txt; t.setAttribute("x","120"); t.setAttribute("y","120"); t.setAttribute("fill","#111"); t.setAttribute("font-family","Impact, 'Comic Sans MS', 'Arial Black', var(--font)");
  t.setAttribute("font-size","36"); t.setAttribute("stroke","#fff"); t.setAttribute("stroke-width","1.2"); const g=wrapTransform(t); selectNode(g); });
$("#addEmoji").addEventListener("click", ()=>{ const e=prompt("Type an emoji"); if(!e) return; const t=document.createElementNS(svgNS,"text");
  t.textContent=e; t.setAttribute("x","100"); t.setAttribute("y","100"); t.setAttribute("font-size","56"); const g=wrapTransform(t); selectNode(g); });
$("#addSticker").addEventListener("change", ev=>{ const file=ev.target.files[0]; if(!file) return; const fr=new FileReader(); fr.onload=()=> addImage(fr.result); fr.readAsDataURL(file); });
document.querySelectorAll(".presetSticker").forEach(btn=> btn.addEventListener("click", ()=> addImage(btn.dataset.src)));
function addImage(src){ const img=document.createElementNS(svgNS,"image"); img.setAttributeNS("http://www.w3.org/1999/xlink","href",src);
  img.setAttribute("x","40"); img.setAttribute("y","40"); img.setAttribute("width","240"); img.setAttribute("height","180"); const g=wrapTransform(img); selectNode(g); }
$("#deleteNode").addEventListener("click", ()=>{ if(!current) return; current.remove(); current=null; });
window.addEventListener("keydown", e=>{ if(!current) return; const tr=current.transform.baseVal.consolidate(); const m=tr?tr.matrix:{e:0,f:0};
  const step=e.shiftKey?10:2; if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)){ if(e.key==="ArrowUp") m.f-=step; if(e.key==="ArrowDown") m.f+=step;
    if(e.key==="ArrowLeft") m.e-=step; if(e.key==="ArrowRight") m.e+=step; current.setAttribute("transform",`translate(${m.e}, ${m.f})`); e.preventDefault(); }
  if(e.key==="Backspace"){ current.remove(); current=null; } });

$("#saveEntry").addEventListener("click", async ()=>{
  if(!state.passwordOk) return status("Unlock first", false);
  const svg=$("#svgRoot").outerHTML; const title=$("#entryTitle").value||"Untitled"; const dateISO=new Date($("#entryDate").value||Date.now()).toISOString();
  const id= state.selectedId || uuid(); const isPublic=$("#pubCheck").checked; const captionPublic=$("#pubCaption").value.trim(); const stickerPublic=$("#pubSticker").value.trim();
  const entry={id,title,dateISO,svg,isPublic,captionPublic,stickerPublic}; const i=state.data.entries.findIndex(e=>e.id===id);
  if(i>=0) state.data.entries[i]=entry; else state.data.entries.push(entry); await CryptoJournal.encrypt(state.password, state.data); renderEntries(); state.selectedId=id;
  status("Saved ✓"); if(isPublic){ const highlights=Store.get("calendar.highlights",[]); const dt=new Date(dateISO);
    highlights.push({id,y:dt.getFullYear(),m:dt.getMonth(),d:dt.getDate(),sticker:stickerPublic||"⭐",caption:captionPublic||title}); Store.set("calendar.highlights",highlights); }
});
$("#newEntry").addEventListener("click", ()=>{ state.selectedId=null; createSVG(1100,700); $("#entryTitle").value=""; $("#pubCaption").value=""; $("#entryDate").valueAsDate=new Date();
  $("#pubCheck").checked=false; $("#pubSticker").value="⭐"; });
function renderEntries(){ const list=$("#entries"); list.innerHTML="";
  const sorted=[...state.data.entries].sort((a,b)=> new Date(b.dateISO)-new Date(a.dateISO));
  for(const e of sorted){ const div=document.createElement("div"); div.className="card"; div.style.padding="10px"; div.style.margin="6px 0";
    div.innerHTML=`<div style="display:flex; align-items:center; justify-content:space-between; gap:10px">
      <div><div><strong>${e.title}</strong></div><div class="small">${new Date(e.dateISO).toLocaleString()}</div>${e.isPublic?`<span class="tag">Published ${e.stickerPublic||"⭐"}</span>`:""}</div>
      <div class="controls"><button class="btn secondary" data-edit="${e.id}">Edit</button><button class="btn" data-export="${e.id}">Export PNG</button><button class="btn secondary" data-del="${e.id}">Delete</button></div>`;
    list.appendChild(div); }
  list.onclick = async (ev)=>{ const id=ev.target.dataset.edit||ev.target.dataset.del||ev.target.dataset.export; if(!id) return; const entry=state.data.entries.find(x=>x.id===id);
    if(ev.target.dataset.edit){ state.selectedId=id; stage.innerHTML=""; stage.insertAdjacentHTML("beforeend", entry.svg);
      $("#entryTitle").value=entry.title; $("#entryDate").value=entry.dateISO.slice(0,10); $("#pubCheck").checked=!!entry.isPublic;
      $("#pubCaption").value=entry.captionPublic||""; $("#pubSticker").value=entry.stickerPublic||"⭐"; status("Loaded entry"); }
    else if(ev.target.dataset.del){ if(confirm("Delete entry?")){ state.data.entries = state.data.entries.filter(x=>x.id!==id); await CryptoJournal.encrypt(state.password, state.data); renderEntries(); status("Deleted"); } }
    else if(ev.target.dataset.export){ const svgText=entry.svg; const svgBlob=new Blob([svgText],{type:"image/svg+xml"}); const url=URL.createObjectURL(svgBlob); const img=new Image();
      img.onload=()=>{ const canvas=document.createElement("canvas"); canvas.width=img.width||1100; canvas.height=img.height||700; const ctx=canvas.getContext("2d"); ctx.drawImage(img,0,0); URL.revokeObjectURL(url);
        const png=canvas.toDataURL("image/png"); const a=document.createElement("a"); a.href=png; a.download=(entry.title||"journal")+".png"; a.click(); }; img.src=url; } };
}
$("#exportVault").addEventListener("click", ()=>{ const bundle=Store.get(CryptoJournal.DATA_KEY); if(!bundle) return status("Nothing to export", false);
  download("journal_encrypted.json", JSON.stringify(bundle,null,2)); });
$("#importVault").addEventListener("change", async ev=>{ const file=ev.target.files[0]; if(!file) return; const text=await fileToText(file);
  try{ const obj=JSON.parse(text); Store.set(CryptoJournal.DATA_KEY, obj); status("Imported. Unlock again."); }catch(e){ status("Bad file", false); } });
$("#entryDate").valueAsDate = new Date();
