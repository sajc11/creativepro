
const KIND = document.body.dataset.kind || "books"; const KEY = KIND + ".items";
const palette=["#FFB0B0","#A0E7E5","#B4F8C8","#FBE7C6","#C7C9FF","#FFD6A5","#FDFFB6","#BDB2FF","#FFC6FF","#A0C4FF"];
function renderShelf(){ const items=Store.get(KEY,[]); const row=document.querySelector(".shelf-row"); row.innerHTML="";
  for(const b of items){ const spine=document.createElement("div"); spine.className="spine"; spine.style.background=b.color || palette[Math.floor(Math.random()*palette.length)];
    spine.style.borderColor="rgba(0,0,0,.75)"; spine.dataset.id=b.id; spine.textContent=b.title; if(b.favorite) spine.style.outline="3px solid var(--y2k)"; row.appendChild(spine); }
  document.querySelector("#count").textContent = `${items.length} ${KIND}`;
}
renderShelf();
const modal=document.querySelector(".modal");
document.querySelector("#addItem").addEventListener("click", ()=> openModal({id:null,title:"",author:"",year:"",color:palette[0],rating:0,favorite:false,notes:""}));
document.querySelector(".shelf-row").addEventListener("click", e=>{ const id=e.target.closest(".spine")?.dataset?.id; if(!id) return; const item=Store.get(KEY,[]).find(x=>x.id===id); openModal(item); });
function openModal(item){
  modal.classList.add("open"); const form=modal.querySelector("form"); form.reset(); form.dataset.id=item.id||"";
  form.title.value=item.title||""; form.author.value=item.author||""; form.year.value=item.year||""; form.color.value=item.color||palette[0]; form.notes.value=item.notes||"";
  const stars=modal.querySelectorAll(".star"); stars.forEach((s,i)=>{ s.classList.toggle("on",(i+1)<=(item.rating||0)); s.onclick=()=>{ stars.forEach((t,j)=> t.classList.toggle("on", j<=i)); form.rating.value=(i+1); } });
  modal.querySelector("#fav").checked=!!item.favorite;
}
document.querySelector("#closeModal").addEventListener("click", ()=> modal.classList.remove("open"));
document.querySelector("#saveItem").addEventListener("click", ()=>{
  const form=modal.querySelector("form"); const items=Store.get(KEY,[]); const id=form.dataset.id || uuid();
  const item={ id, title:form.title.value.trim(), author:form.author.value.trim(), year:form.year.value.trim(), color:form.color.value.trim(),
    rating:Number(form.rating.value||0), favorite: form.querySelector("#fav").checked, notes:form.notes.value.trim() };
  const i=items.findIndex(x=>x.id===id); if(i>=0) items[i]=item; else items.push(item); Store.set(KEY, items); modal.classList.remove("open"); renderShelf();
});
document.querySelector("#deleteItem").addEventListener("click", ()=>{ const id=modal.querySelector("form").dataset.id; if(!id) return; if(confirm("Delete?")){
  const items=Store.get(KEY,[]).filter(x=>x.id!==id); Store.set(KEY, items); modal.classList.remove("open"); renderShelf(); } });
document.querySelector("#exportItems").addEventListener("click", ()=>{ const items=Store.get(KEY,[]); download(`${KIND}.json`, JSON.stringify(items,null,2)); });
document.querySelector("#importItems").addEventListener("change", async ev=>{ const file=ev.target.files[0]; if(!file) return; const text=await fileToText(file); try{ const arr=JSON.parse(text); Store.set(KEY, arr); renderShelf(); }catch(e){ alert("Bad file"); }});
