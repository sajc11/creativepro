
const Store = {
  get(k, d=null){ try{ return JSON.parse(localStorage.getItem(k) || JSON.stringify(d)); }catch(e){ return d } },
  set(k, v){ localStorage.setItem(k, JSON.stringify(v)); },
  del(k){ localStorage.removeItem(k); }
};
function uuid(){ return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
  (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
)}
const CryptoJournal = (()=>{
  const ITER=250000; const SALT_KEY="journal.salt"; const DATA_KEY="journal.encrypted"; const META_KEY="journal.meta";
  async function deriveKey(password, salt){
    const enc = new TextEncoder();
    const baseKey = await crypto.subtle.importKey("raw", enc.encode(password), {name:"PBKDF2"}, false, ["deriveKey"]);
    return await crypto.subtle.deriveKey({name:"PBKDF2", salt, iterations:ITER, hash:"SHA-256"},
      baseKey,{name:"AES-GCM", length:256}, false, ["encrypt","decrypt"]);
  }
  async function ensureSalt(){
    let s = Store.get(SALT_KEY);
    if(!s){ const salt = crypto.getRandomValues(new Uint8Array(16)); Store.set(SALT_KEY, Array.from(salt)); return salt; }
    return new Uint8Array(s);
  }
  async function encrypt(password, plainObj){
    const salt = await ensureSalt(); const key = await deriveKey(password, salt);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const data = new TextEncoder().encode(JSON.stringify(plainObj));
    const cipher = await crypto.subtle.encrypt({name:"AES-GCM", iv}, key, data);
    const bundle = {iv:Array.from(iv), c:Array.from(new Uint8Array(cipher))};
    Store.set(DATA_KEY, bundle); Store.set(META_KEY, {when: Date.now(), count: plainObj?.entries?.length||0});
    return true;
  }
  async function decrypt(password){
    const salt = await ensureSalt(); const key = await deriveKey(password, salt);
    const bundle = Store.get(DATA_KEY); if(!bundle) return {entries:[]};
    try{
      const {iv, c} = bundle;
      const plainBuf = await crypto.subtle.decrypt({name:"AES-GCM", iv:new Uint8Array(iv)}, key, new Uint8Array(c));
      const obj = JSON.parse(new TextDecoder().decode(plainBuf));
      return obj;
    }catch(err){ throw new Error("Bad password or corrupted data."); }
  }
  function clear(){ Store.del(DATA_KEY); }
  return {encrypt, decrypt, clear, DATA_KEY, META_KEY};
})();

function download(filename, text){
  const blob = new Blob([text], {type:"application/json"});
  const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href=url; a.download=filename; a.click();
  setTimeout(()=>URL.revokeObjectURL(url), 5000);
}
function fileToText(file){ return new Promise((resolve,reject)=>{
  const fr = new FileReader(); fr.onload = e=> resolve(String(e.target.result)); fr.onerror = reject; fr.readAsText(file);
})}
