
/* 需求文档工作台 · AI Agent 控制器（v17.0）
   纯前端方案 C：DeepSeek 直连、Key 存独立 localStorage 键、不导出。
   功能：AI 设置 / 测试连接 / 6 维健康度 / 逐条问题诊断 / 一键优化（全文或按节）
         / 节级差异补丁版本（上限 10 版，回滚护栏）/ AI Diff 逐条确认（接受/拒绝/修改/暂缓）
   以独立 <script id='ai-controller'> 追加，不修改主脚本（block1）。
*/
(function(){
'use strict';
var AI_SAMPLE_TEXT="# 协作工具「协同」示例 PRD\r\n\r\n## 目的\r\n本文档用于定义轻量团队协作工具「协同」的核心需求，明确该产品要解决的痛点、目标用户、核心业务流程、功能边界与验收标准。该产品面向 10-200 人规模的中小团队，把任务看板、文档与进度同步统一到一个工作空间，减少在多个工具间切换带来的信息割裂与沟通损耗。\r\n\r\n## 适用范围\r\n本文档适用于「协同」Web 端与移动端（iOS/Android）的任务协作模块开发与测试，为跨端通用能力。- 适用端：Web 工作台、移动端 App（双端功能对齐）。- 适用团队：研发、设计、运营、市场等需要协同推进项目的团队。- 协作边界：即时通讯与日历由第三方集成提供；账号体系支持企业 SSO 接入；开放 API 供内部系统对接。\r\n\r\n## 定义\r\n- 看板：以列为状态、卡片为任务的视图，拖拽即流转。- 任务：最小工作单元，含负责人、截止日、子项与状态。- 角色：成员在团队中的权限身份（管理员 / 成员 / 访客）。\r\n\r\n## 产品信息与目标\r\n本产品在现有&quot;列表 + 表单&quot;任务管理基础上，新增实时协同看板与工作流引擎，实现多人同时编辑、状态自动流转、进度自动汇总。量化目标（上线判断依据）：- 任务创建到可见响应 ≤ 200ms。- 多人协同编辑端到端同步延迟 ≤ 500ms（P95）。- 服务可用性 ≥ 99.9%。- 离线可查看与本地编辑，恢复网络后自动合并。- 核心流程转化率 ≥ 40%。\r\n\r\n## 用户与场景\r\n- 团队负责人：一眼看清各项目进度与阻塞，以便及时纠偏。- 执行成员：快速领取与更新任务，以便减少沟通成本。- 项目管理员：按角色配置权限，以便保证数据安全。\r\n\r\n## 功能总览\r\n- 看板视图与拖拽（P0）- 任务详情与子任务（P0）- 实时协同编辑（P0）- @评论与通知（P1）- 角色权限 RBAC（P0）- 工作流引擎（P1）- 模板库（P2）- 第三方集成（P1）\r\n\r\n## 非功能需求\r\n- 性能：万级卡片首屏 ≤ 1.5s；协同同步 P95 ≤ 500ms。- 安全：传输与存储加密；支持 SSO 与审计日志。- 可用性：≥ 99.9%；单模块故障不影响其他模块。\r\n\r\n## 验收标准\r\n- 创建任务并拖拽到进行中，看板与列表视图状态一致。- 两人同时编辑同一任务不同字段，双方均看到更新且无覆盖。- 成员改为访客后无法看到敏感字段。- 断网本地修改，恢复网络后自动合并且无冲突丢失。";
var AI_SETTINGS_KEY='prdKanbanAiSettings';
var AI_MAX_VERSIONS=10;
var AI_PATCH_WARN=300*1024;
var AI_SCORE_CHUNK_CHARS=5500; // v17.22：长文档分块评分阈值（单块约 5.5k 字，弱模型安全）
var DIM_META={
  completeness:{label:'完整性'},
  clarity:{label:'清晰度'},
  consistency:{label:'一致性'},
  executability:{label:'可执行性'},
  verifiability:{label:'可验证性'},
  risk:{label:'风险'}
};
function defaultSettings(){
  return {
    provider:'deepseek',
    baseUrl:'https://api.deepseek.com/v1',
    model:'deepseek-chat',
    reviewModel:'',
    apiKey:'',
    targetScore:85,
    maxRounds:3,
    web:false,
    dims:{
      completeness:{weight:25,enabled:true},
      clarity:{weight:20,enabled:true},
      consistency:{weight:15,enabled:true},
      executability:{weight:15,enabled:true},
      verifiability:{weight:15,enabled:true},
      risk:{weight:10,enabled:true}
    }
  };
}
/* ---------- 工具 ---------- */
function aiEsc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function aiDeep(o){try{return JSON.parse(JSON.stringify(o));}catch(e){return o&&typeof o==='object'?Object.assign({},o):o;}}
function aiUid(){return 'a'+Date.now().toString(36)+Math.floor(Math.random()*1e6).toString(36);}
function aiKey(sec,reason){var s=(sec||'')+'|'+(reason||'');var h=5381;for(var i=0;i<s.length;i++){h=((h<<5)+h+s.charCodeAt(i))>>>0;}return 'i_'+h.toString(36);}
function aiFingerprint(str){
  try{
    var h=0xcbf29ce484222325n;
    var bytes=new TextEncoder().encode(String(str||''));
    for(var i=0;i<bytes.length;i++){h=BigInt.asUintN(64,h^BigInt(bytes[i]));h=BigInt.asUintN(64,h*0x100000001b3n);}
    return h.toString(16);
  }catch(e){var h2=5381;var s2=String(str||'');for(var j=0;j<s2.length;j++){h2=((h2<<5)+h2+s2.charCodeAt(j))>>>0;}return 'h'+h2.toString(36);}
}
function aiNormText(s){
  return String(s==null?'':s).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().toLowerCase();
}
function aiReplaceFirst(h,from,to){
  var i=h.indexOf(from);
  if(i<0)return h;
  return h.slice(0,i)+to+h.slice(i+from.length);
}
function aiBlockTags(){return ['P','UL','OL','TABLE','H3','H4'];}
function aiIsBlockTag(tag,attrs){return aiBlockTags().indexOf(tag)>=0||(tag==='DIV'&&/imp-img/i.test(attrs||''));}
function aiBlocksOf(html){
  var h=String(html||''),blocks=[],stack=[],curStart=-1;
  var tagRe=/<\/?([a-zA-Z][a-zA-Z0-9]*)((?:"[^"]*"|'[^']*'|[^>"'])*)\/?>/g,m;
  while((m=tagRe.exec(h))){
    var closing=m[0].charAt(1)==='/';
    var tag=m[1].toUpperCase();
    if(!aiIsBlockTag(tag,m[2]))continue;
    if(!closing){
      if(!stack.length)curStart=m.index;
      stack.push(tag);
    }else if(stack.length){
      var idx=stack.lastIndexOf(tag);
      if(idx>=0){
        stack.splice(idx);
        if(!stack.length&&curStart>=0){
          var end=m.index+m[0].length;
          blocks.push({html:h.slice(curStart,end),text:aiNormText(h.slice(curStart,end))});
          curStart=-1;
        }
      }
    }
  }
  return blocks;
}
function aiHtmlBalanced(html){
  var h=String(html||''),stack=[];
  var voidTags={BR:1,IMG:1,HR:1,INPUT:1,META:1,LINK:1};
  var re=/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g,m;
  while((m=re.exec(h))){
    var tag=m[1].toUpperCase();
    if(voidTags[tag])continue;
    if(m[0].charAt(1)==='/'){if(stack.length&&stack[stack.length-1]===tag)stack.pop();else return false;}
    else stack.push(tag);
  }
  return stack.length===0;
}
function aiApplyEdits(html,edits){
  var results=[];
  edits.forEach(function(e){
    var r={edit:e,ok:false,reason:''};
    if(!e||!e.op){r.reason='缺少操作类型';results.push(r);return;}
    if(e.op==='insertBlock'&&(e.position==='start'||e.position==='end')){
      var ins=aiSanitizeHtml(e.newHtml);
      html=e.position==='start'?ins+html:html+ins;
      r.ok=true;r.oldHtml='';r.newHtml=ins;r.anchor='';results.push(r);return;
    }
    var blocks=aiBlocksOf(html),target=null,ti=-1,mt=aiNormText(e.match);
    for(var i=0;i<blocks.length;i++){
      if(mt&&(blocks[i].text===mt||blocks[i].text.indexOf(mt)>=0)){target=blocks[i];ti=i;break;}
    }
    // v17.7：单块未命中时尝试连续多块范围匹配（模型常把连续多段粘贴成 match）
    if(!target&&mt){
      for(var rs=0;rs<blocks.length;rs++){
        var concat='';
        for(var re2=rs;re2<blocks.length&&re2<rs+10;re2++){
          concat+=(re2>rs?' ':'')+blocks[re2].text;
          if(concat.indexOf(mt)>=0){
            target={html:blocks.slice(rs,re2+1).map(function(b){return b.html;}).join(''),text:concat};
            ti=rs;
            break;
          }
        }
        if(target)break;
      }
    }
    if(!target){r.reason='未找到匹配的原文块（引用需与原文逐字一致）';results.push(r);return;}
    if(e.op==='replaceBlock'){
      var nh=aiSanitizeHtml(e.newHtml);
      html=aiReplaceFirst(html,target.html,nh);
      r.ok=true;r.oldHtml=target.html;r.newHtml=nh;r.anchor='';results.push(r);return;
    }
    if(e.op==='deleteBlock'){
      html=aiReplaceFirst(html,target.html,'');
      r.ok=true;r.oldHtml=target.html;r.newHtml='';r.anchor=ti>0?blocks[ti-1].text.slice(0,80):'';results.push(r);return;
    }
    if(e.op==='insertBlock'){
      var nh2=aiSanitizeHtml(e.newHtml);
      var pos=e.position==='before';
      html=aiReplaceFirst(html,target.html,pos?nh2+target.html:target.html+nh2);
      r.ok=true;r.oldHtml='';r.newHtml=nh2;r.anchor=target.text.slice(0,80);results.push(r);return;
    }
    r.reason='未知操作：'+e.op;results.push(r);
  });
  return {html:html,results:results};
}
function aiNormCell(v){return aiNormText(String(v==null?'':v));}
function aiRowCellsOk(cells,rows){
  if(!Array.isArray(cells)||!cells.length)return false;
  var n=rows&&rows.length&&rows[0].cells?rows[0].cells.length:cells.length;
  return cells.length===n;
}
function aiRowExec(rows,rowEdits){
  var out=aiDeep(rows||[]),results=[];
  rowEdits.forEach(function(e){
    var r={edit:e,ok:false,reason:''};
    if(!e||!e.op){r.reason='缺少行操作类型';results.push(r);return;}
    if(e.op==='insert'&&e.position==='end'){
      if(!aiRowCellsOk(e.cells,out)){r.reason='列数与表头不一致';results.push(r);return;}
      var nr={cells:(e.cells||[]).map(function(v){return String(v==null?'':v);})};
      out.push(nr);
      r.ok=true;r.rowOld=null;r.rowNew=aiDeep(nr);r.anchor='';results.push(r);return;
    }
    var ti=-1,mt=aiNormText(e.match);
    for(var i=0;i<out.length;i++){
      var c0=aiNormCell(out[i]&&out[i].cells&&out[i].cells[0]);
      if(mt&&c0&&(c0===mt||c0.indexOf(mt)>=0)){ti=i;break;}
    }
    if(ti<0){r.reason='未找到匹配行（按首列文本）';results.push(r);return;}
    if(e.op==='update'){
      if(!aiRowCellsOk(e.cells,out)){r.reason='列数与表头不一致';results.push(r);return;}
      r.rowOld=aiDeep(out[ti]);
      out[ti]={cells:(e.cells||[]).map(function(v){return String(v==null?'':v);})};
      r.rowNew=aiDeep(out[ti]);r.anchor='';r.ok=true;results.push(r);return;
    }
    if(e.op==='delete'){
      r.rowOld=aiDeep(out[ti]);
      out.splice(ti,1);
      r.rowNew=null;r.anchor=ti>0?aiNormCell(out[ti-1]&&out[ti-1].cells&&out[ti-1].cells[0]):'';r.ok=true;results.push(r);return;
    }
    if(e.op==='insert'){
      if(!aiRowCellsOk(e.cells,out)){r.reason='列数与表头不一致';results.push(r);return;}
      var nr2={cells:(e.cells||[]).map(function(v){return String(v==null?'':v);})};
      var pos=e.position==='before'?ti:ti+1;
      out.splice(pos,0,nr2);
      r.anchor=aiNormCell(out[ti]&&out[ti].cells&&out[ti].cells[0]);r.rowOld=null;r.rowNew=aiDeep(nr2);r.ok=true;results.push(r);return;
    }
    r.reason='未知行操作：'+e.op;results.push(r);
  });
  return {rows:out,results:results};
}
function aiSleep(ms){return new Promise(function(r){setTimeout(r,ms);});}
function aiClamp(v,lo,hi){v=+v;if(isNaN(v))return lo;return Math.max(lo,Math.min(hi,v));}
function aiRound(v){return Math.round((+v||0));}
function aiStripTags(h){if(!h)return '';var d=document.createElement('div');d.innerHTML=String(h);return (d.textContent||'').replace(/\s+/g,' ').trim();}
function aiToast(m){try{if(typeof toast==='function')toast(m);else alert(m);}catch(e){try{alert(m);}catch(e2){}}}
function aiHtmlToText(h){if(typeof htmlToText==='function'){try{return htmlToText(h)||'';}catch(e){}}return aiStripTags(h);}
function aiSectionEmpty(type,id){if(typeof sectionEmpty==='function'){try{return sectionEmpty(type,id);}catch(e){}}return {html:''};}
function aiHashOf(o){return aiKey('obj',JSON.stringify(o));}

/* ---------- 设置存取 ---------- */
function aiGetSettings(){
  var def=defaultSettings();
  try{
    var raw=localStorage.getItem(AI_SETTINGS_KEY);
    if(raw){var s=JSON.parse(raw);if(s&&typeof s==='object'){def=Object.assign(def,s);def.dims=Object.assign(def.dims,s.dims||{});Object.keys(DIM_META).forEach(function(k){if(!def.dims[k])def.dims[k]={weight:10,enabled:true};});}}
  }catch(e){}
  return def;
}
function aiSaveSettings(s){
  try{localStorage.setItem(AI_SETTINGS_KEY,JSON.stringify(s));return true;}
  catch(e){aiToast('AI 设置保存失败（本地存储空间不足）');return false;}
}
function aiNormBase(u){
  u=(u||'').trim().replace(/\/+$/,'');
  if(!/^https?:\/\//i.test(u))u='https://'+u;
  return u;
}

/* ---------- 项目内 AI 状态 ---------- */
function aiState(){
  var p=currentProj();
  if(!p)return null;
  if(!p.ai||typeof p.ai!=='object')p.ai={versions:[],lastReport:null,ignoredAiIssues:[],pendingDiffs:null};
  if(!p.ai.locks||typeof p.ai.locks!=='object')p.ai.locks={};
  return p.ai;
}
function aiPersist(){try{typeof flushSave==='function'?flushSave():(typeof save==='function'&&save());}catch(e){}}
function aiIsSectionLocked(sid){var st=aiState();return !!(st&&st.locks&&st.locks[sid]);}
function aiToggleSectionLock(sid){
  if(!STATE.framework.find(function(s){return s.id===sid;}))return;
  var st=aiState();if(!st)return;
  if(st.locks[sid]){delete st.locks[sid];aiToast('已解除 AI 对该节的锁定');}
  else{st.locks[sid]=Date.now();aiToast('已锁定该节：AI 只能提出建议，不能写入');}
  aiPersist();try{render();}catch(e){}aiRenderPanel();
}

/* ---------- 文本抽取 ---------- */
function aiSecText(id,fields,noCards){
  var fw=STATE.framework.find(function(x){return x.id===id;});
  if(!fw)return '';
  var c=DATA[id]||aiSectionEmpty(fw.type,id);
  var t='';
  if(fields&&'html' in fields)t=aiHtmlToText(fields.html);
  else if(c.items&&c.items.length){
    t=c.items.map(function(i){
      if(i&&i.name!=null)return (i.name||'')+' '+(i.desc||'')+' '+(i.priority||'')+' '+(i.status||'');
      if(i&&i.text!=null)return (i.text||'');
      if(i&&i.role!=null)return '作为'+(i.role||'')+'我希望'+(i.want||'')+'以便'+(i.soThat||'');
      return '';
    }).join('\n');
  }else t=(fields&&'html' in fields)?aiHtmlToText(fields.html):aiHtmlToText(c.html||'');
  var rows=fields&&'rows' in fields?fields.rows:(c.rows||[]);
  if(rows&&rows.length)t+='\n'+(rows.map(function(r){return '| '+((r.cells||[]).map(function(v){return String(v==null?'':v);})).join(' | ')+' |';}).join('\n'));
  if(c.cards&&c.cards.length&&!noCards)t+='\n'+(c.cards.map(function(i){return (i.title||'')+' '+aiHtmlToText(i.html||'');}).join('\n'));
  return t.replace(/\s+/g,' ').trim();
}
function aiDocText(){
  return aiDocTextOpt(false);
}
function aiDocTextOpt(noCards){
  return STATE.framework.map(function(s){
    return '## ['+s.id+'] '+s.title+'\n'+(aiSecText(s.id,null,noCards)||'（空）');
  }).join('\n\n');
}
function aiDocTextWith(pm,noCards){
  return STATE.framework.map(function(s){
    return '## ['+s.id+'] '+s.title+'\n'+(pm&&pm[s.id]?aiSecText(s.id,pm[s.id],noCards):(aiSecText(s.id,null,noCards)||'（空）'));
  }).join('\n\n');
}
function aiFieldsOf(ch){
  if(!ch)return null;
  if(ch.replaceSection!=null)return {html:ch.replaceSection};
  if(ch.replaceRows)return {rows:ch.replaceRows};
  if(ch.type==='table'){
    var c0=DATA[ch.sectionId]||{};
    return {rows:aiRowExec(c0.rows||[],ch.rowEdits||[]).rows};
  }
  if(ch.type==='text'){
    var c1=DATA[ch.sectionId]||{};
    return {html:aiApplyEdits(String(c1.html||''),ch.edits||[]).html};
  }
  return null;
}

/* ---------- AI Client ---------- */
function aiClassify(err,resp,bodyMsg){
  if(err&&err.name==='AbortError')return {kind:'timeout',message:'请求超时，请检查网络后重试。'};
  if(resp){
    var st=resp.status;
    if(st===401||st===403)return {kind:'auth',message:'API Key 无效或无权限（'+st+'），请到 设置→AI 检查 Key。'};
    if(st===429)return {kind:'rate',message:'请求过于频繁（429 限流），已重试仍失败，请稍后再试。'};
    if(st===400)return {kind:'param',message:'请求参数错误（400）：'+(bodyMsg||'请检查模型名是否正确。')};
    if(st===404||st===405)return {kind:'notfound',message:'接口地址或模型不存在（'+st+'），请检查 Base URL 与模型名。'};
    if(st>=500)return {kind:'server',message:'AI 服务端异常（'+st+'），请稍后重试。'};
    return {kind:'http',message:'请求失败（HTTP '+st+'）：'+(bodyMsg||'未知错误')};
  }
  if(err instanceof TypeError)return {kind:'net',message:'网络/跨域错误：DeepSeek 对浏览器直连可能不支持 CORS，或当前无网络。可换兼容服务商，或后续接薄代理（Base URL 不变）。'};
  if(err&&err.kind)return err;
  return {kind:'unknown',message:'请求失败：'+(err&&err.message?err.message:err)};
}
function aiExtractJson(text){
  if(text==null)return null;
  var t=String(text).replace(/^\uFEFF/,'').trim();
  var m=t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if(m)t=m[1].trim();
  var a=t.indexOf('{'),b=t.lastIndexOf('}');
  if(a<0||b<=a)return null;
  var slice=t.slice(a,b+1);
  var obj=aiTryParse(slice);
  if(obj)return obj;
  obj=aiTryParse(slice.replace(/,(\s*[}\]])/g,'$1'));
  if(obj)return obj;
  var depth=0,start=-1;
  for(var i=0;i<t.length;i++){
    var ch=t[i];
    if(ch==='{'){if(depth===0)start=i;depth++;}
    else if(ch==='}'){depth--;if(depth===0&&start>=0){var sub=t.slice(start,i+1);var o=aiTryParse(sub)||aiTryParse(sub.replace(/,(\s*[}\]])/g,'$1'));if(o)return o;}}
  }
  return null;
  function aiTryParse(s){try{return JSON.parse(s);}catch(e){return null;}}
}
function aiApplyWebSearch(body,st){
  var u=(st.baseUrl||'').toLowerCase();
  if(/bigmodel|zhipuai/.test(u)){
    body.tools=[{type:'web_search',web_search:{enable:true,search_result:true}}];
  }else if(/dashscope|qwen|aliyun/.test(u)){
    body.enable_search=true;
  }else{
    body.tools=[{type:'web_search',web_search:{enable:true}}];
  }
}
var AI_PRIVACY_ACK_KEY='prdKanbanAiPrivacyAckV1';
var aiPrivacySeen=(function(){try{return JSON.parse(localStorage.getItem(AI_PRIVACY_ACK_KEY)||'{}')||{};}catch(e){return {};}})();
function aiPrivacyMarkSeen(){try{localStorage.setItem(AI_PRIVACY_ACK_KEY,JSON.stringify(aiPrivacySeen));}catch(e){}}
function aiPrivacyMeta(messages,opts){
  var raw=(messages||[]).map(function(m){return String(m&&m.content||'');}).join('\n');
  var label='AI 对话',scope='本轮对话中输入的文字';
  if(/质量审查|六个维度|分块评分/.test(raw)){label='AI 深度体检';scope='当前项目的 PRD 全文、章节结构和规则命中摘要';}
  else if(/需求文档改写|优化|目标分/.test(raw)){label='AI 优化';scope=/只优化节|本章节/.test(raw)?'选中章节的正文、相关问题和项目上下文':'当前项目的 PRD 全文、问题清单和项目上下文';}
  else if(/结构整理|错位信号|搬到哪个节/.test(raw)){label='AI 结构对齐';scope='当前项目的章节结构与各章节正文';}
  else if(/评审复核员|多角色评审/.test(raw)){label='AI 复核/评审';scope='当前项目的 PRD 全文、拟修改摘要和评审上下文';}
  else if(/产品描述|本章节|章节 id/.test(raw)){label='AI 撰写';scope='你填写的产品描述、所选框架和当前待生成章节要求';}
  return {label:label,scope:scope,key:label+'|'+scope};
}
function aiPrivacyConfirm(meta,st){
  meta=meta||{label:'AI 请求',scope:'本次操作所需内容',key:'default'};
  if(typeof window!=='undefined'&&window.__AI_TEST_MODE)return Promise.resolve(true);
  if(aiPrivacySeen.firstUse)return Promise.resolve(true);
  return new Promise(function(resolve,reject){
    var old=document.getElementById('aiPrivacyModal');if(old)old.remove();
    var provider={deepseek:'DeepSeek',openai:'OpenAI',custom:'自定义 OpenAI 兼容服务'}[st.provider]||st.provider||'当前服务商';
    var m=document.createElement('div');m.className='modal open';m.id='aiPrivacyModal';
    m.innerHTML='<div class="box" role="dialog" aria-modal="true" aria-labelledby="aiPrivacyTitle" style="max-width:600px"><div class="m-head"><h3 id="aiPrivacyTitle">发送前确认 · '+aiEsc(meta.label)+'</h3><button class="x" type="button" data-priv="cancel" aria-label="取消">×</button></div><div class="m-body"><div class="impact-summary"><b>本次会发送到 '+aiEsc(provider)+'：</b><ul><li><b>模型：</b>'+aiEsc(st.model||'未填写')+'</li><li><b>服务地址：</b>'+aiEsc(aiNormBase(st.baseUrl||''))+'</li><li><b>发送范围：</b>'+aiEsc(meta.scope)+'</li><li><b>不会发送：</b>API Key、界面主题和本机其他项目数据（除非它们已写入本次选中的正文/对话）。</li></ul></div><div class="impact-summary" style="margin-top:10px"><b>敏感信息提醒</b><br>请先删除或替换账号密码、Token、身份证/手机号、客户名单、未公开合同与生产数据；需要时可用“[已脱敏]”占位后再发送。</div></div><div class="m-foot"><button type="button" data-priv="cancel">取消本次发送</button><button type="button" class="btn btn--primary" data-priv="confirm">确认并发送</button></div></div>';
    document.body.appendChild(m);
    function done(ok){if(m.parentNode)m.remove();if(ok){aiPrivacySeen.firstUse=true;aiPrivacyMarkSeen();resolve(true);}else reject({kind:'privacy',message:'已取消本次 AI 发送'});}
    m.addEventListener('click',function(e){var b=e.target.closest('[data-priv]');if(b)done(b.dataset.priv==='confirm');});
  });
}
function aiChatOnce(messages,opts){
  var st=aiGetSettings();
  var base=aiNormBase(st.baseUrl);
  var body={model:opts.model||st.model,messages:messages,stream:!!opts.stream,temperature:opts.temperature==null?0.3:opts.temperature};
  if(opts.json)body.response_format={type:'json_object'};
  if(opts.maxTokens)body.max_tokens=opts.maxTokens;
  if(st.web&&!opts.json)aiApplyWebSearch(body,st);
  return aiPrivacyConfirm(aiPrivacyMeta(messages,opts),st).then(function(){
  var ctrl=new AbortController();
  if(aiGlobalAbort){
    aiGlobalAbort.signal.addEventListener('abort',function(){try{ctrl.abort();}catch(e){}});
  }
  var timer=setTimeout(function(){ctrl.abort();},opts.timeout||(opts.stream?150000:45000));
  return fetch(base+'/chat/completions',{
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':'Bearer '+String(st.apiKey||'').trim()},
    body:JSON.stringify(body),
    signal:ctrl.signal
  }).then(function(resp){
    if(!resp.ok){
      clearTimeout(timer);
      return resp.json().then(function(j){var m=(j&&j.error&&j.error.message)||'';throw aiClassify(null,resp,m);}).catch(function(e){
        if(e&&e.kind)throw e;
        throw aiClassify(null,resp,'');
      });
    }
    if(opts.stream){
      clearTimeout(timer);
      if(!resp.body||!resp.body.getReader)throw {kind:'stream',message:'当前浏览器不支持流式读取。'};
      var reader=resp.body.getReader(),dec=new TextDecoder(),buf='',content='';
      var idleT=setTimeout(function(){try{ctrl.abort();}catch(e){}},opts.idleTimeout||15000);
      function kickIdle(){clearTimeout(idleT);idleT=setTimeout(function(){try{ctrl.abort();}catch(e){}},opts.idleTimeout||15000);}
      function endStream(){clearTimeout(idleT);return content;}
      function pump(){
        return reader.read().then(function(r){
          if(r.done)return endStream();
          kickIdle();
          buf+=dec.decode(r.value,{stream:true});
          var nl;
          while((nl=buf.indexOf('\n'))>=0){
            var line=buf.slice(0,nl).trim();buf=buf.slice(nl+1);
            if(line.indexOf('data:')!==0)continue;
            var data=line.slice(5).trim();
            if(data==='[DONE]'){buf='';return endStream();}
            try{
              var j=JSON.parse(data);
              var ch=j.choices&&j.choices[0]&&j.choices[0].delta;
              var d=ch&&ch.content;
              if(d){content+=d;if(opts.onDelta)opts.onDelta(content);}
              var dr=ch&&(ch.reasoning_content||ch.reasoning||ch.thinking);
              if(dr&&opts.onReasoning)opts.onReasoning(dr);
            }catch(e){}
          }
          return pump();
        }).catch(function(e){
          clearTimeout(idleT);
          if(e&&e.name==='AbortError')throw {kind:'timeout',message:'流式响应空闲超时（15 秒无数据），已中断。'};
          throw e;
        });
      }
      return pump();
    }
    clearTimeout(timer);
    return resp.json().then(function(j){
      var c=(j.choices&&j.choices[0]&&j.choices[0].message&&j.choices[0].message.content)||'';
      return c;
    });
  }).catch(function(e){
    clearTimeout(timer);
    if(e&&e.kind)throw e;
    throw aiClassify(e,null,'');
  });
  });
}
function aiChat(messages,opts){
  var lastErr=null;
  function attempt(n){
    return aiChatOnce(messages,opts).catch(function(e){
      lastErr=e;
      if(e.kind==='auth'||e.kind==='param'||e.kind==='notfound')throw e;
      if(aiCancelFlag)throw {kind:'canceled',message:'已停止'};
      if(n<2){if(opts.onStatus)opts.onStatus('网络波动，重试中（'+(n+1)+'/2）…');return aiSleep(1200*n).then(function(){if(aiCancelFlag)throw {kind:'canceled',message:'已停止'};return attempt(n+1);});}
      throw e;
    });
  }
  return attempt(1);
}
function aiAskJSON(messages,opts){
  var last=null;
  function once(useStream){
    if(aiCancelFlag)return Promise.reject({kind:'canceled',message:'已停止'});
    return aiChat(messages,{stream:useStream,json:!useStream,onDelta:opts.onDelta,onStatus:opts.onStatus,temperature:opts.temperature,timeout:opts.timeout,model:opts.model,maxTokens:opts.maxTokens}).then(function(c){
      var j=aiExtractJson(c);
      if(j)return j;
      last={kind:'parse',message:'AI 返回内容不是合法 JSON，已重试。',raw:String(c||'').slice(0,400)};
      return null;
    }).catch(function(e){
      if(e&&(e.kind==='auth'||e.kind==='param'||e.kind==='notfound'))throw e;
      last=e&&e.kind?e:{kind:'net',message:'AI 请求失败。'};
      return null;
    });
  }
  // v17.13：非流式 + json_object 优先（弱模型更稳），流式作兜底
  return once(false).then(function(j){
    if(aiCancelFlag)return Promise.reject({kind:'canceled',message:'已停止'});
    if(j)return j;
    if(opts.onStatus)opts.onStatus('非流式解析异常，改用流式重试…');
    return once(true).then(function(j2){
      if(j2)return j2;
      throw (last&&last.kind?last:{kind:'parse',message:'AI 未返回可用 JSON'});
    });
  });
}

/* ---------- Prompt 构造 ---------- */
function aiScoreSystem(){
  var s=aiGetSettings();
  var dims=[];
  Object.keys(DIM_META).forEach(function(k){
    var d=s.dims[k]||{weight:10,enabled:true};
    dims.push(DIM_META[k].label+'（权重 '+(d.enabled?d.weight:0)+'）');
  });
  var fw=STATE.framework.map(function(x){return x.id+'「'+x.title+'」类型:'+x.type+(x.required?'（必填）':'');}).join('；');
  var rules=(STATE.ruleSet||[]).filter(function(r){return r&&r.enabled;}).map(function(r){return r.id+'「'+r.dim+'」'+r.desc+(r.level==='red'?'[红]':'[黄]');}).join('；');
  return '你是资深 PRD 评审专家。请依据下面给出的文档框架与内置规则基线，对用户提供的 PRD 内容逐节体检并评分。\n'
    +'评分维度：'+dims.join('、')+'。每维 0-100 整数分；完整性问题（必填节缺失、关键信息缺失）应给低分。\n'
    +'文档框架：'+fw+'\n'
    +'内置规则基线（红=必填缺失，黄=疑似缺失/表述含糊）：'+rules+'\n'
    +'issues 的 sectionId 必须使用文档内容中 [id] 标记里的确切 id；全文性问题 sectionId 用 null。severity 只允许 high/medium/low。\n'
    +'证据要求：每条 issue 必须带 quote——从文档中**逐字引用**证明该问题的原文片段（缺失类问题引用所属节标题并注明"未发现 XX"）；每个维度必须带 note——一句话说明该维度评分的依据。quote 必须能直接在原文中找到，禁止编造。\n'
    +'严格只输出 JSON，不要输出任何其他文字：{"summary":"一句话总评","dimensions":[{"id":"completeness","name":"完整性","score":0,"note":"评分依据","issues":[{"sectionId":"id或null","severity":"high|medium|low","reason":"原因","quote":"原文逐字引用","suggestion":"改进建议"}]},{"id":"clarity","name":"清晰度","score":0,"note":"","issues":[]},{"id":"consistency","name":"一致性","score":0,"note":"","issues":[]},{"id":"executability","name":"可执行性","score":0,"note":"","issues":[]},{"id":"verifiability","name":"可验证性","score":0,"note":"","issues":[]},{"id":"risk","name":"风险","score":0,"note":"","issues":[]}]}';
}
function aiIssueLines(report){
  var out=[];
  (report.dimensions||[]).forEach(function(d){
    (d.issues||[]).forEach(function(it){
      var q=it.quote?('（引用："'+String(it.quote).slice(0,60)+'"）'):'';
      out.push('- ['+it.severity+']'+(it.sectionId?'（'+it.sectionTitle+'）':'（全文）')+' '+it.reason+' '+q+' → '+it.suggestion);
    });
  });
  return out.join('\n')||'（无明显问题）';
}
function aiRelatedIssues(change,report){
  var all=[];
  (report&&report.dimensions||[]).forEach(function(d){(d.issues||[]).forEach(function(it){
    if(!change||!change.sectionId||!it.sectionId||it.sectionId===change.sectionId)all.push({id:it.id,label:(it.reason||'未命名问题').slice(0,42),sectionId:it.sectionId||null});
  });});
  return all.slice(0,4);
}
function aiRuleHitSnapshot(){
  var health=runHealth();
  return (health&&health.activeHits||[]).map(function(h){return {key:[h.ruleId,h.sectionId,h.snippet].join('|'),ruleId:h.ruleId,sectionId:h.sectionId,snippet:h.snippet};});
}
function aiBuildRecheck(before,review){
  var after=aiRuleHitSnapshot(),old={};(before||[]).forEach(function(h){old[h.key]=h;});var now={};after.forEach(function(h){now[h.key]=h;});
  return {at:Date.now(),resolved:(before||[]).filter(function(h){return !now[h.key];}),remaining:after.filter(function(h){return old[h.key];}),introduced:after.filter(function(h){return !old[h.key];}),independentReview:review?{score:review.score,verdict:review.verdict,summary:review.summary||''}:null};
}
function aiScore(text,opts){
  var st=aiState();
  var fp=aiFingerprint(JSON.stringify({t:text,f:STATE.framework.map(function(x){return x.id+x.type+(x.required?1:0)+x.title;}).join('|'),r:(STATE.ruleSet||[]).filter(function(x){return x&&x.enabled;}).map(function(x){return x.id;}).join('|'),d:JSON.stringify(aiGetSettings().dims)}));
  if(st&&st.scoreCache&&st.scoreCache.fingerprint===fp){
    var cached=aiDeep(st.scoreCache.report);cached.cached=true;
    return Promise.resolve(cached);
  }
  var doCache=function(report){if(st)st.scoreCache={fingerprint:fp,report:aiDeep(report)};return report;};
  // v17.22：长文档分块评分——超过阈值按节切块、逐块打分、按内容长度加权聚合，避免弱模型长输出截断
  if(String(text||'').length>AI_SCORE_CHUNK_CHARS){
    return aiScoreChunked(text,opts).then(doCache);
  }
  return aiAskJSON([
    {role:'system',content:aiScoreSystem()},
    {role:'user',content:'请评分以下 PRD 内容：\n\n'+text}
  ],{temperature:0,onStatus:opts&&opts.onStatus,onDelta:opts&&opts.onDelta,timeout:120000}).then(function(resp){
    return doCache(aiScoreNormalize(resp));
  });
}
function aiScoreNormalize(resp){
  var s=aiGetSettings();
  var dims=resp&&Array.isArray(resp.dimensions)?resp.dimensions:[];
  var out=[];
  var totalW=0,totalV=0;
  var docTxt=aiDocText();
  Object.keys(DIM_META).forEach(function(k){
    var cfg=s.dims[k]||{weight:10,enabled:true};
    var d=dims.filter(function(x){return x&&(x.id===k);})[0];
    var score=d&&!isNaN(+d.score)?aiRound(d.score):0;
    var issues=d&&Array.isArray(d.issues)?d.issues.map(function(it){
      var sid=it.sectionId||null;
      var q=String(it.quote||'');
      var hay=sid?aiSecText(sid):docTxt;
      var low=!!q&&aiNormText(hay).indexOf(aiNormText(q))<0;
      return {id:aiKey(sid||'',it.reason||''),sectionId:sid,sectionTitle:STATE.framework.find(function(f){return f.id===sid;})?(STATE.framework.find(function(f){return f.id===sid;})).title:'',severity:(it.severity==='high'||it.severity==='medium'||it.severity==='low')?it.severity:'medium',reason:String(it.reason||''),quote:q,lowConfidence:low,suggestion:String(it.suggestion||'')};
    }):[];
    if(!d){issues.push({id:aiKey(k,'missing'),sectionId:null,sectionTitle:'',severity:'medium',reason:'该维度未能评估（AI 未返回）',suggestion:'请重试深度体检。'});}
    out.push({id:k,name:d&&d.name?d.name:DIM_META[k].label,score:score,note:String(d&&d.note||''),weight:cfg.enabled?cfg.weight:0,issues:issues});
    if(cfg.enabled){totalW+=cfg.weight;totalV+=score*cfg.weight;}
  });
  var total=totalW?aiRound(totalV/totalW):0;
  return {total:total,dimensions:out,summary:String(resp&&resp.summary||''),generatedAt:Date.now(),cached:false};
}
function aiChunkDoc(text,maxChars){
  var limit=maxChars||AI_SCORE_CHUNK_CHARS;
  var lines=String(text||'').split('\n');
  var chunks=[],cur=[],curLen=0;
  lines.forEach(function(ln){
    var isHead=/^##\s*\[[^\]]+\]/.test(ln);
    var addLen=ln.length+1;
    if(isHead&&curLen>0&&curLen+addLen>limit){chunks.push(cur.join('\n'));cur=[];curLen=0;}
    cur.push(ln);curLen+=addLen;
  });
  if(cur.length)chunks.push(cur.join('\n'));
  return chunks.filter(function(c){return String(c).trim();});
}
function aiScoreChunked(text,opts){
  var chunks=aiChunkDoc(text,AI_SCORE_CHUNK_CHARS);
  if(chunks.length<=1)return Promise.resolve(null);
  var results=[];
  function next(i){
    if(aiCancelFlag)return Promise.reject({kind:'canceled',message:'已停止'});
    if(i>=chunks.length)return Promise.resolve(results);
    if(opts&&opts.onStatus)opts.onStatus('长文档分块评分 '+(i+1)+'/'+chunks.length+'…');
    return aiAskJSON([
      {role:'system',content:aiScoreSystem()},
      {role:'user',content:'这是长文档的第 '+(i+1)+'/'+chunks.length+' 个分块，请仅依据该分块内容评分并输出 JSON：\n\n'+chunks[i]}
    ],{temperature:0,onStatus:opts&&opts.onStatus,onDelta:opts&&opts.onDelta,timeout:120000,maxTokens:4000}).then(function(resp){
      results.push({resp:resp,len:chunks[i].length});
      return next(i+1);
    });
  }
  return next(0).then(function(){
    var s=aiGetSettings();
    var out=[];
    Object.keys(DIM_META).forEach(function(k){
      var cfg=s.dims[k]||{weight:10,enabled:true};
      var wSum=0,vSum=0,issues=[],notes=[],seen={};
      results.forEach(function(r){
        var d=(r.resp&&Array.isArray(r.resp.dimensions)?r.resp.dimensions:[]).filter(function(x){return x&&x.id===k;})[0];
        if(d&&!isNaN(+d.score)){wSum+=r.len;vSum+=(+d.score)*r.len;}
        (d&&Array.isArray(d.issues)?d.issues:[]).forEach(function(it){
          var sid=it.sectionId||null;
          var q=String(it.quote||'');
          var hay=sid?aiSecText(sid):aiDocText();
          var low=!!q&&aiNormText(hay).indexOf(aiNormText(q))<0;
          var key=aiKey(sid||'',it.reason||'');
          if(seen[key])return;seen[key]=1;
          issues.push({id:key,sectionId:sid,sectionTitle:STATE.framework.find(function(f){return f.id===sid;})?(STATE.framework.find(function(f){return f.id===sid;})).title:'',severity:(it.severity==='high'||it.severity==='medium'||it.severity==='low')?it.severity:'medium',reason:String(it.reason||''),quote:q,lowConfidence:low,suggestion:String(it.suggestion||''),source:it.ruleId?'规则 '+String(it.ruleId):'AI 推断',status:'open'});
        });
        if(d&&d.note)notes.push(String(d.note));
      });
      var score=wSum?aiRound(vSum/wSum):0;
      if(!wSum)issues.push({id:aiKey(k,'missing'),sectionId:null,sectionTitle:'',severity:'medium',reason:'该维度未能评估（AI 未返回）',suggestion:'请重试深度体检。'});
      out.push({id:k,name:DIM_META[k].label,score:score,note:notes.join('；').slice(0,300),weight:cfg.enabled?cfg.weight:0,issues:issues});
    });
    var total=aiComputeTotal({dimensions:out});
    var sumParts=results.map(function(r){return String(r.resp&&r.resp.summary||'').slice(0,60);}).filter(Boolean);
    var summary='长文档分块评分：全文 '+String(text||'').length+' 字 / '+chunks.length+' 个分块。'+(sumParts.length?('｜'+sumParts.join('｜')):'');
    return {total:total,dimensions:out,summary:summary,generatedAt:Date.now(),cached:false,chunked:true};
  });
}
function aiOptimizePrompt(text,scope,issues,target){
  var fw=STATE.framework.map(function(x){return x.id+'「'+x.title+'」类型:'+x.type;}).join('；');
  var scopeNote=scope.mode==='section'?'本次只优化节 ['+scope.sectionId+']，changes 只能包含该节。':'本次优化整份文档。';
  var ctx=aiProjectContextText();
  return {
    system:'你是资深 PRD 优化专家。基于体检报告对内容做精准优化：只改有明显问题的部分，保持原有结构与语气，不得虚构需求、不得擅自增删节。\n'
      +'文档节清单：'+fw+'\n'
      +'输出规则（最小编辑）：\n'
      +'1) text 节只给 edits——按"块"操作（块=段落/列表/表格/标题等整块），每条 match 必须**逐字引用文档中该块的原文文本**（从下方"当前内容"复制，只引用**正文块**，不要引用小卡片内容，小卡片不在正文块中），newHtml 是替换后的整块 HTML（基础标签：p/ul/ol/li/strong/em/h3/h4/table，禁止 script/style/on* 属性）；未引用的块一律不要改。\n'
      +'2) table 节只给 rowEdits——按行操作，match 用该行首列单元格文本定位，cells 为整行新单元格数组（含首列，列数必须与表头一致）。\n'
      +'3) 清单/用户故事/小卡片等无法结构化改写的节只给 type:"suggestion" 和建议文字。\n'
      +'严格只输出 JSON：{"changes":[{"sectionId":"节id","type":"text","edits":[{"op":"replaceBlock","match":"被替换块的原文","newHtml":"替换后的整块HTML"},{"op":"insertBlock","match":"锚点块原文","newHtml":"新块HTML","position":"after|before|start|end"},{"op":"deleteBlock","match":"要删除的块原文"}]},{"sectionId":"节id","type":"table","rowEdits":[{"op":"update","match":"首列文本","cells":["列1","列2"]},{"op":"insert","match":"锚点行首列文本","cells":["列1","列2"],"position":"after|before|end"},{"op":"delete","match":"该行首列文本"}]},{"sectionId":"节id","type":"suggestion","suggestion":"建议文字"}],"summary":"本轮改动摘要"}\n'
      +'未改动的节不要出现在 changes 里。',
    user:(ctx?ctx+'\n\n':'')+scopeNote+'\n目标分：'+target+'。\n\n当前体检问题：\n'+issues+'\n\n当前内容：\n'+text
  };
}
function aiOptimize(text,scope,issues,target,opts){
  var p=aiOptimizePrompt(text,scope,issues,target);
  return aiAskJSON([
    {role:'system',content:p.system},
    {role:'user',content:p.user}
  ],{temperature:0.3,onStatus:opts&&opts.onStatus,onDelta:opts&&opts.onDelta,timeout:150000,maxTokens:8000}).then(function(resp){
    return {changes:Array.isArray(resp&&resp.changes)?resp.changes:[],summary:String(resp&&resp.summary||''),fallback:false};
  });
}
function aiOptimizeSimple(text,scope,issues,target,opts){
  var fw=STATE.framework.map(function(x){return x.id+'「'+x.title+'」类型:'+x.type;}).join('；');
  var scopeNote=scope.mode==='section'?'本次只优化节 ['+scope.sectionId+']。':'本次优化整份文档。';
  var ctx=aiProjectContextText();
  var p={
    system:'你是 PRD 优化专家。基于体检问题只改写有问题的节，保留其余内容与语气，不得虚构需求。\n'
      +'输出格式（整节替换，最简单可靠）：{"changes":[{"sectionId":"节id","type":"text|table|suggestion","newHtml":"text 节：整节完整替换后的 HTML（保留原内容，只改有问题部分；基础标签 p/ul/ol/li/strong/em/h3/h4/table）","newRows":[{"cells":["列1","列2"]}],"suggestion":"建议文字"}],"summary":"一句话总结"}\n'
      +'注意：newHtml 必须包含该节正文的全部内容（只改有问题部分，不得删减未授权内容）；小卡片内容不用管。\n'
      +'文档节清单：'+fw+'\n'
      +'未改动的节不要出现在 changes 里；严格只输出 JSON。',
    user:(ctx?ctx+'\n\n':'')+scopeNote+'\n目标分：'+target+'。\n\n当前体检问题：\n'+issues+'\n\n当前内容：\n'+text
  };
  return aiAskJSON([
    {role:'system',content:p.system},
    {role:'user',content:p.user}
  ],{temperature:0.3,onStatus:opts&&opts.onStatus,onDelta:opts&&opts.onDelta,timeout:150000,maxTokens:6000}).then(function(resp){
    return {changes:Array.isArray(resp&&resp.changes)?resp.changes:[],summary:String(resp&&resp.summary||''),fallback:true};
  });
}
function aiOptimizeSectionSimple(sid,issues,target,opts){
  var fw=STATE.framework.find(function(s){return s.id===sid;});
  if(!fw)return Promise.resolve([]);
  var secText=aiSecText(sid,null,true)||'（空）';
  var p={
    system:'你是 PRD 优化专家。只优化节 ['+sid+']「'+fw.title+'」，保留该节其余内容与语气，不得虚构需求。\n'
      +'输出 JSON：{"changes":[{"sectionId":"'+sid+'","type":"text|table|suggestion","newHtml":"text 节：该节整节完整替换后的 HTML（只改有问题部分，基础标签 p/ul/ol/li/strong/em/h3/h4/table）","newRows":[{"cells":["列1","列2"]}],"suggestion":"建议文字"}],"summary":"一句话"}。未改动就输出 {"changes":[],"summary":"无需改动"}。严格只输出 JSON。',
    user:'目标分：'+target+'。\n\n该节相关体检问题：\n'+issues+'\n\n该节当前内容：\n'+secText
  };
  return aiAskJSON([
    {role:'system',content:p.system},
    {role:'user',content:p.user}
  ],{temperature:0.3,onStatus:opts&&opts.onStatus,onDelta:opts&&opts.onDelta,timeout:150000,maxTokens:4000}).then(function(resp){
    // 返回原始 changes（由调用方统一 aiNormChange 归一化，避免二次归一化把 replaceSection 丢掉）
    return (Array.isArray(resp&&resp.changes)?resp.changes:[]).filter(function(ch){return ch&&ch.sectionId===sid;});
  });
}
function aiOptimizeBySection(baseReport,issues,target,opts){
  var counts={};
  ((baseReport&&baseReport.dimensions)||[]).forEach(function(d){
    (d.issues||[]).forEach(function(it){if(it.sectionId)counts[it.sectionId]=(counts[it.sectionId]||0)+1;});
  });
  if(!Object.keys(counts).length){
    // 没有带节的问题时兜底：取前 6 个非空节
    STATE.framework.forEach(function(s){
      if(!aiSecText(s.id).trim())return;
      counts[s.id]=1;
    });
  }
  var secs=Object.keys(counts).sort(function(a,b){return counts[b]-counts[a];}).slice(0,6);
  var all=[],idx=0;
  function next(){
    if(idx>=secs.length)return Promise.resolve(all);
    var sid=secs[idx++];
    if(opts&&opts.onStatus)opts.onStatus('分节优化 '+idx+'/'+secs.length+'：'+((STATE.framework.find(function(s){return s.id===sid;})||{}).title||sid)+'…');
    return aiOptimizeSectionSimple(sid,issues,target,opts).then(function(chs){
      all=all.concat(chs);
      return next();
    }).catch(function(e){
      if(aiOptDbg)aiOptDbg.steps.push({kind:'secFail',sec:sid,error:String(e&&e.message||e).slice(0,80)});
      return next();
    });
  }
  return next();
}
function aiOptimizeSafe(text,scope,baseReport,issues,target,opts){
  // v17.14：文档较大时跳过整份调用（弱模型必截断），直接按节逐个优化
  if(scope.mode!=='section'&&String(text||'').length>2500){
    if(aiOptDbg)aiOptDbg.steps.push({kind:'fullDocSkipped',len:String(text||'').length});
    if(opts&&opts.onStatus)opts.onStatus('文档较大，直接按节逐个优化…');
    return aiOptimizeBySection(baseReport,issues,target,opts).then(function(changes){
      return {changes:changes,summary:'分节优化 '+changes.length+' 条',fallback:true,sectionMode:true};
    });
  }
  return aiOptimize(text,scope,issues,target,opts).catch(function(e){
    if(!(e&&e.kind==='parse'))throw e;
    if(aiOptDbg)aiOptDbg.steps.push({kind:'fullDocParseFail',raw:String(e.raw||'').slice(0,200)});
    if(scope.mode==='section')throw e;
    if(opts&&opts.onStatus)opts.onStatus('整份返回无法解析，改为按节逐个优化…');
    return aiOptimizeBySection(baseReport,issues,target,opts).then(function(changes){
      return {changes:changes,summary:'分节优化 '+changes.length+' 条',fallback:true,sectionMode:true};
    });
  });
}
function aiReviewPrompt(text,originalText,changes,target){
  var fw=STATE.framework.map(function(x){return x.id+'「'+x.title+'」';}).join('；');
  return {
    system:'你是独立的 PRD 评审复核员。你不知道修改由谁生成，只依据"原稿"与"修改后全文"做客观复核。\n'
      +'检查：①是否解决了原稿体检指出的问题；②是否引入新问题（删除未授权内容、虚构需求、破坏文档结构、前后不一致）；③给修改后全文打 0-100 分并给出结论。\n'
      +'文档节清单：'+fw+'\n'
      +'严格只输出 JSON：{"score":0,"verdict":"pass|needs_work|fail","newIssues":[{"sectionId":"节id或null","severity":"high|medium|low","reason":"原因","quote":"原文引用"}],"summary":"复核结论"}',
    user:'目标分：'+target+'。\n\n本次拟修改的节与内容摘要：\n'+changes+'\n\n原稿：\n'+originalText+'\n\n修改后全文：\n'+text
  };
}
function aiReview(text,originalText,changes,target,opts){
  var st=aiGetSettings();
  var p=aiReviewPrompt(text,originalText,changes,target);
  return aiAskJSON([
    {role:'system',content:p.system},
    {role:'user',content:p.user}
  ],{temperature:0,model:st.reviewModel||undefined,onStatus:opts&&opts.onStatus,onDelta:opts&&opts.onDelta,timeout:120000}).then(function(resp){
    var verdict=(resp&&resp.verdict==='pass')?'pass':(resp&&resp.verdict==='fail')?'fail':'needs_work';
    return {score:aiRound(resp&&resp.score),verdict:verdict,newIssues:Array.isArray(resp&&resp.newIssues)?resp.newIssues:[],summary:String(resp&&resp.summary||'')};
  });
}
function aiValidateChange(item){
  var w=[],b=[];
  if(item.type==='text'){
    if(item.replaceSection!=null){
      item.oldFields=aiCurFields(item.sectionId);
      if(!aiHtmlBalanced(item.replaceSection))b.push('HTML 标签不闭合');
      if(!aiStripTags(item.replaceSection).trim())b.push('替换后内容为空');
      if((item.oldFields.html||'').trim()===(item.replaceSection||'').trim())w.push('新旧内容相同（未实际变化）');
      item.blocks=[];
    }else{
      var html=String((DATA[item.sectionId]||{}).html||'');
      var exec=aiApplyEdits(html,item.edits||[]);
      exec.results.forEach(function(r){if(!r.ok)b.push(r.reason);});
      if(exec.results.some(function(r){return r.ok&&r.oldHtml&&aiNormText(r.oldHtml).indexOf('cmt-hl')>=0;}))w.push('被替换块内含评论划线，该块内评论将被覆盖，请人工确认');
      if(!aiHtmlBalanced(exec.html))b.push('HTML 标签不闭合');
      item.blocks=exec.results.filter(function(r){return r.ok&&r.oldHtml;}).map(function(r){return {blockOld:r.oldHtml,blockNew:r.newHtml,anchor:r.anchor};});
    }
  }else if(item.type==='table'){
    if(item.replaceRows){
      item.oldFields=aiCurFields(item.sectionId);
      var cols=item.replaceRows.length?item.replaceRows[0].cells.length:0;
      if(!cols)b.push('表格为空');
      if(item.replaceRows.some(function(r){return (r.cells||[]).length!==cols;}))b.push('表格列数不一致');
      item.rows=[];
    }else{
      var rows=(DATA[item.sectionId]||{}).rows||[];
      var re=aiRowExec(rows,item.rowEdits||[]);
      re.results.forEach(function(r){if(!r.ok)b.push(r.reason);});
      item.rows=re.results.filter(function(r){return r.ok;}).map(function(r){return {rowOp:(r.edit&&r.edit.op)||'',match:(r.edit&&r.edit.match)||'',rowOld:r.rowOld,rowNew:r.rowNew,anchor:r.anchor};});
    }
  }else if(item.type==='items'||item.replaceItems){
    item.oldFields=aiCurFields(item.sectionId);
    var its=Array.isArray(item.replaceItems)?item.replaceItems:[];
    if(!its.length)b.push('清单为空，未生成可用条目');
    var secType=item.sectionType||'text';
    its.forEach(function(i){
      if(!i||typeof i!=='object'){b.push('条目结构不合法');return;}
      if(secType==='feat'){
        if(!String(i.name||'').trim())b.push('功能点缺名称');
        if(i.priority&&['P0','P1','P2','P3','P4'].indexOf(String(i.priority).toUpperCase())<0)b.push('优先级非法：'+i.priority);
        var fd=String(i.desc||'');var lack=['目标','前置','主流程','异常','输入输出','权限','验收','埋点','待确认'].filter(function(k){return fd.indexOf(k)<0;});
        if(lack.length)w.push('「'+String(i.name||'功能点')+'」缺少可交付字段：'+lack.join('、')+'；请补齐或明确标为待确认，当前草稿不宜直接交付');
      }else if(secType==='accept'){
        if(!String(i.text||'').trim())b.push('验收项缺内容');
      }else if(secType==='users'){
        if(!String(i.role||'').trim()&&!String(i.want||'').trim())b.push('用户故事缺角色或期望');
      }
    });
    item.blocks=[];item.rows=[];
  }
  item.validation={ok:!b.length,warnings:w,blocked:b};
}
function aiValidateChanges(changes){
  return changes.map(function(ch){
    var it={sectionId:ch.sectionId,type:ch.type,edits:ch.edits||[],rowEdits:ch.rowEdits||[],replaceSection:ch.replaceSection!=null?ch.replaceSection:null,replaceRows:ch.replaceRows||null};
    aiValidateChange(it);
    return {ch:ch,it:it};
  });
}
function aiEvalRuleDelta(changes){
  var hBefore=HEALTH,affected=[],saved={};
  changes.forEach(function(ch){
    if(ch.type!=='text'&&ch.type!=='table')return;
    var c=DATA[ch.sectionId];if(!c)return;
    affected.push(ch.sectionId);
    saved[ch.sectionId]={html:c.html,rows:c.rows?aiDeep(c.rows):null};
    var f=aiFieldsOf(ch);
    if(f&&f.html!=null)c.html=f.html;
    if(f&&f.rows)c.rows=f.rows;
  });
  var after=null;
  try{if(typeof runHealth==='function')after=runHealth();}catch(e){}
  affected.forEach(function(id){var sv=saved[id];if(!sv)return;var c=DATA[id];if(!c)return;c.html=sv.html;if(sv.rows)c.rows=sv.rows;});
  var b=hBefore&&hBefore.metrics,a=after&&after.metrics;
  return {riskBefore:b?b.risk:null,riskAfter:a?a.risk:null,completionBefore:b?b.completion:null,completionAfter:a?a.completion:null};
}

/* ============ v17.2 AI 结构对齐 ============ */
function aiAlignHint(){
  var p=currentProj();if(!p)return {level:'low',reasons:[]};
  var reasons=[],totalLen=0,catchLen=0,catchId=null;
  try{catchId=typeof catchAllId==='function'?catchAllId():null;}catch(e){}
  STATE.framework.forEach(function(s){
    var t=aiSecText(s.id);
    totalLen+=t.length;
    if(catchId&&s.id===catchId)catchLen=t.length;
  });
  var level='low';
  if(totalLen>0&&catchLen/totalLen>0.25){
    level='high';
    reasons.push('兜底节（其他/附录）内容约占全文 '+(100*catchLen/totalLen).toFixed(0)+'%，疑似大量内容未归位');
  }
  var emptyReq=STATE.framework.filter(function(s){
    return s.required&&!aiSecText(s.id).trim();
  });
  if(emptyReq.length&&totalLen>200){
    if(level!=='high')level='mid';
    reasons.push('必填节「'+emptyReq.map(function(s){return s.title;}).join('、')+'」为空，内容可能没归位');
  }
  var crowded=STATE.framework.filter(function(s){return aiBlocksOf(String((DATA[s.id]||{}).html||'')).length>8;});
  if(crowded.length&&emptyReq.length){
    if(level!=='high')level='mid';
    reasons.push('「'+crowded.map(function(s){return s.title;}).join('、')+'」块数偏多而其他必填节为空，疑似合并错位');
  }
  return {level:level,reasons:reasons};
}
function aiWrapImport(){
  if(window.__aiImportWrapped||typeof doImportText!=='function')return;
  window.__aiImportWrapped=true;
  var orig=window.doImportText;
  window.doImportText=function(text,projName){
    var routed=false;
    try{
      // v17.3：无项目或当前项目全空时，导入默认走「自动框架」（按文档标题建框架），不再硬套 14 节
      var cur=currentProj();
      var filled=cur&&STATE.framework.some(function(s){return !isEmpty(s.id);});
      if(!cur||!filled){
        if(!cur&&typeof createProject==='function')createProject(projName||'导入的PRD');
        if(typeof autoGenImport==='function'){autoGenImport(text);routed=true;}
      }
    }catch(e){routed=false;}
    if(!routed){
      try{orig.apply(this,arguments);}catch(e){try{toast('导入失败：'+(e&&e.message||e));}catch(e2){}}
    }
    try{
      setTimeout(function(){
        var h=aiAlignHint();
        if(h.level!=='low')aiToast('检测到内容与框架可能错位（'+h.reasons[0]+'），可到 AI 助手执行「结构对齐」');
      },300);
    }catch(e){}
  };
}
function aiWrapLoadSample(){
  // v17.24：示例已由 block1 的 loadSample 改用标准 14 节框架，不再用自动框架覆盖
  window.__aiSampleWrapped=true;
}
function aiAlignPrompt(){
  var fw=STATE.framework.map(function(s){return s.id+'「'+s.title+'」类型:'+s.type+(s.required?'（必填）':'');}).join('；');
  var doc=STATE.framework.map(function(s){return '## ['+s.id+'] '+s.title+'\n'+(aiSecText(s.id)||'（空）');}).join('\n\n');
  var hint=aiAlignHint();
  var hintTxt=hint.level==='low'?'（无明显错位信号）':('（错位信号：'+hint.reasons.join('；')+'）');
  return {
    system:'你是 PRD 结构整理专家。给定文档框架（节 id/标题/类型）与当前每节内容，判断哪些内容放错了节、应搬到哪个节。\n'
      +'只输出 JSON：{"moves":[{"fromSection":"节id","match":"要搬走的块原文（逐字引用）","toSection":"节id","position":"after|before|start|end","anchor":"目标节锚点块原文（after/before 必填）"}],"ops":[{"op":"rename","sectionId":"节id","newTitle":"新标题"},{"op":"deleteEmpty","sectionId":"节id"},{"op":"merge","fromSection":"节id","toSection":"节id"},{"op":"split","sectionId":"节id","newTitle":"新节标题","moves":[{"match":"要拆走的块原文"}]}],"suggestions":[{"kind":"other","sectionId":"节id","text":"无法自动执行的建议文字"}],"summary":"一句话总结"}\n'
      +'规则：\n'
      +'- match 必须逐字来自来源节内容（text 节=块文本；table 节=首列单元格文本定位行）；\n'
      +'- 只搬确定属于目标节的内容，不确定的宁可不搬；\n'
      +'- 只做结构归位，不要改写任何内容本身；\n'
      +'- 清单/用户故事/小卡片节（feat/accept/users）内的条目不自动搬，需调整时放 suggestions；\n'
      +'- 目标节与来源节不能相同；text 节对 text 节、table 节对 table 节；\n'
      +'- rename：新标题应贴合文档实际用词；deleteEmpty：只能删**内容为空且非必填**的节；merge：把来源节全部内容并入目标节（text↔text 或 table↔table，来源节删除）；split：从内容臃肿的 text 节拆出部分块到新节（moves 逐字引用这些块）。\n'
      +'- ops 会被真正执行，只有确定无疑的才放 ops；不确定的一律放 suggestions。',
    user:'文档框架：'+fw+'\n错位信号：'+hintTxt+'\n\n当前内容：\n'+doc
  };
}
function aiNormMove(m){
  if(!m||!m.fromSection||!m.toSection||m.fromSection===m.toSection)return null;
  if(!STATE.framework.find(function(s){return s.id===m.fromSection;}))return null;
  if(!STATE.framework.find(function(s){return s.id===m.toSection;}))return null;
  if(!m.match)return null;
  var pos=m.position==='before'?'before':m.position==='start'?'start':m.position==='end'?'end':'after';
  if((pos==='after'||pos==='before')&&!m.anchor)return null;
  return {fromSection:m.fromSection,match:String(m.match),toSection:m.toSection,position:pos,anchor:String(m.anchor||'')};
}
function aiMoveToItem(m){
  var srcType=(STATE.framework.find(function(s){return s.id===m.fromSection;})||{}).type;
  var kind=srcType==='table'?'moveRow':'moveBlock';
  return {id:aiUid(),kind:kind,fromSection:m.fromSection,fromTitle:(STATE.framework.find(function(s){return s.id===m.fromSection;})||{}).title||m.fromSection,toSection:m.toSection,toTitle:(STATE.framework.find(function(s){return s.id===m.toSection;})||{}).title||m.toSection,match:m.match,position:m.position,anchor:m.anchor,blockOld:'',blockNew:'',rowOld:null,rowNew:null,fromAnchor:'',toAnchor:'',suggestion:'',validation:{ok:true,warnings:[],blocked:[]},status:'pending'};
}
function aiNormOp(o){
  if(!o||!o.op)return null;
  if(o.op==='rename'){
    if(!o.sectionId||!o.newTitle)return null;
    if(!STATE.framework.find(function(s){return s.id===o.sectionId;}))return null;
    return {op:'rename',sectionId:o.sectionId,newTitle:String(o.newTitle).trim()};
  }
  if(o.op==='deleteEmpty'){
    if(!o.sectionId)return null;
    if(!STATE.framework.find(function(s){return s.id===o.sectionId;}))return null;
    return {op:'deleteEmpty',sectionId:o.sectionId};
  }
  if(o.op==='merge'){
    if(!o.fromSection||!o.toSection||o.fromSection===o.toSection)return null;
    if(!STATE.framework.find(function(s){return s.id===o.fromSection;}))return null;
    if(!STATE.framework.find(function(s){return s.id===o.toSection;}))return null;
    return {op:'merge',fromSection:o.fromSection,toSection:o.toSection};
  }
  if(o.op==='split'){
    if(!o.sectionId||!o.newTitle)return null;
    if(!STATE.framework.find(function(s){return s.id===o.sectionId;}))return null;
    var moves=Array.isArray(o.moves)?o.moves.map(function(m){return {match:String(m&&m.match||'')};}).filter(function(m){return m.match;}):[];
    if(!moves.length)return null;
    return {op:'split',sectionId:o.sectionId,newTitle:String(o.newTitle).trim(),moves:moves};
  }
  return null;
}
function aiOpToItem(o){
  var titleOf=function(id){var s=STATE.framework.find(function(x){return x.id===id;});return s?s.title:id;};
  if(o.op==='rename')return {id:aiUid(),kind:'rename',fromSection:o.sectionId,fromTitle:titleOf(o.sectionId),toSection:'',toTitle:'',match:'',position:'',anchor:'',blockOld:'',blockNew:'',rowOld:null,rowNew:null,fromAnchor:'',toAnchor:'',newTitle:o.newTitle,moves:[],meta:null,suggestion:'',validation:{ok:true,warnings:[],blocked:[]},status:'pending'};
  if(o.op==='deleteEmpty')return {id:aiUid(),kind:'deleteEmpty',fromSection:o.sectionId,fromTitle:titleOf(o.sectionId),toSection:'',toTitle:'',match:'',position:'',anchor:'',blockOld:'',blockNew:'',rowOld:null,rowNew:null,fromAnchor:'',toAnchor:'',newTitle:'',moves:[],meta:null,suggestion:'',validation:{ok:true,warnings:[],blocked:[]},status:'pending'};
  if(o.op==='merge')return {id:aiUid(),kind:'merge',fromSection:o.fromSection,fromTitle:titleOf(o.fromSection),toSection:o.toSection,toTitle:titleOf(o.toSection),match:'',position:'',anchor:'',blockOld:'',blockNew:'',rowOld:null,rowNew:null,fromAnchor:'',toAnchor:'',newTitle:'',moves:[],meta:null,suggestion:'',validation:{ok:true,warnings:[],blocked:[]},status:'pending'};
  return {id:aiUid(),kind:'split',fromSection:o.sectionId,fromTitle:titleOf(o.sectionId),toSection:'',toTitle:'',match:'',position:'',anchor:'',blockOld:'',blockNew:'',rowOld:null,rowNew:null,fromAnchor:'',toAnchor:'',newTitle:o.newTitle,moves:o.moves,meta:null,suggestion:'',validation:{ok:true,warnings:[],blocked:[]},status:'pending'};
}
function aiValidateMove(it){
  var w=[],b=[];
  var srcType=(STATE.framework.find(function(s){return s.id===it.fromSection;})||{}).type;
  var dstType=(STATE.framework.find(function(s){return s.id===it.toSection;})||{}).type;
  if(it.kind==='moveRow'&&(srcType!=='table'||dstType!=='table')){b.push('仅支持表格节之间的行搬移');}
  if(it.kind==='moveBlock'&&(srcType!=='text'||dstType!=='text')){b.push('仅支持文本节之间的块搬移');}
  if(it.kind==='moveBlock'){
    var src=DATA[it.fromSection]||{};
    var blocks=aiBlocksOf(String(src.html||'')),ti=-1,mt=aiNormText(it.match);
    for(var i=0;i<blocks.length;i++){if(mt&&(blocks[i].text===mt||blocks[i].text.indexOf(mt)>=0)){ti=i;break;}}
    if(ti<0){b.push('来源节未找到匹配的内容块（引用需逐字一致）');}
    else{
      it.blockOld=blocks[ti].html;it.blockNew=blocks[ti].html;
      it.fromAnchor=ti>0?blocks[ti-1].text.slice(0,80):'';
      if(aiNormText(it.blockOld).indexOf('cmt-hl')>=0)w.push('该块内含评论划线，会随块一起移动');
      var tgt=DATA[it.toSection]||{};
      var tblocks=aiBlocksOf(String(tgt.html||''));
      if(tblocks.some(function(x){return x.text===aiNormText(it.blockOld);}))w.push('目标节已存在相同内容块，可能重复');
      if(it.position==='after'||it.position==='before'){
        var ta=-1,mt2=aiNormText(it.anchor);
        for(var j=0;j<tblocks.length;j++){if(mt2&&(tblocks[j].text===mt2||tblocks[j].text.indexOf(mt2)>=0)){ta=j;break;}}
        if(ta<0)b.push('目标节未找到锚点块（'+it.anchor.slice(0,30)+'…）');
        else it.toAnchor=tblocks[ta].text.slice(0,80);
      }
    }
  }else if(it.kind==='moveRow'){
    var srows=(DATA[it.fromSection]||{}).rows||[];
    var ri=-1,rm=aiNormText(it.match);
    for(var k=0;k<srows.length;k++){var c0=aiNormCell(srows[k]&&srows[k].cells&&srows[k].cells[0]);if(rm&&c0&&(c0===rm||c0.indexOf(rm)>=0)){ri=k;break;}}
    if(ri<0){b.push('来源表未找到匹配行（按首列文本）');}
    else{
      it.rowOld=aiDeep(srows[ri]);it.rowNew=aiDeep(srows[ri]);
      it.fromAnchor=ri>0?aiNormCell(srows[ri-1]&&srows[ri-1].cells&&srows[ri-1].cells[0]):'';
      var trows=(DATA[it.toSection]||{}).rows||[];
      var cols=trows.length&&trows[0].cells?trows[0].cells.length:0;
      if(cols&&cols!==(it.rowOld.cells||[]).length)b.push('目标表列数（'+cols+'）与来源行（'+(it.rowOld.cells||[]).length+'）不一致');
      if(it.position==='after'||it.position==='before'){
        var ra=-1,rm2=aiNormText(it.anchor);
        for(var q=0;q<trows.length;q++){if(rm2&&aiNormCell(trows[q]&&trows[q].cells&&trows[q].cells[0])===rm2){ra=q;break;}}
        if(ra<0)b.push('目标表未找到锚点行（'+it.anchor.slice(0,30)+'…）');
        else it.toAnchor=aiNormCell(trows[ra]&&trows[ra].cells&&trows[ra].cells[0]);
      }
    }
  }else if(it.kind==='rename'){
    var fs=STATE.framework.find(function(s){return s.id===it.fromSection;});
    if(!fs){b.push('节不存在');}
    else if(!it.newTitle||it.newTitle===fs.title){b.push('新标题为空或未变化');}
  }else if(it.kind==='deleteEmpty'){
    var fd=STATE.framework.find(function(s){return s.id===it.fromSection;});
    if(!fd){b.push('节不存在');}
    else{
      if(fd.required)b.push('必填节不能删除');
      if(aiSecText(it.fromSection).trim()||((DATA[it.fromSection]||{}).cards||[]).length)b.push('该节仍有内容，不能作为空节删除');
      if(fd.type==='table'&&((DATA[it.fromSection]||{}).rows||[]).length>1)b.push('该表格节还有数据行');
    }
  }else if(it.kind==='merge'){
    var fm=STATE.framework.find(function(s){return s.id===it.fromSection;});
    var tm=STATE.framework.find(function(s){return s.id===it.toSection;});
    if(!fm||!tm)b.push('来源/目标节不存在');
    else if(fm.id===tm.id)b.push('不能合并到自身');
    else if(fm.type!==tm.type)b.push('仅支持同类型节合并（text↔text 或 table↔table）');
    else if(fm.type==='text'&&!aiBlocksOf(String((DATA[it.fromSection]||{}).html||'')).length)b.push('来源节没有可搬的内容块');
    else if(fm.type==='table'&&((DATA[it.fromSection]||{}).rows||[]).length<=1)b.push('来源表没有可搬的数据行');
  }else if(it.kind==='split'){
    var fs2=STATE.framework.find(function(s){return s.id===it.fromSection;});
    if(!fs2){b.push('节不存在');}
    else{
      if(fs2.type!=='text')b.push('仅支持从文本节拆分');
      if(!it.newTitle)b.push('缺少新节标题');
      var blocks2=aiBlocksOf(String((DATA[it.fromSection]||{}).html||''));
      it.moves.forEach(function(mv){
        var mt3=aiNormText(mv.match),found=false;
        for(var z=0;z<blocks2.length;z++){if(mt3&&(blocks2[z].text===mt3||blocks2[z].text.indexOf(mt3)>=0)){found=true;break;}}
        if(!found)b.push('拆分块「'+String(mv.match).slice(0,20)+'…」在来源节未找到');
      });
      if(!it.moves.length)b.push('缺少要拆走的块');
    }
  }else{
    b.push('未知移动类型');
  }
  it.validation={ok:!b.length,warnings:w,blocked:b};
}
function aiAlign(){
  if(aiBusy){aiToast('AI 正在处理中，请稍候');return;}
  if(!currentProj()){aiToast('请先创建或打开项目');return;}
  if(!String(aiGetSettings().apiKey||'').trim()){aiToast('请先在 设置→AI 中配置 API Key');aiOpenSettingsTab();return;}
  var st=aiState();
  if(st.pendingAlign&&st.pendingAlign.items&&st.pendingAlign.items.length){aiToast('有未确认的结构调整，请先处理');return;}
  aiBusy=true;
  aiGlobalAbort=new AbortController();
  aiCancelFlag=false;
  aiStatus='';aiStatusLog=[];
  var p=aiAlignPrompt();
  aiSetStatus('AI 结构对齐分析中…');
  return aiAskJSON([
    {role:'system',content:p.system},
    {role:'user',content:p.user}
  ],{temperature:0.2,onStatus:aiSetStatus,onDelta:function(c){if(aiStatus.indexOf('已接收')<0)aiSetStatus('AI 正在分析…已接收 '+c.length+' 字');},timeout:120000}).then(function(resp){
    var moves=(resp&&Array.isArray(resp.moves)?resp.moves:[]).map(aiNormMove).filter(Boolean);
    var ops=(resp&&Array.isArray(resp.ops)?resp.ops:[]).map(aiNormOp).filter(Boolean);
    var sug=(resp&&Array.isArray(resp.suggestions)?resp.suggestions:[]).filter(function(s){return s&&s.kind&&s.text;});
    var items=moves.map(function(m){
      var it=aiMoveToItem(m);
      aiValidateMove(it);
      return it;
    });
    ops.forEach(function(o){
      var it=aiOpToItem(o);
      aiValidateMove(it);
      items.push(it);
    });
    sug.forEach(function(s){
      var stitle=(STATE.framework.find(function(x){return x.id===s.sectionId;})||{}).title||'';
      items.push({id:aiUid(),kind:'suggestion',fromSection:s.sectionId||'',fromTitle:stitle,toSection:'',toTitle:'',match:'',position:'',anchor:'',blockOld:'',blockNew:'',rowOld:null,rowNew:null,fromAnchor:'',toAnchor:'',newTitle:'',moves:[],meta:null,suggestion:'['+s.kind+']'+(stitle?'「'+stitle+'」':'')+'：'+s.text,validation:{ok:true,warnings:[],blocked:[]},status:'pending'});
    });
    var st2=aiState();
    st2.pendingAlign={id:aiUid(),createdAt:Date.now(),summary:String(resp&&resp.summary||''),items:items};
    aiPersist();
    aiBusy=false;aiGlobalAbort=null;aiStatus='';aiStatusLog=[];
    aiRenderPanel();
    aiToast(items.length?('结构对齐建议 '+items.length+' 条待确认'):'AI 未发现明显错位');
  }).catch(function(e){
    aiBusy=false;aiGlobalAbort=null;
    if(aiCancelFlag){aiStatus='';aiStatusLog=[];aiRenderPanel();return;}
    aiStatus='';aiRenderPanel();
    var c=aiClassify(e,null,'');
    aiToast('结构对齐失败：'+c.message);
  });
}
function aiJumpToBlock(sid,match){
  try{openSection(sid);}catch(e){}
  var card=document.getElementById('sec-'+sid);
  var fw=STATE.framework.find(function(s){return s.id===sid;});
  var mt=aiNormText(match);
  var hit=null;
  if(fw&&fw.type==='table'&&card){
    var tbl=card.querySelector('.editable table, .table-scroll table, table');
    if(tbl){
      var rows=Array.from(tbl.querySelectorAll('tr'));
      for(var i=0;i<rows.length;i++){
        var first=rows[i].querySelector('th,td');
        var t=aiNormText(first?first.textContent:'');
        if(t&&mt&&(t===mt||t.indexOf(mt)>=0||mt.indexOf(t)>=0)){hit=rows[i];break;}
      }
    }
  }
  if(!hit&&card){
    var ed=card.querySelector('.editable[data-id="'+sid+'"], .table-scroll');
    if(ed){
      var els=Array.from(ed.children||[]);
      if(!els.length)els=Array.from(ed.querySelectorAll('p,ul,ol,table,h3,h4,div'));
      for(var j=0;j<els.length;j++){
        var t2=aiNormText(els[j].textContent||'');
        if(t2&&mt&&(t2===mt||t2.indexOf(mt)>=0||mt.indexOf(t2)>=0)){hit=els[j];break;}
      }
      if(!hit&&mt){
        var all=Array.from(ed.querySelectorAll('p,ul,ol,table,h3,h4,div'));
        for(var k=0;k<all.length;k++){
          var t3=aiNormText(all[k].textContent||'');
          if(t3&&mt&&(t3===mt||t3.indexOf(mt)>=0||mt.indexOf(t3)>=0)){hit=all[k];break;}
        }
      }
    }
  }
  if(hit){
    try{hit.scrollIntoView({behavior:'smooth',block:'center'});}catch(e){try{hit.scrollIntoView();}catch(e2){}}
    hit.classList.add('ai-flash');
    setTimeout(function(){hit.classList.remove('ai-flash');},2400);
  }else if(card){
    try{card.scrollIntoView({behavior:'smooth',block:'start'});}catch(e){}
    aiToast('未找到精确内容，已定位到节');
  }
}
function aiDecideAlign(id,status){
  var st=aiState();var pa=st.pendingAlign;if(!pa)return;
  var it=pa.items.filter(function(x){return x.id===id;})[0];
  if(!it)return;
  it.status=status;
  aiPersist();aiRenderPanel();
  if(pa.items.every(function(x){return x.status!=='pending';}))aiFinalizeAlign();
}
function aiAcceptAllAlign(){
  var st=aiState();var pa=st.pendingAlign;if(!pa)return;
  pa.items.forEach(function(it){if(it.status==='pending'&&it.validation&&it.validation.ok)it.status='accepted';});
  if(!pa.items.some(function(it){return it.status==='accepted';})){aiToast('存在校验不过的调整，请逐条处理');return;}
  aiPersist();aiFinalizeAlign();
}
function aiApplyAlignItem(it,patches){
  if(it.kind==='moveBlock'){
    var sc=DATA[it.fromSection],tc=DATA[it.toSection];
    if(!sc||!tc)return;
    var srcHtml=String(sc.html||'');
    sc.html=aiReplaceFirst(srcHtml,it.blockOld,'');
    var tgtHtml=String(tc.html||'');
    if(it.position==='start'){tc.html=it.blockOld+tgtHtml;return pushAlignPatches(it,patches);}
    if(it.position==='end'){tc.html=tgtHtml+it.blockOld;return pushAlignPatches(it,patches);}
    var tblocks=aiBlocksOf(tgtHtml),ai2=-1,mt2=aiNormText(it.anchor);
    for(var i=0;i<tblocks.length;i++){if(mt2&&(tblocks[i].text===mt2||tblocks[i].text.indexOf(mt2)>=0)){ai2=i;break;}}
    if(ai2>=0)tc.html=it.position==='before'?aiReplaceFirst(tgtHtml,tblocks[ai2].html,it.blockOld+tblocks[ai2].html):aiReplaceFirst(tgtHtml,tblocks[ai2].html,tblocks[ai2].html+it.blockOld);
    else tc.html=tgtHtml+it.blockOld;
    pushAlignPatches(it,patches);
  }else if(it.kind==='moveRow'){
    var sc2=DATA[it.fromSection],tc2=DATA[it.toSection];
    if(!sc2||!tc2)return;
    var srows=aiDeep(sc2.rows||[]),ri=-1,rm=aiNormText(it.match);
    for(var j=0;j<srows.length;j++){if(rm&&aiNormCell(srows[j]&&srows[j].cells&&srows[j].cells[0])===rm){ri=j;break;}}
    if(ri<0)return;
    var row=srows.splice(ri,1)[0];
    sc2.rows=srows;
    var trows=aiDeep(tc2.rows||[]);
    if(it.position==='start'){trows.unshift(row);}
    else if(it.position==='end'){trows.push(row);}
    else{
      var ra=-1,rm2=aiNormText(it.anchor);
      for(var k=0;k<trows.length;k++){if(rm2&&aiNormCell(trows[k]&&trows[k].cells&&trows[k].cells[0])===rm2){ra=k;break;}}
      if(ra>=0)trows.splice(it.position==='before'?ra:ra+1,0,row);
      else trows.push(row);
    }
    tc2.rows=trows;
    pushAlignPatches(it,patches);
  }else if(it.kind==='rename'){
    var fs=STATE.framework.find(function(s){return s.id===it.fromSection;});
    if(!fs)return;
    var oldTitle=fs.title;
    aiFwRename(it.fromSection,it.newTitle);
    (patches[it.fromSection]=patches[it.fromSection]||[]).push({kind:'fwname',sectionId:it.fromSection,oldTitle:oldTitle,newTitle:it.newTitle});
  }else if(it.kind==='deleteEmpty'){
    var fd=STATE.framework.find(function(s){return s.id===it.fromSection;});
    if(!fd)return;
    var idx=STATE.framework.indexOf(fd);
    var meta={title:fd.title,type:fd.type,required:!!fd.required,weight:fd.weight!=null?fd.weight:1};
    aiFwRemove(it.fromSection);
    (patches[it.fromSection]=patches[it.fromSection]||[]).push({kind:'fwdel',sectionId:it.fromSection,meta:meta,index:idx});
  }else if(it.kind==='merge'){
    var fm=STATE.framework.find(function(s){return s.id===it.fromSection;});
    var tm=STATE.framework.find(function(s){return s.id===it.toSection;});
    if(!fm||!tm)return;
    var idxM=STATE.framework.indexOf(fm);
    var metaM={title:fm.title,type:fm.type,required:!!fm.required,weight:fm.weight!=null?fm.weight:1};
    if(fm.type==='text'){
      var sc3=DATA[it.fromSection],tc3=DATA[it.toSection];
      if(!sc3||!tc3)return;
      var blocks=aiBlocksOf(String(sc3.html||''));
      blocks.forEach(function(b,bi){
        var anchor=bi>0?blocks[bi-1].text.slice(0,80):'';
        sc3.html=aiReplaceFirst(sc3.html,b.html,'');
        tc3.html=(tc3.html||'')+b.html;
        (patches[it.fromSection]=patches[it.fromSection]||[]).push({kind:'block',blockOld:b.html,blockNew:'',anchor:anchor});
        (patches[it.toSection]=patches[it.toSection]||[]).push({kind:'block',blockOld:'',blockNew:b.html,anchor:''});
      });
    }else{
      var sc4=DATA[it.fromSection],tc4=DATA[it.toSection];
      if(!sc4||!tc4)return;
      var srows=aiDeep(sc4.rows||[]),dataRows=srows.slice(1);
      sc4.rows=[srows.length?srows[0]:{cells:[]}];
      var trows=aiDeep(tc4.rows||[]);
      dataRows.forEach(function(row){
        trows.push(row);
        (patches[it.fromSection]=patches[it.fromSection]||[]).push({kind:'row',rowOp:'delete',match:aiNormCell(row.cells&&row.cells[0]),rowOld:row,rowNew:null,anchor:''});
        (patches[it.toSection]=patches[it.toSection]||[]).push({kind:'row',rowOp:'insert',match:'',rowOld:null,rowNew:row,anchor:''});
      });
      tc4.rows=trows;
    }
    aiFwRemove(it.fromSection);
    (patches[it.fromSection]=patches[it.fromSection]||[]).push({kind:'fwdel',sectionId:it.fromSection,meta:metaM,index:idxM});
  }else if(it.kind==='split'){
    var fs4=STATE.framework.find(function(s){return s.id===it.fromSection;});
    if(!fs4)return;
    var newId='ai_'+aiUid().slice(0,10);
    var srcIdx=STATE.framework.indexOf(fs4);
    aiFwInsert(newId,{title:it.newTitle,type:'text',required:false,weight:1},srcIdx+1);
    (patches[newId]=patches[newId]||[]).push({kind:'fwadd',sectionId:newId,meta:{title:it.newTitle,type:'text',required:false,weight:1},index:srcIdx+1});
    var sc5=DATA[it.fromSection],newData=DATA[newId];
    if(!sc5||!newData)return;
    it.moves.forEach(function(mv){
      var blocks5=aiBlocksOf(String(sc5.html||'')),ti2=-1,mt5=aiNormText(mv.match);
      for(var z=0;z<blocks5.length;z++){if(mt5&&(blocks5[z].text===mt5||blocks5[z].text.indexOf(mt5)>=0)){ti2=z;break;}}
      if(ti2<0)return;
      var b=blocks5[ti2];
      var anchor=ti2>0?blocks5[ti2-1].text.slice(0,80):'';
      sc5.html=aiReplaceFirst(sc5.html,b.html,'');
      newData.html=(newData.html||'')+b.html;
      (patches[it.fromSection]=patches[it.fromSection]||[]).push({kind:'block',blockOld:b.html,blockNew:'',anchor:anchor});
      (patches[newId]=patches[newId]||[]).push({kind:'block',blockOld:'',blockNew:b.html,anchor:''});
    });
  }
}
function pushAlignPatches(it,patches){
  if(it.kind==='moveBlock'){
    (patches[it.fromSection]=patches[it.fromSection]||[]).push({kind:'block',blockOld:it.blockOld,blockNew:'',anchor:it.fromAnchor||''});
    (patches[it.toSection]=patches[it.toSection]||[]).push({kind:'block',blockOld:'',blockNew:it.blockNew,anchor:it.toAnchor||''});
  }else if(it.kind==='moveRow'){
    (patches[it.fromSection]=patches[it.fromSection]||[]).push({kind:'row',rowOp:'delete',match:it.match,rowOld:it.rowOld,rowNew:null,anchor:it.fromAnchor||''});
    (patches[it.toSection]=patches[it.toSection]||[]).push({kind:'row',rowOp:'insert',match:'',rowOld:null,rowNew:it.rowNew,anchor:it.toAnchor||''});
  }
}
function aiFinalizeAlign(){
  var st=aiState();var pa=st.pendingAlign;if(!pa)return;
  var open=pa.items.filter(function(i){return i.status==='pending'||i.status==='deferred';});
  if(open.length){aiToast('还有 '+open.length+' 条未处理项，处理完后再归档');aiRenderPanel();return;}
  var accepted=pa.items.filter(function(i){return i.status==='accepted';});
  if(!accepted.length){st.pendingAlign=null;aiPersist();aiRenderPanel();aiToast('结构对齐全部拒绝，未产生版本');return;}
  var patches={};
  accepted.forEach(function(it){aiApplyAlignItem(it,patches);});
  var totalEntries=Object.keys(patches).reduce(function(a,s){return a+patches[s].length;},0);
  if(!totalEntries){st.pendingAlign=null;aiPersist();aiRenderPanel();aiToast('仅建议类调整，无自动执行内容');return;}
  var vs=st.versions||(st.versions=[]);
  var n=vs.filter(function(v){return String(v.label||'').indexOf('结构对齐')===0;}).length;
  aiCreateVersion('ai',n?'结构对齐 '+(n+1):'结构对齐',patches,null,null,{applied:true});
  st.pendingAlign=null;
  aiPersist();
  try{render();refreshHealthUI();}catch(e){}
  aiRenderPanel();
  aiToast('结构对齐已应用，保存为「结构对齐」版本');
}

/* ---------- 校验 / 清洗 ---------- */
function aiSanitizeHtml(h){
  if(!h)return '';
  var text=String(h);
  try{
    var d=document.createElement('div');
    d.innerHTML=text;
    var all=d.querySelectorAll?d.querySelectorAll('*'):null;
    if(all&&all.length){
      d.querySelectorAll('script,style,iframe,object,embed,link,meta,form,svg').forEach(function(n){n.remove();});
      d.querySelectorAll('*').forEach(function(n){
        Array.from(n.attributes||[]).forEach(function(at){
          var nm=at.name.toLowerCase();
          if(/^on/i.test(nm)||nm==='style'||nm==='id')n.removeAttribute(at.name);
        });
        if(n.tagName==='IMG'){var src=n.getAttribute('src')||'';if(!/^(https?:|data:image\/|blob:)/i.test(src))n.removeAttribute('src');}
        if(n.tagName==='A'){var hr=n.getAttribute('href')||'';if(/^\s*javascript:/i.test(hr))n.removeAttribute('href');}
      });
      return d.innerHTML;
    }
  }catch(e){}
  // 兜底：无 DOM 解析能力（如极简测试环境）时走正则清洗
  return text.replace(/<script[\s\S]*?<\/script>/gi,'')
    .replace(/<style[\s\S]*?<\/style>/gi,'')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi,'')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi,'')
    .replace(/\sstyle\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi,'');
}
function aiNormChange(ch){
  if(!ch||!ch.sectionId)return null;
  if(!STATE.framework.find(function(f){return f.id===ch.sectionId;}))return null;
  var type=ch.type;
  if(type==='text'){
    var edits=Array.isArray(ch.edits)?ch.edits.map(aiNormEdit).filter(Boolean):[];
    var replaceSection=(typeof ch.newHtml==='string'&&ch.newHtml.trim())?aiSanitizeHtml(ch.newHtml):null;
    if(edits.length)return {sectionId:ch.sectionId,type:'text',edits:edits};
    if(replaceSection)return {sectionId:ch.sectionId,type:'text',edits:[],replaceSection:replaceSection};
    return null;
  }
  if(type==='table'){
    var rowEdits=Array.isArray(ch.rowEdits)?ch.rowEdits.map(aiNormRowEdit).filter(Boolean):[];
    var replaceRows=Array.isArray(ch.newRows)?ch.newRows.filter(function(r){return r&&Array.isArray(r.cells);}).map(function(r){return {cells:r.cells.map(function(v){return String(v==null?'':v);})};}):null;
    if(rowEdits.length)return {sectionId:ch.sectionId,type:'table',rowEdits:rowEdits};
    if(replaceRows&&replaceRows.length)return {sectionId:ch.sectionId,type:'table',rowEdits:[],replaceRows:replaceRows};
    return null;
  }
  return {sectionId:ch.sectionId,type:'suggestion',suggestion:String(ch.suggestion||'').trim()};
}
function aiNormEdit(e){
  if(!e||!e.op)return null;
  if(e.op==='replaceBlock'){
    if(typeof e.newHtml!=='string'||!e.newHtml.trim()||!e.match)return null;
    return {op:'replaceBlock',match:String(e.match),newHtml:aiSanitizeHtml(e.newHtml)};
  }
  if(e.op==='insertBlock'){
    if(typeof e.newHtml!=='string'||!e.newHtml.trim())return null;
    if(e.position==='start'||e.position==='end')return {op:'insertBlock',match:'',newHtml:aiSanitizeHtml(e.newHtml),position:e.position};
    if(!e.match)return null;
    return {op:'insertBlock',match:String(e.match),newHtml:aiSanitizeHtml(e.newHtml),position:e.position==='before'?'before':'after'};
  }
  if(e.op==='deleteBlock'){
    if(!e.match)return null;
    return {op:'deleteBlock',match:String(e.match)};
  }
  return null;
}
function aiNormRowEdit(e){
  if(!e||!e.op)return null;
  if(e.op==='update'){
    if(!Array.isArray(e.cells)||!e.cells.length||!e.match)return null;
    return {op:'update',match:String(e.match),cells:e.cells.map(function(v){return String(v==null?'':v);})};
  }
  if(e.op==='insert'){
    if(!Array.isArray(e.cells)||!e.cells.length)return null;
    if(e.position==='end')return {op:'insert',match:'',cells:e.cells.map(function(v){return String(v==null?'':v);}),position:'end'};
    if(!e.match)return null;
    return {op:'insert',match:String(e.match),cells:e.cells.map(function(v){return String(v==null?'':v);}),position:e.position==='before'?'before':'after'};
  }
  if(e.op==='delete'){
    if(!e.match)return null;
    return {op:'delete',match:String(e.match)};
  }
  return null;
}

/* ---------- 版本 ---------- */
function aiCurFields(sid){
  var c=DATA[sid];if(!c)return {};
  var out={};
  if(c.html!=null)out.html=c.html;
  if(c.rows!=null)out.rows=aiDeep(c.rows);
  if(c.items!=null)out.items=aiDeep(c.items);
  return out;
}
function aiFieldsEq(a,b){
  return aiHashOf(a||{})===aiHashOf(b||{});
}
function aiApplyFields(sid,fields){
  var c=DATA[sid];if(!c||!fields)return;
  if('html' in fields)c.html=fields.html;
  if('rows' in fields)c.rows=aiDeep(fields.rows);
  if('items' in fields)c.items=aiDeep(fields.items);
}
function aiVersionLabel(kind,n){
  if(kind==='original')return '原始版';
  if(kind==='human')return '人工版'+(n>1?' '+n:'');
  if(kind==='final')return '终稿';
  return '优化版'+(n>1?' '+n:'');
}
function aiCreateVersion(kind,label,patches,scoreBefore,scoreAfter,opts){
  var st=aiState();if(!st)return null;
  var vs=st.versions||(st.versions=[]);
  var v={id:aiUid(),kind:kind,label:label,createdAt:Date.now(),parentId:vs.length?vs[vs.length-1].id:null,patch:patches||{},scoreBefore:scoreBefore==null?null:aiRound(scoreBefore),scoreAfter:scoreAfter==null?null:aiRound(scoreAfter),applied:!!(opts&&opts.applied),transform:!!(opts&&opts.transform),rolledBack:false};
  vs.push(v);
  var sz=0;try{sz=JSON.stringify(v.patch).length;}catch(e){}
  if(sz>AI_PATCH_WARN)aiToast('注意：该版本差异较大（约 '+(sz/1024).toFixed(0)+'KB），建议导出备份。');
  aiPruneVersions();
  aiPersist();
  return v;
}
function aiPruneVersions(){
  var st=aiState();if(!st)return;
  var vs=st.versions;if(!vs||vs.length<=AI_MAX_VERSIONS)return;
  while(vs.length>AI_MAX_VERSIONS){
    var idx=vs.findIndex(function(v){return v.kind!=='final';});
    if(idx<0)break;
    var removed=vs.splice(idx,1)[0];
    aiToast('版本已达上限（'+AI_MAX_VERSIONS+'），已自动淘汰最早版本「'+(removed.label||removed.kind)+'」（导出的备份中仍可找回）。');
  }
}
function aiReverseEntries(fields,entries){
  fields.items=fields.items||null;
  entries.forEach(function(e){
    if(!e)return;
    if(e.kind==='section'){fields.html=e.oldHtml;}
    else if(e.kind==='rows'){fields.rows=aiDeep(e.oldRows||[]);}
    else if(e.kind==='block'){
      var h=String(fields.html||'');
      if(e.blockNew){h=aiReplaceFirst(h,e.blockNew,e.blockOld||'');}
      else if(e.blockOld){
        var blocks=aiBlocksOf(h),idx=-1;
        if(e.anchor){var mt=aiNormText(e.anchor);for(var i=0;i<blocks.length;i++){if(mt&&(blocks[i].text===mt||blocks[i].text.indexOf(mt)>=0)){idx=i;break;}}}
        if(idx>=0)h=aiReplaceFirst(h,blocks[idx].html,blocks[idx].html+e.blockOld);
        else h=h+e.blockOld;
      }
      fields.html=h;
    }else if(e.kind==='row'){
      var rows=aiDeep(fields.rows||[]);
      if(e.rowOp==='update'){
        var mu=aiNormCell(e.rowNew&&e.rowNew.cells&&e.rowNew.cells[0]);
        for(var j=0;j<rows.length;j++){if(mu&&aiNormCell(rows[j].cells&&rows[j].cells[0])===mu){rows[j]=e.rowOld?aiDeep(e.rowOld):rows[j];break;}}
      }else if(e.rowOp==='insert'&&e.rowNew){
        var mi=aiNormCell(e.rowNew.cells&&e.rowNew.cells[0]);
        for(var k=rows.length-1;k>=0;k--){if(mi&&aiNormCell(rows[k].cells&&rows[k].cells[0])===mi){rows.splice(k,1);break;}}
      }else if(e.rowOp==='delete'&&e.rowOld){
        var ai2=-1;
        if(e.anchor){for(var k2=0;k2<rows.length;k2++){if(aiNormCell(rows[k2].cells&&rows[k2].cells[0])===aiNormText(e.anchor)){ai2=k2;break;}}}
        if(ai2>=0)rows.splice(ai2+1,0,aiDeep(e.rowOld));else rows.push(aiDeep(e.rowOld));
      }
      fields.rows=rows;
    }else if(e.kind==='items'){
      fields.items=aiDeep(e.oldItems||[]);
    }
  });
  return fields;
}
function aiReversePatch(sid,entries){
  var c=DATA[sid];if(!c)return;
  if(!Array.isArray(entries)){aiApplyFields(sid,entries&&entries.old);return;}
  var f=aiReverseEntries({html:c.html,rows:c.rows?aiDeep(c.rows):null,items:c.items?aiDeep(c.items):null},entries);
  if(f.html!=null)c.html=f.html;
  if(f.rows)c.rows=f.rows;
  if(f.items!=null)c.items=f.items;
}
function aiEnsureTarget(fields,entries){
  fields.items=fields.items||null;
  entries.forEach(function(e){
    if(!e)return;
    if(e.kind==='section'){fields.html=e.newHtml;}
    else if(e.kind==='rows'){fields.rows=aiDeep(e.newRows||[]);}
    else if(e.kind==='block'){
      var h=String(fields.html||'');
      if(e.blockNew){
        var blocks=aiBlocksOf(h),idx=-1,mt=aiNormText(e.blockNew);
        for(var i=0;i<blocks.length;i++){if(mt&&blocks[i].text===mt){idx=i;break;}}
        if(idx>=0){if(blocks[idx].html!==e.blockNew)h=aiReplaceFirst(h,blocks[idx].html,e.blockNew);}
        else h=h+e.blockNew;
      }
      fields.html=h;
    }else if(e.kind==='row'){
      var rows=aiDeep(fields.rows||[]);
      if(e.rowNew){
        var m1=aiNormCell(e.rowNew.cells&&e.rowNew.cells[0]),found=-1;
        for(var j=0;j<rows.length;j++){if(m1&&aiNormCell(rows[j].cells&&rows[j].cells[0])===m1){found=j;break;}}
        if(found>=0)rows[found]=aiDeep(e.rowNew);
        else rows.push(aiDeep(e.rowNew));
      }
      fields.rows=rows;
    }else if(e.kind==='items'){
      fields.items=aiDeep(e.newItems||[]);
    }
  });
  return fields;
}
function aiFwRename(sid,title){
  var p=currentProj();if(!p)return;
  var s=p.framework.find(function(x){return x.id===sid;});
  if(s)s.title=title;
  var s2=STATE.framework.find(function(x){return x.id===sid;});
  if(s2)s2.title=title;
}
function aiFwRemove(sid){
  var p=currentProj();if(!p)return;
  var idx=p.framework.findIndex(function(s){return s.id===sid;});
  if(idx>=0)p.framework.splice(idx,1);
  STATE.framework=p.framework;
  if(p.data&&sid in p.data)delete p.data[sid];
  if(sid in DATA)delete DATA[sid];
}
function aiFwInsert(sid,meta,index){
  var p=currentProj();if(!p)return;
  if(p.framework.some(function(s){return s.id===sid;}))return;
  var fw={id:sid,title:(meta&&meta.title)||sid,type:(meta&&meta.type)||'text',required:!!(meta&&meta.required),weight:(meta&&meta.weight)!=null?meta.weight:1};
  var idx=Math.max(0,Math.min(index==null?p.framework.length:index,p.framework.length));
  p.framework.splice(idx,0,fw);
  STATE.framework=p.framework;
  if(!p.data[sid])p.data[sid]={};
  if(p.data[sid].html===undefined)p.data[sid].html='';
  if(!p.data[sid].cards)p.data[sid].cards=[];
  DATA=p.data;
}
function aiHasFwEntries(v){
  var p=v.patch||{};
  return Object.keys(p).some(function(sid){
    var arr=p[sid];
    if(!Array.isArray(arr))return false;
    return arr.some(function(e){return e&&(e.kind==='fwdel'||e.kind==='fwadd'||e.kind==='fwname');});
  });
}
function aiReverseVersionPatch(v){
  var p=v.patch||{};
  Object.keys(p).forEach(function(sid){
    var arr=p[sid];
    if(!Array.isArray(arr))return;
    arr.forEach(function(e){
      if(e.kind==='fwdel')aiFwInsert(sid,e.meta,e.index);
      else if(e.kind==='fwadd')aiFwRemove(sid);
      else if(e.kind==='fwname')aiFwRename(sid,e.oldTitle);
    });
  });
  Object.keys(p).forEach(function(sid){aiReversePatch(sid,p[sid]);});
}
function aiRestoreToVersion(vid){
  var st=aiState();if(!st)return;
  var vs=st.versions;
  var target=vs.filter(function(v){return v.id===vid;})[0];
  if(!target){aiToast('版本不存在');return;}
  var idxT=vs.indexOf(target);
  var later=vs.slice(idxT+1);
  // v17.2：变换型版本（如结构对齐，含删除类条目）恢复头部=撤销该次搬移
  // v17.15：AI 草稿版本标记 transform=true，恢复=撤销草稿回到生成前空白
  var isTransform=target.transform===true||Object.keys(target.patch||{}).some(function(sid){
    var arr=target.patch[sid];
    if(!Array.isArray(arr))return false;
    return arr.some(function(e){return (e.kind==='block'&&e.blockNew==='')||(e.kind==='row'&&e.rowNew==null)||(e.kind==='fwdel')||(e.kind==='fwadd')||(e.kind==='fwname');});
  });
  if(!later.length&&isTransform){
    if(target.transform){
      // AI 草稿类：先存「恢复前快照」，恢复该快照即可重新得到草稿内容
      var safetyT={};
      Object.keys(target.patch||{}).forEach(function(sid){
        var arr=target.patch[sid];
        var c=DATA[sid];
        if(!Array.isArray(arr)||!c)return;
        var cur={html:c.html,rows:c.rows?aiDeep(c.rows):null,items:c.items?aiDeep(c.items):null};
        var es=[];
        arr.forEach(function(e){
          if(e.kind==='section')es.push({kind:'section',oldHtml:'',newHtml:cur.html});
          else if(e.kind==='rows')es.push({kind:'rows',oldRows:[],newRows:cur.rows||[]});
          else if(e.kind==='items')es.push({kind:'items',oldItems:[],newItems:cur.items||[]});
        });
        if(es.length)safetyT[sid]=es;
      });
      if(Object.keys(safetyT).length)aiCreateVersion('human','恢复前快照',safetyT,null,null,{applied:true});
    }
    aiReverseVersionPatch(target);
    aiPersist();
    try{render();refreshHealthUI();}catch(e){}
    aiRenderPanel();
    aiToast('已撤销「'+target.label+'」'+(target.transform?'（内容已回到生成前空白）':'（内容已搬回原位）'));
    return;
  }
  var hasFw=aiHasFwEntries(target)||later.some(aiHasFwEntries);
  // 生成安全版本：记录受影响节当前值 vs 目标版本状态（任何恢复都可再撤销）
  var affected={};
  later.forEach(function(v){Object.keys(v.patch).forEach(function(s){affected[s]=1;});});
  Object.keys(target.patch||{}).forEach(function(s){affected[s]=1;});
  if(!hasFw){
    var safety={};
    Object.keys(affected).forEach(function(sid){
      var targetState=aiCurFields(sid);
      for(var i=later.length-1;i>=0;i--){
        var p=later[i].patch[sid];
        if(Array.isArray(p))targetState=aiReverseEntries(targetState,p);
        else if(p&&p.old&&Object.keys(p.old).length)targetState=aiDeep(p.old);
      }
      var tp=target.patch&&target.patch[sid];
      if(tp&&!Array.isArray(tp)&&tp.new)targetState=aiDeep(tp.new);
      safety[sid]={old:targetState,new:aiCurFields(sid)};
    });
    aiCreateVersion('human','恢复前快照',safety,null,null,{applied:true});
  }
  // 倒序回放：head → 目标（每个 patch 的 old 即父版本内容，逐字快照无误差）
  later.slice().reverse().forEach(function(v){
    aiReverseVersionPatch(v);
  });
  // 目标版本自身涉及的节落回该版本 new（旧格式直接赋值；新格式按块 ensure，兜底追加）
  Object.keys(target.patch||{}).forEach(function(sid){
    var tp=target.patch[sid];
    if(Array.isArray(tp)){
      var c=DATA[sid];if(!c)return;
      var f=aiEnsureTarget({html:c.html,rows:c.rows?aiDeep(c.rows):null,items:c.items?aiDeep(c.items):null},tp);
      if(f.html!=null)c.html=f.html;
      if(f.rows)c.rows=f.rows;
      if(f.items!=null)c.items=f.items;
    }else if(tp&&tp.new){aiApplyFields(sid,tp.new);}
  });
  aiPersist();
  try{render();refreshHealthUI();}catch(e){}
  aiRenderPanel();
  aiToast('已恢复到「'+target.label+'」'+(target.scoreAfter!=null?'（'+target.scoreAfter+' 分）':''));
}
function aiCaptureManualDelta(){
  var st=aiState();if(!st||!st.versions||!st.versions.length)return;
  var vs=st.versions;
  var hasNew=vs.some(function(v){return Object.keys(v.patch||{}).some(function(s){return Array.isArray(v.patch[s]);});});
  if(hasNew)return; // v17.1 块级补丁暂不自动捕获人工增量（恢复前快照已兜底）
  var rec={};
  vs.forEach(function(v){Object.keys(v.patch||{}).forEach(function(sid){rec[sid]=v.patch[sid].new;});});
  var changes={};
  Object.keys(rec).forEach(function(sid){
    var cur=aiCurFields(sid);
    if(!aiFieldsEq(cur,rec[sid]))changes[sid]={old:aiDeep(rec[sid]),new:cur};
  });
  if(Object.keys(changes).length){
    aiCreateVersion('human',aiVersionLabel('human',vs.filter(function(v){return v.kind==='human';}).length+1),changes,null,null,{applied:true});
    aiToast('检测到版本后的人工修改，已自动记录为人工版本');
  }
}

/* ---------- 6 维评分 ---------- */
function aiComputeTotal(r){
  if(!r||!r.dimensions)return 0;
  var w=0,v=0;
  r.dimensions.forEach(function(d){if(d.weight>0){w+=d.weight;v+=d.score*d.weight;}});
  return w?aiRound(v/w):0;
}

/* ---------- 一键优化 ---------- */
var aiStatus='';
var aiStatusLog=[];
var aiBusy=false;
var aiGlobalAbort=null;
var aiCancelFlag=false;
var aiOptDbg=null;
var aiBackupTimer=null;
var aiRecoverOffer=null;
function aiSetStatus(m){
  aiStatus=m;
  if(m){aiStatusLog.push(m);if(aiStatusLog.length>50)aiStatusLog.shift();}
  aiRenderPanel();
}
function aiSyncBusyBtn(){var b=document.getElementById('aiFloatBtn');if(b)b.classList.toggle('ai-busy',!!(aiBusy||(aiChatState&&aiChatState.busy)));}
function aiAbortRun(){
  aiCancelFlag=true;
  if(aiConfirmResolver&&aiConfirmResolver.abort)aiConfirmResolver.abort();
  if(aiGlobalAbort){try{aiGlobalAbort.abort();}catch(e){}}
  aiGlobalAbort=null;
  document.querySelectorAll('.dash-cell.scoring').forEach(function(el){el.classList.remove('scoring');});
  aiBusy=false;
  aiStatus='';aiStatusLog=[];
  aiRenderPanel();
  aiToast('已停止 AI 任务');
}
function aiBackupState(){
  try{
    var raw=localStorage.getItem(STORAGE_KEY);
    if(raw)localStorage.setItem(STORAGE_KEY+'.bak',raw);
  }catch(e){}
}
function aiWrapSave(){
  if(window.__aiSaveWrapped||typeof save!=='function')return;
  window.__aiSaveWrapped=true;
  var orig=window.save;
  window.save=function(){
    var r=orig.apply(this,arguments);
    if(!aiBackupTimer){
      aiBackupTimer=setTimeout(function(){aiBackupTimer=null;aiBackupState();},5000);
    }
    return r;
  };
  try{
    window.addEventListener('beforeunload',function(){
      if(aiBackupTimer){clearTimeout(aiBackupTimer);aiBackupTimer=null;}
      aiBackupState();
    });
  }catch(e){}
}
function aiRecoverFromBackup(){
  var raw=null,bak=null;
  try{raw=localStorage.getItem(STORAGE_KEY);}catch(e){}
  try{bak=localStorage.getItem(STORAGE_KEY+'.bak');}catch(e){}
  if(!bak)return false;
  var j=null;
  try{j=JSON.parse(bak);}catch(e){}
  if(!j||!Array.isArray(j.projects)||!j.projects.length)return false;
  if(raw===null){
    // 主存储彻底缺失（被清/被删）→ 自动恢复
    try{
      STATE=j;
      save();
      aiToast('检测到本地自动备份，已恢复 '+j.projects.length+' 个项目');
      return true;
    }catch(e){return false;}
  }
  var rj=null;
  try{rj=JSON.parse(raw);}catch(e){}
  if(rj&&(!rj.projects||!rj.projects.length)){
    // 主存储存在但项目为空 → 不自动覆盖（尊重用户删除），面板给一键恢复入口
    aiRecoverOffer={count:j.projects.length,at:Date.now()};
    return true;
  }
  return false;
}
function aiOptScope(){return {mode:aiOptMode,sectionId:aiOptSectionId};}
var aiOptMode='full',aiOptSectionId=null;

function aiRunScore(){
  if(aiBusy){aiToast('AI 正在处理中，请稍候');return;}
  aiBusy=true;
  aiGlobalAbort=new AbortController();
  aiCancelFlag=false;
  var st=aiGetSettings();
  if(!String(st.apiKey||'').trim()||!String(st.baseUrl||'').trim()){aiBusy=false;aiToast('请先在 设置→AI 中配置 API Key 与地址');aiOpenSettingsTab();return;}
  var proj=currentProj();if(!proj){aiBusy=false;aiToast('请先创建或打开项目');return;}
  aiStatus='';aiStatusLog=[];
  document.querySelectorAll('.dash-cell').forEach(function(el){el.classList.add('scoring');});
  function scoreStatus(m){
    aiSetStatus(m);
    var ht=document.querySelector('.dash-heatmap-h .muted');
    if(ht){var mm=String(m||'').match(/(\d+)\/(\d+)/);ht.innerHTML=STATE.framework.length+' 节 · <span class="dashheat-progress">'+(mm?('AI 体检中 '+mm[1]+'/'+mm[2]):'AI 体检分析中…')+'</span>';}
  }
  aiSetStatus('AI 深度体检中（约 10-40 秒）…');
  var t0=Date.now();
  var lastUi=0;
  var timer=setInterval(function(){
    if(Date.now()-lastUi>1000){
      lastUi=Date.now();
      aiSetStatus(aiStatus.replace(/（已用时 \d+ 秒）$/,'')+'（已用时 '+Math.round((Date.now()-t0)/1000)+' 秒）');
    }
  },1000);
  return aiScore(aiDocText(),{onStatus:scoreStatus,onDelta:function(c){if(aiStatus.indexOf('已接收')<0)aiSetStatus('AI 正在分析…已接收 '+c.length+' 字');}}).then(function(r){
    clearInterval(timer);
    aiBusy=false;
    aiGlobalAbort=null;
    var st2=aiState();st2.lastReport=r;st2.pendingDiffs=null;aiPersist();
    aiSetStatus('');aiStatusLog=[];
    aiRenderPanel();
    document.querySelectorAll('.dash-cell.scoring').forEach(function(el){el.classList.remove('scoring');});
    if(typeof renderDashboard==='function')renderDashboard();
    aiToast('AI 深度体检完成：'+r.total+' 分');
  }).catch(function(e){
    clearInterval(timer);
    aiGlobalAbort=null;
    document.querySelectorAll('.dash-cell.scoring').forEach(function(el){el.classList.remove('scoring');});
    if(aiCancelFlag){aiBusy=false;aiStatus='';aiStatusLog=[];aiRenderPanel();return;}
    var c=aiClassify(e,null,'');
    aiBusy=false;
    aiSetStatus('');aiRenderPanel();
    aiToast('AI 体检失败：'+c.message);
  });
}
function aiOpenOptModal(){
  if(!currentProj()){aiToast('请先创建或打开项目');return;}
  if(!String(aiGetSettings().apiKey||'').trim()){aiToast('请先在 设置→AI 中配置 API Key');aiOpenSettingsTab();return;}
  var st=aiState();
  if(st.pendingDiffs&&st.pendingDiffs.items&&st.pendingDiffs.items.length){
    aiToast('有未确认的修改待处理，请先在 AI 面板完成确认');
    return;
  }
  var sel=document.getElementById('aiOptSec');
  if(sel){
    var opts=STATE.framework.map(function(s){return '<option value="'+aiEsc(s.id)+'">'+aiEsc(s.title)+'</option>';}).join('');
    sel.innerHTML=opts;
  }
  try{openModal('aiOptModal');}catch(e){document.getElementById('aiOptModal').classList.add('open');}
}
function aiRunOptimize(){
  if(aiBusy){aiToast('AI 正在处理中，请稍候');return;}
  aiBusy=true;
  aiGlobalAbort=new AbortController();
  aiCancelFlag=false;
  aiOptDbg={at:Date.now(),steps:[]};
  var st=aiGetSettings();
  var scope=aiOptScope();
  if(scope.mode==='section'&&!STATE.framework.find(function(f){return f.id===scope.sectionId;})){aiBusy=false;aiToast('请选择要优化的节');return;}
  aiCaptureManualDelta();
  aiStatus='';aiStatusLog=[];
  var proj=currentProj();
  var baseText=scope.mode==='section'?aiSecText(scope.sectionId,null,true):aiDocTextOpt(true);
  var best={score:null,changes:{}};
  var curText=baseText;
  var rounds=0;
  var target=aiClamp(st.targetScore,50,100);
  var maxR=aiClamp(st.maxRounds,1,5);
  var t0=Date.now();
  aiSetStatus('基线评分中…');
  return aiScore(baseText,{onStatus:aiSetStatus}).then(function(baseReport){
    best.score=baseReport.total;
    var loop=function(){
      if(aiCancelFlag){aiBusy=false;aiGlobalAbort=null;aiStatus='';aiStatusLog=[];aiRenderPanel();return null;}
      if(best.score>=target||rounds>=maxR)return finish(baseReport.total);
      rounds++;
      aiSetStatus('第 '+rounds+'/'+maxR+' 轮优化中…');
      return aiOptimizeSafe(curText,scope,baseReport,aiIssueLines(baseReport),target,{onStatus:aiSetStatus}).then(function(res){
        aiOptDbg.steps.push({kind:'optimize',raw:(res.changes||[]).length,summary:String(res.summary||'').slice(0,60)});
        function normOf(list){
          var locked=[];
          var usable=(list||[]).map(aiNormChange).filter(Boolean).filter(function(ch){
            if(scope.mode==='section'&&ch.sectionId!==scope.sectionId)return false;
            if(aiIsSectionLocked(ch.sectionId)){locked.push(ch.sectionId);return false;}
            return true;
          });
          if(locked.length){aiOptDbg.steps.push({kind:'lockedSkipped',sections:Array.from(new Set(locked))});aiStatusLog.push('已跳过 AI 锁定章节：'+Array.from(new Set(locked)).join('、'));}
          return usable;
        }
        function proceed(changes,res){
          aiOptDbg.steps.push({kind:'norm',got:changes.length});
          if(!changes.length){
            var rawN=(res.changes||[]).length;
            aiOptDbg.steps.push({kind:rawN?'filteredAll':'empty',raw:rawN});
            aiToast(rawN>0?'模型返回 '+rawN+' 条但均未通过（引用不逐字/结构不完整），已停止本轮，可查看面板诊断':(res.fallback?'两次尝试均未产出可用建议，可查看面板诊断':'AI 未返回任何修改建议（可能认为已达标或输出被截断），可查看面板诊断'));
            aiSetStatus('未产生可用的修改建议（第 '+rounds+' 轮），停止。');
            return finish(baseReport.total,null);
          }
          var checked=aiValidateChanges(changes);
          var blockedAny=checked.filter(function(c){return !c.it.validation.ok;});
          if(blockedAny.length){
            var reasons=blockedAny.map(function(c){return c.ch.sectionId+'：'+(c.it.validation.blocked||[]).join('；');}).join(' ｜ ');
            aiOptDbg.steps.push({kind:'blocked',reasons:reasons.slice(0,160)});
            if(!res.fallback&&(res.changes||[]).length){
              // v17.7：引用匹配失败（多为模型粘贴多段/含卡片文本）→ 改用整节替换方式重试一次
              aiOptDbg.steps.push({kind:'blockedRetry'});
              aiSetStatus('第 '+rounds+' 轮：引用匹配失败，改用整节替换方式重试…');
              return aiOptimizeSimple(curText,scope,aiIssueLines(baseReport),target,{onStatus:aiSetStatus}).then(function(res2){
                aiOptDbg.steps.push({kind:'simple',raw:(res2.changes||[]).length,summary:String(res2.summary||'').slice(0,60)});
                return proceed(normOf(res2.changes),res2);
              }).catch(function(e2){
                aiOptDbg.steps.push({kind:'simpleError',error:String(e2&&e2.message||e2).slice(0,120)});
                return proceed([],{changes:[],summary:''});
              });
            }
            aiStatusLog.push('存在结构校验不过的修改（blocked），本轮未采用：'+reasons);
            aiToast('本轮修改未采用：'+reasons.slice(0,120));
            aiSetStatus('');
            return finish(baseReport.total,null);
          }
          var simText;
          if(scope.mode==='section'){
            var ch0=changes.filter(function(x){return x.type!=='suggestion';})[0];
            simText=aiSecText(scope.sectionId,ch0?aiFieldsOf(ch0):null,true);
          }else{
            simText=aiDocTextWith((function(){var pm={};changes.forEach(function(ch){if(ch.type!=='suggestion')pm[ch.sectionId]=aiFieldsOf(ch);});return pm;})(),true);
          }
          aiSetStatus('第 '+rounds+' 轮独立复核中…');
          var chSummary=changes.map(function(c){return c.sectionId+'('+c.type+(c.replaceSection!=null?'整节':c.type==='text'?'×'+c.edits.length:c.type==='table'?'×'+c.rowEdits.length:'')+')';}).join(', ');
          return aiReview(simText,baseText,chSummary,target,{onStatus:aiSetStatus}).then(function(review){
            aiOptDbg.steps.push({kind:'review',score:review.score,verdict:review.verdict});
            var simScore=review.score;
            if(simScore<best.score||review.verdict==='fail'){
              aiStatusLog.push('第 '+rounds+' 轮复核 '+simScore+' 分（'+review.verdict+'）低于/劣于历史最好 '+best.score+'，自动回滚到最好版本（本轮未采用）：'+(review.summary||''));
              aiSetStatus('');
              return finish(baseReport.total,review);
            }
            changes.forEach(function(ch){best.changes[ch.sectionId]=ch;});
            best.score=simScore;
            curText=simText;
            aiStatusLog.push('第 '+rounds+' 轮：复核 '+simScore+' 分（'+review.verdict+'）'+(simScore>=target?'（达标）':''));
            if(simScore>=target){aiSetStatus('');return finish(baseReport.total,review);}
            return loop();
          });
        }
        var changes=normOf(res.changes);
        if(!changes.length&&(res.changes||[]).length){
          aiOptDbg.steps.push({kind:'fallbackSimple'});
          aiSetStatus('第 '+rounds+' 轮：模型格式不完整，改用整节替换方式重试…');
          return aiOptimizeSimple(curText,scope,aiIssueLines(baseReport),target,{onStatus:aiSetStatus}).then(function(res2){
            aiOptDbg.steps.push({kind:'simple',raw:(res2.changes||[]).length,summary:String(res2.summary||'').slice(0,60)});
            return proceed(normOf(res2.changes),res2);
          }).catch(function(e2){
            aiOptDbg.steps.push({kind:'simpleError',error:String(e2&&e2.message||e2).slice(0,120)});
            return proceed([],{changes:[],summary:''});
          });
        }
        return proceed(changes,res);
      });
    };
    function finish(scoreBefore,review){
      var items=Object.keys(best.changes).map(function(sid){
        var ch=best.changes[sid];
        var it={id:aiUid(),sectionId:sid,sectionTitle:(STATE.framework.find(function(f){return f.id===sid;})||{}).title||sid,type:ch.type,suggestion:ch.type==='suggestion'?ch.suggestion:'',status:'pending',relatedIssues:aiRelatedIssues(ch,baseReport),edits:[],rowEdits:[],replaceSection:ch.replaceSection!=null?ch.replaceSection:null,replaceRows:ch.replaceRows||null};
        if(ch.type==='text')it.edits=ch.edits;
        else if(ch.type==='table')it.rowEdits=ch.rowEdits;
        aiValidateChange(it);
        return it;
      });
      var st2=aiState();
      st2.pendingDiffs={id:aiUid(),scoreBefore:aiRound(scoreBefore),scoreAfter:best.score,target:target,rounds:rounds,createdAt:Date.now(),review:review,ruleBaseline:aiRuleHitSnapshot(),engineDelta:aiEvalRuleDelta(Object.keys(best.changes).map(function(s){return best.changes[s];})),items:items};
      st2.lastOptDebug=aiOptDbg;
      aiPersist();
      aiBusy=false;
      aiGlobalAbort=null;
      aiStatus='';aiStatusLog=[];
      aiRenderPanel();
      aiToast(items.length?('优化完成：'+scoreBefore+' → '+best.score+' 分（独立复核），共 '+items.length+' 条待确认'):'未产生修改建议（当前已较优或 AI 无可优化项）');
    }
    return loop();
  }).catch(function(e){
    aiBusy=false;
    aiGlobalAbort=null;
    var stDbg=aiState();if(stDbg)stDbg.lastOptDebug={at:Date.now(),error:String((e&&e.message)||e),raw:String(e&&e.raw||'').slice(0,300)};
    if(aiCancelFlag){aiStatus='';aiStatusLog=[];aiRenderPanel();return;}
    aiStatus='';aiRenderPanel();
    var c=aiClassify(e,null,'');
    aiToast('一键优化失败：'+c.message);
  });
}

/* ---------- AI 撰写（v17.15：从产品描述生成整份草稿，逐节确认后写入、版本可回滚） ---------- */
function aiMdToHtml(md){
  // 轻量 Markdown → HTML（供 AI 撰写草稿使用）：段落/标题/列表/表格/代码块/引用/加粗/斜体/行内代码/链接
  var src=String(md==null?'':md).replace(/\r\n?/g,'\n');
  var out=[];
  function escMd(s){return aiEsc(s);}
  function inline(s){
    s=String(s||'');
    s=s.replace(/`([^`]+)`/g,function(m,c){return '<code>'+escMd(c)+'</code>';});
    s=s.replace(/\*\*([^*]+)\*\*/g,function(m,c){return '<strong>'+c+'</strong>';});
    s=s.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g,function(m,p,c){return p+'<em>'+c+'</em>';});
    s=s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g,function(m,t,u){return '<a href="'+escMd(u)+'">'+t+'</a>';});
    return s;
  }
  function tableHtml(rows){
    if(!rows.length)return '';
    var h='<table class="tbl"><thead><tr>'+rows[0].map(function(c){return '<th>'+inline(escMd(c))+'</th>';}).join('')+'</tr></thead><tbody>';
    for(var i=1;i<rows.length;i++)h+='<tr>'+rows[i].map(function(c){return '<td>'+inline(escMd(c))+'</td>';}).join('')+'</tr>';
    return h+'</tbody></table>';
  }
  var lines=src.split('\n'),i=0;
  while(i<lines.length){
    var ln=lines[i];
    if(/^\s*```/.test(ln)){
      var code=[],lang=ln.replace(/^\s*```/,'').trim();
      i++;
      while(i<lines.length&&!/^\s*```/.test(lines[i])){code.push(lines[i]);i++;}
      i++;
      out.push('<pre class="ai-code'+(lang?(' lang-'+escMd(lang)):'')+'"><code>'+escMd(code.join('\n'))+'</code></pre>');
      continue;
    }
    if(/^\s*---+\s*$/.test(ln)){out.push('<hr>');i++;continue;}
    if(/^\s*#{1,4}\s+/.test(ln)){
      var m=ln.match(/^\s*(#{1,4})\s+(.*)$/);
      var lv=m[1].length<=2?3:4;
      out.push('<h'+lv+'>'+inline(escMd(m[2]))+'</h'+lv+'>');
      i++;continue;
    }
    if(/^\s*[-*+]\s+/.test(ln)){
      var items=[],it;
      while(i<lines.length&&(it=lines[i].match(/^\s*[-*+]\s+(.*)$/))){items.push(inline(escMd(it[1])));i++;}
      out.push('<ul>'+items.map(function(x){return '<li>'+x+'</li>';}).join('')+'</ul>');
      continue;
    }
    if(/^\s*\d+[.、]\s+/.test(ln)){
      var oi=[],mi;
      while(i<lines.length&&(mi=lines[i].match(/^\s*\d+[.、]\s+(.*)$/))){oi.push(inline(escMd(mi[1])));i++;}
      out.push('<ol>'+oi.map(function(x){return '<li>'+x+'</li>';}).join('')+'</ol>');
      continue;
    }
    if(/^\s*>\s?/.test(ln)){
      var q=[],qi;
      while(i<lines.length&&(qi=lines[i].match(/^\s*>\s?(.*)$/))){q.push(inline(escMd(qi[1])));i++;}
      out.push('<blockquote>'+q.map(function(x){return '<p>'+x+'</p>';}).join('')+'</blockquote>');
      continue;
    }
    if(ln.indexOf('|')>=0){
      var rows=[],ri;
      while(i<lines.length&&lines[i].indexOf('|')>=0){
        var cells=lines[i].split('|').map(function(c){return c.trim();});
        if(cells.length&&cells[0]==='')cells.shift();
        if(cells.length&&cells[cells.length-1]==='')cells.pop();
        if(!cells.every(function(c){return /^:?-+:?$/.test(c);}))rows.push(cells);
        i++;
      }
      if(rows.length)out.push(tableHtml(rows));
      continue;
    }
    if(ln.trim()===''){i++;continue;}
    var para=[ln.trim()];
    i++;
    while(i<lines.length&&lines[i].trim()!==''&&!/^\s*(#{1,4}\s|[-*+]\s|\d+[.、]\s|>\s?|\s*```)/.test(lines[i])&&lines[i].indexOf('|')<0){
      para.push(lines[i].trim());i++;
    }
    out.push('<p>'+inline(escMd(para.join(' ')))+'</p>');
  }
  return out.join('\n');
}
function aiGenTypeSchema(type){
  var schemas={
    text:{shape:'{"html":"Markdown 格式的章节内容"}',tips:'2-6 个要点；先总述再分点；关键指标给具体数字与判定标准；可用 ##/### 子标题、- 列表、| 表格 组织内容。'},
    table:{shape:'{"rows":[{"cells":["表头1","表头2"]},{"cells":["值1","值2"]}]}',tips:'第一行必须是表头；2-6 行数据；表头按章节用途设计（变更历史：版本/更改内容/作者/日期；定义：术语/定义；埋点：事件/触发条件/参数/上报方式）。'},
    feat:{shape:'{"items":[{"name":"功能点名称","desc":"目标：…；前置：…；主流程：…；异常/边界：…；输入输出：…；权限：…；验收：…；埋点：…；待确认：…","priority":"P1","status":"草稿"}]}',tips:'5-12 条；每条 desc 必须按固定字段写全：目标、前置、主流程、异常/边界、输入输出、权限、验收、埋点、待确认；未知值写“AI 建议（待确认）”。name 必填且唯一；priority 只能 P0/P1/P2/P3/P4；status 只能 草稿/评审中/开发中/测试中/已上线；至少 1 条 P0。'},
    accept:{shape:'{"items":[{"text":"验收标准","status":"na"}]}',tips:'4-10 条；每条必须能用是/否判定并尽量带量化指标（如"延迟 ≤ 1.5 秒"）；status 一律 "na"。'},
    users:{shape:'{"items":[{"role":"角色","want":"想要…","soThat":"以便…"}]}',tips:'2-6 条用户故事；role/want/soThat 都必填。'}
  };
  return schemas[type]||schemas.text;
}
function aiGenStyleGuide(style){
  var guides={
    standard:'【模板风格：标准 PRD】全篇遵循：①每个必填节都要有实质内容；②量化目标必须给数字+判定方式；③验收项可"是/否"判定并尽量带指标；④功能需求带优先级 P0-P4 与状态；⑤上线含灰度/回滚/监控。',
    agile:'【模板风格：精简敏捷 PRD】全篇遵循：①聚焦本次迭代要交付的内容，篇幅精简；②范围必须写清"做/不做"（明确排除项防蔓延）；③验收聚焦可量化验收项；④上线计划写发布时间窗/灰度/回滚/监控。',
    hardware:'【模板风格：通用硬件/物联网】全篇遵循：①安全优先：功能安全等级、故障降级策略、关键操作需二次确认；②环境与法规：高低温/湿度/振动/EMC 等环境试验与认证要求（如 CE/FCC/CCC 等行业强制认证）；③接口必须写协议/字段/依赖服务；④量化指标给上下限与测量方式。'
  };
  return guides[style]||'';
}
function aiProjectContextText(p){
  p=p||currentProj();
  if(!p||!p.context)return '';
  var c=p.context;
  var map=[['type','产品类型'],['users','目标用户'],['platform','运行平台/系统'],['competitors','竞品'],['techDeps','技术依赖'],['goals','业务目标']];
  var lines=[];
  for(var i=0;i<map.length;i++){var v=String(c[map[i][0]]||'').trim();if(v)lines.push('- '+map[i][1]+'：'+v);}
  if(!lines.length)return '';
  return '【项目上下文】（来自本项目「项目上下文」设置，AI 撰写/体检/评审时请据此约束与对齐内容，不得与之冲突）\n'+lines.join('\n');
}
function aiGenSectionPrompt(sid,desc,fwList,styleGuide,mode,ctxText){
  var s=STATE.framework.find(function(x){return x.id===sid;});
  if(!s)return null;
  var type=(s.type==='timeline')?'text':s.type;
  var schema=aiGenTypeSchema(type);
  var isDes=String(mode||'')==='design';
  var styleLine=String(styleGuide||'').trim()?('6. 风格约束：'+styleGuide+'\n'):'';
  var modeLine=isDes?('7. 产品设计视角：先明确目标用户、核心场景与产品定位，再基于此产出本章节内容；功能与指标须能与产品定位对应，避免与技术实现脱节。\n8. 对从需求澄清带入的“待确认假设”，必须保留“（建议：…）”标识；不可把它写成已确认事实。功能需求应覆盖目标、前置条件、主流程、异常/边界、输入输出、权限、验收、埋点与待确认项：缺少时说明缺口或给出建议，不可用空泛文字掩盖。\n'):'';
  return {
    system:'你是资深的 PRD（产品需求文档）撰写专家。根据用户提供的产品描述，为指定章节撰写中文内容。\n'
      +'硬性要求：\n'
      +'1. 只输出一个 JSON 对象，不要输出任何多余文字、注释或代码围栏。\n'
      +'2. 内容必须具体、可落地、可验证；可量化的指标必须给出具体数字与判定标准。\n'
      +'3. 严禁编造产品描述中不存在的关键事实；不确定的部分用"（建议：…）"标注，不得写成既定事实。\n'
      +'4. 输出结构必须严格符合：'+schema.shape+'\n'
      +'5. 写作提示：'+schema.tips+'\n'
      +styleLine
      +modeLine,
    user:(ctxText?ctxText+'\n\n':'')+'【产品描述】\n'+(isDes?'（产品设计模式：请从目标用户、核心场景、产品定位角度理解以下描述，并据此先做产品设计再输出内容）\n':'')+desc+'\n\n【全部章节】\n'+fwList+'\n\n【本章节】\n章节 id：'+s.id+'；标题：'+s.title+'；类型：'+(s.type==='timeline'?'text':s.type)+(s.required?'（必填）':'（可选）')+'\n\n按上述要求输出 JSON。'
  };
}
function aiGenNormRows(rows){
  if(!Array.isArray(rows))return null;
  var out=rows.filter(function(r){return r&&Array.isArray(r.cells);}).map(function(r){return {cells:r.cells.map(function(v){return String(v==null?'':v).trim();})};});
  if(!out.length)return null;
  var n=out[0].cells.length;
  if(!n||out.some(function(r){return r.cells.length!==n;}))return null;
  return out;
}
function aiGenNormItems(type,items){
  if(!Array.isArray(items))return null;
  var out=[];
  var prio={'P0':1,'P1':1,'P2':1,'P3':1,'P4':1};
  var sts={'草稿':1,'评审中':1,'开发中':1,'测试中':1,'已上线':1,'':1};
  items.forEach(function(it){
    if(!it)return;
    if(type==='feat'){
      var name=String(it.name==null?'':it.name).trim();
      if(!name)return;
      out.push({name:name,desc:String(it.desc==null?'':it.desc).trim(),priority:(prio[String(it.priority||'P2').toUpperCase()]?String(it.priority).toUpperCase():'P2'),status:(sts[it.status]?it.status:'草稿')});
    }else if(type==='accept'){
      var text=String(it.text==null?'':it.text).trim();
      if(!text)return;
      out.push({text:text,status:'na'});
    }else if(type==='users'){
      var role=String(it.role==null?'':it.role).trim(),want=String(it.want==null?'':it.want).trim(),soThat=String(it.soThat==null?'':it.soThat).trim();
      if(!role&&!want)return;
      out.push({role:role,want:want,soThat:soThat});
    }
  });
  return out.length?out:null;
}
function aiGenSection(sid,desc,opts){
  var s=STATE.framework.find(function(x){return x.id===sid;});
  if(!s)return Promise.resolve(null);
  // v18.30：变更历史节自动生成「V1.0 建立」（第一版），不走 AI
  if(sid==='meta'){
    var d0=new Date();
    var dt0=d0.getFullYear()+'-'+('0'+(d0.getMonth()+1)).slice(-2)+'-'+('0'+d0.getDate()).slice(-2);
    return Promise.resolve({sectionId:'meta',type:'table',secType:'table',replaceRows:[{cells:['版本','更改内容','作者','日期']},{cells:['V1.0','建立','',''+dt0]}]});
  }
  var type=(s.type==='timeline')?'text':s.type;
  var fwList=STATE.framework.map(function(x){return x.id+'「'+x.title+'」'+(x.type==='timeline'?'text':x.type);}).join('；');
  var p=aiGenSectionPrompt(sid,desc,fwList,opts&&opts.styleGuide,opts&&opts.mode,opts&&opts.ctxText);
  return aiAskJSON([{role:'system',content:p.system},{role:'user',content:p.user}],{temperature:0.5,onStatus:opts&&opts.onStatus,onDelta:opts&&opts.onDelta,timeout:120000,maxTokens:4000}).then(function(resp){
    if(!resp||typeof resp!=='object')return null;
    var ch=null;
    if(type==='text'){
      var md=String(resp.html==null?'':resp.html).trim();
      if(!md)return null;
      var html=aiSanitizeHtml(aiMdToHtml(md));
      if(!aiStripTags(html).trim())return null;
      ch={sectionId:sid,type:'text',secType:s.type,replaceSection:html};
    }else if(type==='table'){
      var rows=aiGenNormRows(resp.rows);
      if(!rows)return null;
      ch={sectionId:sid,type:'table',secType:s.type,replaceRows:rows};
    }else{
      var items=aiGenNormItems(type,resp.items);
      if(!items)return null;
      ch={sectionId:sid,type:'items',secType:s.type,replaceItems:items};
    }
    return ch;
  });
}
function aiGenStart(){
  if(aiBusy){aiToast('AI 正在处理中，请稍候');return;}
  var nm=document.getElementById('aiGenName');
  var descEl=document.getElementById('aiGenDesc');
  var fwSel=document.getElementById('aiGenFw');
  var styleSel=document.getElementById('aiGenStyle');
  var stLine=document.getElementById('aiGenStatus');
  var name=(nm&&nm.value||'').trim()||'AI 草稿';
  var text=(descEl&&descEl.value||'').trim();
  if(text.length<10){aiToast('请填写更完整的产品/功能描述（至少 10 个字）');if(stLine)stLine.textContent='请先补充产品描述。';return;}
  var st0=aiGetSettings();
  if(!String(st0.apiKey||'').trim()||!String(st0.baseUrl||'').trim()){aiToast('请先在 设置→AI 中配置 API Key 与地址');aiOpenSettingsTab();return;}
  aiBusy=true;
  aiGlobalAbort=new AbortController();
  aiCancelFlag=false;
  aiStatus='';aiStatusLog=[];
  var styleGuide=aiGenStyleGuide(styleSel&&styleSel.value||'');
  var dbg={at:Date.now(),name:name,fwId:(fwSel&&fwSel.value)||'default',style:(styleSel&&styleSel.value)||'',sections:0,ok:0,failed:[],steps:[]};
  // v18.31：生成前捕获当前项目上下文（createProject 会切换 activeProject，必须在之前取），注入 AI 提示词
  var ctxText=aiProjectContextText();
  function finishModal(){try{closeModal('aiGenModal');}catch(e){var mm=document.getElementById('aiGenModal');if(mm)mm.classList.remove('open');}}
  try{createProject(name,fwSel?fwSel.value:null);}catch(e){aiBusy=false;aiToast('创建项目失败：'+(e&&e.message||e));return;}
  finishModal();
  // v18.30：生成开始即展开 AI 助手面板（用户看到撰写进度；生成完 pendingDiffs 直接出现在面板里）。class+内联 style 双保险
  aiUi.open=true;
  var pp0=document.getElementById('aiPanel');
  if(pp0){pp0.classList.add('open');pp0.style.transform='translateX(0)';}
  aiUpdateButtonVisibility();
  aiSetStatus('AI 撰写中：正在逐节生成草稿…');
  var secs=STATE.framework.slice();
  var changes=[];
  var idx=0;
  function next(){
    if(aiCancelFlag){aiBusy=false;aiGlobalAbort=null;aiStatus='';aiStatusLog=[];aiRenderPanel();aiToast('已停止 AI 撰写');return null;}
    if(idx>=secs.length)return finish();
    var s=secs[idx++];
    aiSetStatus('正在撰写第 '+idx+'/'+secs.length+' 节：'+s.title+'…');
    return aiGenSection(s.id,text,{onStatus:aiSetStatus,styleGuide:styleGuide,mode:aiGenMode,ctxText:ctxText}).then(function(ch){
      if(ch){changes.push(ch);dbg.ok++;dbg.sections++;aiStatusLog.push(s.title+'：已生成');}
      else{dbg.sections++;dbg.failed.push(s.title);aiStatusLog.push('— '+s.title+'：本次未生成内容（可稍后手动补写或用一键优化）');}
      return next();
    }).catch(function(e){
      dbg.sections++;dbg.failed.push(s.title+(e&&e.kind==='canceled'?'':'：'+String(e&&e.message||e).slice(0,60)));
      if(aiCancelFlag){aiBusy=false;aiGlobalAbort=null;aiStatus='';aiStatusLog=[];aiRenderPanel();aiToast('已停止 AI 撰写');return null;}
      return next();
    });
  }
  function finish(){
    dbg.finishedAt=Date.now();
    var st=aiState();
    var items=[];
    changes.forEach(function(ch){
      var it={id:aiUid(),sectionId:ch.sectionId,sectionTitle:(STATE.framework.find(function(f){return f.id===ch.sectionId;})||{}).title||ch.sectionId,type:ch.type,sectionType:ch.secType||ch.type,status:'pending'};
      if(ch.type==='text')it.replaceSection=ch.replaceSection;
      else if(ch.type==='table')it.replaceRows=ch.replaceRows;
      else it.replaceItems=ch.replaceItems;
      aiValidateChange(it);
      items.push(it);
    });
    st.pendingDiffs={id:aiUid(),gen:true,genLabel:'AI 草稿',scoreBefore:null,scoreAfter:null,target:null,rounds:0,createdAt:Date.now(),review:null,engineDelta:null,items:items};
    st.lastGenDebug=dbg;
    aiPersist();
    aiBusy=false;
    aiGlobalAbort=null;
    aiStatus='';aiStatusLog=[];
    // 自动展开 AI 助手面板，让用户立即看到「AI 撰写草稿待确认」+「全部接受并写入」入口（class+内联 style 双保险）
    aiUi.open=true;
    var pp=document.getElementById('aiPanel');
    if(pp){pp.classList.add('open');pp.style.transform='translateX(0)';}
    aiUpdateButtonVisibility();
    aiRenderPanel();
    aiToast(items.length?('AI 草稿生成完成：'+items.length+' 节待确认。已自动展开 AI 助手面板，点击「全部接受并写入」即可写入正文（如不需要可点「关闭」按钮收起）'):'AI 未能生成内容，请检查 API Key/模型或补充产品描述后重试');
  }
  return next();
}
var aiGenMode='';
function aiOpenGenModal(mode){
  aiGenMode=String(mode||'').trim();
  if(!String(aiGetSettings().apiKey||'').trim()){aiToast('请先在 设置→AI 中配置 API Key');aiOpenSettingsTab();return;}
  var st=aiState();
  if(st&&st.pendingDiffs&&st.pendingDiffs.items&&st.pendingDiffs.items.length&&!st.pendingDiffs.gen){
    aiToast('有未确认的修改待处理，请先在 AI 面板完成确认');return;
  }
  var fwSel=document.getElementById('aiGenFw');
  if(fwSel){
    var opts=(STATE.frameworkPresets||[]).map(function(p){return '<option value="'+aiEsc(p.id)+'">'+aiEsc(p.name)+'</option>';}).join('');
    var cp=currentProj();
    if(cp)opts+='<option value=""'+(opts?'':' selected')+'>当前框架：'+aiEsc(cp.name)+'</option>';
    fwSel.innerHTML=opts;
  }
  var descEl=document.getElementById('aiGenDesc');if(descEl)descEl.value='';
  var nmEl=document.getElementById('aiGenName');if(nmEl)nmEl.value='';
  var stLine=document.getElementById('aiGenStatus');if(stLine)stLine.textContent='';
  var isDes=aiGenMode==='design';
  var tEl=document.getElementById('aiGenTitle');if(tEl)tEl.textContent=isDes?'AI 产品设计 · 从想法到产品方案与 PRD':'AI 撰写 · 直接生成 PRD';
  var hint=document.querySelector('#aiGenModal .m-body>.muted');if(hint)hint.textContent=isDes?'描述目标用户、核心场景与产品想法，AI 先做产品设计（用户画像/场景/功能优先级），再按框架生成每节内容。':'已有明确方案？直接填写产品或功能描述，AI 新建项目并按框架逐节撰写草稿；每节内容逐条确认后才写入正文，版本可回滚。';
  var lbs=document.querySelectorAll('#aiGenModal .field label');if(lbs.length>1)lbs[1].textContent=isDes?'产品想法 / 目标用户与场景（至少 10 个字）':'产品/功能描述（已有方案，至少 10 个字）';
  var da=document.getElementById('aiGenDesc');if(da)da.placeholder=isDes?'例如：面向中小团队的轻量协作工具，核心场景为任务看板与进度同步；希望设计兼顾易用、实时协同与权限管理…':'例如：为协作工具新增实时协同编辑能力，支持多人同时编辑看板与任务；目标指标：协同延迟≤500ms、可用性≥99.9%、离线可编辑…';
  try{openModal('aiGenModal');}catch(e){var mm=document.getElementById('aiGenModal');if(mm)mm.classList.add('open');}
}

/* ---------- Diff 确认（v17.9：逐条点击即写入，可单条撤销） ---------- */
function aiApplyDiffItemNow(it){
  var entries=[];
  if(it.type==='text'){
    var c=DATA[it.sectionId];if(!c)return null;
    if(it.replaceSection!=null){
      c.html=it.replaceSection;
      entries.push({kind:'section',oldHtml:(it.oldFields&&it.oldFields.html)||'',newHtml:it.replaceSection});
    }else{
      var r=aiApplyEdits(String(c.html||''),it.edits||[]);
      if(r.results.some(function(x){return !x.ok;}))return null;
      c.html=r.html;
      entries=r.results.filter(function(x){return x.ok&&x.oldHtml;}).map(function(x){return {kind:'block',blockOld:x.oldHtml,blockNew:x.newHtml,anchor:x.anchor||''};});
    }
  }else if(it.type==='table'){
    var c2=DATA[it.sectionId];if(!c2)return null;
    if(it.replaceRows){
      c2.rows=it.replaceRows;
      entries.push({kind:'rows',oldRows:(it.oldFields&&it.oldFields.rows)||[],newRows:it.replaceRows});
    }else{
      var re=aiRowExec(c2.rows||[],it.rowEdits||[]);
      if(re.results.some(function(x){return !x.ok;}))return null;
      c2.rows=re.rows;
      entries=re.results.filter(function(x){return x.ok;}).map(function(x){return {kind:'row',rowOp:(x.edit&&x.edit.op)||'',match:(x.edit&&x.edit.match)||'',rowOld:x.rowOld,rowNew:x.rowNew,anchor:x.anchor||''};});
    }
  }else if(it.type==='items'){
    var c3=DATA[it.sectionId];if(!c3)return null;
    entries.push({kind:'items',oldItems:aiDeep(c3.items||[]),newItems:aiDeep(it.replaceItems||[])});
    c3.items=aiDeep(it.replaceItems||[]);
  }
  return entries;
}
function aiMergeApplied(pd,it,entries){
  if(!entries||!entries.length)return;
  if(!pd.appliedPatches)pd.appliedPatches={};
  (pd.appliedPatches[it.sectionId]=pd.appliedPatches[it.sectionId]||[]).push.apply(pd.appliedPatches[it.sectionId],entries);
}
function aiDecideDiff(id,status){
  var st=aiState();var pd=st.pendingDiffs;if(!pd)return;
  var it=pd.items.filter(function(x){return x.id===id;})[0];
  if(!it)return;
  if(status==='accepted'){
    if(aiIsSectionLocked(it.sectionId)){aiToast('该节已锁定，AI 修改不能写入；可解除锁定后重新确认');return;}
    if(it.type==='suggestion'){it.status='accepted';aiPersist();aiRenderPanel();if(pd.items.every(function(x){return x.status!=='pending';}))aiFinalizePending();return;}
    if(!(it.validation&&it.validation.ok)){aiToast('该条校验不过，无法接受（可修改或拒绝）');return;}
    var entries=aiApplyDiffItemNow(it);
    if(!entries){aiToast('应用失败：内容已变化或无法匹配，请重新优化');return;}
    aiMergeApplied(pd,it,entries);
    it.appliedEntries=entries;
    it.status='accepted';
    aiPersist();
    try{render();refreshHealthUI();}catch(e){}
    var remain=pd.items.filter(function(x){return x.status==='pending';}).length;
    aiToast('已应用「'+it.sectionTitle+'」'+(remain?('，还剩 '+remain+' 条待确认'):''));
  }else{
    it.status=status;
    aiPersist();
  }
  aiRenderPanel();
  if(pd.items.every(function(x){return x.status!=='pending';}))aiFinalizePending();
}
function aiSaveModifiedDiff(id,ei){
  var st=aiState();var pd=st.pendingDiffs;if(!pd)return;
  var it=pd.items.filter(function(x){return x.id===id;})[0];
  if(!it)return;
  if(aiIsSectionLocked(it.sectionId)){aiToast('该节已锁定，不能写入 AI 修改');return;}
  var ta=document.getElementById('aiModify-'+id+(ei!=null?'_'+ei:''));
  if(!ta)return;
  var v=ta.value;
  if(it.type==='text'){
    var html=v.split(/\n{2,}/).map(function(p){return '<p>'+aiEsc(p.replace(/\n/g,' '))+'</p>';}).join('');
    if(ei!=null&&it.edits[ei])it.edits[ei].newHtml=html;
  }else if(it.type==='table'){
    if(ei!=null&&it.rowEdits[ei])it.rowEdits[ei].cells=v.split('|').map(function(c){return c.trim();});
  }else{it.suggestion=v;}
  aiValidateChange(it);
  if(it.type!=='suggestion'){
    if(!(it.validation&&it.validation.ok)){aiToast('修改后校验不过：'+(it.validation.blocked||[]).join('；'));aiRenderPanel();return;}
    var entries=aiApplyDiffItemNow(it);
    if(!entries){aiToast('应用失败：内容已变化或无法匹配');return;}
    aiMergeApplied(pd,it,entries);
    it.appliedEntries=entries;
  }
  it.status='modified';
  aiPersist();
  try{render();refreshHealthUI();}catch(e){}
  aiRenderPanel();
  aiToast('已应用修改后的「'+it.sectionTitle+'」');
  if(pd.items.every(function(x){return x.status!=='pending';}))aiFinalizePending();
}
function aiAcceptAll(){
  var st=aiState();var pd=st.pendingDiffs;if(!pd)return;
  var ok=false;
  pd.items.forEach(function(it){
    if(it.status==='pending'&&it.validation&&it.validation.ok){
      if(aiIsSectionLocked(it.sectionId))return;
      if(it.type==='suggestion'){it.status='accepted';ok=true;return;}
      var entries=aiApplyDiffItemNow(it);
      if(entries){aiMergeApplied(pd,it,entries);it.appliedEntries=entries;it.status='accepted';ok=true;}
    }
  });
  if(!ok){aiToast('存在校验不过或已锁定的修改，无法全部接受，请逐条处理');aiRenderPanel();return;}
  aiPersist();
  try{render();refreshHealthUI();}catch(e){}
  aiFinalizePending();
}
function aiUndoDiffItem(id){
  var st=aiState();var pd=st.pendingDiffs;if(!pd)return;
  var it=pd.items.filter(function(x){return x.id===id;})[0];
  if(!it||(it.status!=='accepted'&&it.status!=='modified'&&it.status!=='rejected'))return;
  var entries=it.appliedEntries;
  if(entries&&entries.length){
    var c=DATA[it.sectionId];if(c){
      var f=aiReverseEntries({html:c.html,rows:c.rows?aiDeep(c.rows):null,items:c.items?aiDeep(c.items):null},entries);
      if(f.html!=null)c.html=f.html;
      if(f.rows)c.rows=f.rows;
      if(f.items!=null)c.items=f.items;
    }
    var ap=pd.appliedPatches;
    if(ap&&ap[it.sectionId]){
      var keys=entries.map(function(e){return JSON.stringify(e);});
      ap[it.sectionId]=ap[it.sectionId].filter(function(e){return keys.indexOf(JSON.stringify(e))<0;});
      if(!ap[it.sectionId].length)delete ap[it.sectionId];
    }
  }
  it.appliedEntries=null;
  it.status='pending';
  aiPersist();
  try{render();refreshHealthUI();}catch(e){}
  aiRenderPanel();
  aiToast('已撤销「'+it.sectionTitle+'」的修改（恢复原文）');
}
function aiFinalizePending(){
  var st=aiState();var pd=st.pendingDiffs;if(!pd)return;
  var deferred=pd.items.filter(function(i){return i.status==='deferred'||i.status==='pending';});
  if(deferred.length){aiToast('还有 '+deferred.length+' 条暂缓/未处理项，处理完后再归档');aiRenderPanel();return;}
  var accepted=pd.items.filter(function(i){return i.status==='accepted'||i.status==='modified';});
  if(!accepted.length){
    st.pendingDiffs=null;aiPersist();aiRenderPanel();
    aiToast('本轮修改全部拒绝，未产生新版本');
    return;
  }
  var patches=pd.appliedPatches||{};
  var totalEntries=Object.keys(patches).reduce(function(a,s){return a+patches[s].length;},0);
  if(!totalEntries){
    st.pendingDiffs=null;aiPersist();aiRenderPanel();
    aiToast('本轮仅有建议类修改（无自动写入内容），已归档，未产生新版本');
    return;
  }
  var kind=pd.gen?'ai':((pd.scoreAfter!=null&&pd.scoreAfter>=pd.target)?'final':'ai');
  var vs=st.versions||(st.versions=[]);
  var label=pd.genLabel||aiVersionLabel(kind,kind==='ai'?vs.filter(function(v){return v.kind==='ai';}).length+1:1);
  aiCreateVersion(kind,label,patches,pd.scoreBefore,pd.scoreAfter,{applied:true,transform:!!pd.gen});
  // 写入后以当前正文重新跑确定性规则；独立 AI 复核保留其对“拟改后全文”的结论，二者不会相互替代。
  st.lastRecheck=aiBuildRecheck(pd.ruleBaseline,pd.review);
  st.pendingDiffs=null;
  aiPersist();
  try{render();refreshHealthUI();}catch(e){}
  aiRenderPanel();
  aiToast('已归档为「'+label+'」'+(kind==='final'?'（达到目标分 '+pd.target+'）':''));
}

/* ---------- 忽略 / 已订正 ---------- */
function aiToggleIgnore(key,corrected){
  var st=aiState();var arr=st.ignoredAiIssues||(st.ignoredAiIssues=[]);
  var idx=arr.findIndex(function(x){return x.key===key;});
  if(idx>=0){arr.splice(idx,1);aiToast('已恢复该问题');}
  else{arr.push({key:key,corrected:!!corrected,at:Date.now()});aiToast(corrected?'已标记为已订正':'已忽略');}
  aiPersist();aiRenderPanel();
}

/* ---------- 设置页 ---------- */
function aiOpenSettingsTab(){
  try{openSettings('ai');}catch(e){try{openModal('settingsModal');setSettingsTab('ai');}catch(e2){}}
}
function aiReadForm(){
  var s=aiGetSettings();
  var g=function(id){var el=document.getElementById(id);return el?el.value.trim():'';};
  var key=g('aiKey');
  var out={provider:g('aiProvider')||s.provider,baseUrl:g('aiBaseUrl')||s.baseUrl,model:g('aiModel')||s.model,apiKey:key||s.apiKey,targetScore:aiClamp(+(g('aiTarget')||s.targetScore),50,100),maxRounds:aiClamp(+(g('aiRounds')||s.maxRounds),1,5),web:(function(){var el=document.getElementById('aiWeb');return el?el.checked:s.web;})(),dims:{}};
  out.reviewModel=g('aiReviewModel')||s.reviewModel;
  Object.keys(DIM_META).forEach(function(k){
    var en=document.getElementById('aiDimOn-'+k);
    var w=document.getElementById('aiDimW-'+k);
    var cur=s.dims[k]||{weight:10,enabled:true};
    out.dims[k]={enabled:en?en.checked:cur.enabled,weight:aiClamp(w?+(w.value||cur.weight):cur.weight,1,100)};
  });
  return out;
}
function aiSaveForm(){
  var s=aiReadForm();
  if(aiSaveSettings(s)){aiToast('AI 设置已保存（Key 仅存本机浏览器，不随备份导出）');aiRenderPanel();}
}
function aiTestConn(){
  var s=aiReadForm();
  if(!String(s.apiKey||'').trim()||!String(s.baseUrl||'').trim()){aiToast('请先填写 API Key 与地址');return;}
  var line=document.getElementById('aiConnStatus');
  if(line)line.innerHTML='<span class="ai-orb ai-orb--spin" style="--s:13px;margin-right:5px"></span>正在测试连接…';
  var base=aiNormBase(s.baseUrl);
  var ctrl=new AbortController();
  var timer=setTimeout(function(){ctrl.abort();},20000);
  fetch(base+'/models',{headers:{'Authorization':'Bearer '+String(s.apiKey).trim()},signal:ctrl.signal}).then(function(resp){
    clearTimeout(timer);
    if(resp.ok){
      if(line)line.textContent='连接成功：Key 有效，可开始使用（若后续调用报跨域，说明该服务商对浏览器直连不稳定）。';
      aiToast('连接成功');
    }else{
      var c=aiClassify(null,resp,'');
      if(line)line.textContent=c.message;
      aiToast('连接失败：'+c.message);
    }
  }).catch(function(e){
    clearTimeout(timer);
    var c=aiClassify(e,null,'');
    if(line)line.textContent=c.message;
    aiToast('连接失败：'+c.message);
  });
}
function aiRenderTab(){
  var el=document.getElementById('tabAI');if(!el)return;
  var s=aiGetSettings();
  var keyMask=s.apiKey?(s.apiKey.length>6?s.apiKey.slice(0,3)+'••••••'+s.apiKey.slice(-2):'••••••'):'';
  var dimsHtml=Object.keys(DIM_META).map(function(k){
    var d=s.dims[k]||{weight:10,enabled:true};
    return '<div class="ai-dim-row"><label class="ai-dim-on"><input type="checkbox" class="sw" id="aiDimOn-'+k+'"'+(d.enabled?' checked':'')+'>'+DIM_META[k].label+'</label><span class="muted">权重</span><input type="number" id="aiDimW-'+k+'" min="1" max="100" step="1" value="'+(d.weight||10)+'" style="width:64px"></div>';
  }).join('');
  el.innerHTML='<div class="muted" style="margin-bottom:10px">AI 深度体检（与红黄绿规则引擎并列，不覆盖）。Key 仅存本机浏览器，不进备份/导出/日志；公开分享的链接不会携带你的 Key。</div>'
    +'<div class="impact-summary" style="margin-bottom:12px"><b>AI 数据边界</b><ul><li>首次使用 AI 时会显示服务商、模型和数据边界；确认后不再因不同操作重复打断。</li><li>体检/全文优化/评审会发送当前项目 PRD；单节优化仅发送该节和相关问题；对话只发送本轮对话内容。</li><li>请先脱敏账号、密钥、个人信息、客户数据和未公开合同；API Key、主题及其他本机项目不会作为请求字段发送。</li></ul></div>'
    +'<div class="field"><label>服务商</label><select id="aiProvider">'+[['deepseek','DeepSeek'],['openai','OpenAI'],['custom','自定义']].map(function(o){return '<option value="'+o[0]+'"'+(s.provider===o[0]?' selected':'')+'>'+o[1]+'</option>';}).join('')+'</select></div>'
    +'<div class="field"><label>Base URL（OpenAI 兼容）</label><input id="aiBaseUrl" value="'+aiEsc(s.baseUrl)+'" placeholder="https://api.deepseek.com/v1"></div>'
    +'<div class="field"><label>模型</label><input id="aiModel" value="'+aiEsc(s.model)+'" placeholder="deepseek-chat" list="aiModelList"><datalist id="aiModelList"><option value="deepseek-chat"><option value="deepseek-reasoner"></datalist></div>'
    +'<div class="field"><label>复检模型（可选，留空=与主模型相同）</label><input id="aiReviewModel" value="'+aiEsc(s.reviewModel||'')+'" placeholder="deepseek-chat"></div>'
    +'<div class="field"><label>API Key</label><input id="aiKey" type="password" placeholder="'+(keyMask?('已保存 '+keyMask+'（输入新值将覆盖）'):'sk-...')+'"><div class="muted">'+ (keyMask?'当前 Key：'+aiEsc(keyMask):'尚未配置 Key') +'</div></div>'
    +'<div class="ai-dim-grid"><div class="ai-dim-grid-t"><span>评分维度</span><span>权重（可调，总分会按权重加权）</span></div>'+dimsHtml+'</div>'
    +'<div class="field"><label>目标分（一键优化达标线）</label><input id="aiTarget" type="number" min="50" max="100" value="'+s.targetScore+'"></div>'
    +'<div class="field"><label>最大优化轮数（护栏：2-5，超出自动停止）</label><input id="aiRounds" type="number" min="1" max="5" value="'+s.maxRounds+'"></div>'
    +'<div class="field ai-web-field"><label class="ai-toggle"><input type="checkbox" class="sw" id="aiWeb"'+(s.web?' checked':'')+'> 开启联网（模型原生搜索，按服务商自动适配）</label><div class="muted">智谱走 web_search 工具、通义走 enable_search；不确定服务商时按智谱风格注入，不支持的服务商会报错提示。仅对话流生效，不影响体检/优化（JSON 模式自动跳过）。</div></div>'
    +'<div class="row-act"><button data-ai="savesettings">保存设置</button><button data-ai="testconn">测试连接</button></div>'
    +'<div id="aiConnStatus" class="muted" style="margin-top:6px"></div>';
}

/* ---------- 面板渲染 ---------- */
function aiSeverityTag(sv){
  var map={high:['lv-red','严重'],medium:['lv-yellow','中'],low:['lv-green','轻']};
  var m=map[sv]||map.medium;
  return '<span class="pill-st '+m[0]+'">'+m[1]+'</span>';
}
function aiPreview(fields){
  if(!fields)return '—';
  if('html' in fields)return aiHtmlToText(fields.html).slice(0,220);
  if('rows' in fields)return (fields.rows||[]).map(function(r){return '| '+((r.cells||[]).join(' | '))+' |';}).slice(0,6).join('\n');
  if('items' in fields)return (fields.items||[]).map(function(i){return i?(i.name!=null?(i.name+' '+(i.desc||'')):(i.role?('作为'+i.role+'我希望'+(i.want||'')+'以便'+(i.soThat||'')):(i.text||''))):'';}).slice(0,8).join('\n');
  return '';
}
function aiRenderPanel(){
  aiSyncBusyBtn();
  var body=document.getElementById('aiBody');if(!body)return;
  var proj=currentProj();
  if(!proj){
    var recHtml=aiRecoverOffer?'<div class="ai-hint">'+ICONS.warn+' 检测到本地自动备份（'+aiRecoverOffer.count+' 个项目），当前主存储为空<button data-ai="recover-backup">恢复备份</button></div>':'';
    body.innerHTML='<div class="empty"><span class="e-ic">'+ICONS.starL+'</span><span class="e-t">还没有打开项目</span><span class="e-d">先创建或打开一个项目，再使用 AI 助手</span></div>'
      +'<div class="ai-diff-all"><button class="btn btn--primary" data-ai="gen" title="输入产品描述，AI 新建项目并逐节生成草稿"><svg class="ic-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20l4.2-1.1 11-11-3.1-3.1-11 11L4 20Z"/><path d="M13.9 6.9l3.1 3.1"/></svg> AI 撰写草稿（新建项目）</button></div>'
      +recHtml;
    return;
  }
  var st=aiState();
  var eng=HEALTH&&HEALTH.metrics?'规则引擎：'+HEALTH.metrics.completion+'%':'';
  var hint=aiAlignHint();
  var html='<div class="ai-tools" role="toolbar" aria-label="AI 操作"><button class="btn btn--primary" data-ai="score">AI 深度体检</button><button class="btn btn--secondary" data-ai="optimize">一键优化</button><button class="btn btn--ghost" data-ai="align">结构对齐</button><button class="btn btn--ghost" data-ai="gen" title="输入产品描述，AI 新建项目并逐节生成草稿"><svg class="ic-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20l4.2-1.1 11-11-3.1-3.1-11 11L4 20Z"/><path d="M13.9 6.9l3.1 3.1"/></svg> AI 撰写</button><button class="btn btn--ghost" data-ai="review" title="产品/研发/测试/设计/项目经理五视角评审当前 PRD">多角色评审</button><span class="ai-engine muted">'+eng+'</span></div>';
  if(hint.level!=='low')html+='<div class="ai-hint">'+ICONS.warn+' '+hint.reasons.map(function(r){return aiEsc(r);}).join('；')+'<button data-ai="align">执行对齐</button></div>';
  if(aiBusy||aiStatus)html+='<div class="ai-stop-row"><button class="btn btn--danger" data-ai="stop" title="中断当前 AI 任务">■ 停止</button><span class="muted" style="font-size:11.5px">停止后本轮结果不写入，可随时重试</span></div>';
  if(aiStatus)html+='<div class="ai-status">'+(aiBusy?'<span class="ai-orb ai-orb--spin" style="--s:14px;margin-right:6px"></span>':'')+aiEsc(aiStatus)+'</div>';
  if(st.lastRecheck){
    var rc=st.lastRecheck,rv=rc.independentReview;
    html+='<div class="ai-sec"><div class="ai-sec-h">最近一次优化后复检 <span class="muted">'+new Date(rc.at).toLocaleString()+'</span></div>'
      +'<div class="ai-engine-delta">确定性规则：<b>已解决 '+(rc.resolved||[]).length+'</b> · 仍存在 '+(rc.remaining||[]).length+' · 新引入 '+(rc.introduced||[]).length+'</div>'
      +(rv?'<div class="ai-review">独立 AI 复核（拟改后全文）：<b>'+rv.score+'</b> 分 · '+(rv.verdict==='pass'?'通过':rv.verdict==='fail'?'不通过':'需改进')+(rv.summary?' · '+aiEsc(rv.summary):'')+'</div>':'<div class="muted" style="font-size:12px">本轮没有可独立复核的 AI 优化拟稿。</div>')
      +(rc.introduced&&rc.introduced.length?'<div class="ai-vwarn">'+ICONS.warn+' 新引入：'+aiEsc(rc.introduced.slice(0,3).map(function(h){return h.snippet;}).join('；'))+'</div>':'')+'</div>';
  }
  if(st.lastOptDebug)html+='<div class="ai-sec"><div class="ai-sec-h">最近一次优化诊断 <button data-ai="clearoptdbg">清除</button></div><pre class="ai-dbg">'+aiEsc(JSON.stringify(st.lastOptDebug,null,1).slice(0,900))+'</pre></div>';
  if(st.lastGenDebug)html+='<div class="ai-sec"><div class="ai-sec-h">最近一次撰写诊断 <button data-ai="cleargendbg">清除</button></div><pre class="ai-dbg">'+aiEsc(JSON.stringify(st.lastGenDebug,null,1).slice(0,900))+'</pre></div>';
  if(st.lastReport){
    var r=st.lastReport;
    var ds=new Date(r.generatedAt).toLocaleString();
    html+='<div class="ai-sec"><div class="ai-sec-h">AI 深度体检 <span class="muted">'+ds+(r.cached?' · 内容未变化，使用缓存':'')+'</span></div>'
      +'<div class="ai-total">总分 <b class="'+(r.total>=80?'lv-green':r.total>=60?'lv-yellow':'lv-red')+'">'+r.total+'</b><small>/100</small></div>'
      +(r.summary?'<div class="ai-sum">'+aiEsc(r.summary)+'</div>':'');
    r.dimensions.forEach(function(d){
      var open=aiUi.dimOpen[d.id];
      html+='<div class="ai-dim"><div class="ai-dim-top" data-ai="dimtoggle" data-did="'+aiEsc(d.id)+'"><span>'+aiEsc(d.name)+' <small class="muted">w'+(d.weight||0)+'</small></span><span class="ai-dim-score">'+d.score+'</span></div>'
        +'<div class="ai-bar"><i style="width:'+aiClamp(d.score,0,100)+'%"></i></div>';
      if(open){
        if(d.note)html+='<div class="ai-dim-note">'+aiEsc(d.note)+'</div>';
        var iss=d.issues||[];
        html+='<div class="ai-iss">'+(iss.length?iss.map(function(it){
          var ignored=st.ignoredAiIssues&&st.ignoredAiIssues.some(function(x){return x.key===it.id;});
          return '<div class="ai-iss-item'+(ignored?' ignored':'')+'">'
            +'<div class="ai-iss-top">'+aiSeverityTag(it.severity)+'<span class="muted">'+(it.sectionTitle?aiEsc(it.sectionTitle):'全文')+' · '+aiEsc(it.source||'AI 推断')+' · '+(ignored?'已忽略/误报':it.status==='resolved'?'已解决':'待处理')+'</span></div>'
            +'<div class="ai-iss-reason">'+aiEsc(it.reason)+'</div>'
            +(it.lowConfidence?'<div class="ai-iss-warn">'+ICONS.warn+' 引用未匹配原文，疑似幻觉，请人工核对</div>':'')
            +(it.quote?'<div class="ai-iss-quote">引用：'+aiEsc(it.quote)+'</div>':'')
            +(it.suggestion?'<div class="ai-iss-adv">建议：'+aiEsc(it.suggestion)+'</div>':'')
            +'<div class="ai-iss-act">'+(it.sectionId?'<button class="btn btn--sm btn--ghost" data-ai="jump" data-sid="'+aiEsc(it.sectionId)+'">定位</button>':'')
            +(ignored?'<button class="btn btn--sm btn--ghost" data-ai="unignore" data-key="'+aiEsc(it.id)+'">恢复</button>'
              :'<button class="btn btn--sm btn--ghost" data-ai="ignore" data-key="'+aiEsc(it.id)+'">忽略</button><button class="btn btn--sm btn--ghost" data-ai="correct" data-key="'+aiEsc(it.id)+'">已订正</button>')
            +'</div></div>';
        }).join(''):'<div class="muted">该维度无明显问题</div>')+'</div>';
      }
      html+='</div>';
    });
    html+='</div>';
  }else{
    html+='<div class="ai-sec"><div class="muted">尚未运行 AI 深度体检。点击上方按钮，AI 将按 6 个维度（完整性/清晰度/一致性/可执行性/可验证性/风险）评分并逐条诊断。</div></div>';
  }
  if(st.pendingDiffs&&st.pendingDiffs.items&&st.pendingDiffs.items.length){
    var pd=st.pendingDiffs;
    html+='<div class="ai-sec warn"><div class="ai-sec-h">'+(pd.gen?'AI 撰写草稿（'+pd.items.length+' 节待确认）<span class="muted">逐条接受后写入正文，可回滚</span>':'待确认修改（'+pd.items.length+' 条）<span class="muted">'+pd.scoreBefore+' → '+pd.scoreAfter+' 分 · 目标 '+pd.target+'</span>')+'</div>';
    if(pd.review)html+='<div class="ai-review">独立复核：<b>'+pd.review.score+'</b> 分 · '+(pd.review.verdict==='pass'?'通过':pd.review.verdict==='fail'?'不通过':'需改进')+(pd.review.summary?' · '+aiEsc(pd.review.summary):'')+'</div>';
    if(pd.engineDelta&&pd.engineDelta.riskBefore!=null)html+='<div class="ai-engine-delta">规则引擎：风险 '+pd.engineDelta.riskBefore+'→'+pd.engineDelta.riskAfter+' · 完成度 '+pd.engineDelta.completionBefore+'%→'+pd.engineDelta.completionAfter+'%</div>';
    html+='<div class="ai-diff-all"><button class="btn btn--primary" data-ai="acceptall">全部接受并写入</button></div>';
    pd.items.forEach(function(it){
      var stT=it.status;
      var locked=aiIsSectionLocked(it.sectionId);
      var stLabel=stT==='pending'?'待确认':(stT==='accepted'?'已接受':stT==='modified'?'已修改':stT==='rejected'?'已拒绝':'已暂缓');
      var v=it.validation||{ok:true,warnings:[],blocked:[]};
      var vBadge=v.ok?'<span class="ai-vbadge ok">'+ICONS.check+' 校验通过</span>':(v.blocked.length?'<span class="ai-vbadge bad">'+ICONS.ban+' '+v.blocked.length+' 项校验不过</span>':'');
      var vWarn=v.warnings&&v.warnings.length?'<div class="ai-vwarn">'+ICONS.warn+' '+v.warnings.map(function(x){return aiEsc(x);}).join('；')+'</div>':'';
      html+='<div class="ai-diff'+(stT==='rejected'?' rejected':'')+(stT==='accepted'||stT==='modified'?' accepted':'')+'">'
        +'<div class="ai-diff-h"><b>'+aiEsc(it.sectionTitle)+'</b><span class="muted">'+it.type+'</span>'
        +(stT==='accepted'||stT==='modified'?'<span class="ai-diff-st acc">'+ICONS.check+' '+stLabel+'</span>'
          :stT==='rejected'?'<span class="ai-diff-st rej">'+ICONS.x+' '+stLabel+'</span>'
          :stT==='deferred'?'<span class="ai-diff-st def">'+stLabel+'</span>'
          :'<span class="muted">· '+stLabel+'</span>')
        +(locked?'<span class="ai-vbadge bad">🔒 AI 锁定</span>':'')+vBadge+'</div>'
        +(it.relatedIssues&&it.relatedIssues.length?'<div class="muted" style="font-size:12px">关联原始问题：'+aiEsc(it.relatedIssues.map(function(x){return x.label;}).join('；'))+'</div>':'')+vWarn;
      if(it.type==='suggestion'){
        html+='<div class="ai-diff-sug">建议：'+aiEsc(it.suggestion)+'</div><div class="muted" style="font-size:12px">该类内容（清单/用户故事/小卡片）不做自动写入，请人工处理。</div>';
      }else{
        if(it.replaceSection!=null){
          html+='<div class="ai-block"><div class="ai-diff-old"><b>原</b><pre class="ai-jump" data-ai="jumpblock" data-sid="'+aiEsc(it.sectionId)+'" data-match="'+aiEsc(aiNormText(aiHtmlToText((it.oldFields&&it.oldFields.html)||'')).slice(0,160))+'" title="点击跳转原文">'+aiEsc(aiHtmlToText((it.oldFields&&it.oldFields.html)||''))+'</pre></div>'
            +'<div class="ai-diff-new"><b>改</b><pre>'+aiEsc(aiHtmlToText(it.replaceSection))+'</pre></div></div>';
        }else if(it.replaceRows){
          var rowTxt0=function(r){return r?'| '+((r.cells||[]).join(' | '))+' |':'';};
          html+='<div class="ai-block"><div class="ai-diff-old"><b>原</b><pre class="ai-jump" data-ai="jumpblock" data-sid="'+aiEsc(it.sectionId)+'" data-match="'+aiEsc(it.replaceRows&&it.replaceRows[0]?String(it.replaceRows[0].cells[0]||'').slice(0,60):'')+'" title="点击跳转原文">'+aiEsc(((it.oldFields&&it.oldFields.rows)||[]).map(rowTxt0).join('\n'))+'</pre></div>'
            +'<div class="ai-diff-new"><b>改</b><pre>'+aiEsc((it.replaceRows||[]).map(rowTxt0).join('\n'))+'</pre></div></div>';
        }else if(it.replaceItems){
          var itemTxt0=function(i){return i?((i.name!=null)?(i.name+' '+(i.desc||'')+' '+(i.priority||'')+' '+(i.status||'')):(i.role?('作为'+i.role+'我希望'+(i.want||'')+'以便'+(i.soThat||'')):(i.text||''))):'';};
          html+='<div class="ai-block"><div class="ai-diff-old"><b>原</b><pre>'+aiEsc(((it.oldFields&&it.oldFields.items)||[]).map(itemTxt0).join('\n')||'（空）')+'</pre></div>'
            +'<div class="ai-diff-new"><b>改</b><pre>'+aiEsc((it.replaceItems||[]).map(itemTxt0).join('\n'))+'</pre></div></div>';
        }else{
        var blks=it.type==='text'?(it.blocks||[]):[];
        var rws=it.type==='table'?(it.rows||[]):[];
        blks.forEach(function(b,bi){
          var mk=it.id+'_'+bi;
          html+='<div class="ai-block"><div class="ai-diff-old"><b>原</b><pre class="ai-jump" data-ai="jumpblock" data-sid="'+aiEsc(it.sectionId)+'" data-match="'+aiEsc(aiNormText(aiHtmlToText(b.blockOld)).slice(0,160))+'" title="点击跳转原文">'+aiEsc(aiHtmlToText(b.blockOld))+'</pre></div>'
            +'<div class="ai-diff-new"><b>改</b><pre>'+aiEsc(aiHtmlToText(b.blockNew))+'</pre></div>';
          if(aiUi.modifyOpen[mk]){
            html+='<textarea id="aiModify-'+aiEsc(it.id)+'_'+bi+'" rows="4" style="width:100%;box-sizing:border-box">'+aiEsc(aiHtmlToText(b.blockNew))+'</textarea>'
              +'<div><button class="btn btn--primary" data-ai="modify-save" data-did="'+aiEsc(it.id)+'" data-ei="'+bi+'">保存修改</button></div>';
          }
          html+='</div>';
        });
        rws.forEach(function(b,bi){
          var mk=it.id+'_'+bi;
          var rowTxt=function(r){return r?(r.cells||[]).join(' | '):'（该行被删除）';};
          html+='<div class="ai-block"><div class="ai-diff-old"><b>原</b><pre class="ai-jump" data-ai="jumpblock" data-sid="'+aiEsc(it.sectionId)+'" data-match="'+aiEsc(b.rowOld&&b.rowOld.cells&&b.rowOld.cells[0]?String(b.rowOld.cells[0]).slice(0,60):'')+'" title="点击跳转原文">'+aiEsc(rowTxt(b.rowOld))+'</pre></div>'
            +'<div class="ai-diff-new"><b>改</b><pre>'+aiEsc(rowTxt(b.rowNew))+'</pre></div>';
          if(aiUi.modifyOpen[mk]){
            html+='<textarea id="aiModify-'+aiEsc(it.id)+'_'+bi+'" rows="2" style="width:100%;box-sizing:border-box">'+aiEsc(b.rowNew?(b.rowNew.cells||[]).join('|'):'')+'</textarea>'
              +'<div><button class="btn btn--primary" data-ai="modify-save" data-did="'+aiEsc(it.id)+'" data-ei="'+bi+'">保存修改</button></div>';
          }
          html+='</div>';
        });
        }
      }
      html+='<div class="ai-diff-act">'
        +(stT==='pending'||stT==='deferred'?(v.ok&&!locked?'<button class="btn btn--accept" data-ai="accept" data-did="'+aiEsc(it.id)+'">接受</button>':'<button class="btn btn--accept" disabled title="'+(locked?'该节已锁定 AI 写入':'校验不过的修改需先修改或拒绝')+'">接受</button>'):'')
        +(stT==='pending'&&!locked?'<button class="btn btn--ghost" data-ai="modify" data-did="'+aiEsc(it.id)+'">修改</button>':'')
        +(stT==='pending'?'<button class="btn btn--reject" data-ai="reject" data-did="'+aiEsc(it.id)+'">拒绝</button>':'')
        +(stT==='pending'?'<button class="btn btn--ghost" data-ai="defer" data-did="'+aiEsc(it.id)+'">暂缓</button>':'')
        +(stT==='accepted'||stT==='modified'||stT==='rejected'?'<button class="btn btn--ghost" data-ai="undo-diff" data-did="'+aiEsc(it.id)+'">撤销</button>':'')
        +'</div>';
      html+='</div>';
    });
    html+='</div>';
  }
  if(st.pendingAlign&&st.pendingAlign.items&&st.pendingAlign.items.length){
    var pa=st.pendingAlign;
    html+='<div class="ai-sec align"><div class="ai-sec-h">结构对齐建议（'+pa.items.length+' 条）'+(pa.summary?'<span class="muted">'+aiEsc(pa.summary)+'</span>':'')+'</div><div class="ai-diff-all"><button class="btn btn--primary" data-ai="align-all">全部接受并应用</button></div>';
    pa.items.forEach(function(it){
      var stT=it.status;
      var stLabel=stT==='pending'?'待确认':(stT==='accepted'?'已接受':stT==='rejected'?'已拒绝':'已暂缓');
      var v=it.validation||{ok:true,warnings:[],blocked:[]};
      var vBadge=v.ok?'<span class="ai-vbadge ok">'+ICONS.check+' 校验通过</span>':(v.blocked.length?'<span class="ai-vbadge bad">'+ICONS.ban+' '+v.blocked.length+' 项校验不过</span>':'');
      var vWarn=v.warnings&&v.warnings.length?'<div class="ai-vwarn">'+ICONS.warn+' '+v.warnings.map(function(x){return aiEsc(x);}).join('；')+'</div>':'';
      html+='<div class="ai-align-item'+(stT==='rejected'?' rejected':'')+(stT==='accepted'?' accepted':'')+'">'
        +(v.blocked&&v.blocked.length?'<div class="ai-vblock">'+ICONS.ban+' '+v.blocked.map(function(x){return aiEsc(x);}).join('；')+'</div>':'');
      if(it.kind==='suggestion'){
        html+='<div class="ai-align-h"><b>建议</b><span class="muted">'+stLabel+'</span>'+vBadge+'</div><div class="ai-align-sug">'+aiEsc(it.suggestion)+'</div>';
      }else if(it.kind==='rename'){
        html+='<div class="ai-align-h"><b>改名：'+aiEsc(it.fromTitle)+' → '+aiEsc(it.newTitle)+'</b><span class="muted">'+stLabel+'</span>'+vBadge+'</div>'+vWarn;
      }else if(it.kind==='deleteEmpty'){
        html+='<div class="ai-align-h"><b>删除空节：「'+aiEsc(it.fromTitle)+'」</b><span class="muted">'+stLabel+'</span>'+vBadge+'</div>'+vWarn+'<div class="ai-align-where muted">仅内容为空且非必填的节才会执行</div>';
      }else if(it.kind==='merge'){
        html+='<div class="ai-align-h"><b>合并：'+aiEsc(it.fromTitle)+' → '+aiEsc(it.toTitle)+'</b><span class="muted">'+stLabel+'</span>'+vBadge+'</div>'+vWarn+'<div class="ai-align-where muted">来源节全部内容并入目标节后删除来源节</div>';
      }else if(it.kind==='split'){
        html+='<div class="ai-align-h"><b>拆分：从「'+aiEsc(it.fromTitle)+'」拆出新节「'+aiEsc(it.newTitle)+'」</b><span class="muted">'+stLabel+'</span>'+vBadge+'</div>'+vWarn
          +'<div class="ai-align-pre"><b>拆走 '+it.moves.length+' 个块</b><pre>'+aiEsc(it.moves.map(function(m){return '· '+aiHtmlToText(m.match);}).join('\n'))+'</pre></div>';
      }else{
        html+='<div class="ai-align-h"><b>'+aiEsc(it.fromTitle)+' → '+aiEsc(it.toTitle)+'</b><span class="muted">'+(it.kind==='moveRow'?'表格行':'文本块')+' · '+stLabel+'</span>'+vBadge+'</div>'+vWarn
          +'<div class="ai-align-pre"><b>搬移内容</b><pre class="ai-jump" data-ai="jumpblock" data-sid="'+aiEsc(it.fromSection)+'" data-match="'+aiEsc(it.kind==='moveRow'?(it.rowOld&&it.rowOld.cells&&it.rowOld.cells[0]?String(it.rowOld.cells[0]).slice(0,60):''):aiNormText(aiHtmlToText(it.blockOld)).slice(0,160))+'" title="点击跳转原文">'+aiEsc(it.kind==='moveRow'?(it.rowOld?(it.rowOld.cells||[]).join(' | '):''):aiHtmlToText(it.blockOld))+'</pre></div>'
          +'<div class="ai-align-where muted">目标位置：'+(it.position==='start'?'节首':it.position==='end'?'节尾':(it.position==='before'?'锚点前':'锚点后')+(it.anchor?'「'+aiEsc(String(it.anchor).slice(0,40))+'」':''))+'</div>';
      }
      html+='<div class="ai-diff-act">'
        +(stT==='pending'||stT==='deferred'?(v.ok?'<button class="btn btn--primary" data-ai="align-accept" data-did="'+aiEsc(it.id)+'">接受</button>':'<button class="btn btn--primary" disabled title="校验不过的调整需先修改或拒绝">接受</button>'):'')
        +(stT==='pending'?'<button data-ai="align-reject" data-did="'+aiEsc(it.id)+'">拒绝</button>':'')
        +(stT==='pending'?'<button data-ai="align-defer" data-did="'+aiEsc(it.id)+'">暂缓</button>':'')
        +'</div></div>';
    });
    html+='</div>';
  }
  var vs=st.versions||[];
  if(vs.length){
    html+='<div class="ai-sec"><div class="ai-sec-h">版本历史 <span class="muted">'+vs.length+'/'+AI_MAX_VERSIONS+' · 节级差异补丁 · 无全文快照</span></div>';
    vs.slice().reverse().forEach(function(v){
      var kindLbl=v.kind==='original'?'原始':v.kind==='human'?'人工':v.kind==='final'?'终稿':'优化';
      var open=aiUi.verOpen[v.id];
      html+='<div class="ai-ver"><div class="ai-ver-top"><span class="ai-ver-lbl">'+aiEsc(v.label)+'</span><span class="pill-st lv-green">'+kindLbl+'</span>'
        +(v.scoreAfter!=null?'<span class="muted">'+v.scoreBefore+' → '+v.scoreAfter+' 分</span>':'')
        +(v.rolledBack?'<span class="pill-st lv-yellow">已回滚</span>':'')
        +'<span class="ai-ver-ops"><button data-ai="viewdiff" data-vid="'+aiEsc(v.id)+'">'+(open?'收起 Diff':'查看 Diff')+'</button><button data-ai="restore" data-vid="'+aiEsc(v.id)+'">恢复</button></span></div>';
      if(open){
        var keys=Object.keys(v.patch||{});
        html+='<div class="ai-ver-diff">'+(keys.length?keys.map(function(sid){
          var p=v.patch[sid],html2='<div class="ai-vd"><div class="muted">'+aiEsc(sectionTitle(sid))+'</div>';
          if(!Array.isArray(p)){
            html2+='<div class="ai-diff-old"><b>原</b><pre>'+aiEsc(aiPreview(p.old))+'</pre></div><div class="ai-diff-new"><b>改</b><pre>'+aiEsc(aiPreview(p.new))+'</pre></div>';
          }else{
            p.forEach(function(e){
              if(e.kind==='block')html2+='<div class="ai-diff-old"><b>原</b><pre class="ai-jump" data-ai="jumpblock" data-sid="'+aiEsc(sid)+'" data-match="'+aiEsc(aiNormText(aiHtmlToText(e.blockOld)).slice(0,160))+'" title="点击跳转原文">'+aiEsc(aiHtmlToText(e.blockOld))+'</pre></div><div class="ai-diff-new"><b>改</b><pre>'+aiEsc(aiHtmlToText(e.blockNew))+'</pre></div>';
              else if(e.kind==='row')html2+='<div class="ai-diff-old"><b>原</b><pre class="ai-jump" data-ai="jumpblock" data-sid="'+aiEsc(sid)+'" data-match="'+aiEsc(e.rowOld&&e.rowOld.cells&&e.rowOld.cells[0]?String(e.rowOld.cells[0]).slice(0,60):'')+'" title="点击跳转原文">'+aiEsc(e.rowOld?(e.rowOld.cells||[]).join(' | '):'')+'</pre></div><div class="ai-diff-new"><b>改</b><pre>'+aiEsc(e.rowNew?(e.rowNew.cells||[]).join(' | '):'')+'</pre></div>';
              else if(e.kind==='fwname')html2+='<div class="ai-diff-old"><b>改名</b><pre>'+aiEsc(e.oldTitle)+' → '+aiEsc(e.newTitle)+'</pre></div>';
              else if(e.kind==='fwdel')html2+='<div class="ai-diff-old"><b>删除节</b><pre>'+aiEsc((e.meta&&e.meta.title)||'')+'</pre></div>';
              else if(e.kind==='fwadd')html2+='<div class="ai-diff-old"><b>新增节</b><pre>'+aiEsc((e.meta&&e.meta.title)||'')+'</pre></div>';
              else if(e.kind==='section')html2+='<div class="ai-diff-old"><b>原</b><pre class="ai-jump" data-ai="jumpblock" data-sid="'+aiEsc(sid)+'" data-match="'+aiEsc(aiNormText(aiHtmlToText(e.oldHtml)).slice(0,160))+'" title="点击跳转原文">'+aiEsc(aiHtmlToText(e.oldHtml))+'</pre></div><div class="ai-diff-new"><b>改</b><pre>'+aiEsc(aiHtmlToText(e.newHtml))+'</pre></div>';
              else if(e.kind==='rows')html2+='<div class="ai-diff-old"><b>原</b><pre class="ai-jump" data-ai="jumpblock" data-sid="'+aiEsc(sid)+'" data-match="'+aiEsc(e.oldRows&&e.oldRows[0]&&e.oldRows[0].cells&&e.oldRows[0].cells[0]?String(e.oldRows[0].cells[0]).slice(0,60):'')+'" title="点击跳转原文">'+aiEsc((e.oldRows||[]).map(function(r){return '| '+((r.cells||[]).join(' | '))+' |';}).join('\n'))+'</pre></div><div class="ai-diff-new"><b>改</b><pre>'+aiEsc((e.newRows||[]).map(function(r){return '| '+((r.cells||[]).join(' | '))+' |';}).join('\n'))+'</pre></div>';
              else if(e.kind==='items')html2+='<div class="ai-diff-old"><b>原</b><pre>'+aiEsc((e.oldItems||[]).map(function(i){return i?((i.name!=null)?(i.name+' '+(i.desc||'')):(i.role?('作为'+i.role+'我希望'+(i.want||'')+'以便'+(i.soThat||'')):(i.text||''))):'';}).join('\n')||'（空）')+'</pre></div><div class="ai-diff-new"><b>改</b><pre>'+aiEsc((e.newItems||[]).map(function(i){return i?((i.name!=null)?(i.name+' '+(i.desc||'')):(i.role?('作为'+i.role+'我希望'+(i.want||'')+'以便'+(i.soThat||'')):(i.text||''))):'';}).join('\n'))+'</pre></div>';
            });
          }
          return html2+'</div>';
        }).join(''):'<div class="muted">（空版本）</div>')+'</div>';
      }
      html+='</div>';
    });
    html+='</div>';
  }
  if(st.ignoredAiIssues&&st.ignoredAiIssues.length){
    html+='<div class="ai-sec"><div class="ai-sec-h">已忽略 / 已订正 <span class="muted">'+st.ignoredAiIssues.length+'</span></div>';
    st.ignoredAiIssues.forEach(function(x){
      html+='<div class="ai-ign"><span>'+(x.corrected?'已订正':'已忽略')+'</span><button class="btn btn--sm btn--ghost" data-ai="unignore" data-key="'+aiEsc(x.key)+'">恢复</button></div>';
    });
    html+='</div>';
  }
  if(aiStatusLog.length){
    html+='<div class="ai-sec"><div class="ai-sec-h">过程记录</div>'+aiStatusLog.map(function(l){return '<div class="ai-log">'+aiEsc(l)+'</div>';}).join('')+'</div>';
  }
  body.innerHTML=html;
}

/* ---------- UI 状态 ---------- */
var aiUi={open:false,dimOpen:{},modifyOpen:{},verOpen:{}};
var aiChatState={messages:[],busy:false};
function aiTogglePanel(){
  aiUi.open=!aiUi.open;
  var p=document.getElementById('aiPanel');
  if(p){p.classList.toggle('open',aiUi.open);if(!aiUi.open)p.style.transform='';}
  aiUpdateButtonVisibility();
  if(aiUi.open)aiRenderPanel();
}
function aiClosePanel(){aiUi.open=false;var p=document.getElementById('aiPanel');if(p){p.classList.remove('open');p.style.transform='';}aiUpdateButtonVisibility();}
function aiUpdateButtonVisibility(){
  var sb=document.getElementById('aiSidebarBtn');
  if(sb)sb.style.display=aiUi.open?'none':'';
  // 侧栏「AI 助手」按钮：待确认草稿/修改数红色徽章（面板收起时也能看到有待确认内容）
  try{
    var st=aiState();
    var cnt=st&&st.pendingDiffs&&st.pendingDiffs.items?st.pendingDiffs.items.filter(function(x){return x.status==='pending'||x.status==='deferred';}).length:0;
    var bd=document.getElementById('aiPendingBadge');
    if(bd){if(cnt>0){bd.style.display='inline-block';bd.textContent=cnt;}else{bd.style.display='none';}}
  }catch(e){}
  // 浮动对话按钮常驻可见（聊天已仅保留在右下角浮动面板）
}

/* ---------- 注入 ---------- */
function aiInjectStyle(){
  if(document.getElementById('aiStyle'))return;
  var st=document.createElement('style');st.id='aiStyle';
  st.textContent='#aiPanel{position:fixed;top:0;right:0;bottom:0;width:390px;max-width:94vw;z-index:58;background:var(--bg,#faf9f7);border-left:1px solid var(--line,#e4e1da);display:flex;flex-direction:column;transform:translateX(105%);transition:transform .25s ease;box-shadow:-10px 0 28px rgba(0,0,0,.14)}'
    +'#aiPanel.open{transform:translateX(0)}'
    +'.ai-head{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid var(--line,#e4e1da);font-family:var(--serif,Georgia,serif);font-size:16px;font-weight:600}'
    +'.ai-close{border:0;background:transparent;color:var(--ink-2,#777);font-size:16px;cursor:pointer;padding:4px 8px}'
    +'.ai-body{flex:1;overflow:auto;padding:12px 14px;display:flex;flex-direction:column;gap:12px}'
    +'.ai-tools{display:flex;gap:8px;align-items:center;flex-wrap:wrap}'
    +'.ai-tools .ai-btn{flex:1 1 auto;text-align:center;white-space:nowrap}'
    +'.ai-btn{border:1px solid var(--line,#d8d5ce);background:var(--sidebar-bg,#f0eee9);color:var(--ink,#26241f);border-radius:8px;padding:6px 12px;font-size:13px;cursor:pointer}'
    +'.ai-head{background:linear-gradient(135deg,rgba(27,79,214,.09),transparent 65%)}'
    +'.ai-body::-webkit-scrollbar{width:8px}.ai-body::-webkit-scrollbar-thumb{background:var(--line-2,#d8d5ce);border-radius:4px}.ai-body::-webkit-scrollbar-track{background:transparent}'
    +'.ai-btn.primary{background:var(--brand,#1b4fd6);border-color:var(--brand,#1b4fd6);color:#fff}'
    +'.ai-btn.danger{background:rgba(214,69,69,.1);border-color:var(--red,#d64545);color:var(--red,#d64545)}'
    +'.ai-stop-row{display:flex;align-items:center;gap:8px}'
    +'.ai-engine{margin-left:auto;font-size:12px}'
    +'.ai-status{background:var(--brand-soft,rgba(27,79,214,.12));border:1px solid var(--brand-line,rgba(27,79,214,.28));color:var(--ink,#26241f);border-radius:8px;padding:8px 10px;font-size:12.5px}'
    +'.ai-sec{border:1px solid var(--line,#e4e1da);border-radius:10px;padding:10px;background:var(--sidebar-bg,rgba(0,0,0,.02))}'
    +'.ai-sec.warn{border-color:var(--yellow,#d9a514)}'
    +'.ai-sec-h{font-weight:600;font-size:13px;margin-bottom:8px;display:flex;justify-content:space-between;gap:6px;flex-wrap:wrap}'
    +'.ai-total{font-size:15px;margin:4px 0} .ai-total b{font-size:26px} .ai-total small{color:var(--ink-2,#888)}'
    +'.ai-sum{margin:6px 0;font-size:12.5px;color:var(--ink-2,#666)}'
    +'.ai-dim{margin:8px 0;cursor:pointer}'
    +'.ai-dim-top{display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:3px}'
    +'.ai-dim-score{font-weight:700}'
    +'.ai-bar{height:6px;background:var(--line-2,#f0eee9);border-radius:4px;overflow:hidden}'
    +'.ai-bar i{display:block;height:100%;background:var(--brand,#1b4fd6);border-radius:4px}'
    +'.ai-iss{margin-top:8px;display:flex;flex-direction:column;gap:8px}'
    +'.ai-iss-item{border:1px solid var(--line,#e4e1da);border-radius:8px;padding:8px;background:var(--bg,#fff)}'
    +'.ai-iss-item.ignored{opacity:.55}'
    +'.ai-iss-top{display:flex;gap:6px;align-items:center;font-size:12px}'
    +'.ai-iss-reason{font-size:12.5px;margin:5px 0}'
    +'.ai-iss-warn{font-size:11.5px;color:var(--red,#d64545);background:rgba(214,69,69,.08);border-radius:5px;padding:3px 6px;margin:3px 0}'
    +'.ai-iss-quote{font-size:11.5px;color:var(--ink-2,#666);background:var(--line-2,rgba(0,0,0,.04));border-radius:5px;padding:4px 6px;margin:3px 0;word-break:break-all}'
    +'.ai-dim-note{font-size:11.5px;color:var(--ink-2,#666);margin:5px 0}'
    +'.ai-iss-adv{font-size:12px;color:var(--ink-2,#666)}'
    +'.ai-iss-act{display:flex;gap:6px;margin-top:6px}'
    +'.ai-iss-act button{border:1px solid var(--line,#d8d5ce);background:transparent;border-radius:6px;padding:2px 8px;font-size:12px;cursor:pointer;color:var(--ink,#26241f)}'
    +'.ai-diff-all{margin-bottom:8px}'
    +'.ai-diff{border:1px solid var(--line,#e4e1da);border-radius:8px;padding:8px;margin-bottom:8px;background:var(--bg,#fff)}'
    +'.ai-diff.accepted{border-color:var(--green,#2f9e44);opacity:.75}'
    +'.ai-diff.rejected{border-color:var(--red,#d64545);opacity:.6}'
    +'.ai-diff-h{display:flex;justify-content:space-between;gap:6px;font-size:12.5px;margin-bottom:6px}'
    +'.ai-diff-old,.ai-diff-new{margin:4px 0}'
    +'.ai-diff-old pre,.ai-diff-new pre,.ai-ver-diff pre{white-space:pre-wrap;word-break:break-all;margin:2px 0;font-size:11.5px;background:var(--line-2,rgba(0,0,0,.04));border-radius:6px;padding:5px;max-height:110px;overflow:auto}'
    +'.ai-diff-sug{font-size:12.5px;background:var(--brand-soft,rgba(27,79,214,.1));border-radius:6px;padding:6px}'
    +'.ai-diff-act{display:flex;gap:6px;margin-top:6px;flex-wrap:wrap}'
    +'.ai-diff-act button{border:1px solid var(--line,#d8d5ce);background:transparent;border-radius:6px;padding:3px 10px;font-size:12px;cursor:pointer;color:var(--ink-2,#666)}'
    +'.ai-diff-act button.btn--accept,.ai-diff-act button.btn--primary{background:var(--green,#2fa84f);border-color:var(--green,#2fa84f);color:#fff}'
    +'.ai-diff-act button.btn--reject{background:var(--red,#d64545);border-color:var(--red,#d64545);color:#fff}'
    +'.ai-review{font-size:12px;background:var(--brand-soft,rgba(27,79,214,.1));border-radius:6px;padding:6px 8px;margin-bottom:6px}'
    +'.ai-engine-delta{font-size:11.5px;color:var(--ink-2,#666);margin-bottom:6px}'
    +'.ai-vbadge{font-size:11px;border-radius:5px;padding:2px 6px;margin-left:4px}'
    +'.ai-vbadge.ok{background:rgba(47,158,68,.12);color:var(--green,#2f9e44)}'
    +'.ai-vbadge.bad{background:rgba(214,69,69,.12);color:var(--red,#d64545)}'
    +'.ai-vwarn{font-size:11.5px;color:var(--yellow,#b8860b);margin:4px 0}'
    +'.ai-vblock{font-size:11.5px;color:var(--red,#d64545);background:rgba(214,69,69,.08);border-radius:5px;padding:4px 6px;margin:4px 0}'
    +'.ai-block{border-top:1px dashed var(--line,#e4e1da);margin-top:6px;padding-top:6px}'
    +'.ai-block:first-of-type{border-top:0;margin-top:0;padding-top:0}'
    +'.ai-hint{font-size:12px;background:rgba(217,165,20,.12);border:1px solid rgba(217,165,20,.35);color:var(--ink,#26241f);border-radius:8px;padding:7px 9px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}'
    +'.ai-hint button{border:1px solid var(--yellow,#d9a514);background:transparent;border-radius:6px;padding:2px 10px;font-size:12px;cursor:pointer;margin-left:auto}'
    +'.ai-sec.align{border-color:rgba(27,79,214,.35)}'
    +'.ai-align-item{border:1px solid var(--line,#e4e1da);border-radius:8px;padding:8px;margin-bottom:8px;background:var(--bg,#fff)}'
    +'.ai-align-item.accepted{border-color:var(--green,#2f9e44);opacity:.75}'
    +'.ai-align-item.rejected{border-color:var(--red,#d64545);opacity:.6}'
    +'.ai-align-h{display:flex;justify-content:space-between;gap:6px;font-size:12.5px;margin-bottom:6px;align-items:center;flex-wrap:wrap}'
    +'.ai-align-pre{margin:4px 0}'
    +'.ai-align-pre pre{white-space:pre-wrap;word-break:break-all;margin:2px 0;font-size:11.5px;background:var(--line-2,rgba(0,0,0,.04));border-radius:6px;padding:5px;max-height:90px;overflow:auto}'
    +'.ai-align-sug{font-size:12.5px;background:var(--brand-soft,rgba(27,79,214,.1));border-radius:6px;padding:6px}'
    +'.ai-align-where{font-size:11.5px;margin:2px 0}'
    +'.ai-dbg{white-space:pre-wrap;word-break:break-all;font-size:10.5px;background:var(--line-2,rgba(0,0,0,.05));border-radius:6px;padding:6px;max-height:180px;overflow:auto;margin:0}'
    +'.ai-jump{cursor:pointer}'
    +'.ai-jump:hover{outline:1px dashed var(--brand,#1b4fd6);outline-offset:-1px}'
    +'.ai-flash{outline:3px solid var(--brand,#1b4fd6)!important;outline-offset:2px;border-radius:4px;transition:outline-color .3s}'
    +'.ai-ver{border:1px solid var(--line,#e4e1da);border-radius:8px;padding:7px;margin-bottom:7px;background:var(--bg,#fff)}'
    +'.ai-ver-top{display:flex;align-items:center;gap:7px;font-size:12.5px;flex-wrap:wrap}'
    +'.ai-ver-lbl{font-weight:600}'
    +'.ai-ver-ops{margin-left:auto;display:flex;gap:5px}'
    +'.ai-ver-ops button,.ai-ign button{border:1px solid var(--line,#d8d5ce);background:transparent;border-radius:6px;padding:2px 7px;font-size:11.5px;cursor:pointer}'
    +'.ai-ver-diff{margin-top:6px}'
    +'.ai-vd{margin-bottom:6px}'
    +'.ai-ign{display:flex;justify-content:space-between;align-items:center;font-size:12px;padding:4px 0;border-bottom:1px dashed var(--line,#e4e1da)}'
    +'.ai-log{font-size:11.5px;color:var(--ink-2,#777);padding:2px 0}'
    +'.ai-dim-row{display:flex;align-items:center;gap:8px;font-size:13px;padding:3px 0}'
    +'.ai-dim-grid{border:1px solid var(--line,#e4e1da);border-radius:8px;padding:8px;margin:8px 0}'
    +'.ai-dim-grid-t{display:flex;justify-content:space-between;font-size:12px;color:var(--ink-2,#888);margin-bottom:4px}'
    +'@media(max-width:760px){#aiPanel{width:94vw}}'
    +'#aiChatFooter{flex-shrink:0;border-top:1px solid var(--line,#e4e1da);padding:10px 14px;display:flex;flex-direction:column;gap:8px;background:var(--sidebar-bg,#f0eee9)}'
    +'.ai-chat-h{font-size:11.5px;margin-bottom:2px}'
    +'.ai-chat-log{display:flex;flex-direction:column;gap:8px;max-height:180px;overflow:auto;font-size:12.5px;padding-right:2px}'
    +'.ai-msg{max-width:100%}'
    +'.ai-msg.user{text-align:right}'
    +'.ai-msg.user .ai-msg-b{display:inline-block;text-align:left;background:var(--brand,#1b4fd6);color:#fff;border-radius:10px;padding:7px 10px;max-width:88%;white-space:pre-wrap;word-break:break-word}'
    +'.ai-msg.bot .ai-msg-b{display:inline-block;background:var(--bg,#fff);border:1px solid var(--line,#e4e1da);border-radius:10px;padding:7px 10px;max-width:96%;white-space:pre-wrap;word-break:break-word}'
    +'.ai-msg.sys .ai-msg-b{display:inline-block;background:rgba(27,79,214,.1);color:var(--ink,#26241f);border-radius:8px;padding:5px 9px;max-width:96%;font-size:11.5px;white-space:pre-wrap;word-break:break-word}'
    +'.ai-act-chips{margin-top:6px;display:flex;flex-wrap:wrap;gap:5px}'
    +'.ai-act-chip{font-size:11px;background:rgba(27,79,214,.12);color:var(--brand,#1b4fd6);border-radius:6px;padding:2px 7px}'
    +'.ai-chat-input{display:flex;gap:6px;align-items:flex-end}'
    +'.ai-chat-input textarea{flex:1;resize:none;height:40px;min-height:40px;max-height:96px;font-size:12.5px;padding:8px 9px;border:1px solid var(--line,#d8d5ce);border-radius:8px;font-family:inherit;line-height:1.35}'
    +'.ai-chat-input button{padding:9px 14px;white-space:nowrap}'
    +'.ai-typing{color:var(--brand,#1b4fd6)}'
    +'.ai-float{position:fixed;right:18px;bottom:76px;width:344px;max-width:92vw;height:466px;max-height:74vh;z-index:60;background:var(--bg,#faf9f7);border:1px solid var(--line,#e4e1da);border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.18);display:flex;flex-direction:column;overflow:hidden;transform:translateY(18px) scale(.98);opacity:0;pointer-events:none;transition:transform .2s ease,opacity .2s ease}'
    +'.ai-float.open{transform:none;opacity:1;pointer-events:auto}'
    +'.ai-float-head{display:flex;justify-content:space-between;align-items:center;padding:11px 14px;border-bottom:1px solid var(--line,#e4e1da);font-weight:600;font-size:14px;background:linear-gradient(135deg,rgba(27,79,214,.09),transparent 70%)}'
    +'.ai-float .ai-chat-log{flex:1;max-height:none;padding:10px 14px}'
    +'.ai-float .ai-chat-input{padding:10px 14px;border-top:1px solid var(--line,#e4e1da)}'
    +'#aiFloatBtn{position:fixed;right:18px;bottom:18px;width:54px;height:54px;border:0;background:transparent;padding:0;cursor:pointer;z-index:61;perspective:170px;display:flex;align-items:center;justify-content:center;overflow:visible;transition:transform .25s ease;-webkit-tap-highlight-color:transparent;animation:aiFloatIn .55s cubic-bezier(.34,1.56,.64,1)}'
    +'#aiFloatBtn:hover{transform:scale(1.07)}'
    +'#aiFloatBtn:active{transform:scale(.93)}'
    +'.orb{position:relative;width:46px;height:46px;transform-style:preserve-3d}'
    +'.orb-haze{position:absolute;left:50%;top:50%;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;background:radial-gradient(circle,var(--brand) 0%,rgba(27,79,214,.18) 50%,transparent 72%);opacity:.5;animation:orbHaze 4.6s ease-in-out infinite}'
    +'.orb-core{position:absolute;left:50%;top:50%;width:15px;height:15px;margin:-7.5px 0 0 -7.5px;border-radius:50%;background:radial-gradient(circle at 36% 30%,#fff,var(--brand) 62%,transparent 80%);box-shadow:0 0 12px 4px var(--brand),0 0 30px 12px rgba(27,79,214,.3);animation:orbCore 2.4s ease-in-out infinite}'
    +'.orb-ring{position:absolute;left:50%;top:50%;width:42px;height:42px;margin:-21px 0 0 -21px;border-radius:50%;border:1px solid rgba(120,150,255,.26);transform-style:preserve-3d}'
    +'.orb-ring.r1{transform:rotateX(74deg)}'
    +'.orb-ring.r2{transform:rotateX(74deg) rotateY(58deg)}'
    +'.orb-ring.r3{transform:rotateX(74deg) rotateY(118deg)}'
    +'.orb-ring .p{position:absolute;left:50%;top:0;width:6px;height:6px;margin:-3px 0 0 -3px;border-radius:50%;background:var(--brand);box-shadow:0 0 9px 2px var(--brand);transform-origin:50% 24px;animation:orbOrbit 3.6s linear infinite}'
    +'.orb-ring.r2 .p{background:#37d0ff;box-shadow:0 0 9px 2px #37d0ff}'
    +'.orb-ring.r3 .p{background:#fff;box-shadow:0 0 9px 2px rgba(255,255,255,.85)}'
    +'#aiFloatBtn.ai-busy .orb-ring .p{animation-duration:1.5s}'
    +'#aiFloatBtn.ai-busy .orb-core{animation-duration:1.05s}'
    +'#aiFloatBtn.ai-busy .orb-haze{animation-duration:2s;opacity:.72}'
    +'.orb-planet-orbit{position:absolute;left:50%;top:50%;width:48px;height:48px;margin:-24px 0 0 -24px;transform-style:preserve-3d;transform:rotateX(74deg);opacity:0;transition:opacity .4s ease;animation:orbPlanetOrbit 9s linear infinite;pointer-events:none}'
    +'.orb-planet{position:absolute;right:0;top:50%;width:14px;height:14px;margin:-7px -7px 0 0;border-radius:50%;background:radial-gradient(circle at 36% 30%,#ffffff,#00e5ff 62%,rgba(0,0,0,.45) 100%);box-shadow:0 0 12px 4px rgba(0,229,255,.65),0 0 28px 10px rgba(0,229,255,.22),inset -2px -3px 5px rgba(0,0,0,.55);overflow:hidden}'
    +'.orb-planet::before{content:"";position:absolute;left:22%;top:18%;width:34%;height:30%;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.95),rgba(255,255,255,0) 72%);filter:blur(.4px)}'
    +'.orb-planet-face{position:absolute;inset:0;border-radius:50%;background:linear-gradient(90deg,rgba(255,255,255,.42),rgba(255,255,255,0) 40%,rgba(0,0,0,.25) 72%,rgba(255,255,255,.24));animation:orbPlanetSpin 3.2s linear infinite}'
    +'#aiFloatBtn.ai-busy .orb-planet-orbit{opacity:1;animation-duration:3.4s}'
    +'#aiFloatBtn.ai-busy .orb-planet-face{animation-duration:1.1s}'
    +'@keyframes orbOrbit{from{transform:rotate(0)}to{transform:rotate(360deg)}}'
    +'@keyframes orbCore{0%,100%{transform:scale(.82);opacity:.85}50%{transform:scale(1.28);opacity:1}}'
    +'@keyframes orbHaze{0%,100%{opacity:.36;transform:scale(.94)}50%{opacity:.62;transform:scale(1.12)}}'
    +'@keyframes orbPlanetOrbit{from{transform:rotateX(74deg) rotateZ(0)}to{transform:rotateX(74deg) rotateZ(360deg)}}'
    +'@keyframes orbPlanetSpin{from{transform:rotate(0)}to{transform:rotate(360deg)}}'
    +'@keyframes aiFloatIn{0%{transform:translateY(22px) scale(.4);opacity:0}100%{transform:translateY(0) scale(1);opacity:1}}'
    +'.ai-confirm-ov{position:fixed;inset:0;z-index:80;background:rgba(0,0,0,.42);display:flex;align-items:center;justify-content:center;padding:16px}'
    +'.ai-confirm{background:var(--bg,#fff);border:1px solid var(--red,#d64545);border-radius:12px;max-width:360px;width:100%;padding:16px;box-shadow:0 16px 48px rgba(0,0,0,.28)}'
    +'.ai-confirm-t{font-weight:700;font-size:15px;color:var(--red,#d64545);margin-bottom:8px}'
    +'.ai-confirm-d{font-size:13px;line-height:1.55;color:var(--ink,#26241f);margin-bottom:14px;white-space:pre-wrap;word-break:break-word}'
    +'.ai-confirm-act{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap}'
    +'.ai-confirm-act button{padding:7px 14px}';
  document.head.appendChild(st);
}
function aiInjectSettingsTab(){
  var tabs=document.querySelector('#settingsModal .tabs');
  if(tabs&&!document.querySelector('#settingsModal .tabs [data-tab="ai"]')){
    var b=document.createElement('button');
    b.type='button';b.dataset.tab='ai';b.dataset.act='settab';b.className='top-icon-btn ai-btn-icon';b.innerHTML='<svg class="ic-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="7.5" cy="12" r="3" fill="currentColor" stroke="none"/><circle cx="16.5" cy="12" r="3" fill="none"/></svg><span>AI</span>';
    tabs.appendChild(b);
  }
  var prefs=document.getElementById('tabPrefs');
  if(prefs&&!document.getElementById('tabAI')){
    var d=document.createElement('div');
    d.id='tabAI';d.style.display='none';
    prefs.parentNode.appendChild(d);
  }
  var orig=window.setSettingsTab;
  window.setSettingsTab=function(tab){
    document.querySelectorAll('#settingsModal .tabs button').forEach(function(x){x.classList.toggle('active',x.dataset.tab===tab);});
    if(tab==='rules'||tab==='ai'){
      var map={rules:'tabRules',ai:'tabAI'};
      Object.keys(map).forEach(function(k){var el=document.getElementById(map[k]);if(el)el.style.display=(k===tab)?'block':'none';});
      if(tab==='ai')aiRenderTab();
    }
  };
}
function aiInjectButtons(){
  // v18.4：顶部栏 AI 按钮与左侧栏「AI 助手」重复，移除顶部栏 btnAi，仅保留左侧栏入口
  var sb=document.getElementById('sidebar');
  if(sb&&!document.getElementById('aiSidebarBtn')){
    var pb=sb.querySelector('.proj-bar');
    var ab=document.createElement('button');
    ab.id='aiSidebarBtn';ab.type='button';ab.className='pp-toggle';ab.style.marginTop='8px';ab.title='AI 助手';
    ab.innerHTML='<span class="ic"><svg class="ic-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l1.9 5.3L19 10l-5.1 1.7L12 17l-1.9-5.3L5 10l5.1-1.7L12 3Z"/></svg></span><span class="pt-name">AI 助手</span><span class="ai-badge" id="aiPendingBadge" style="display:none"></span><span class="chev">›</span>';
    ab.addEventListener('click',function(e){e.stopPropagation();aiTogglePanel();});
    if(pb&&pb.nextSibling)pb.parentNode.insertBefore(ab,pb.nextSibling);
    else sb.appendChild(ab);
  }
}
function aiInjectPanel(){
  if(document.getElementById('aiPanel'))return;
  var p=document.createElement('aside');
  p.id='aiPanel';
  p.setAttribute('aria-label','AI 助手');
  p.innerHTML='<div class="ai-head"><span>AI 助手</span><button type="button" class="ai-close" data-ai="close" title="关闭"><svg class="ic-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>'
    +'<div class="ai-body" id="aiBody"></div>';
  document.body.appendChild(p);
  var m=document.createElement('div');
  m.className='modal';m.id='aiOptModal';
  m.innerHTML='<div class="box"><div class="m-head"><h3>一键优化</h3><button class="x" data-ai="optclose">×</button></div><div class="m-body">'
    +'<div class="muted" style="margin-bottom:10px">选择优化范围。AI 将先体检，再给出逐条修改建议；你确认后才写入正文，分数回退自动保留最好版本。</div>'
    +'<div class="field"><label><input type="radio" name="aiScope" value="full" checked> 全文优化</label></div>'
    +'<div class="field"><label><input type="radio" name="aiScope" value="section"> 按节优化</label>'
    +'<select id="aiOptSec" style="margin-top:6px"></select></div>'
    +'</div><div class="m-foot"><button data-ai="optclose">取消</button><button class="btn btn--primary" data-ai="optstart">开始优化</button></div></div>';
  document.body.appendChild(m);
  var gm=document.createElement('div');
  gm.className='modal';gm.id='aiGenModal';
  gm.innerHTML='<div class="box" role="dialog" aria-modal="true" aria-labelledby="aiGenTitle"><div class="m-head"><h3 id="aiGenTitle">AI 撰写 · 直接生成 PRD</h3><button class="x" data-ai="genclose" aria-label="关闭">×</button></div><div class="m-body">'
    +'<div class="muted" style="margin-bottom:10px">已有明确方案？直接填写产品或功能描述，AI 新建项目并按框架逐节撰写草稿；每节内容逐条确认后才写入正文，版本可回滚。</div>'
    +'<div class="field"><label>项目名称</label><input id="aiGenName" placeholder="例如：轻量团队协作工具"></div>'
    +'<div class="field"><label>产品/功能描述（至少 10 个字）</label><textarea id="aiGenDesc" rows="6" style="width:100%;box-sizing:border-box" placeholder="例如：为协作工具新增实时协同编辑能力，支持多人同时编辑看板与任务；目标指标：协同延迟≤500ms、可用性≥99.9%、离线可编辑…"></textarea></div>'
    +'<div class="field"><label>框架</label><select id="aiGenFw"></select></div>'
    +'<div class="field"><label>模板风格（约束生成内容的取舍）</label><select id="aiGenStyle">'
    +'<option value="">不约束</option><option value="standard">标准 PRD</option><option value="agile">精简敏捷 PRD</option><option value="hardware">通用硬件 / 物联网</option>'
    +'</select></div>'
    +'<div id="aiGenStatus" class="muted" style="margin-top:4px"></div>'
    +'</div><div class="m-foot"><button class="btn btn--ghost" data-ai="genclose">取消</button><button class="btn btn--primary" data-ai="genstart">开始生成</button></div></div>';
  document.body.appendChild(gm);
  var dm=document.createElement('div');
  dm.className='modal';dm.id='aiDesignModal';
  dm.innerHTML='<div class="box" role="dialog" aria-modal="true" aria-labelledby="aiDesTitle" style="width:560px;max-width:94vw"><div class="m-head"><h3 id="aiDesTitle">AI 需求澄清 · 从一句想法开始</h3><button class="x" data-ai="desclose" aria-label="关闭">×</button></div>'
    +'<div class="m-body" style="display:flex;flex-direction:column;gap:10px;max-height:58vh;overflow:hidden">'
    +'<div class="muted" style="font-size:12px">不需要懂 PRD、指标或技术术语。先说说你想做什么；AI 会把它整理成方案，并把不确定的内容标为建议供你确认。</div>'
    +'<div id="aiDesState" aria-live="polite" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;font-size:11.5px"></div>'
    +'<div class="ai-chat-log" id="aiDesLog" style="flex:1;max-height:none;overflow:auto;border:1px solid var(--line,#e4e1da);border-radius:10px;padding:10px 12px;min-height:180px"></div>'
    +'<div class="ai-chat-input"><textarea id="aiDesInput" rows="2" placeholder="例如：我想做一个帮我记录健身的简单网页（Enter 发送）"></textarea><button class="btn btn--ghost" data-ai="desstop" id="aiDesStop" style="display:none">■ 停止</button><button class="btn btn--primary" data-ai="dessend" id="aiDesSendBtn">开始梳理</button></div><div class="row-act" style="margin:0"><button class="btn btn--ghost btn--sm" data-ai="desadvise">我不确定，让 AI 建议</button><span class="muted" style="font-size:11.5px">每次只需回答一个问题</span></div>'
    +'</div>'
    +'<div class="m-foot" style="justify-content:space-between"><button class="btn btn--ghost" data-ai="desclose">取消</button><button class="btn btn--ghost" data-ai="desskip" id="aiDesSkip" title="不想继续回答了？可先查看并确认当前方案">跳过引导，查看方案</button><button class="btn btn--primary" data-ai="desfinish" id="aiDesFinish" style="display:none">查看并确认方案</button></div></div>';
  document.body.appendChild(dm);
  var sm=document.createElement('div');
  sm.className='modal';sm.id='aiDesSkeletonModal';
  sm.innerHTML='<div class="box" role="dialog" aria-modal="true" aria-labelledby="aiDesSkelTitle" style="width:640px;max-width:94vw"><div class="m-head"><h3 id="aiDesSkelTitle">确认产品方案</h3><button class="x" data-ai="desskelclose" aria-label="关闭">×</button></div><div class="m-body" style="display:flex;flex-direction:column;gap:10px"><div class="muted">这是将交给 Coding Agent 的可读方案。请直接修改不准确的地方；标为“AI 建议（待确认）”的内容不会被当成已确认事实。</div><textarea id="aiDesSkeletonEditor" rows="16" style="width:100%;box-sizing:border-box;resize:vertical" aria-label="可编辑产品方案"></textarea><div id="aiDesSkeletonHint" class="muted" style="font-size:12px"></div></div><div class="m-foot" style="justify-content:space-between"><button class="btn btn--ghost" data-ai="desskelback">继续澄清</button><button class="btn btn--primary" data-ai="desskelconfirm">确认方案并生成 PRD</button></div></div>';
  document.body.appendChild(sm);
  var desInp=dm.querySelector('#aiDesInput');
  if(desInp)desInp.addEventListener('keydown',function(ev){if(ev.key==='Enter'&&!ev.shiftKey){ev.preventDefault();aiDesSend();}});
  var fp=document.createElement('div');
  fp.id='aiFloatPanel';fp.className='ai-float';
  fp.innerHTML='<div class="ai-float-head"><span>产品助手</span><button type="button" id="aiFloatClose" class="ai-close" title="关闭"><svg class="ic-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div><div id="aiFloatLog" class="ai-chat-log"></div><div class="ai-chat-input"><textarea id="aiFloatInput" rows="2" placeholder="问产品助手（Shift+Enter 换行，Enter 发送）"></textarea><button id="aiFloatSend" class="btn btn--primary">发送</button></div>';
  if(!document.getElementById('aiFloatPanel'))document.body.appendChild(fp);
  var fb=document.createElement('button');
  fb.id='aiFloatBtn';fb.type='button';fb.title='产品助手对话（可见即可做）';fb.setAttribute('aria-label','产品助手对话（点击打开）');fb.innerHTML='<span class="orb" aria-hidden="true"><span class="orb-haze"></span><span class="orb-ring r1"><i class="p"></i></span><span class="orb-ring r2"><i class="p"></i></span><span class="orb-ring r3"><i class="p"></i></span><span class="orb-core"></span><span class="orb-planet-orbit"><span class="orb-planet"><span class="orb-planet-face"></span></span></span></span>';
  fb.addEventListener('click',function(){aiToggleFloat();});
  if(!document.getElementById('aiFloatBtn'))document.body.appendChild(fb);
}
/* P1-②A AI 产品设计引导：只有想法 → 一步步引导成型 → 生成 PRD（与「创建新需求」直接填写的实现逻辑不同） */
var aiDesState={step:0,sub:0,qa:[],busy:false,name:'',summary:'',understood:'',needs:[],assumptions:[],conflicts:[]};
var AI_DES_Q=['先用一句话说说：你想做一个什么东西，或者希望它帮你完成什么？','谁最可能会用它？他们现在通常怎么解决这件事？','第一版最想让它帮用户完成哪一两件事？','如果它真的有用，你希望用户最后得到什么结果？不确定也可以让 AI 建议。','有没有绝对不能发生的情况，或你已经知道的限制（例如只能自己用、要手机能用、时间很赶）？'];
var AI_DES_TOPICS=['你想做什么','谁会用、现在怎么做','第一版先完成什么','希望得到什么结果','限制、风险与例外情况'];
function aiDesNewState(){return {step:0,sub:0,qa:[],busy:false,name:'',summary:'',understood:'',needs:[AI_DES_TOPICS[0]],assumptions:[],conflicts:[]};}
function aiDesPlain(txt){return String(txt||'').replace(/【[^】]{1,16}】/g,'').replace(/^项目名[:：].*$/m,'').trim();}
function aiDesMarker(txt,name){var m=String(txt||'').match(new RegExp('【'+name+'】\\s*([\\s\\S]*?)(?=【|$)'));return m?m[1].trim():'';}
function aiDesConflictHints(){
  var all=aiDesState.qa.join(' '),out=[];
  if(/(?:只|仅).{0,4}(?:自己|个人)|仅供个人/.test(all)&&/(?:多人|团队|协作|同事)/.test(all))out.push('“仅自己使用”和“多人/团队协作”需要二选一或说明范围');
  if(/(?:无需|不需要|不)登录/.test(all)&&/(?:账号|登录|注册|成员)/.test(all))out.push('“无需登录”和“账号/成员”需要说明是否存在例外');
  if(/离线/.test(all)&&/(?:必须|仅).{0,4}联网|在线才/.test(all))out.push('“离线可用”和“必须联网”需要说明各自适用的操作');
  return out;
}
function aiDesRenderState(){
  var el=document.getElementById('aiDesState');if(!el)return;
  var understood=aiDesState.understood||('已收到 '+aiDesState.qa.length+' 条你的描述');
  var fallback=AI_DES_TOPICS.slice(Math.min(aiDesState.qa.length,AI_DES_TOPICS.length),Math.min(aiDesState.qa.length+2,AI_DES_TOPICS.length));
  var needs=(aiDesState.conflicts.length?aiDesState.conflicts:aiDesState.needs.length?aiDesState.needs:fallback).slice(0,2);
  var assumptions=aiDesState.assumptions.slice(-2);
  var cell=function(title,text,color){return '<div style="padding:7px 8px;border:1px solid var(--line,#e4e1da);border-radius:8px;background:var(--panel,#fff);min-width:0"><strong style="display:block;color:'+color+';font-size:11px;margin-bottom:2px">'+title+'</strong><span style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="'+aiEsc(text||'暂无')+'">'+aiEsc(text||'暂无')+'</span></div>';};
  el.innerHTML=cell('我已理解',understood,'var(--color-success-text,#2e6f4e)')+cell('还需要确认',needs.join('；')||'AI 正在判断下一步','var(--color-warning-text,#8a5b13)')+cell('AI 暂定假设',assumptions.join('；')||'没有；不知道时可让 AI 建议','var(--ink-2,#667)');
}
function aiDesAbsorbResponse(txt){
  var understood=aiDesMarker(txt,'我已理解');if(understood)aiDesState.understood=aiDesPlain(understood).slice(0,120);
  var needs=aiDesMarker(txt,'还需确认');if(needs)aiDesState.needs=needs.split(/[；;\n]/).map(function(x){return aiDesPlain(x).replace(/^[-•]\s*/,'').trim();}).filter(Boolean).slice(0,3);
  var assume=aiDesMarker(txt,'AI假设');if(assume){assume.split(/[；;\n]/).map(function(x){return aiDesPlain(x).replace(/^[-•]\s*/,'').trim();}).filter(Boolean).forEach(function(x){if(aiDesState.assumptions.indexOf(x)<0)aiDesState.assumptions.push(x);});}
  aiDesState.conflicts=aiDesConflictHints();aiDesRenderState();
}
function aiDesLogAdd(role,txt){
  var log=document.getElementById('aiDesLog');if(!log)return;
  var d=document.createElement('div');d.className='ai-msg '+role;
  d.innerHTML='<span class="ai-msg-b">'+aiEsc(String(txt))+'</span>';
  log.appendChild(d);log.scrollTop=log.scrollHeight;
}
var aiDesStreamEl=null;
function aiDesSend(forceEnd){
  forceEnd=!!forceEnd;
  if(aiDesState.busy){aiToast('AI 正在思考，稍等片刻');return;}
  var inp=document.getElementById('aiDesInput');var txt=(inp&&inp.value||'').trim();
  if(!txt){aiToast('先回答当前问题吧');return;}
  if(inp)inp.value='';
  aiDesLogAdd('user',txt);
  aiDesState.qa.push(txt);
  if(/不确定|不知道|没想好|随便|都可以/.test(txt))aiDesState.assumptions.push((AI_DES_TOPICS[Math.min(aiDesState.step,AI_DES_TOPICS.length-1)]||'当前问题')+'：AI 建议（待确认）');
  aiDesState.conflicts=aiDesConflictHints();aiDesRenderState();
  aiDesState.busy=true;
  aiDesStreamEl=null;
  var st=aiGetSettings();
  if(!String(st.apiKey||'').trim()||!String(st.baseUrl||'').trim()){aiDesLogAdd('sys','请先在 设置→高级→AI 设置 中配置 API Key 与地址。');aiDesState.busy=false;return;}
  var collected='';
  aiDesState.qa.forEach(function(q,i){collected+='Q'+(i+1)+'：'+String(q).slice(0,160)+'\n';});
  var cur=Math.min(aiDesState.step,AI_DES_Q.length-1);
  var conflicts=aiDesConflictHints();
  var sys='你是面向 Vibe Coding 小白的需求澄清助手，正在把一句想法整理成可确认的产品方案。\n已收集回答：\n'+collected+'\n规则：①先判断当前最大的缺口，优先澄清谁会用/现在怎么做、想完成什么、第一版最小范围、不能接受什么；只有会改变方案时才问权限、数据或技术限制。②不要按固定题序；候选问题「'+AI_DES_Q[cur]+'」仅在它仍是最大缺口时才使用。③不用 PRD、指标、优先级等术语。④本轮只问 1 个最容易回答的问题，可给生活化例子。⑤用户说“不知道”时给 2 个简单选项，或标记“AI 建议（待确认）”，不要强迫填写指标。⑥若发现前后矛盾，必须先澄清矛盾，不能直接汇总。当前规则检测到的可能矛盾：'+(conflicts.join('；')||'无')+'。⑦每次输出都先给三个短标记：\n【我已理解】一句话复述\n【还需确认】最多 2 个未确认点\n【AI假设】没有则写“无”；所有推导都必须写“AI 建议（待确认）”。\n然后：信息足够时输出【汇总】及小白可读方案（要做什么、给谁用、怎样完成、第一版做/不做、成功结果、风险/待确认项），第一行补「项目名：<8字以内名字>」；否则输出【进入下一题】再提出唯一一个最关键的问题。';
  aiDesState.abort=new AbortController();
  aiGlobalAbort=aiDesState.abort;
  var stopBtn=document.getElementById('aiDesStop');if(stopBtn)stopBtn.style.display='';
  var aiDesReasoning='',aiDesOut='';
  // 请求一发出就给出真实状态反馈；不能等正文首个 token 到达才创建思考区。
  aiDesLogAdd('bot','');
  aiDesStreamEl=document.querySelector('#aiDesLog .ai-msg.bot:last-child .ai-msg-b');
  if(aiDesStreamEl)aiDesStreamEl.innerHTML='<details class="ai-think" open><summary><span class="ai-think-h-t"><span class="ai-think-dot"></span>深度思考已启动</span><span class="ai-think-cnt">准备中</span><span class="ai-think-caret">▾</span></summary><div class="ai-think-body">已收到你的描述，正在理解你的想法，并找出最需要确认的一件事…</div></details>';
  Promise.resolve().then(function(){
    if(aiCancelFlag)throw {kind:'canceled',message:'已停止'};
    return aiChat([{role:'system',content:sys},{role:'user',content:forceEnd?'全部回答如下：\n'+collected:'（我的回答如上，请继续引导）'}],{stream:true,temperature:0.5,onDelta:function(c){
    aiDesOut=c;
    if(aiDesStreamEl)aiDesStreamEl.innerHTML=(aiDesReasoning?'<details class="ai-think" open><summary><span class="ai-think-h-t"><span class="ai-think-dot"></span>深度思考</span><span class="ai-think-cnt">'+aiDesReasoning.length+' 字</span><span class="ai-think-caret">▾</span></summary><div class="ai-think-body">'+aiEsc(aiDesReasoning)+'</div></details>':'')+'<div class="ai-des-out">'+aiEsc(aiDesOut)+'</div>';aiScrollThinkBody();
  },onReasoning:function(r){
    aiDesReasoning+=r;
    if(aiDesStreamEl)aiDesStreamEl.innerHTML=(aiDesReasoning?'<details class="ai-think" open><summary><span class="ai-think-h-t"><span class="ai-think-dot"></span>深度思考</span><span class="ai-think-cnt">'+aiDesReasoning.length+' 字</span><span class="ai-think-caret">▾</span></summary><div class="ai-think-body">'+aiEsc(aiDesReasoning)+'</div></details>':'')+'<div class="ai-des-out">'+aiEsc(aiDesOut)+'</div>';aiScrollThinkBody();
    }});
  }).then(function(text){
    aiDesState.busy=false;aiGlobalAbort=null;aiDesState.abort=null;aiCancelFlag=false;
    if(stopBtn)stopBtn.style.display='none';
    var t=String(text||'').trim();
    if(aiDesStreamEl){aiDesStreamEl.innerHTML=(aiDesReasoning?'<details class="ai-think"><summary><span class="ai-think-h-t"><span class="ai-think-ic">'+ICONS.brain+'</span>深度思考</span><span class="ai-think-cnt">'+aiDesReasoning.length+' 字</span><span class="ai-think-caret">▾</span></summary><div class="ai-think-body">'+aiEsc(aiDesReasoning)+'</div></details>':'')+'<div class="ai-des-out">'+aiEsc(t||'（AI 没有回应，请再试一次）')+'</div>';}
    else{aiDesLogAdd('bot',t||'（AI 没有回应，请再试一次）');}
    aiDesStreamEl=null;
    var finish=function(){
      var fin=document.getElementById('aiDesFinish');if(fin)fin.style.display='inline-block';
      var hint=document.getElementById('aiDesInput');if(hint)hint.placeholder='点击下方「据此生成 PRD」继续';
      var sb=document.getElementById('aiDesSendBtn');if(sb)sb.style.display='none';
    };
    aiDesAbsorbResponse(t);
    if(t.indexOf('【汇总】')>=0){
      aiDesState.summary=t.replace(/【汇总】/g,'').trim();
      aiDesState.name=(t.match(/项目名[:：]\s*(.{1,16})/)||[])[1]||'AI 产品设计';
      finish();
    }else if(t.indexOf('【进入下一题】')>=0){
      aiDesState.step++;aiDesState.sub=0;
    }else{
      aiDesState.sub++;
      if(aiDesState.sub>=3){aiDesState.step++;aiDesState.sub=0;}
    }
  }).catch(function(e){
    aiDesState.busy=false;aiGlobalAbort=null;aiDesState.abort=null;aiCancelFlag=false;
    if(stopBtn)stopBtn.style.display='none';
    aiDesStreamEl=null;
    if(e&&(e.kind==='canceled'||e.name==='AbortError')){
      aiDesLogAdd('sys','已停止本轮引导。你可以基于已收集的回答查看并确认方案。');
      var fin=document.getElementById('aiDesFinish');if(fin)fin.style.display='inline-block';
      var hint=document.getElementById('aiDesInput');if(hint)hint.placeholder='点击「据此生成 PRD」直接生成';
      var sb=document.getElementById('aiDesSendBtn');if(sb)sb.style.display='none';
    }else{
      aiDesLogAdd('sys','请求失败：'+(e&&e.message||e));
    }
  });
}
function aiDesignOpen(){
  aiDesState=aiDesNewState();
  var log=document.getElementById('aiDesLog');if(log)log.innerHTML='';
  var fin=document.getElementById('aiDesFinish');if(fin)fin.style.display='none';
  var inp=document.getElementById('aiDesInput');if(inp){inp.value='';inp.placeholder='例如：我想做一个帮我记录健身的简单网页（Enter 发送）';}
  var sb=document.getElementById('aiDesSendBtn');if(sb)sb.style.display='';
  aiDesRenderState();
  var stp=document.getElementById('aiDesStop');if(stp)stp.style.display='none';
  var st=aiGetSettings();
  if(!String(st.apiKey||'').trim()||!String(st.baseUrl||'').trim()){
    aiDesLogAdd('sys','请先在 设置→高级→AI 设置 中配置 API Key 与地址。');
  }else{
    aiDesLogAdd('bot','你好，我是需求澄清助手。你不用会写 PRD，先告诉我一个想法就好；不确定的地方我会给建议，并标成待确认。\n\n'+AI_DES_Q[0]);
  }
  try{openModal('aiDesignModal');}catch(e){var mm=document.getElementById('aiDesignModal');if(mm)mm.classList.add('open');}
}
window.aiDesignOpen=aiDesignOpen;
function aiDesBuildSkeleton(){
  var provided=aiDesState.qa.map(function(q,i){return '- '+(i+1)+'. '+String(q).slice(0,220);}).join('\n')||'- （尚未提供）';
  var assumptions=aiDesState.assumptions.length?aiDesState.assumptions.map(function(x){return '- '+x;}).join('\n'):'- 无';
  var needs=(aiDesState.conflicts.length?aiDesState.conflicts:aiDesState.needs).map(function(x){return '- '+x;}).join('\n')||'- 请在生成前补充或接受 AI 建议';
  var summary=aiDesPlain(aiDesState.summary);
  return '# '+(aiDesState.name||'我的产品方案')+'\n\n## 要做什么\n'+(aiDesState.understood||'根据下面的描述整理')+'\n\n## 你已提供的信息\n'+provided+'\n\n## AI 整理的方案\n'+(summary||'（尚未完成 AI 汇总；以下信息会以待确认状态交给 AI 生成草稿。）')+'\n\n## AI 建议（待确认）\n'+assumptions+'\n\n## 还需要确认 / 可能冲突\n'+needs+'\n\n## 第一版边界\n- 只实现上面已确认的核心任务；其余内容默认不做，除非你在此处补充。';
}
function aiDesFinish(){
  if(aiDesState.busy){aiToast('AI 仍在整理，稍后再查看方案');return;}
  var editor=document.getElementById('aiDesSkeletonEditor');if(editor)editor.value=aiDesBuildSkeleton();
  var hint=document.getElementById('aiDesSkeletonHint');if(hint)hint.textContent=aiDesState.conflicts.length?'发现可能冲突：确认前请在方案中说明取舍。':'确认后才会开始按章节生成草稿；生成内容仍需在 AI 面板逐条接受后写入。';
  try{closeModal('aiDesignModal');openModal('aiDesSkeletonModal');}catch(e){var dm=document.getElementById('aiDesignModal'),sm=document.getElementById('aiDesSkeletonModal');if(dm)dm.classList.remove('open');if(sm)sm.classList.add('open');}
}
function aiDesConfirmSkeleton(){
  var st=aiGetSettings();
  if(!String(st.apiKey||'').trim()||!String(st.baseUrl||'').trim()){aiToast('请先在 设置→AI 中配置 API Key 与地址');return;}
  var editor=document.getElementById('aiDesSkeletonEditor');var text=String(editor&&editor.value||'').trim();
  if(text.length<10){aiToast('请补充至少一句产品方案');return;}
  var nmEl=document.getElementById('aiGenName');if(nmEl)nmEl.value=aiDesState.name||'AI 产品设计';
  var dsEl=document.getElementById('aiGenDesc');if(dsEl)dsEl.value=text.slice(0,6000);
  aiGenMode='design';
  try{closeModal('aiDesSkeletonModal');}catch(e){var sm=document.getElementById('aiDesSkeletonModal');if(sm)sm.classList.remove('open');}
  aiGenStart();
}
function aiBind(){
  document.addEventListener('click',function(e){
    if(e.target){
      if(e.target.id==='aiChatSend'||e.target.id==='aiFloatSend'){var ta=document.getElementById(e.target.id==='aiChatSend'?'aiChatInput':'aiFloatInput');if(ta){chatSend(ta.value);ta.value='';}return;}
      if((e.target.closest&&e.target.closest('#aiFloatClose'))||e.target.id==='aiFloatClose'){var fp=document.getElementById('aiFloatPanel');if(fp)fp.classList.remove('open');return;}
    }
    var t=e.target&&e.target.closest?e.target.closest('[data-ai]'):null;
    if(!t)return;
    var act=t.dataset.ai;
    if(act==='close'){aiClosePanel();return;}
    if(act==='score'){aiRunScore();return;}
    if(act==='optimize'){aiOpenOptModal();return;}
    if(act==='review'){rvOpen();return;}
    if(act==='dessend'){aiDesSend();return;}
    if(act==='desadvise'){var di=document.getElementById('aiDesInput');if(di){di.value='我不确定，请结合我前面的描述给出一个合理建议，并标记为待确认。';aiDesSend();}return;}
    if(act==='desskip'){if(aiDesState.busy){aiToast('AI 正在输出，可先点「■ 停止」再查看方案');return;}if(!aiDesState.qa.length){aiToast('先回答一个问题，或提供一点想法吧');return;}aiDesState.assumptions.push('未继续回答的部分：AI 建议（待确认）');aiDesRenderState();aiDesFinish();return;}
    if(act==='desstop'){if(aiDesState.abort){try{aiDesState.abort.abort();}catch(e){}}aiCancelFlag=true;return;}
    if(act==='desfinish'){aiDesFinish();return;}
    if(act==='desclose'){try{closeModal('aiDesignModal');}catch(e){var dmx=document.getElementById('aiDesignModal');if(dmx)dmx.classList.remove('open');}return;}
    if(act==='desskelback'){try{closeModal('aiDesSkeletonModal');openModal('aiDesignModal');}catch(e){var smx=document.getElementById('aiDesSkeletonModal'),dmx2=document.getElementById('aiDesignModal');if(smx)smx.classList.remove('open');if(dmx2)dmx2.classList.add('open');}return;}
    if(act==='desskelclose'){try{closeModal('aiDesSkeletonModal');}catch(e){var smc=document.getElementById('aiDesSkeletonModal');if(smc)smc.classList.remove('open');}return;}
    if(act==='desskelconfirm'){aiDesConfirmSkeleton();return;}
    if(act==='align'){aiAlign();return;}
    if(act==='gen'){aiOpenGenModal();return;}
    if(act==='genclose'){try{closeModal('aiGenModal');}catch(e){var gmm=document.getElementById('aiGenModal');if(gmm)gmm.classList.remove('open');}return;}
    if(act==='genstart'){aiGenStart();return;}
    if(act==='align-accept'||act==='align-reject'||act==='align-defer'){aiDecideAlign(t.dataset.did,act==='align-accept'?'accepted':act==='align-reject'?'rejected':'deferred');return;}
    if(act==='align-all'){aiAcceptAllAlign();return;}
    if(act==='stop'){aiAbortRun();return;}
    if(act==='clearoptdbg'){var stc=aiState();if(stc)delete stc.lastOptDebug;aiPersist();aiRenderPanel();return;}
    if(act==='cleargendbg'){var stc2=aiState();if(stc2)delete stc2.lastGenDebug;aiPersist();aiRenderPanel();return;}
    if(act==='jumpblock'){aiJumpToBlock(t.dataset.sid,t.dataset.match);return;}
    if(act==='undo-diff'){aiUndoDiffItem(t.dataset.did);return;}
    if(act==='recover-backup'){
      var rbk=null;
      try{rbk=localStorage.getItem(STORAGE_KEY+'.bak');}catch(e){}
      if(!rbk){aiToast('没有找到可恢复的备份');return;}
      try{
        STATE=JSON.parse(rbk);
        save();
        aiRecoverOffer=null;
        aiRenderPanel();
        aiToast('已从备份恢复 '+STATE.projects.length+' 个项目');
      }catch(e){aiToast('备份恢复失败：'+(e&&e.message||e));}
      return;
    }
    if(act==='optclose'){try{closeModal('aiOptModal');}catch(e){var mm=document.getElementById('aiOptModal');if(mm)mm.classList.remove('open');}return;}
    if(act==='optstart'){
      var v=document.querySelector('input[name="aiScope"]:checked');
      aiOptMode=v&&v.value==='section'?'section':'full';
      var sel=document.getElementById('aiOptSec');
      aiOptSectionId=sel&&sel.value?sel.value:null;
      try{closeModal('aiOptModal');}catch(e){var m2=document.getElementById('aiOptModal');if(m2)m2.classList.remove('open');}
      aiRunOptimize();
      return;
    }
    if(act==='jump'){try{openSection(t.dataset.sid);}catch(e){}return;}
    if(act==='lock-section'){aiToggleSectionLock(t.dataset.sid);return;}
    if(act==='ignore'||act==='correct'){aiToggleIgnore(t.dataset.key,act==='correct');return;}
    if(act==='unignore'){aiToggleIgnore(t.dataset.key,false);return;}
    if(act==='accept'||act==='reject'||act==='defer'){aiDecideDiff(t.dataset.did,act==='accept'?'accepted':act==='reject'?'rejected':'deferred');return;}
    if(act==='modify'){var mk1=t.dataset.did+'_'+(t.dataset.ei||'0');aiUi.modifyOpen[mk1]=!aiUi.modifyOpen[mk1];aiRenderPanel();return;}
    if(act==='modify-save'){aiSaveModifiedDiff(t.dataset.did,t.dataset.ei!=null?+t.dataset.ei:null);return;}
    if(act==='acceptall'){aiAcceptAll();return;}
    if(act==='viewdiff'){aiUi.verOpen[t.dataset.vid]=!aiUi.verOpen[t.dataset.vid];aiRenderPanel();return;}
    if(act==='restore'){aiRestoreToVersion(t.dataset.vid);return;}
    if(act==='dimtoggle'){aiUi.dimOpen[t.dataset.did]=!aiUi.dimOpen[t.dataset.did];aiRenderPanel();return;}
    if(act==='savesettings'){aiSaveForm();return;}
    if(act==='testconn'){aiTestConn();return;}
  });
  document.addEventListener('keydown',function(e){
    if(e.key==='Enter'&&!e.shiftKey&&(e.target.id==='aiChatInput'||e.target.id==='aiFloatInput')){e.preventDefault();chatSend(e.target.value);e.target.value='';return;}
    if(e.key==='Escape'){var mm=document.getElementById('aiOptModal'),gm=document.getElementById('aiGenModal');if(mm&&mm.classList.contains('open')){try{closeModal('aiOptModal');}catch(e2){mm.classList.remove('open');}}else if(gm&&gm.classList.contains('open')){try{closeModal('aiGenModal');}catch(e3){gm.classList.remove('open');}}else if(aiUi.open)aiClosePanel();}
  });
}

/* ---------- 对话助手（流式 / 可见即可做） ---------- */
var AI_CHAT_TEMPLATES={
  purpose:'## 目的\n\n本 PRD 旨在定义……（一句话说明该需求为什么做、解决谁的什么问题）。',
  scope:'## 适用范围\n\n- 适用设备 / 配置：\n- 适用软件版本：\n- 不适用范围：',
  nfr:'## 非功能需求\n\n- 性能：关键链路端到端延迟 ≤ 1.5s；\n- 稳定性：连续运行 72h 无崩溃；\n- 安全：满足行业合规与隐私要求。',
  feat:'## 功能需求\n\n| 功能点 | 描述 | 优先级 | 状态 |\n|---|---|---|---|\n| 示例功能 | 说明 | P1 | 待开发 |',
  accept:'## 验收标准\n\n- [ ] 关键指标可量化验证（如达标率 ≥ 95%）；\n- [ ] 主流程走通无阻断；\n- [ ] 异常场景有兜底。',
  risk:'## 风险与对策\n\n- 风险1：…… 对策：……\n- 风险2：…… 对策：……',
  metrics:'## 关键指标\n\n- 关键指标达标率 ≥ 95%\n- 端到端延迟 ≤ 1.5s\n- 异常率 ≤ 1 次/天'
};
function aiRenderChatLog(){
  aiSyncBusyBtn();
  var html=aiChatState.messages.map(aiChatMsgHtml).join('');
  var logs=[document.getElementById('aiChatLog'),document.getElementById('aiFloatLog')];
  logs.forEach(function(l){if(l){l.innerHTML=html;l.scrollTop=l.scrollHeight;}});
  aiScrollThinkBody();
}
function aiChatMsgHtml(m){
  if(m.role==='user')return '<div class="ai-msg user"><div class="ai-msg-b">'+aiEsc(m.content||'')+'</div></div>';
  if(m.role==='system')return '<div class="ai-msg sys"><div class="ai-msg-b">'+aiEsc(m.content||'')+'</div></div>';
  var txt=m.content||'';
  var acts=aiChatActionsFrom(txt);
  var chips=acts.map(function(a){return '<span class="ai-act-chip" title="'+aiEsc(JSON.stringify(a.payload||{}))+'">'+ICONS.bolt+' '+aiEsc(a.name)+'</span>';}).join('');
  var body=aiEsc(txt.replace(/<action[^>]*\/>/g,''));
  var think='';
  if(m.reasoning||m.pending){
    var rl=String(m.reasoning||'');
    var pendingText='已收到你的消息，正在理解问题并规划下一步…';
    think='<details class="ai-think"'+(m.pending?' open':'')+'><summary><span class="ai-think-h-t">'+(m.pending?'<span class="ai-think-dot"></span>':'<span class="ai-think-ic">'+ICONS.brain+'</span>')+(rl?'深度思考':'深度思考已启动')+'</span><span class="ai-think-cnt">'+(rl.length?rl.length+' 字':'准备中')+'</span><span class="ai-think-caret">▾</span></summary><div class="ai-think-body">'+aiEsc(rl||pendingText)+'</div></details>';
  }
  return '<div class="ai-msg bot"><div class="ai-msg-b">'+think+body+(chips?'<div class="ai-act-chips">'+chips+'</div>':'')+(m.pending?'<span class="ai-orb ai-orb--working" style="--s:13px;--d:2.5px" aria-label="AI 正在回复"></span>':'')+'</div></div>';
}
function aiChatActionsFrom(text){
  var out=[];if(!text)return out;
  var re=/<action\s+name="([^"]+)"\s*(?:payload='([\s\S]*?)')?\s*\/>/g,m;
  while((m=re.exec(text))){
    var name=m[1],payload=null;
    if(m[2]!=null){try{payload=JSON.parse(m[2]);}catch(e){payload={};}}
    out.push({name:name,payload:payload});
  }
  return out;
}
function aiChatSystemPrompt(){
  var web=aiGetSettings().web;
  return '你是「产品助手」，一名资深产品经理 AI，服务于 需求文档工作台。你的使命是帮助任何人——尤其是用 AI 构建产品的开发者与 vibe coding 人群——先把模糊想法写成清晰的 PRD，再交给 AI 高效落地执行。你的第一身份是**对话伙伴**，其次才是执行者。\n'
   +'原则：\n'
   +'1) 优先对话：用户给模糊或复杂需求时，先用产品经理视角拆解、提问澄清、给取舍建议，再谈执行；不要急于套用动作。\n'
   +'2) 像带实习生：用 完整性/清晰度/一致性/可执行/可验证/风险 六维度思考，结论先行、给依据。\n'
   +'3) 该动手才动手：只有用户意图明确、且明显希望看板变化时才输出动作标签。提问/讨论/方案对比都只正常回答，不加动作。\n'
   +'4) 「可见即可做」：你能调用看板上所有操作、拥有最大编辑权限——撰写 / 体检 / 优化 / 结构对齐 / 缺口处理 / 版本回滚 / 备份恢复等都不在话下；涉及删除 / 恢复 / 批量覆盖等高风险动作时，界面会弹二次确认，你按用户要求发起、由用户点确认即可。\n'
   +'5) 执行看板操作时，在回复自然语言之后输出动作标签：\n<action name="动作名" payload=\'JSON对象\'/>\n'
   +'可用动作：score(体检) optimize(优化) align(结构对齐) gen(撰写) addSection(新增节) deleteSection(删除节) renameSection(改名) editSection(写/改内容) addPara/editPara/deletePara(段落级增改删) applyTemplate(套模板) newProject(建项目) renameProject(项目改名) accept/reject/undo-diff(单条修改) rollback/restore(版本) jump(定位)。\n'
   +'addSection payload：{"title":"节名","type":"text|table|feat|users|accept|timeline","after":"某节标题(可选)","content":"文本或数组"}。\n'
   +'editSection payload：{"title" 或 "index":"第几节","content":"写入内容","mode":"append|replace"(可选),"para":段落序号(可选)}。\n'
   +'addPara/editPara/deletePara payload：{"title" 或 "index":"第几节","para":段落序号(从1起),"content":"文本(增/改时用)"}。\n'
   +'deleteSection payload：{"title" 或 "index":"第几节"}。renameSection payload：{"title" 或 "index","newTitle":"新名"}。renameProject payload：{"newName":"新项目名"}。\n'
   +'accept/reject/undo-diff payload：{"id":"修改项id"}；rollback payload：{"id":"版本id"}。id 可从面板按钮的 data-did/data-vid 获得，未明确不要猜测。\n'
   +'示例——用户："给我加一节竞品分析，写段背景"：回复"好的，新增『竞品分析』节并写入背景。"\n<action name="addSection" payload=\'{"title":"竞品分析","type":"text","content":"## 竞品分析\\n\\n当前主流协作工具方案对比：……"}\'/>\n'
   +'6) 一次回复可含多个动作标签，按顺序执行；复杂任务先列计划、再逐步执行。\n'
   +'7) 纯提问就正常回答，不加动作标签。\n'
   +(web?'8) 你已开启联网，可基于最新资料作答（引用来源时标注出处）。\n':'')
   +'9) 语言简洁、像产品经理带实习生，不要写新闻稿。';
}
function chatSend(text){
  text=String(text||'').trim();
  if(!text)return;
  if(aiChatState.busy){aiToast('AI 正在回复，请稍候');return;}
  if(!currentProj()){aiToast('请先创建或打开一个项目');return;}
  aiChatState.messages.push({role:'user',content:text});
  aiChatState.messages.push({role:'assistant',content:'',pending:true});
  aiRenderChatLog();
  aiChatState.busy=true;
  aiCancelFlag=false;
  var hist=aiChatState.messages.filter(function(m){return !m.pending;}).map(function(m){return {role:m.role,content:m.content||''};});
  if(hist.length&&hist[0].role!=='system')hist.unshift({role:'system',content:aiChatSystemPrompt()});
  else if(!hist.length)hist=[{role:'system',content:aiChatSystemPrompt()}];
  var full='';
  aiChatOnce(hist,{stream:true,model:aiGetSettings().model,temperature:0.4,onDelta:function(c){full=c;var last=aiChatState.messages[aiChatState.messages.length-1];if(last)last.content=c;aiRenderChatLog();},onReasoning:function(r){var last=aiChatState.messages[aiChatState.messages.length-1];if(last)last.reasoning=(last.reasoning||'')+r;aiRenderChatLog();}})
    .then(function(c){full=c||full;var last=aiChatState.messages[aiChatState.messages.length-1];if(last){last.content=full;last.pending=false;}aiRenderChatLog();return aiChatExecActions(full);})
    .then(function(){aiRenderChatLog();})
    .catch(function(e){var last=aiChatState.messages[aiChatState.messages.length-1];if(last){last.content=(last.content||'')+'\n\n出错了：'+((e&&e.message)||e);last.pending=false;}aiRenderChatLog();})
    .finally(function(){aiChatState.busy=false;aiRenderChatLog();});
}
function aiChatExecActions(text){
  var acts=aiChatActionsFrom(text);
  if(!acts.length)return Promise.resolve();
  return new Promise(function(resolve){
    function step(){
      if(aiCancelFlag){aiChatState.messages.push({role:'system',content:'⊘ 已停止，剩余 '+acts.length+' 个动作未执行'});aiRenderChatLog();return resolve();}
      if(!acts.length){return resolve();}
      var a=acts.shift();
      var risk=aiActionRisk(a.name,a.payload);
      function runOne(){
        var note;
        try{var r=runAction(a.name,a.payload||{});note=(r?r:('执行 '+a.name));}
        catch(e){note=a.name+' 失败：'+((e&&e.message)||e);}
        aiChatState.messages.push({role:'system',content:note});
        aiRenderChatLog();
        step();
      }
      if(risk==='HIGH'){
        aiConfirmHighRisk(a.name,a.payload,runOne,function(){
          aiChatState.messages.push({role:'system',content:'已跳过高风险动作「'+a.name+'」（需用户确认）'});
          aiRenderChatLog();step();
        });
      }else{
        runOne();
      }
    }
    step();
  });
}
function aiActionRisk(name,p){
  var HIGH=['deleteSection','recover-backup','rollback','restore'];
  var MED=['deletePara','reject','undo-diff','rollback-ver'];
  if(HIGH.indexOf(name)>=0)return 'HIGH';
  if(MED.indexOf(name)>=0)return 'MED';
  return 'LOW';
}
var aiConfirmResolver=null;
function aiHighRiskDetail(name,p){
  p=p||{};
  if(name==='deleteSection'){var s=aiChatFindSection(p)||{};return '即将删除节「'+aiEsc(s.title||p.title||p.index||'')+'」。\n该节内容将丢失，且无法自动撤销（只能从本地备份恢复）。';}
  if(name==='recover-backup'){return '即将用本地自动备份覆盖当前全部项目数据。\n当前未保存的改动会丢失，请确认。';}
  if(name==='rollback'||name==='restore'){return '即将恢复到历史版本（id：'+aiEsc(p.id||'')+'）。\n当前内容将被该版本覆盖，请确认。';}
  return '该动作被标记为高风险，请确认是否执行：\n'+aiEsc(name);
}
function aiConfirmHighRisk(name,p,onYes,onSkip){
  if(aiConfirmResolver)aiConfirmResolver.abort();
  var ov=document.createElement('div');ov.className='ai-confirm-ov';
  ov.innerHTML='<div class="ai-confirm"><div class="ai-confirm-t">'+ICONS.warn+' 高风险操作确认</div>'
    +'<div class="ai-confirm-d">'+aiHighRiskDetail(name,p)+'</div>'
    +'<div class="ai-confirm-act"><button class="btn btn--danger" data-aic="yes">确认执行</button>'
    +'<button class="btn" data-aic="skip">跳过此动作</button>'
    +'<button class="btn" data-aic="abort">中断全部</button></div></div>';
  document.body.appendChild(ov);
  function close(){if(ov.parentNode)ov.parentNode.removeChild(ov);aiConfirmResolver=null;}
  function yes(){close();onYes();}
  function skip(){close();onSkip();}
  function abort(){close();aiCancelFlag=true;onSkip();}
  ov.addEventListener('click',function(e){
    var b=e.target.closest('[data-aic]');if(!b)return;
    var k=b.getAttribute('data-aic');
    if(k==='yes')yes();else if(k==='skip')skip();else abort();
  });
  aiConfirmResolver={yes:yes,skip:skip,abort:abort};
}
/* ---------- 动作调度（对话与 UI 共用底层函数） ---------- */
function runAction(act,p){
  p=p||{};
  try{
    switch(act){
      case 'close':aiClosePanel();return '已关闭面板';
      case 'score':aiRunScore();return '已触发 AI 深度体检';
      case 'optimize':aiOpenOptModal();return '已打开一键优化';
      case 'align':aiAlign();return '已触发结构对齐';
      case 'gen':aiOpenGenModal();return '已打开 AI 撰写';
      case 'genstart':aiGenStart();return '已开始生成';
      case 'stop':aiAbortRun();return '已停止';
      case 'jump':
      case 'open':if(p.sid){openSection(p.sid);return '已定位节';}return '未提供节 ID';
      case 'acceptall':aiAcceptAll();return '已全部接受修改';
      case 'accept':if(p.id){aiDecideDiff(p.id,'accepted');return '已接受该条修改';}return '缺少修改 id';
      case 'reject':if(p.id){aiDecideDiff(p.id,'rejected');return '已拒绝该条修改';}return '缺少修改 id';
      case 'defer':if(p.id){aiDecideDiff(p.id,'deferred');return '已暂缓该条修改';}return '缺少修改 id';
      case 'undo-diff':if(p.id){aiUndoDiffItem(p.id);return '已撤销该条修改';}return '缺少修改 id';
      case 'align-all':aiAcceptAllAlign();return '已应用全部对齐';
      case 'align-accept':if(p.id){aiDecideAlign(p.id,'accepted');return '已接受该条对齐';}return '缺少对齐 id';
      case 'align-reject':if(p.id){aiDecideAlign(p.id,'rejected');return '已拒绝该条对齐';}return '缺少对齐 id';
      case 'align-defer':if(p.id){aiDecideAlign(p.id,'deferred');return '已暂缓该条对齐';}return '缺少对齐 id';
      case 'ignore':aiToggleIgnore(p.key,false);return '已忽略该问题';
      case 'correct':aiToggleIgnore(p.key,true);return '已标记已订正';
      case 'unignore':aiToggleIgnore(p.key,false);return '已恢复该问题';
      case 'viewdiff':if(p.id){aiUi.verOpen[p.id]=!aiUi.verOpen[p.id];aiRenderPanel();return '已切换版本 Diff';}return '缺少版本 id';
      case 'restore':
      case 'rollback':if(p.id){aiRestoreToVersion(p.id);return '已恢复到该版本';}return '缺少版本 id';
      case 'recover-backup':
        var rbk=null;
        try{rbk=localStorage.getItem(STORAGE_KEY+'.bak');}catch(e){}
        if(!rbk){return '没有找到可恢复的备份';}
        try{STATE=JSON.parse(rbk);save();aiRecoverOffer=null;aiRenderPanel();return '已从备份恢复 '+STATE.projects.length+' 个项目';}
        catch(e){return '备份恢复失败：'+(e&&e.message||e);}
      case 'dimtoggle':if(p.id){aiUi.dimOpen[p.id]=!aiUi.dimOpen[p.id];aiRenderPanel();return '已展开/收起维度';}return '缺少维度 id';
      case 'addSection':return aiChatAddSection(p);
      case 'deleteSection':return aiChatDeleteSection(p);
      case 'editSection':return aiChatEditSection(p);
      case 'addPara':return aiChatAddPara(p);
      case 'editPara':return aiChatEditPara(p);
      case 'deletePara':return aiChatDeletePara(p);
      case 'renameSection':return aiChatRenameSection(p);
      case 'applyTemplate':return aiChatApplyTemplate(p);
      case 'newProject':return aiChatNewProject(p);
      case 'renameProject':return aiChatRenameProject(p);
      default:return null;
    }
  }catch(e){return '执行失败：'+((e&&e.message)||e);}
}
function aiChatFindSection(p){
  var fw=STATE.framework||[];
  if(p.sid)return fw.find(function(s){return s.id===p.sid;})||null;
  if(p.index){var i=parseInt(p.index,10);if(i>=1&&i<=fw.length)return fw[i-1];}
  if(p.title){var t=String(p.title).trim().toLowerCase();return fw.find(function(s){return (s.title||'').toLowerCase().indexOf(t)>=0;})||null;}
  return null;
}
function aiChatNormItem(type,raw){
  if(raw&&typeof raw==='object')return raw;
  var s=String(raw||'');
  if(type==='feat')return {name:s,desc:'',priority:'P2',status:'todo'};
  if(type==='accept')return {text:s,status:'na'};
  if(type==='users')return {text:s};
  return {text:s};
}
function aiChatSetSectionContent(id,type,content){
  var pj=currentProj();if(!pj)return;
  var sec=DATA[id]||(pj.data[id]=sectionEmpty(type,id));
  if(type==='text'||type==='timeline'||type==='cards'){
    sec.html=aiMdToHtml(String(content||''));
  }else if(type==='feat'||type==='accept'||type==='users'){
    if(Array.isArray(content))sec.items=content.map(function(it){return aiChatNormItem(type,it);});
    else{var lines=String(content).split(/\n+/).map(function(s){return s.trim();}).filter(Boolean);sec.items=lines.map(function(l){return aiChatNormItem(type,l);});}
  }else if(type==='table'){
    if(Array.isArray(content))sec.rows=content;
    else sec.rows=[{cells:['列1','列2']},{cells:['','']}];
  }
}
function aiChatSecData(p){
  var sec=aiChatFindSection(p);if(!sec)return null;
  var pj=currentProj();if(!pj)return null;
  var data=pj.data[sec.id]||(pj.data[sec.id]=sectionEmpty(sec.type,sec.id));
  return {sec:sec,data:data};
}
// 聊天段落操作只需 HTML 字符串数组；不能覆盖前面的结构化 aiBlocksOf，
// 后者被优化、结构对齐等流程依赖并返回 {html,text} 对象。
function aiChatBlocksOf(html){
  var div=document.createElement('div');
  div.innerHTML=String(html||'');
  var arr=[];
  for(var i=0;i<div.childNodes.length;i++){var n=div.childNodes[i];if(n.nodeType===1)arr.push(n.outerHTML);}
  return arr;
}
function aiChatSecIsTextual(type){return type==='text'||type==='timeline'||type==='cards';}
function aiChatAddPara(p){
  var sd=aiChatSecData(p);if(!sd)return '未找到节';
  if(!aiChatSecIsTextual(sd.sec.type))return '「'+sd.sec.title+'」不是文本类节，暂不支持段落级改写（请用 editSection 整体写入）';
  var newBlocks=aiChatBlocksOf(aiMdToHtml(p.content||''));
  if(!newBlocks.length)return '请提供 content 内容';
  var blocks=aiChatBlocksOf(sd.data.html||'');
  var para=parseInt(p.para,10);
  if(para>=1&&para<=blocks.length+1){blocks.splice(para-1,0,newBlocks.join('\n'));}
  else{blocks=blocks.concat(newBlocks);para=blocks.length;}
  sd.data.html=blocks.join('\n');
  save();if(typeof renderFrameworkTab==='function')renderFrameworkTab();if(aiUi.open)aiRenderPanel();if(currentProj())render();
  return '已在「'+sd.sec.title+'」第 '+(p.para?para:'末')+' 段新增内容';
}
function aiChatEditPara(p){
  var sd=aiChatSecData(p);if(!sd)return '未找到节';
  if(!aiChatSecIsTextual(sd.sec.type))return '「'+sd.sec.title+'」不是文本类节';
  var blocks=aiChatBlocksOf(sd.data.html||'');
  var para=parseInt(p.para,10);
  if(!(para>=1&&para<=blocks.length))return '段落序号无效（当前共 '+blocks.length+' 段）';
  var newBlocks=aiChatBlocksOf(aiMdToHtml(p.content||''));
  if(!newBlocks.length)return '请提供 content 内容';
  blocks.splice(para-1,1,newBlocks.join('\n'));
  sd.data.html=blocks.join('\n');
  save();if(typeof renderFrameworkTab==='function')renderFrameworkTab();if(aiUi.open)aiRenderPanel();if(currentProj())render();
  return '已改写「'+sd.sec.title+'」第 '+para+' 段';
}
function aiChatDeletePara(p){
  var sd=aiChatSecData(p);if(!sd)return '未找到节';
  if(!aiChatSecIsTextual(sd.sec.type))return '「'+sd.sec.title+'」不是文本类节';
  var blocks=aiChatBlocksOf(sd.data.html||'');
  var para=parseInt(p.para,10);
  if(!(para>=1&&para<=blocks.length))return '段落序号无效（当前共 '+blocks.length+' 段）';
  blocks.splice(para-1,1);
  sd.data.html=blocks.join('\n');
  save();if(typeof renderFrameworkTab==='function')renderFrameworkTab();if(aiUi.open)aiRenderPanel();if(currentProj())render();
  return '已删除「'+sd.sec.title+'」第 '+para+' 段（剩 '+blocks.length+' 段）';
}
function aiChatAddSection(p){
  var title=p.title||'新节';
  var type=p.type||'text';
  var required=p.required==null?false:(p.required===true||p.required==='true');
  var id=uid();
  var fw=STATE.framework;
  var idx=fw.length;
  if(p.after){var ai=fw.findIndex(function(s){return s.id===p.after||(s.title||'')===p.after;});if(ai>=0)idx=ai+1;}
  fw.splice(idx,0,{id:id,title:title,type:type,required:required,weight:p.weight!=null?+p.weight:1,template:''});
  var pj=currentProj();
  if(pj){pj.framework=deep(STATE.framework);if(!pj.data[id])pj.data[id]=sectionEmpty(type,id);}
  if(p.content)aiChatSetSectionContent(id,type,p.content);
  save();if(typeof renderFrameworkTab==='function')renderFrameworkTab();if(aiUi.open)aiRenderPanel();if(currentProj())render();
  return '已新增节「'+title+'」'+(p.content?'并写入内容':'');
}
function aiChatDeleteSection(p){
  var sec=aiChatFindSection(p);if(!sec)return '未找到要删除的节';
  if(sec.required)return '「'+sec.title+'」是必填节，按规范不允许删除';
  var i=STATE.framework.indexOf(sec);
  STATE.framework.splice(i,1);
  var pj=currentProj();
  if(pj){pj.framework=deep(STATE.framework);delete pj.data[sec.id];}
  save();if(typeof renderFrameworkTab==='function')renderFrameworkTab();if(aiUi.open)aiRenderPanel();if(currentProj())render();
  return '已删除节「'+sec.title+'」';
}
function aiChatEditSection(p){
  var sec=aiChatFindSection(p);if(!sec)return '未找到节';
  var changed=[];
  if(p.title){sec.title=p.title;changed.push('改名');}
  if(p.type){sec.type=p.type;changed.push('改类型');}
  if(p.required!=null){sec.required=(p.required===true||p.required==='true');changed.push('改必填');}
  if(p.para!=null){
    var pr=aiChatEditPara(p);
    changed.push('段落改写');
    var pj=currentProj();if(pj)pj.framework=deep(STATE.framework);
    save();if(typeof renderFrameworkTab==='function')renderFrameworkTab();if(aiUi.open)aiRenderPanel();if(currentProj())render();
    return '已更新节「'+sec.title+'」（段落改写：'+pr+'）';
  }
  if(p.content!=null){aiChatSetSectionContent(sec.id,sec.type,p.content);changed.push('写入内容');}
  var pj=currentProj();if(pj)pj.framework=deep(STATE.framework);
  save();if(typeof renderFrameworkTab==='function')renderFrameworkTab();if(aiUi.open)aiRenderPanel();if(currentProj())render();
  return '已更新节「'+sec.title+'」'+(changed.length?('（'+changed.join('、')+'）'):'');
}
function aiChatRenameSection(p){
  var sec=aiChatFindSection(p);if(!sec)return '未找到节';
  sec.title=p.newTitle||p.title;
  var pj=currentProj();if(pj)pj.framework=deep(STATE.framework);
  save();if(typeof renderFrameworkTab==='function')renderFrameworkTab();if(aiUi.open)aiRenderPanel();if(currentProj())render();
  return '已改名为「'+sec.title+'」';
}
function aiChatApplyTemplate(p){
  var sec=aiChatFindSection(p);if(!sec)return '未找到节';
  var tpl=AI_CHAT_TEMPLATES[p.template||''];
  if(!tpl)return '未找到模板「'+(p.template||'')+'」';
  aiChatSetSectionContent(sec.id,sec.type,tpl);
  save();if(aiUi.open)aiRenderPanel();if(currentProj())render();
  return '已套用模板「'+(p.template||'')+'」到「'+sec.title+'」';
}
function aiChatNewProject(p){
  var id=uid();
  var fw=deep(STATE.framework);
  var proj={id:id,name:p.name||'新建 PRD',framework:fw,data:blankData(fw),createdAt:Date.now()};
  STATE.projects.push(proj);STATE.activeProjectId=id;refreshData();save();render();if(aiUi.open)aiRenderPanel();
  return '已创建项目「'+proj.name+'」';
}
function aiChatRenameProject(p){
  var pj=currentProj();if(!pj)return '当前没有打开的项目';
  var name=(p.newName||p.name||'').trim();if(!name)return '请提供新项目名';
  var old=pj.name;
  renameProject(pj.id,name);
  return '已将项目从「'+old+'」改名为「'+name+'」';
}
function aiToggleFloat(){
  var p=document.getElementById('aiFloatPanel');if(!p)return;
  var open=p.classList.toggle('open');
  if(open)aiRenderChatLog();
}

/* ---------- Tabulator 表格引擎（在线增强，离线降级原生表） ---------- */
var aiTblInst={};var aiTblZoom={};var aiTblUpgrading=false;
function aiTblAvailable(){return (typeof Tabulator!=='undefined');}
function aiTblDestroyAll(){
  Object.keys(aiTblInst).forEach(function(k){try{aiTblInst[k].destroy();}catch(e){}delete aiTblInst[k];});
  document.querySelectorAll('.tbl-host').forEach(function(h){h._tblBuilt=false;});
}
function aiTblUpgradeAll(){
  if(aiTblUpgrading)return;aiTblUpgrading=true;
  try{
    if(!aiTblAvailable()){
      document.querySelectorAll('.tbl-host').forEach(function(h){h.style.display='none';});
      document.querySelectorAll('.native-tbl').forEach(function(n){n.style.display='';});
      if(!aiTblUpgradeAll._t){aiTblUpgradeAll._t=setInterval(function(){if(aiTblAvailable()){clearInterval(aiTblUpgradeAll._t);aiTblUpgradeAll._t=null;aiTblUpgradeAll();}},700);}
      return;
    }
    if(aiTblUpgradeAll._t){clearInterval(aiTblUpgradeAll._t);aiTblUpgradeAll._t=null;}
    document.querySelectorAll('.tbl-host').forEach(function(host){
      var secId=host.getAttribute('data-sec');if(!secId||host._tblBuilt)return;
      var pj=currentProj();if(!pj)return;
      var data=pj.data[secId];if(!data||!data.rows||!data.rows.length)return;
      var rows=data.rows;var heads=rows[0].cells||[];
      var cols=heads.map(function(h,j){return {title:String(h==null?'列'+(j+1):h),field:'c'+j,width:(data.colWidths&&data.colWidths[j])||120,editor:(editing?'input':'')};});
      var tdata=rows.slice(1).map(function(r,ri){var o={__r:ri+1};(r.cells||[]).forEach(function(v,j){o['c'+j]=(v==null?'':String(v));});return o;});
      var inst=new Tabulator(host,{
        layout:'fitColumns',
        columns:cols,
        data:tdata,
        cellEdited:function(cell){
          var f=cell.getField();var colIdx=parseInt(f.slice(1),10);var row=cell.getRow().getData();var ri=row.__r;
          if(pj.data[secId]&&pj.data[secId].rows[ri]){pj.data[secId].rows[ri].cells[colIdx]=cell.getValue();save();}
        },
        columnResized:function(column){
          var f=column.getDefinition().field;var j=parseInt(String(f).slice(1),10);var w=column.getWidth();
          if(pj.data[secId]&&pj.data[secId].colWidths){pj.data[secId].colWidths[j]=w;save();}
        }
      });
      host._tblBuilt=true;aiTblInst[secId]=inst;
      var wrap=host.closest('.tbl-wrap');if(wrap){var nt=wrap.querySelector('.native-tbl');if(nt)nt.style.display='none';}
      host.style.display='';
      aiTblApplyZoom(secId);
    });
  }catch(e){if(typeof console!=='undefined')console.error('Tabulator 升级失败',e);}finally{aiTblUpgrading=false;}
}
function aiTblApplyZoom(secId){
  var z=aiTblZoom[secId]||1;
  var wrap=document.querySelector('.tbl-wrap[data-sec="'+secId+'"]');
  if(wrap){var stage=wrap.querySelector('.tbl-stage');if(stage){stage.style.transform='scale('+z+')';stage.style.transformOrigin='top left';var val=wrap.querySelector('.tbl-zoom-val');if(val)val.textContent=Math.round(z*100)+'%';}}
}
function aiTblZoom(secId,delta){
  var z=aiTblZoom[secId]||1;z=Math.max(0.5,Math.min(2,z+delta));aiTblZoom[secId]=z;aiTblApplyZoom(secId);
}
function aiTblCsvEscape(v){v=String(v==null?'':v);if(/[",\n]/.test(v))return '"'+v.replace(/"/g,'""')+'"';return v;}
function aiTblToCSV(sec){
  var pj=currentProj();if(!pj||!pj.data[sec])return '';
  var rows=pj.data[sec].rows||[];
  return rows.map(function(r){(r.cells||[]).map(function(v){return aiTblCsvEscape(v);}).join(',')}).join('\n');
}
function aiTblToMD(sec){
  var pj=currentProj();if(!pj||!pj.data[sec])return '';
  var rows=pj.data[sec].rows||[];
  if(!rows.length)return '';
  function md(r){return '| '+((r.cells||[]).map(function(v){return String(v==null?'':v).replace(/\|/g,'\\|');})).join(' | ')+' |';}
  var out=[md(rows[0])];
  out.push('| '+rows[0].cells.map(function(){return '---';}).join(' | ')+' |');
  for(var i=1;i<rows.length;i++)out.push(md(rows[i]));
  return out.join('\n');
}
function aiTblParseCSV(text){
  var rows=[],row=[],field='',inQ=false,i=0;
  while(i<text.length){
    var ch=text[i];
    if(inQ){
      if(ch==='"'){if(text[i+1]==='"'){field+='"';i+=2;continue;}inQ=false;i++;continue;}
      field+=ch;i++;continue;
    }
    if(ch==='"'){inQ=true;i++;continue;}
    if(ch===','){row.push(field);field='';i++;continue;}
    if(ch==='\n'){row.push(field);rows.push({cells:row});row=[];field='';i++;continue;}
    if(ch==='\r'){i++;continue;}
    field+=ch;i++;
  }
  if(field.length||row.length){row.push(field);rows.push({cells:row});}
  return rows.filter(function(r){return r.cells.some(function(x){return String(x||'').trim()!=='';});});
}
function aiTblParseMD(text){
  var out=[],lines=String(text||'').split(/\r?\n/);
  lines.forEach(function(ln){
    ln=ln.trim();if(!ln||ln.charAt(0)!=='|')return;
    var cells=ln.replace(/^\|/,'').replace(/\|$/,'').split('|').map(function(c){return c.trim().replace(/\\\|/g,'|');});
    if(cells.length&&/^:?-+:?$/.test(cells[0].replace(/\s/g,'')))return;
    out.push({cells:cells});
  });
  return out;
}
function aiTblSetRows(sec,rows){
  var pj=currentProj();if(!pj)return;
  var d=pj.data[sec];if(!d)d=pj.data[sec]={};
  d.rows=rows;if(d.colWidths)d.colWidths=[];
  save();render();aiToast('表格已更新');
}
function aiTblAddCol(sec){
  var pj=currentProj();if(!pj)return;
  var d=pj.data[sec];if(!d||!d.rows||!d.rows.length)return;
  d.rows.forEach(function(r){r.cells=r.cells||[];r.cells.push('');});
  if(d.colWidths)d.colWidths.push(120);
  save();render();
}
function aiTblAddRow(sec){
  var pj=currentProj();if(!pj)return;
  var d=pj.data[sec];if(!d||!d.rows||!d.rows.length)return;
  var n=d.rows[0].cells.length,cells=[];for(var j=0;j<n;j++)cells.push('');
  d.rows.push({cells:cells});save();render();
}
function aiTblDelCol(sec){
  var pj=currentProj();if(!pj)return;
  var d=pj.data[sec];if(!d||!d.rows||!d.rows.length)return;
  if(d.rows[0].cells.length<=1){aiToast('至少保留一列');return;}
  d.rows.forEach(function(r){if(r.cells&&r.cells.length)r.cells.pop();});
  if(d.colWidths&&d.colWidths.length)d.colWidths.pop();
  save();render();
}
function aiTblDelRow(sec){
  var pj=currentProj();if(!pj)return;
  var d=pj.data[sec];if(!d||!d.rows||d.rows.length<=2){aiToast('至少保留一行数据');return;}
  d.rows.pop();save();render();
}
function aiTblImport(sec,kind){
  if(!editing){aiToast('请先进入编辑模式再导入');return;}
  var inp=document.createElement('input');inp.type='file';
  inp.accept=kind==='csv'?'text/csv,.csv':'text/markdown,.md,.txt';
  inp.onchange=function(){
    var f=inp.files&&inp.files[0];if(!f)return;
    var rd=new FileReader();
    rd.onload=function(){var txt=String(rd.result||'');var rows=kind==='csv'?aiTblParseCSV(txt):aiTblParseMD(txt);if(!rows.length){aiToast('未解析到表格内容');return;}aiTblSetRows(sec,rows);};
    rd.readAsText(f);
  };
  inp.click();
}

function aiBoot(){
  aiInjectStyle();
  aiInjectSettingsTab();
  aiInjectButtons();
  aiInjectPanel();
  aiBind();
  aiWrapImport();
  aiWrapLoadSample();
  aiWrapSave();
  aiRecoverFromBackup();
}

/* ---------- 对外 ---------- */
window.__AICtrl={
  boot:aiBoot,
  openPanel:function(){aiUi.open=true;var p=document.getElementById('aiPanel');if(p){p.classList.add('open');p.style.transform='translateX(0)';}aiUpdateButtonVisibility();aiRenderPanel();},
  closePanel:aiClosePanel,
  togglePanel:aiTogglePanel,
  renderPanel:aiRenderPanel,
  getSettings:aiGetSettings,
  privacyConfirm:function(meta){return aiPrivacyConfirm(meta,aiGetSettings());},
  runScore:aiRunScore,
  runOptimize:aiRunOptimize,
  runAlign:aiAlign,
  runGen:aiGenStart,
  openGen:aiOpenGenModal,
  stop:aiAbortRun,
  isBusy:function(){return aiBusy;},
  restoreToVersion:aiRestoreToVersion,
  _test:{
    state:aiState,
    createVersion:aiCreateVersion,
    decideDiff:aiDecideDiff,
    acceptAll:aiAcceptAll,
    finalizePending:aiFinalizePending,
    restore:aiRestoreToVersion,
    prune:aiPruneVersions,
    toggleIgnore:aiToggleIgnore,
    docText:aiDocText,
    sanitize:aiSanitizeHtml,
    normChange:aiNormChange,
    validate:aiValidateChange,
    evalDelta:aiEvalRuleDelta,
    applyEdits:aiApplyEdits,
    rowExec:aiRowExec,
    balanced:aiHtmlBalanced,
    blocks:aiBlocksOf,
    alignHint:aiAlignHint,
    secText:aiSecText,
    docTextNoCards:function(){return aiDocTextOpt(true);},
    normMove:aiNormMove,
    validateMove:aiValidateMove,
    decideAlign:aiDecideAlign,
    acceptAllAlign:aiAcceptAllAlign,
    finalizeAlign:aiFinalizeAlign,
    applyAlignItem:aiApplyAlignItem,
    undoDiff:aiUndoDiffItem,
    applyDiffNow:aiApplyDiffItemNow,
    genSection:aiGenSection,
    genStart:aiGenStart,
    genPrompt:aiGenSectionPrompt,
    styleGuide:aiGenStyleGuide,
    chunkDoc:aiChunkDoc,
    scoreChunked:aiScoreChunked,
    scoreNormalize:aiScoreNormalize,
    mdToHtml:aiMdToHtml,
    normItems:aiGenNormItems,
    normRows:aiGenNormRows,
    privacyMeta:aiPrivacyMeta,
    privacyConfirm:aiPrivacyConfirm,
    privacySeen:function(){return aiPrivacySeen;},
    clearPrivacySeen:function(){aiPrivacySeen={};try{localStorage.removeItem(AI_PRIVACY_ACK_KEY);}catch(e){}},
    backup:aiBackupState,
    recover:aiRecoverFromBackup,
    recoverOffer:function(){return aiRecoverOffer;},
    sampleText:function(){return AI_SAMPLE_TEXT;}
  }
};
aiBoot();
})();

