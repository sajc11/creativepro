
const canvas = document.getElementById("webcanvas"); const ctx = canvas.getContext("2d");
const tickFlash = document.createElement("div"); tickFlash.id="tickFlash"; document.body.appendChild(tickFlash);

function resize(){ const dpr=window.devicePixelRatio||1; canvas.width=Math.floor(canvas.clientWidth*dpr); canvas.height=Math.floor(canvas.clientHeight*dpr); ctx.setTransform(dpr,0,0,dpr,0,0); }
if (window.ResizeObserver) { new ResizeObserver(resize).observe(canvas); }
resize();
window.addEventListener('resize', resize);
window.addEventListener('load', resize);
setTimeout(resize, 0);

const nodes=[
  {id:"journal", label:"Private Journal", url:"journal.html"},
  {id:"calendar", label:"Sticker Calendar", url:"calendar.html"},
  {id:"library", label:"Library (Books)", url:"library.html"},
  {id:"dvds", label:"DVD Rack", url:"dvds.html"},
  {id:"board", label:"Post-it Board", url:"board.html"},
  {id:"pro", label:"Professional Site", url:"index.html"},
  {id:"cv", label:"CV", url:"cv.html"},
  {id:"music", label:"Music (soon)", url:"#"},
  {id:"network", label:"Network (soon)", url:"#"},
  {id:"messaging", label:"Messaging (soon)", url:"#"},
];

// Subweb definitions (simple)
const subweb = {
  library: ["Fiction","Non-fiction","Sci‑Fi","Memoir","Poetry","Design","Data","Favorites"].map((t,i)=>({id:"lib"+i,label:t})),
  music: ["Playlists","Albums","Artists","Live Sets"].map((t,i)=>({id:"mus"+i,label:t})),
  network: ["Projects","Visuals","Papers"].map((t,i)=>({id:"net"+i,label:t})),
  messaging: ["Notes","Ideas","To‑do"].map((t,i)=>({id:"msg"+i,label:t}))
};

// Subweb overlay
const overlay = document.createElement("div");
overlay.style.cssText = "position:fixed; inset:0; background:rgba(0,0,0,.85); display:none; z-index:75";
overlay.innerHTML = `<canvas id="subCanvas" style="width:100%; height:100%"></canvas>
  <button id="subClose" class="btn" style="position:fixed; top:14px; right:14px; z-index:80">Close</button>`;
document.body.appendChild(overlay);
const subCanvas = overlay.querySelector("#subCanvas"); const subCtx = subCanvas.getContext("2d");
function subResize(){ const dpr=window.devicePixelRatio||1; subCanvas.width=Math.floor(subCanvas.clientWidth*dpr); subCanvas.height=Math.floor(subCanvas.clientHeight*dpr); subCtx.setTransform(dpr,0,0,dpr,0,0); }
new ResizeObserver(subResize).observe(subCanvas); subResize();

let subNodes=[], subEdges=[];
function openSubweb(kind){
  const data = subweb[kind]; if(!data) return;
  overlay.style.display="block"; subNodes = data.map((d,i)=>({ ...d, x: (subCanvas.clientWidth/2)+ Math.cos(i/data.length*6.28)*220, y: (subCanvas.clientHeight/2)+Math.sin(i/data.length*6.28)*160, r:12, vx:0, vy:0, m:1 }));
  subEdges=[]; for(let i=0;i<subNodes.length;i++) subEdges.push([i,(i+1)%subNodes.length]);
  subStep();
}
overlay.querySelector("#subClose").onclick = ()=> overlay.style.display="none";

function subStep(){
  subCtx.clearRect(0,0,subCanvas.clientWidth, subCanvas.clientHeight);
  subCtx.lineWidth=1.2; subCtx.strokeStyle="rgba(255,255,255,.6)";
  subCtx.beginPath(); for(const [a,b] of subEdges){ const A=subNodes[a], B=subNodes[b]; subCtx.moveTo(A.x,A.y); subCtx.lineTo(B.x,B.y); } subCtx.stroke();
  subNodes.forEach(n=>{ subCtx.beginPath(); subCtx.arc(n.x,n.y,n.r,0,Math.PI*2); subCtx.fillStyle="#fff"; subCtx.fill();
    subCtx.fillStyle="#aaa"; subCtx.font="12px ui-sans-serif"; subCtx.textAlign="center"; subCtx.fillText(n.label, n.x, n.y-18); });
  if(overlay.style.display!=="none") requestAnimationFrame(subStep);
}

// physics web
const center = ()=>({x: canvas.clientWidth/2, y: canvas.clientHeight/2});
function initPositions(){ const c=center(); const R=Math.min(c.x,c.y)*0.72; const n=nodes.length; nodes.forEach((node,i)=>{ const t=(i/n)*Math.PI*2; node.x=c.x+R*Math.cos(t); node.y=c.y+R*Math.sin(t); node.vx=0; node.vy=0; node.m=1; node.r=14+(node.id==="pro"?6:0); }); }
initPositions();
const edges=[]; for(let i=0;i<nodes.length;i++) edges.push([i,(i+1)%nodes.length]); const hub=nodes.findIndex(n=>n.id==="journal"); nodes.forEach((n,i)=>{ if(i!==hub) edges.push([hub,i]); });
const physics={spring:.015, rest:160, repulsion:1600, damping:.92, maxSpeed:8};

let hoverId=null, dragId=null, dragOff={x:0,y:0}; let lastDropT=0;
canvas.addEventListener("pointerdown", e=>{ const p=pointer(e); const hit=pick(p.x,p.y); if(hit!=null){ dragId=hit; dragOff.x=nodes[hit].x-p.x; dragOff.y=nodes[hit].y-p.y; canvas.setPointerCapture(e.pointerId);} });
canvas.addEventListener("pointermove", e=>{ const p=pointer(e); if(dragId!=null){ nodes[dragId].x=p.x+dragOff.x; nodes[dragId].y=p.y+dragOff.y; nodes[dragId].vx=0; nodes[dragId].vy=0; }
  else{ hoverId=pick(p.x,p.y); canvas.style.cursor = hoverId!=null ? "pointer":"default"; } showTooltip(p.x,p.y,hoverId); });
canvas.addEventListener("pointerup", e=>{
  const p=pointer(e); if(dragId!=null){ // tick sound & flash
    tickFlash.style.setProperty("--x", (p.x/window.innerWidth*100)+"%"); tickFlash.style.setProperty("--y", (p.y/window.innerHeight*100)+"%");
    tickFlash.classList.add("show"); setTimeout(()=> tickFlash.classList.remove("show"), 120);
    playTick(); dragId=null;
  } else if(hoverId!=null){ const n=nodes[hoverId]; if(n.url && n.url!=="#") location.href=n.url; else openSubweb(n.id); }
});

function playTick(){ try{ const ac=new (window.AudioContext||window.webkitAudioContext)(); const o=ac.createOscillator(); const g=ac.createGain(); o.frequency.value=880; o.type="triangle"; o.connect(g); g.connect(ac.destination); g.gain.value=.001; o.start(); g.gain.linearRampToValueAtTime(.06, ac.currentTime+.02); g.gain.exponentialRampToValueAtTime(.00001, ac.currentTime+.15); o.stop(ac.currentTime+.16); setTimeout(()=>ac.close(), 300); }catch(e){} }

function pointer(e){ const r=canvas.getBoundingClientRect(); return {x: e.clientX-r.left, y:e.clientY-r.top}; }
function pick(x,y){ for(let i=nodes.length-1;i>=0;i--){ const n=nodes[i]; const dx=n.x-x, dy=n.y-y; if(dx*dx+dy*dy <= (n.r+6)*(n.r+6)) return i; } return null; }
const tooltip=document.getElementById("tooltip"); function showTooltip(x,y,id){ if(id==null){ tooltip.style.display="none"; return; } const n=nodes[id]; tooltip.style.display="block"; tooltip.textContent=n.label; tooltip.style.left=x+"px"; tooltip.style.top=y+"px"; }

function step(){
  for(const [a,b] of edges){ const na=nodes[a], nb=nodes[b]; let dx=nb.x-na.x, dy=nb.y-na.y; const dist=Math.max(0.001, Math.hypot(dx,dy)); const f=physics.spring*(dist-physics.rest);
    dx/=dist; dy/=dist; const fx=f*dx, fy=f*dy; if(dragId!==a){ na.vx += fx/na.m; na.vy += fy/na.m } if(dragId!==b){ nb.vx -= fx/nb.m; nb.vy -= fy/nb.m } }
  for(let i=0;i<nodes.length;i++){ for(let j=i+1;j<nodes.length;j++){ const a=nodes[i], b=nodes[j]; let dx=b.x-a.x, dy=b.y-a.y; let d2=dx*dx+dy*dy+0.01; const f=physics.repulsion/d2;
      const dist=Math.sqrt(d2); dx/=dist; dy/=dist; if(dragId!==i){ a.vx -= f*dx; a.vy -= f*dy } if(dragId!==j){ b.vx += f*dx; b.vy += f*dy } } }
  const W=canvas.clientWidth, H=canvas.clientHeight;
  for(const n of nodes){ if(dragId!=null && nodes[dragId]===n) continue; n.vx*=physics.damping; n.vy*=physics.damping;
    n.vx=Math.max(-physics.maxSpeed, Math.min(physics.maxSpeed, n.vx)); n.vy=Math.max(-physics.maxSpeed, Math.min(physics.maxSpeed, n.vy));
    n.x+=n.vx; n.y+=n.vy; if(n.x<n.r){n.x=n.r; n.vx*=-.5} if(n.y<n.r+6){n.y=n.r+6; n.vy*=-.5} if(n.x>W-n.r){n.x=W-n.r; n.vx*=-.5} if(n.y>H-n.r){n.y=H-n.r; n.vy*=-.5} }
  ctx.clearRect(0,0,canvas.clientWidth,canvas.clientHeight);
// paint dark background so white nodes/edges are visible even on light themes
const W = canvas.clientWidth, H = canvas.clientHeight;
const g = ctx.createRadialGradient(W*0.7, H*0.2, 0, W*0.7, H*0.2, Math.max(W,H));
g.addColorStop(0,'#0b0c10'); g.addColorStop(1,'#000');
ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
// glow lines
  ctx.lineWidth=1.5; ctx.strokeStyle="rgba(255,255,255,.65)";
  ctx.beginPath(); for(const [a,b] of edges){ const na=nodes[a], nb=nodes[b]; ctx.moveTo(na.x, na.y); ctx.lineTo(nb.x, nb.y); } ctx.stroke();
  // nodes
  for(let i=0;i<nodes.length;i++){ const n=nodes[i]; const on=(i===hoverId);
    if(on){ // halo
      const grad=ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,40); grad.addColorStop(0,"rgba(255,255,255,.85)"); grad.addColorStop(1,"rgba(255,255,255,0)");
      ctx.fillStyle=grad; ctx.beginPath(); ctx.arc(n.x,n.y,40,0,Math.PI*2); ctx.fill();
    }
    ctx.beginPath(); ctx.arc(n.x,n.y,n.r,0,Math.PI*2); ctx.fillStyle= on ? "#fff" : "#fafafa"; ctx.globalAlpha= on?1:.9; ctx.fill(); ctx.globalAlpha=1;
    ctx.beginPath(); ctx.arc(n.x, n.y, Math.max(3, n.r*0.3), 0, Math.PI*2); ctx.fillStyle="#111"; ctx.fill();
  }
  requestAnimationFrame(step);
}
requestAnimationFrame(step);

// Cabinet drag-peek: progress follows pointer within top zone
const cabinet=document.querySelector(".cabinet"); const topZone=document.querySelector(".top-hover-zone");
if(topZone){
  let dragging=false;
  topZone.addEventListener("mouseenter", ()=> cabinet?.classList.add("peek"));
  topZone.addEventListener("mouseleave", ()=> { if(!dragging) cabinet?.classList.remove("peek"); });
  topZone.addEventListener("pointerdown", ()=>{ dragging=true; topZone.classList.add("dragging"); });
  topZone.addEventListener("pointerup", ()=>{ dragging=false; topZone.classList.remove("dragging"); });
  topZone.addEventListener("pointermove", (e)=>{
    if(!cabinet) return;
    const r=topZone.getBoundingClientRect();
    const t = Math.min(1, Math.max(0, (e.clientY - r.top) / Math.max(1,r.height)));
    const max = window.innerHeight*0.8; // 80vh
    cabinet.style.top = (-max + max*t) + "px";
  });
  // click toggles open
  topZone.addEventListener("click", ()=>{
    const top = parseFloat((cabinet.style.top||"-10000").replace("px",""));
    if(top < -20){ cabinet.style.top = "0px"; cabinet.classList.add("open"); }
    else { cabinet.style.top = ""; cabinet.classList.remove("open"); }
  });
}
