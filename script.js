const LANGS=["C","C#","C++","Clojure","CSS","Dart","Elixir","Go","Haskell","HTML","Java","JavaScript","Julia","Kotlin","Lua","Objective-C","PHP","Python","R","Ruby","Rust","Scala","Shell","Swift","TypeScript","Vue","Zig"];
const $=id=>document.getElementById(id);
const sel=$("lang"),panel=$("panel"),refresh=$("refresh");
const totals={}; // total_count por lenguaje (cache)
const fmt=n=>n.toLocaleString("es");
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

LANGS.forEach(l=>sel.add(new Option(l,l)));

function show(html){panel.innerHTML=html}
function initial(){show('<div class="state">Selecciona un lenguaje para empezar.</div>');refresh.hidden=true}
initial();

async function api(lang,page){
  const q=encodeURIComponent(`language:"${lang}" stars:>50`);
  const r=await fetch(`https://api.github.com/search/repositories?q=${q}&sort=stars&per_page=1&page=${page}`,
    {headers:{Accept:"application/vnd.github+json"}});
  if(r.status===403||r.status===429)throw new Error("Superaste el límite de solicitudes de GitHub. Espera un minuto e inténtalo de nuevo.");
  if(!r.ok)throw new Error(`GitHub respondió con el error ${r.status}.`);
  return r.json();
}

async function load(){
  const lang=sel.value;
  if(!lang){initial();return}
  show('<div class="state"><div class="spin"></div>Buscando un repositorio…</div>');
  refresh.hidden=false;refresh.disabled=true;sel.disabled=true;
  try{
    if(totals[lang]===undefined){
      const first=await api(lang,1);
      totals[lang]=first.total_count;
    }
    const total=Math.min(totals[lang],1000); // la API solo expone los primeros 1000
    if(total===0){
      show('<div class="state">No se encontraron repositorios para este lenguaje. Prueba con otro.</div>');
      refresh.hidden=true;return;
    }
    const data=await api(lang,Math.ceil(Math.random()*total));
    const repo=data.items&&data.items[0];
    if(!repo){show('<div class="state">No se encontraron repositorios. Inténtalo de nuevo.</div>');return}
    show(`<article class="repo">
      <h2><a href="${esc(repo.html_url)}" target="_blank" rel="noopener">${esc(repo.full_name)}</a></h2>
      <p>${esc(repo.description||"Este repositorio no tiene descripción.")}</p>
      <dl class="stats">
        <div><dt>Estrellas</dt><dd>${fmt(repo.stargazers_count)}</dd></div>
        <div><dt>Forks</dt><dd>${fmt(repo.forks_count)}</dd></div>
        <div><dt>Issues abiertos</dt><dd>${fmt(repo.open_issues_count)}</dd></div>
      </dl></article>`);
  }catch(e){
    show(`<div class="err" role="alert">${esc(e.message||"No se pudo conectar con GitHub.")} Pulsa «Refrescar» para reintentar.</div>`);
  }finally{refresh.disabled=false;sel.disabled=false}
}
sel.addEventListener("change",load);
refresh.addEventListener("click",load);
