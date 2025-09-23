
const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
let today = new Date();
function renderCalendar(d=new Date()){
  const y=d.getFullYear(), m=d.getMonth();
  document.querySelector("#monthLabel").textContent = `${monthNames[m]} ${y}`;
  const first = new Date(y, m, 1); const startDay = first.getDay(); const daysInMonth = new Date(y, m+1, 0).getDate();
  const grid = document.querySelector(".calendar"); grid.innerHTML="";
  for(let i=0;i<startDay;i++){ grid.appendChild(document.createElement("div")); }
  const highlights = Store.get("calendar.highlights", []);
  const monthHighlights = highlights.filter(h=>h.y===y && h.m===m);
  for(let day=1; day<=daysInMonth; day++){
    const cell=document.createElement("div"); cell.className="day"; const h4=document.createElement("h4"); h4.textContent=String(day); cell.appendChild(h4);
    const hl = monthHighlights.filter(h=>h.d===day);
    if(hl.length){
      const s=document.createElement("div"); s.style.position="absolute"; s.style.left="8px"; s.style.bottom="6px"; s.style.right="60px"; s.style.fontSize="12px"; s.style.color="var(--ink)";
      s.textContent = hl[hl.length-1].caption; cell.appendChild(s);
      const emoji = hl[hl.length-1].sticker;
      if(emoji.startsWith("data:")){ const img=document.createElement("img"); img.src=emoji; img.className="sticker"; cell.appendChild(img); }
      else{ const span=document.createElement("div"); span.textContent=emoji; span.style.position="absolute"; span.style.right="10px"; span.style.bottom="2px"; span.style.fontSize="36px"; cell.appendChild(span); }
    }
    grid.appendChild(cell);
  }
}
document.querySelector("#prev").addEventListener("click", ()=>{ today = new Date(today.getFullYear(), today.getMonth()-1, 1); renderCalendar(today); });
document.querySelector("#next").addEventListener("click", ()=>{ today = new Date(today.getFullYear(), today.getMonth()+1, 1); renderCalendar(today); });
document.querySelector("#exportHL").addEventListener("click", ()=>{ const hl=Store.get("calendar.highlights",[]); download("calendar_highlights.json", JSON.stringify(hl,null,2)); });
document.querySelector("#importHL").addEventListener("change", async ev=>{ const file=ev.target.files[0]; if(!file) return; const text=await fileToText(file); try{ const arr=JSON.parse(text); Store.set("calendar.highlights",arr); renderCalendar(today); }catch(e){ alert("Bad file"); }});
renderCalendar(today);
