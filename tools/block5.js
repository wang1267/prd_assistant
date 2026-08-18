
(function(){
  var editing=false;
  // 与主脚本 editing 同步（监听 view-mode class 变化）
  function syncEditing(){ editing=!document.documentElement.classList.contains('view-mode'); }
  syncEditing();
  var _mo=new MutationObserver(function(){syncEditing();});
  _mo.observe(document.documentElement,{attributes:true,attributeFilter:['class']});

  // P0-3：孤儿 mark 兜底——主脚本 render() 重建 DOM 后，清理 comments 对不上的划线
  function cleanOrphans(){
    try{
      document.querySelectorAll('.cmt-hl').forEach(function(m){
        var cid=m.dataset.cid;
        if(!cid)return;
        var info=curSec(m);
        var store=getCmtStore(info);
        if(store&&store.comments&&store.comments[cid])return; // 有对应评论，保留
        // 孤儿：还原为纯文本（不落盘，只清 DOM；数据层本就没有）
        var p=m.parentNode; if(!p)return;
        while(m.firstChild)p.insertBefore(m.firstChild,m);
        p.removeChild(m);
      });
    }catch(e){}
  }
  window.__cleanCmtOrphans=cleanOrphans;
  // 常驻：main 内 DOM 重建后，若之前有显示的气泡，用新 mark 重新弹出（位置跟随重建后的划线）
  function restoreTip(){
    try{
      if(!lastShownCid)return;
      if(document.querySelector('.cmt-tip'))return; // 已有气泡不重复弹
      var mk=document.querySelector('.cmt-hl[data-cid="'+lastShownCid+'"]');
      if(mk)showTip(mk);
    }catch(e){}
  }
  window.__restoreCmtTip=restoreTip;
  var _mo2=new MutationObserver(function(){cleanOrphans();restoreTip();});
  var _main=document.getElementById('main');if(_main)_mo2.observe(_main,{childList:true,subtree:true});
  cleanOrphans();

  function curSec(el){
    // 从 .editable 或 .sub-card-body 找到所属节与卡片索引
    var ed=el.closest('.editable,.sub-card-body');
    if(!ed)return null;
    // 卡片正文：用 data-sec/data-idx（渲染时无 data-id）；正文：用 data-id
    if(ed.dataset.act==='cardbody'||ed.classList.contains('sub-card-body')){
      return {sec:ed.dataset.sec,cardIdx:ed.dataset.idx!=null?+ed.dataset.idx:null};
    }
    return {sec:ed.dataset.id,cardIdx:null};
  }
  function getCmtStore(info){
    if(!info||!info.sec)return null;
    var c=DATA[info.sec];if(!c)return null;
    if(info.cardIdx!=null){var card=(c.cards||[])[info.cardIdx];return card?card:null;}
    return c;
  }

  var bar=null;
  var cachedRange=null;
  function hideBar(){if(bar){bar.remove();bar=null;}}

  // 选中检测：视图态下在 .editable 里选中文本 → 显示浮动评论按钮
  document.addEventListener('mouseup',function(e){
    if(editing){hideBar();return;}
    if(e.target.closest('.cmt-bar')||e.target.closest('.cmt-tip'))return;
    setTimeout(function(){
      var sel=window.getSelection();
      if(!sel||sel.isCollapsed||!sel.rangeCount){hideBar();return;}
      var range=sel.getRangeAt(0);
      cachedRange=range.cloneRange();
      var common=range.commonAncestorContainer;
      var el=common.nodeType===3?common.parentElement:common;
      if(!el){hideBar();return;}
      var ed=el.closest('.editable');
      // P1-3：表格内选中 → 提示（不静默）
      if(!ed){
        var td=el.closest('td,th');
        if(td&&!editing){
          if(!window.__cmtTblTipShown){window.__cmtTblTipShown=true;try{if(typeof toast==='function')toast('表格内暂不支持划线评论（仅正文区）');}catch(e){}setTimeout(function(){window.__cmtTblTipShown=false;},2500);}
        }
        hideBar();return;
      }
      var rect=range.getBoundingClientRect();
      if(!rect||rect.width<2){hideBar();return;}
      hideBar();
      bar=document.createElement('div');bar.className='cmt-bar';
      // P1-1：右缘 clamp，防溢出屏幕
      var bw=260;
      var bx=Math.max(8,rect.left+rect.width/2-bw/2);
      bx=Math.min(bx,window.innerWidth-bw-8);
      bar.style.left=Math.max(8,bx)+'px';
      bar.style.top=Math.max(8,rect.top-44)+'px';
      bar.innerHTML='<span style="opacity:.8">划线评论</span><input type="text" class="cmt-inp" placeholder="输入评论…" style="border:0;background:var(--line-2,#363B46);color:inherit;border-radius:8px;padding:6px 10px;font-size:12.5px;width:180px;outline:none"><button type="button" class="cmt-ok">✓ 确认</button><button type="button" class="cmt-x">✕</button>';
      var inp=bar.querySelector('.cmt-inp');
      function doCmt(){var v=inp.value.trim();if(!v){inp.focus();return;}addComment(el,v);}
      bar.querySelector('.cmt-ok').onclick=doCmt;
      bar.querySelector('.cmt-x').onclick=hideBar;
      inp.addEventListener('keydown',function(ev){if(ev.key==='Enter'){ev.preventDefault();doCmt();}else if(ev.key==='Escape'){hideBar();}});
      // P1-4：不自动抢焦点，用户点输入框才聚焦
      document.body.appendChild(bar);
    },150);
  });
  document.addEventListener('mousedown',function(e){
    if(e.target.closest('.cmt-bar'))return;
    hideBar();
  });

  function addComment(ed,text){
    hideBar();
    var range=cachedRange;
    if(!range||range.collapsed){return;}
    var info=curSec(ed);
    var store=getCmtStore(info);
    if(!store){return;}
    if(!text||!text.trim())return;
    text=text.trim();
    // P1-2：嵌套拦截——选区已含评论划线时拒绝（防 mark 套 mark）
    try{
      var tmp=range.cloneContents();
      if(tmp.querySelector&&tmp.querySelector('.cmt-hl')){
        if(typeof toast==='function')toast('该选区已含评论划线，请选择新文本');
        return;
      }
    }catch(e2){}
    var cid='c'+Date.now().toString(36)+Math.floor(Math.random()*1000).toString(36);
    // 用 Range API 包裹选中文本为 <mark class="cmt-hl" data-cid>
    var mark;
    try{
      mark=document.createElement('mark');
      mark.className='cmt-hl';
      mark.dataset.cid=cid;
      mark.title='点击查看评论';
      var frag=range.extractContents();
      mark.appendChild(frag);
      range.insertNode(mark);
      cachedRange=null;
    }catch(err){alert('评论划线失败：'+err.message);return;}
    try{window.getSelection().removeAllRanges();}catch(e){}
    // 存评论数据
    if(!store.comments)store.comments={};
    store.comments[cid]={text:text,by:'评审',at:Date.now()};
    // P0 修复：把含 <mark> 的 DOM 写回数据层，mark 才随项目持久化（刷新/切项目/重渲染保留）
    try{ if(typeof saveEditableEl==='function') saveEditableEl(ed); else { try{typeof save==='function'&&save();}catch(e2){} } }catch(e3){}
    if(typeof refreshHealthUI==='function'){try{refreshHealthUI();}catch(e){}}
    // 常驻：确认后自动弹出评论气泡（不自动关闭，只有点删除才消失）
    showTip(mark);
  }

  // 评论气泡抽成 showTip；点击 mark 显示/切换；确认后自动常驻弹出
  var activeTipCleanup=null; // Floating UI autoUpdate 的清理函数
  function stopTip(tip){
    if(activeTipCleanup){try{activeTipCleanup();}catch(e){}activeTipCleanup=null;}
    if(tip&&tip.remove)tip.remove();
  }
  function showTip(mk){
    if(mk)lastShownCid=mk.dataset.cid||lastShownCid;
    var existing=document.querySelector('.cmt-tip'); if(existing)stopTip(existing);
    if(!mk)return;
    var cid=mk.dataset.cid;
    var info=curSec(mk);
    var store=getCmtStore(info);
    var cmt=store&&store.comments?store.comments[cid]:null;
    // 兜底：当前节取不到时，全数据搜该 cid（避免卡片/渲染后归属变化导致评论"看不到"）
    if(!cmt){try{Object.keys(DATA).forEach(function(sk){var c=DATA[sk];if(c&&c.comments&&c.comments[cid]){cmt=c.comments[cid];return;}(c.cards||[]).forEach(function(cd){if(cd&&cd.comments&&cd.comments[cid]){cmt=cd.comments[cid];}});});}catch(e2){}}
    var tip=document.createElement('div');
    tip.className='cmt-tip';
    var d=cmt?new Date(cmt.at):new Date();
    var ds=d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2);
    var meta='';
    if(cmt){
      meta='<div class="cmt-meta"><span>'+esc(cmt.by||'评审')+' · '+ds+'</span><button type="button" class="cmt-del" data-cid="'+cid+'">删除</button></div>';
    }
    tip.innerHTML='<button type="button" class="cmt-tip-x" title="收起气泡（评论仍常驻）">✕</button><div class="cmt-txt">'+esc(cmt?cmt.text:'（评论已删除）')+'</div>'+meta;
    document.body.appendChild(tip);
    // v16.6：锚定交给 Floating UI（offset/flip/shift/hide + autoUpdate），滚动/缩放自动跟随；
    // 划线滚出视口时气泡自动隐藏（不再出现"贴到侧栏/底端"的游离气泡），滚回自动恢复。
    var F=window.FloatingUIDOM;
    var tipW=tip.offsetWidth||340, tipH=tip.offsetHeight||120;
    function fallbackPlace(){
      var vw=window.innerWidth||document.documentElement.clientWidth;
      var vh=window.innerHeight||document.documentElement.clientHeight;
      var r2=mk.getBoundingClientRect();
      if(!(r2.width>=2&&r2.height>=1)){try{mk.scrollIntoView({block:'center'});}catch(e){}r2=mk.getBoundingClientRect();}
      var inView=r2.top>=0&&r2.bottom<=vh+20;
      var top;
      if(inView){
        if(r2.bottom+10+tipH<=vh-8){ top=r2.bottom+10; }
        else if(r2.top-10-tipH>=8){ top=r2.top-10-tipH; }
        else { top=Math.max(8, vh-tipH-16); }
      }else{ top=Math.max(8, vh-tipH-16); }
      tip.style.display=inView?'':'none';
      tip.style.left=Math.max(8, Math.min(r2.left, vw-tipW-8))+'px';
      tip.style.top=top+'px';
    }
    if(F&&F.autoUpdate&&F.computePosition){
      function upd(){
        if(!document.body.contains(tip))return;
        F.computePosition(mk,tip,{
          strategy:'fixed', // v16.7：CSS 是 position:fixed，必须用 fixed 策略，否则按 absolute 换算坐标会跑到屏幕外（气泡看不到的根因）
          placement:'bottom',
          middleware:[F.offset(10),F.flip(),F.shift({padding:10}),F.hide({strategy:'referenceHidden'})]
        }).then(function(pos){
          if(!document.body.contains(tip))return;
          var hid=pos.middlewareData&&pos.middlewareData.hide&&pos.middlewareData.hide.referenceHidden;
          if(hid){tip.style.display='none';return;}
          var px=isFinite(pos.x)?pos.x:8, py=isFinite(pos.y)?pos.y:8;
          tip.style.display='';
          tip.style.left=px+'px';
          tip.style.top=py+'px';
        }).catch(function(){fallbackPlace();});
      }
      fallbackPlace(); // 先就近放一次，避免异步计算完成前不可见
      activeTipCleanup=F.autoUpdate(mk,tip,upd);
    }else{
      // 兜底（正常情况下 Floating UI 已内联）：简单 fixed 定位 + 滚动跟随
      fallbackPlace();
      var follow=function(){ if(!document.body.contains(tip))return; fallbackPlace(); };
      window.addEventListener('scroll',follow,true);
      window.addEventListener('resize',follow);
    }
    // ✕ / 删除（两条路径共用；Floating UI 路径由 stopTip 顺带清理 autoUpdate）
    var x=tip.querySelector('.cmt-tip-x');
    if(x)x.onclick=function(ev){ev.stopPropagation();stopTip(tip);};
    var del=tip.querySelector('.cmt-del');
    if(del)del.onclick=function(ev){
      ev.stopPropagation();
      if(!confirm('删除这条评论划线？'))return;
      deleteCmt(cid,mk,store);
      stopTip(tip);
    };
  }
  function deleteCmt(cid,mk,store){
    var ed=edOf(mk);
    if(mk&&mk.parentNode){
      var parent=mk.parentNode;
      while(mk.firstChild)parent.insertBefore(mk.firstChild,mk);
      parent.removeChild(mk);
    }
    if(store&&store.comments)delete store.comments[cid];
    // P0 修复：删除后把还原为纯文本的 DOM 写回数据层（否则刷新后 mark 复活）
    try{ if(typeof saveEditableEl==='function') saveEditableEl(ed); else { try{typeof save==='function'&&save();}catch(e2){} } }catch(e3){}
  }
  // 点击 mark → 显示/切换评论气泡；点空白处气泡保持常驻（评论本身常驻，删除才消失）
  // 捕获阶段绑定：即使主脚本其它监听器 stopPropagation，评论点击也能先收到（用户反馈点击无反应的修复）
  document.addEventListener('click',function(e){
    if(e.target.closest('.cmt-bar')||e.target.closest('.cmt-tip'))return;
    var mk=e.target.closest('.cmt-hl');
    if(mk){ e.stopPropagation(); showTip(mk); }
  }, true);

  function edOf(el){ return el&&el.closest?el.closest('.editable'):null; }
  function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  var lastShownCid=null; // 常驻气泡：记录当前显示评论，DOM 重建后自动恢复
  window.__commentCtrl={
    hideBar:hideBar,
    // 列表点击 → 定位到具体划线并弹气泡
    reveal:function(mk){ if(mk){ try{mk.scrollIntoView({behavior:'smooth',block:'center'});}catch(e){} showTip(mk); } else { try{toast('评论划线不存在');}catch(e){} } }
  };
})();
