
function randomRot(){ return (Math.random()*6 - 3).toFixed(2)+"deg"; }
function renderBoard(){ const notes=Store.get("board.notes",[]); const grid=document.querySelector(".board"); grid.innerHTML="";
  notes.forEach(n=>{ const div=document.createElement("div"); div.className="note"; div.style.setProperty("--rot", n.rot||randomRot()); div.dataset.id=n.id;
    div.innerHTML = `<div class="pin"></div><div style="white-space:pre-wrap">${n.text}</div><div class="small" style="position:absolute; left:10px; bottom:8px">${new Date(n.when).toLocaleString()}</div>`; grid.appendChild(div); });
  document.querySelector("#count").textContent = `${notes.length} notes`; }
renderBoard();
document.querySelector("#addNote").addEventListener("click", ()=>{ const txt=prompt("Drop a note for the board:"); if(!txt) return;
  const notes=Store.get("board.notes",[]); notes.push({id:uuid(), text:txt, when:Date.now(), rot:randomRot()}); Store.set("board.notes", notes); renderBoard(); });
document.querySelector("#clearNotes").addEventListener("click", ()=>{ if(confirm("Clear all notes on this device?")){ Store.set("board.notes", []); renderBoard(); } });
document.querySelector("#exportNotes").addEventListener("click", ()=>{ const notes=Store.get("board.notes",[]); download("board_notes.json", JSON.stringify(notes,null,2)); });
document.querySelector("#importNotes").addEventListener("change", async ev=>{ const file=ev.target.files[0]; if(!file) return; const text=await fileToText(file); try{ const arr=JSON.parse(text); Store.set("board.notes",arr); renderBoard(); }catch(e){ alert("Bad file"); } });
