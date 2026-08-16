
(function(){
  const KEY='prdKanbanTheme';
  const root=document.documentElement;
  function setNeumorphism(on){ var st=document.getElementById('dark-neumorphism'); if(st) st.disabled=!on; }
  function applyTheme(t){ root.dataset.theme=(t==='light'?'light':'dark'); try{localStorage.setItem(KEY,root.dataset.theme);}catch(e){} setNeumorphism(root.dataset.theme!=='light'); }
  window.toggleTheme=function(){ applyTheme(root.dataset.theme==='light'?'dark':'light'); updateBtn(); };
  function updateBtn(){ const b=document.querySelector('.theme-toggle'); if(!b)return; b.textContent=(root.dataset.theme==='light'?'🌙 切换深色':'☀️ 切换浅色'); }
  window.updateThemeBtn=updateBtn;
  let saved; try{saved=localStorage.getItem(KEY);}catch(e){} applyTheme(saved);
  function inject(){
    const el=document.getElementById('tabPrefs'); if(!el)return;
    if(el.querySelector('.theme-row')){updateBtn();return;}
    const row=document.createElement('div'); row.className='theme-row';
    row.style.cssText='margin-top:18px;padding-top:14px;border-top:1px solid rgba(128,128,128,.3)';
    row.innerHTML='<div class="muted" style="margin-bottom:10px">界面主题（本机生效，刷新后保留）。</div>'+
      '<button class="dens-btn theme-toggle" type="button" onclick="toggleTheme()">'+
      (root.dataset.theme==='light'?'🌙 切换深色':'☀️ 切换浅色')+'</button>';
    el.appendChild(row);
  }
  function observe(){ const el=document.getElementById('tabPrefs'); if(el && !window.__themeObs){ window.__themeObs=new MutationObserver(inject); window.__themeObs.observe(el,{childList:true}); } }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){inject();observe();});
  else{inject();observe();}
})();
