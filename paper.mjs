import {updateCharts} from './paper-charts.mjs?v=be1v1';
import {holdModel,pnlModel,entryDelay,formatDuration,formatUTC,formatSOL,formatPercent,safeLinks,selectPositions,countModel} from './paper-table-model.mjs?v=be1v1';
const feed='https://raw.githubusercontent.com/RamonHitramon/sol100be/refs/heads/paper-feed/live-paper.json';
const $=id=>document.getElementById(id);
const sol=v=>Number(v).toFixed(3)+' SOL';
const at=t=>t?new Date(t*1000).toLocaleString('ru-RU',{timeZone:'UTC'})+' UTC':'—';
const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
const field=(list,key,value)=>{const line=el('div');line.append(el('dt',key),el('dd',value));list.append(line);};
let state=null,busy=false;
function render(){
 const s=state,age=Date.now()/1000-s.updated_at,stale=age>300;
 $('status').textContent=(s.run_status==='stopped'?'■ Эксперимент завершён · ':stale?'⚠ Снимок устарел. ':'● Демо работает · ')+at(s.stopped_at||s.updated_at)+(s.run_id?' · '+s.run_id:'')+' · коллов: '+s.signals;
 $('status').className=stale?'warning':'muted';$('wallets').replaceChildren();
 const active=s.wallets.filter(w=>!w.disabled).length;
 $('active-strategies').textContent=`Активных стратегий: ${active}. Новые коллы → реальные котировки Jupiter → виртуальные сделки; без подбора по будущему максимуму.`;
 $('active-rules').textContent=`BE1 — отдельный тест: ${active} независимых свежих счёта. Не продолжение R4. TP30 baseline против TP30BE; данные не заимствуются из R4.`;
 for(const option of $('filter').options){option.dataset??={};option.dataset.label??=option.textContent;option.textContent=option.dataset.label+(s.config?.disabled_strategies?.[option.value]?' · архив':'');}
 for(const w of s.wallets){const card=el('article',undefined,'card');card.append(el('h3',w.name+(w.disabled?' · архив':'')),el('small',w.disabled?'Архив · без новых входов/выходов; оценка заморожена':'Оценка счёта с расходами'),el('div',sol(w.equity_sol),w.disabled?'big muted':'big'),el('div',(w.net_sol>=0?'+':'')+sol(w.net_sol)+' · '+(w.net_sol*100).toFixed(2)+'%',w.disabled?'muted':w.net_sol>=0?'pos':'neg'));if(w.disabled)card.append(el('small','Заморожено: '+formatUTC(w.disabled_at).replace('\n',' · ')));const dl=el('dl');field(dl,'Свободно',sol(w.cash_sol));field(dl,'Реализовано',sol(w.realised_sol));field(dl,'Открыто / закрыто',w.open+' / '+w.closed);field(dl,'Пропущено',w.skipped);if(w.stale)field(dl,'Устаревшие оценки',w.stale);card.append(dl);$('wallets').append(card);}
 renderTrades(s);
 const h=s.health||{};$('health').textContent='Запуск: '+at(s.started_at)+' · RAM процесса: '+((s.memory_rss_kib||0)/1024).toFixed(1)+' МиБ · Последняя успешная котировка: '+at(h.last_quote_ok)+' · Зафиксированных разрывов мониторинга: '+(h.gap_count||0)+(h.last_error?' · Последнее событие: '+h.last_error.stage+' / '+h.last_error.error+' / '+at(h.last_error.at):'');
 $('download').href=feed;updateCharts(s);
}
export function renderTrades(s){
 const ps=selectPositions(s.positions,{strategy:$('filter').value,status:$('status-filter').value,sort:$('sort').value},s.updated_at);
 const body=$('positions');body.replaceChildren();
 const count=countModel(s,ps.length);
 $('trade-count').textContent=`Показано ${count.shown} из ${count.loaded} в снимке · всего ${count.total}`+(count.truncated?' · Feed: только последние 200; фильтры и сортировка по загруженным строкам.':'');
 $('trade-asof').textContent='As of: '+formatUTC(s.updated_at).replace('\n',' · ')+' · HOLD открытых рассчитан на время снимка; FROZEN — до frozen_at (без даты: —). Замороженный PnL не является текущей котировкой.';
 if(!ps.length){const row=el('tr'),cell=el('td',s.signals?'В этом фильтре пока нет сделок.':'Ожидаем первый новый подходящий колл. Старые сигналы задним числом не покупаются.','empty');cell.colSpan=9;row.append(cell);body.append(row);}
 for(const p of ps){
  const row=el('tr'),token=el('th',undefined,'token-cell');token.scope='row';token.append(el('strong',p.symbol||'—','token-name'));
  const links=safeLinks(p),linksRow=el('div',undefined,'token-links');
  for(const [label,url] of [['GMGN ↗',links.gmgn],['TG ↗',links.telegram]]){const link=el(url?'a':'span',url?label:label.replace(' ↗',' —'));if(url){link.href=url;link.target='_blank';link.rel='noopener noreferrer';}else link.className='muted';linksRow.append(link);}
  token.title=p.address||'Mint отсутствует';token.append(linksRow);row.append(token);
  const archived=p.strategy_disabled===true||s.wallets.find(w=>w.id===p.strategy)?.disabled||Boolean(s.config?.disabled_strategies?.[p.strategy]);
  const frozen=p.strategy_disabled===true&&p.closed==null;
  const name=(s.wallets.find(w=>w.id===p.strategy)?.name||p.strategy||'—')+(p.strategy==='tp30be'?(p.armed?' · ARMED':' · не активирован'):'')+(archived?' · архив':'');const strategy=el('td',name,'strategy-cell');
  strategy.title=name;row.append(strategy);
  row.append(el('td',formatUTC(p.signal_at),'utc'),el('td',formatUTC(p.opened),'utc'),el('td',formatDuration(entryDelay(p)),'numeric'));
  const exit=el('td',p.closed==null?(frozen?'FROZEN':'OPEN'):formatUTC(p.closed),p.closed==null?'muted':'utc');exit.title=frozen?'Заморожено: '+formatUTC(p.frozen_at).replace('\n',' · '):p.reason||'Открытая виртуальная позиция';row.append(exit);
  const hold=holdModel(p,s.updated_at);row.append(el('td',formatDuration(hold.seconds),'numeric '+hold.tone));
  const pnl=pnlModel(p,s.updated_at),cell=el('td',undefined,'numeric '+(frozen||pnl.net===null?'muted':pnl.net>0?'pos':pnl.net<0?'neg':'muted'));
  cell.append(el('div',(pnl.approx?'≈ ':'')+formatSOL(pnl.net)));
  if(pnl.approx){cell.append(el('small',frozen?'frozen · ≈ замороженная оценка':pnl.stale?'⚠ stale / нет свежей оценки':'mark · as of snapshot',frozen?'muted':pnl.stale?'warning':'muted'));cell.title='Оценка от '+formatUTC(p.last_seen).replace('\n',' · ')+'; max(0, last_mark × 0.99 − 0.00005) − cost. Не исполненная продажа.';}
  // Column order: token, strategy, signal, entry, delay, exit, HOLD, PnL SOL, PnL %.
  const percent=el('td',(pnl.approx?'≈ ':'')+formatPercent(pnl.percent),'numeric '+(frozen||pnl.net===null?'muted':pnl.net>0?'pos':pnl.net<0?'neg':'muted'));
  row.append(cell,percent);body.append(row);
 }
}
async function refresh(){if(busy)return;busy=true;$('refresh').disabled=true;try{const r=await fetch(feed+'?v='+Math.floor(Date.now()/60000),{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);const s=await r.json();if(s.mode!=='PAPER_ONLY'||!Array.isArray(s.wallets))throw Error('Неверный формат снимка');state=s;$('error').textContent=s.data_quality?.legacy_quote_outages?'⚠ Earlier quote gaps: results are provisional, not a clean strategy comparison.':'';render();}catch(e){$('error').textContent='Не удалось получить свежий снимок: '+e.message;if(state)render();}finally{busy=false;$('refresh').disabled=false;}}
$('refresh').addEventListener('click',refresh);for(const id of ['filter','status-filter','sort'])$(id).addEventListener('change',()=>state&&renderTrades(state));refresh();setInterval(refresh,60000);
