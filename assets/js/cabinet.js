
// cabinet.js — builds the inside-of-drawer navigator & fixes open/peek behavior
(() => {
  const PAGES = [
    {id:"journal",  label:"Private Journal", icon:"🔒", url:"journal.html"},
    {id:"calendar", label:"Sticker Calendar", icon:"📆", url:"calendar.html"},
    {id:"library",  label:"Library (Books)", icon:"📚", url:"library.html"},
    {id:"dvds",     label:"DVD Rack",        icon:"📀", url:"dvds.html"},
    {id:"board",    label:"Post-it Board",   icon:"🗒️", url:"board.html"},
    {id:"music",    label:"Music",           icon:"🎵", url:"music.html"},
    {id:"network",  label:"Network",         icon:"🕸️", url:"network.html"},
    {id:"messaging",label:"Messaging",       icon:"💬", url:"messaging.html"},
    {id:"cv",       label:"CV",              icon:"📄", url:"cv.html"},
    {id:"pro",      label:"Professional",    icon:"🧭", url:"index.html"}
  ];

  function buildDrawer(cabinet){
    const root = document.createElement("div");
    root.className = "drawer-root";
    root.innerHTML = `
      <div class="folder-shell">
        <div class="speed-index">
          <div class="stacks">
            <div class="stack left"></div>
            <div class="center-well">
              <div class="open-file" id="openFile">
                <div class="bar"></div>
                <div class="tab-top" id="ofTab">Preview</div>
                <div class="chrome"><span id="ofHint">Hover a file tab to preview • Click to open</span><button class="closebtn" id="ofClose">Close</button></div>
                <div class="frame">
                  <iframe id="ofFrame" loading="lazy" referrerpolicy="no-referrer"></iframe>
                </div>
              </div>
            </div>
            <div class="stack right"></div>
          </div>
        </div>
      </div>`;
    const container = cabinet.querySelector(".container");
    container.innerHTML = ""; // clear old tabs
    container.appendChild(root);
    document.body.classList.add("drawer-installed");

    
    const left = root.querySelector(".stack.left");
    const right = root.querySelector(".stack.right");
    const of = root.querySelector("#openFile");
    const ofTab = root.querySelector("#ofTab");
    const ofFrame = root.querySelector("#ofFrame");
    const ofClose = root.querySelector("#ofClose");
    function makeSlim(pg, i){
      const host = (i % 2 === 0) ? left : right;
      const slim = document.createElement("div");
      slim.className = "slim pos"+(i%4);
      slim.dataset.url = pg.url;
      slim.innerHTML = `<div class="tab">${pg.icon} ${pg.label}</div><div class="label">${pg.label}</div>`;
      host.appendChild(slim);
      // Hover → preview in center but keep tucked (only visible when clicked)
      slim.addEventListener("mouseenter", () => {
        ofTab.textContent = pg.label;
        if(ofFrame.dataset.src !== pg.url){
          ofFrame.dataset.src = pg.url;
          ofFrame.src = pg.url;
        }
      });
      // Click → open center file
      slim.addEventListener("click", () => {
        of.classList.add("visible");
      });
    }
    PAGES.forEach((pg,i)=> makeSlim(pg,i));
    ofClose.addEventListener("click", ()=> of.classList.remove("visible"));
    ("click", () => {
      const url = pvFrame?.dataset?.src;
      if(url && url !== "#") location.href = url;
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const cabinet = document.querySelector(".cabinet");
    if(!cabinet) return;
    buildDrawer(cabinet);

    const topZone = document.querySelector(".top-hover-zone");
    // clean previous drag code: we just peek on hover, and toggle on click
    if(topZone){
      topZone.addEventListener("mouseenter", () => cabinet.classList.add("peeking"));
      topZone.addEventListener("mouseleave", () => cabinet.classList.remove("peeking"));
      topZone.addEventListener("click", () => cabinet.classList.toggle("open"));
    }
    // handle button toggles too
    document.querySelectorAll("[data-open-cabinet]").forEach(btn => btn.addEventListener("click", () => cabinet.classList.toggle("open")));
  });
})();
