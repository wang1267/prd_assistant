
(function(){
  function neuOn(){var st=document.getElementById('dark-neumorphism');return st?!st.disabled:false;}
  function sync(){
    try{
      var root=document.documentElement;
      var on=root.classList.contains('view-mode');
      var old=document.querySelector('.report-banner');
      if(!on){if(old)old.remove();return;}
      var hc=document.querySelector('.hero .hcontent');
      if(!hc)return;
      if(old)return;
      var lvl='green';
      var pill=document.getElementById('topbarHealthPill');
      if(pill){var m=pill.className.match(/\b(green|yellow|red)\b/);if(m)lvl=m[1];}
      var comp=null;
      try{if(typeof HEALTH!=='undefined'&&HEALTH&&HEALTH.metrics)comp=HEALTH.metrics.completion;}catch(e){}
      var labelMap={green:'健康',yellow:'需关注',red:'风险'};
      var label=labelMap[lvl]||'健康';
      var cnt=0;try{if(typeof STATE!=='undefined'&&STATE&&STATE.framework)cnt=STATE.framework.length;}catch(e){}
      var d=new Date();
      var ds=d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2);
      var compStr=comp!=null?('完成度 '+comp+'%'):(pill&&pill.querySelector('.txt')?pill.querySelector('.txt').textContent:'');
      var b=document.createElement('div');b.className='report-banner';
      b.innerHTML='<div class="rb-kicker">PRD 健康体检报告</div>'
        +'<div class="rb-meta">生成于 '+ds+' · 共 '+cnt+' 个框架节</div>'
        +'<div class="rb-verdict '+lvl+'"><span class="rb-dot"></span>整体：'+label+' · '+(compStr||'—')+'</div>';
      hc.appendChild(b);
    }catch(e){}
  }
  window.__syncViewBanner=sync;
  var mo=new MutationObserver(function(){sync();});
  mo.observe(document.documentElement,{attributes:true,attributeFilter:['class','data-theme']});
  var main=document.getElementById('main');if(main)mo.observe(main,{childList:true,subtree:true});
  var st=document.getElementById('dark-neumorphism');if(st)mo.observe(st,{attributes:true,attributeFilter:['disabled']});
  sync();
})();
