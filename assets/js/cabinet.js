
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
    {id:"pro",      label:"Professional",    icon:"🧭", url:"index.html"}
  ];

  function buildDrawer(cabinet){
    const root = document.createElement("div");
    root.className = "drawer-root";
    root.innerHTML = `
      <div class="drawer">
        <div class="files"></div>
        <div class="preview">
          <div class="label">
            <span id="pvLabel">Preview</span>
            <button class="openbtn" id="pvOpen" disabled>Open</button>
          </div>
          <div class="frame">
            <iframe id="pvFrame" loading="lazy" referrerpolicy="no-referrer"></iframe>
            <div class="overlay"></div>
          </div>
          <div class="hint">Hover a folder to preview • Click to open</div>
        </div>
      </div>`;
    const container = cabinet.querySelector(".container");
    container.innerHTML = ""; // clear old tabs
    container.appendChild(root);
    document.body.classList.add("drawer-installed");

    const files = root.querySelector(".files");
    const pvFrame = root.querySelector("#pvFrame");
    const pvLabel = root.querySelector("#pvLabel");
    const pvOpen  = root.querySelector("#pvOpen");
    const preview = root.querySelector(".preview");
    let current = null, hoverTimer = null;

    PAGES.forEach(pg => {
      const li = document.createElement("div");
      li.className = "file";
      li.dataset.url = pg.url;
      li.innerHTML = `<div class="tab">${pg.icon} ${pg.label}</div><div class="sheet"></div>`;
      files.appendChild(li);

      li.addEventListener("mouseenter", () => {
        pvOpen.disabled = (pg.url === "#");
        pvLabel.textContent = pg.label;
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(() => {
          if (pvFrame.dataset.src !== pg.url){
            preview.classList.add("loading");
            pvFrame.dataset.src = pg.url;
            pvFrame.src = pg.url;
            pvFrame.onload = () => preview.classList.remove("loading");
          }
        }, 120);
      });

      li.addEventListener("click", () => {
        if (pg.url && pg.url !== "#") location.href = pg.url;
      });
    });

    pvOpen.addEventListener("click", () => {
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
