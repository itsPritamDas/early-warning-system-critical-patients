(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const TICK_MS = 1450;
  const MAX_TICKS = 60;
  const TOTAL_MINUTES = 12;
  const METRICS = [
    { key: 'heartRate', name: 'Heart rate', short: 'HR', unit: 'bpm', range: '60–100', icon: '♥', min: 40, max: 180 },
    { key: 'spo2', name: 'Oxygen saturation', short: 'SpO₂', unit: '%', range: '95–100', icon: '◉', min: 75, max: 100 },
    { key: 'sbp', name: 'Systolic blood pressure', short: 'SBP', unit: 'mmHg', range: '100–130', icon: '↕', min: 55, max: 180 },
    { key: 'dbp', name: 'Diastolic blood pressure', short: 'DBP', unit: 'mmHg', range: '60–85', icon: '↕', min: 30, max: 115 },
    { key: 'respiratoryRate', name: 'Respiratory rate', short: 'RR', unit: '/min', range: '12–20', icon: '≋', min: 6, max: 42 },
    { key: 'temperature', name: 'Temperature', short: 'Temp', unit: '°C', range: '36.1–37.5', icon: '♨', min: 34, max: 41 },
    { key: 'lactate', name: 'Lactate', short: 'Lactate', unit: 'mmol/L', range: '0.5–2.0', icon: '◈', min: 0, max: 8 },
    { key: 'creatinine', name: 'Creatinine', short: 'Creat.', unit: 'mg/dL', range: '0.6–1.3', icon: '◌', min: 0.2, max: 5 },
    { key: 'wbc', name: 'White blood cells', short: 'WBC', unit: '×10⁹/L', range: '4.0–11.0', icon: '⊙', min: 1, max: 35 },
    { key: 'platelets', name: 'Platelets', short: 'PLT', unit: '×10⁹/L', range: '150–400', icon: '●', min: 20, max: 500 },
    { key: 'gcs', name: 'Glasgow Coma Scale', short: 'GCS', unit: '/15', range: '13–15', icon: '◉', min: 3, max: 15 }
  ];
  const BASE = { heartRate: 78, spo2: 98, sbp: 122, dbp: 78, respiratoryRate: 16, temperature: 36.8, lactate: 1.1, creatinine: 0.9, wbc: 7.2, platelets: 238, gcs: 15 };
  const state = { scenario: 'stable', running: false, timer: null, tick: 0, history: [], alerts: [], lastStatus: 'stable', current: { ...BASE }, toastTimer: null };
  const canvas = $('trendChart');
  const ctx = canvas.getContext('2d');

  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
  function jitter(scale = 1) { return (Math.random() - 0.5) * scale; }
  function roundValue(key, n) { return Number(n.toFixed(['temperature','lactate','creatinine'].includes(key) ? 1 : 0)); }
  function timeLabel(tick) { const min = tick * TOTAL_MINUTES; const h = Math.floor(min / 60); const m = min % 60; return `T+${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`; }
  function clockLabel(tick) { const min = tick * TOTAL_MINUTES; return `${String(Math.floor(min / 60)).padStart(2,'0')}:${String(min % 60).padStart(2,'0')}`; }

  function synthesizeVitals(t) {
    const x = clamp(t / (MAX_TICKS - 1), 0, 1);
    const v = { ...BASE };
    if (state.scenario === 'sepsis') {
      const slow = Math.pow(x, 1.15);
      v.heartRate += 44 * slow; v.spo2 -= 5.5 * slow; v.sbp -= 37 * slow; v.dbp -= 16 * slow;
      v.respiratoryRate += 16 * slow; v.temperature += 2.0 * slow; v.lactate += 4.7 * slow;
      v.creatinine += 1.15 * slow; v.wbc += 12.5 * slow; v.platelets -= 105 * slow; v.gcs -= 3 * slow;
    } else if (state.scenario === 'cardiac') {
      const onset = clamp((x - 0.24) / 0.36, 0, 1);
      const acute = clamp((x - 0.56) / 0.19, 0, 1);
      v.heartRate += 12 + 53 * onset + 18 * Math.sin(t * 1.65) * onset;
      v.spo2 -= 1 + 8 * onset; v.sbp -= 7 + 44 * onset; v.dbp -= 3 + 18 * onset;
      v.respiratoryRate += 2 + 11 * onset; v.temperature += 0.12 * x; v.lactate += 0.4 + 3.6 * onset;
      v.creatinine += 0.45 * acute; v.wbc += 1.4 * onset; v.platelets -= 25 * acute; v.gcs -= 4.5 * acute;
    }
    const noise = state.scenario === 'stable' ? 1 : 1.6;
    v.heartRate += jitter(5 * noise); v.spo2 += jitter(1.5 * noise); v.sbp += jitter(5 * noise); v.dbp += jitter(4 * noise);
    v.respiratoryRate += jitter(2.4 * noise); v.temperature += jitter(0.28 * noise); v.lactate += jitter(0.3 * noise);
    v.creatinine += jitter(0.14); v.wbc += jitter(1.1); v.platelets += jitter(15); v.gcs += jitter(0.5);
    const limits = { heartRate:[35,200], spo2:[60,100], sbp:[45,200], dbp:[25,130], respiratoryRate:[4,50], temperature:[33,42], lactate:[0.2,12], creatinine:[0.2,9], wbc:[0.2,60], platelets:[5,650], gcs:[3,15] };
    for (const m of METRICS) v[m.key] = roundValue(m.key, clamp(v[m.key], ...limits[m.key]));
    return v;
  }

  function getSeverity(key, v) {
    const ranges = {
      heartRate: v.heartRate > 130 ? 2 : v.heartRate > 100 || v.heartRate < 50 ? 1 : 0,
      spo2: v.spo2 < 88 ? 2 : v.spo2 < 95 ? 1 : 0,
      sbp: v.sbp < 80 ? 2 : v.sbp < 100 || v.sbp > 180 ? 1 : 0,
      dbp: v.dbp < 45 ? 2 : v.dbp < 60 || v.dbp > 110 ? 1 : 0,
      respiratoryRate: v.respiratoryRate > 30 || v.respiratoryRate < 8 ? 2 : v.respiratoryRate > 20 || v.respiratoryRate < 12 ? 1 : 0,
      temperature: v.temperature > 39.5 || v.temperature < 35 ? 2 : v.temperature > 37.5 || v.temperature < 36 ? 1 : 0,
      lactate: v.lactate >= 4 ? 2 : v.lactate > 2 ? 1 : 0,
      creatinine: v.creatinine >= 3 ? 2 : v.creatinine > 1.3 ? 1 : 0,
      wbc: v.wbc > 20 || v.wbc < 2 ? 2 : v.wbc > 11 || v.wbc < 4 ? 1 : 0,
      platelets: v.platelets < 50 ? 2 : v.platelets < 150 ? 1 : 0,
      gcs: v.gcs <= 8 ? 2 : v.gcs < 13 ? 1 : 0
    };
    return ranges[key] ?? 0;
  }
  function calculateRisk(v, prev) {
    const weights = { heartRate: 0.11, spo2: 0.16, sbp: 0.17, dbp: 0.04, respiratoryRate: 0.12, temperature: 0.06, lactate: 0.15, creatinine: 0.05, wbc: 0.06, platelets: 0.04, gcs: 0.04 };
    let risk = 4;
    for (const m of METRICS) {
      const sev = getSeverity(m.key, v);
      risk += sev * weights[m.key] * 100;
      if (prev && Math.abs(v[m.key] - prev[m.key]) > 0) {
        const diff = Math.abs(v[m.key] - prev[m.key]);
        const scale = m.key === 'lactate' ? 1.2 : m.key === 'temperature' ? 1.4 : m.key === 'spo2' ? 2 : 10;
        risk += Math.min(2.5, diff / scale) * weights[m.key] * 10;
      }
    }
    if (state.scenario === 'sepsis') risk += 12 * (state.tick / MAX_TICKS);
    if (state.scenario === 'cardiac') risk += 8 * (state.tick / MAX_TICKS);
    return Math.round(clamp(risk, 4, 96));
  }
  function statusFor(risk) { return risk >= 70 ? 'critical' : risk >= 40 ? 'warning' : 'stable'; }
  function statusText(status) { return status === 'critical' ? 'Critical risk' : status === 'warning' ? 'Elevated risk' : 'Low risk'; }
  function scenarioName() { return state.scenario === 'sepsis' ? 'Sepsis progression' : state.scenario === 'cardiac' ? 'Cardiac event' : 'Stable baseline'; }

  function renderVitals(v) {
    $('vitalsBody').innerHTML = METRICS.map((m) => {
      const sev = getSeverity(m.key, v); const klass = sev === 2 ? 'critical' : sev === 1 ? 'warning' : 'normal';
      const label = sev === 2 ? 'High deviation' : sev === 1 ? 'Out of range' : 'In range';
      const formatted = m.key === 'temperature' || m.key === 'lactate' || m.key === 'creatinine' ? v[m.key].toFixed(1) : String(v[m.key]);
      const prev = state.history.length > 1 ? state.history[state.history.length - 2].vitals[m.key] : v[m.key];
      const delta = v[m.key] - prev; const trend = Math.abs(delta) < (m.key === 'temperature' || m.key === 'lactate' ? .15 : 1) ? 'flat' : delta > 0 ? 'up' : 'down';
      const glyph = trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→';
      const readClass = sev === 2 ? 'reading-critical' : sev === 1 ? 'reading-high' : '';
      const seed = state.history.slice(-8).map(h => h.vitals[m.key]);
      const spark = drawSpark(seed.length ? seed : [v[m.key]], trend, klass);
      return `<tr><td><div class="vital-name"><span class="vital-symbol">${m.icon}</span>${m.name}</div></td><td class="vital-reading ${readClass}">${formatted}<span class="unit">${m.unit}</span></td><td>${m.range}</td><td><span class="status-chip ${klass}">${label}</span></td><td><div style="display:flex;align-items:center;gap:7px"><span class="trend-${trend}">${glyph}</span>${spark}</div></td></tr>`;
    }).join('');
  }
  function drawSpark(values, trend, klass) {
    const w=73,h=22,p=2; const mn=Math.min(...values)-0.001,mx=Math.max(...values)+0.001; const span=mx-mn || 1;
    const points=values.map((v,i)=>`${p+(i/Math.max(1,values.length-1))*(w-2*p)},${h-p-((v-mn)/span)*(h-2*p)}`).join(' ');
    const color=klass==='critical'?'#ff7285':klass==='warning'?'#ffbf69':'#42e0c1';
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" aria-hidden="true"><polyline points="${points}" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }

  function renderContributions(v) {
    const sorted = METRICS.map(m => ({ name:m.short, sev:getSeverity(m.key,v), key:m.key })).map(a => ({...a, value:a.sev*35 + (a.sev===0?Math.abs(v[a.key]-BASE[a.key])/(Math.abs(BASE[a.key])||1)*12:0)})).sort((a,b)=>b.value-a.value).slice(0,6);
    const max = Math.max(1,...sorted.map(x=>x.value));
    $('contributionList').innerHTML = sorted.map(item => { const pct=Math.round(item.value/max*100); const color=pct>80?'hot':pct>45?'warm':''; return `<div class="contribution-row"><span class="contribution-name">${item.name}</span><div class="contribution-track"><div class="contribution-fill ${color}" style="width:${pct}%"></div></div><span class="contribution-pct">${Math.round(item.value)} pts</span></div>`; }).join('');
  }

  function drawChart() {
    const rect = canvas.getBoundingClientRect(); if (!rect.width || !rect.height) return;
    const dpr = window.devicePixelRatio || 1; canvas.width = Math.round(rect.width*dpr); canvas.height = Math.round(rect.height*dpr); ctx.setTransform(dpr,0,0,dpr,0,0);
    const w=rect.width,h=rect.height; ctx.clearRect(0,0,w,h);
    const pad={l:35,r:12,t:15,b:25}; const pw=w-pad.l-pad.r, ph=h-pad.t-pad.b;
    const metric=$('trendMetric').value; const riskMode=metric==='risk'; const points=state.history.map(x=>riskMode?x.risk:x.vitals[metric]);
    const config={risk:{min:0,max:100,label:'INDEX',color:'#42e0c1'},heartRate:{min:40,max:160,label:'BPM',color:'#42e0c1'},spo2:{min:75,max:100,label:'%',color:'#82bdff'},sbp:{min:50,max:170,label:'MMHG',color:'#ffbf69'},respiratoryRate:{min:6,max:38,label:'/MIN',color:'#b1a9ff'},lactate:{min:0,max:7,label:'MMOL/L',color:'#ff8998'}}[metric];
    ctx.font='9px "DM Mono", monospace'; ctx.textBaseline='middle';
    for(let i=0;i<=4;i++){const y=pad.t+(ph*i/4);ctx.strokeStyle='rgba(136,164,189,.13)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(w-pad.r,y);ctx.stroke();ctx.fillStyle='#607b92';const val=Math.round(config.max-(config.max-config.min)*i/4);ctx.textAlign='right';ctx.fillText(String(val),pad.l-8,y);}
    for(let i=0;i<=4;i++){const x=pad.l+(pw*i/4);ctx.strokeStyle='rgba(136,164,189,.07)';ctx.beginPath();ctx.moveTo(x,pad.t);ctx.lineTo(x,h-pad.b);ctx.stroke();ctx.fillStyle='#607b92';ctx.textAlign=i===0?'left':i===4?'right':'center';const idx=Math.round((Math.max(0,state.history.length-1))*i/4);ctx.fillText(state.history.length?timeLabel(idx).replace('T+',''):['00:00','', '', '', ''][i],x,h-pad.b+14);}
    ctx.fillStyle='#536f87';ctx.textAlign='left';ctx.fillText(config.label,pad.l,pad.t-5);
    if(!points.length){ctx.fillStyle='#617d93';ctx.textAlign='center';ctx.font='11px Manrope, sans-serif';ctx.fillText('Run the simulation to build the trend line',pad.l+pw/2,pad.t+ph/2);return;}
    if(riskMode){const y40=pad.t+ph-(40-config.min)/(config.max-config.min)*ph;const y70=pad.t+ph-(70-config.min)/(config.max-config.min)*ph;ctx.fillStyle='rgba(255,191,105,.045)';ctx.fillRect(pad.l,y70,pw,y40-y70);ctx.fillStyle='rgba(255,114,133,.04)';ctx.fillRect(pad.l,pad.t,pw,y70-pad.t);}
    const coords=points.map((val,i)=>({x:pad.l+(points.length===1?.5:i/(points.length-1))*pw,y:pad.t+ph-((val-config.min)/(config.max-config.min))*ph}));
    ctx.beginPath();coords.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.lineTo(coords[coords.length-1].x,pad.t+ph);ctx.lineTo(coords[0].x,pad.t+ph);ctx.closePath();const grad=ctx.createLinearGradient(0,pad.t,0,h-pad.b);grad.addColorStop(0,config.color+'30');grad.addColorStop(1,config.color+'00');ctx.fillStyle=grad;ctx.fill();
    ctx.beginPath();coords.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.strokeStyle=config.color;ctx.lineWidth=2;ctx.lineJoin='round';ctx.lineCap='round';ctx.shadowColor=config.color+'70';ctx.shadowBlur=6;ctx.stroke();ctx.shadowBlur=0;
    const last=coords[coords.length-1];ctx.beginPath();ctx.arc(last.x,last.y,3.5,0,Math.PI*2);ctx.fillStyle=config.color;ctx.fill();ctx.beginPath();ctx.arc(last.x,last.y,7,0,Math.PI*2);ctx.strokeStyle=config.color+'50';ctx.lineWidth=1;ctx.stroke();
  }

  function renderAlerts() {
    const count=state.alerts.filter(a=>a.kind!=='resolved').length;
    $('alertCount').textContent=String(count);$('eventCounter').textContent=String(state.alerts.length).padStart(2,'0');$('alertBar').style.width=`${Math.min(100,count*22)}%`;
    $('alertStatus').textContent=count===0?'No active alerts':count===1?'1 active alert':`${count} active alerts`;
    if(!state.alerts.length){$('alertList').innerHTML='<div class="empty-state"><span class="empty-icon">⌁</span><b>No alerts recorded</b><span>Run a scenario to see simulated events here.</span></div>';return;}
    $('alertList').innerHTML=state.alerts.slice(0,18).map(a=>`<div class="alert-event ${a.kind}"><span class="alert-event-icon">${a.kind==='critical'?'!':a.kind==='warning'?'△':'✓'}</span><div><b>${a.title}</b><p>${a.detail}</p></div><time>${a.time}</time></div>`).join('');
  }

  function renderDashboard(v,risk) {
    const status=statusFor(risk); $('riskValue').textContent=String(risk).padStart(2,'0');$('gaugeLabel').textContent=String(risk).padStart(2,'0');$('riskLabel').textContent=statusText(status);$('riskCaption').textContent=status==='critical'?'High-deviation pattern':status==='warning'?'Change detected':'Stable pattern';
    const dot=$('riskDot');dot.className=`state-dot ${status==='stable'?'stable':status}`;
    const gauge=$('gaugeProgress');gauge.style.strokeDashoffset=String(270.18-(risk/100)*270.18);gauge.style.stroke=status==='critical'?'#ff7285':status==='warning'?'#ffbf69':'#42e0c1';
    $('riskTrend').textContent=state.history.length>2&&risk>state.history[state.history.length-2].risk+2?'↗ Rising risk signal':status==='stable'?'→ No major deviation':'→ Elevated signal';$('riskTrend').style.color=status==='critical'?'#ff8998':status==='warning'?'#ffbf69':'#91d5c7';
    const observedTick=state.history.length?state.history[state.history.length-1].tick:0;
    $('windowValue').innerHTML=`${clockLabel(observedTick)}<span>h</span>`;$('windowBar').style.width=`${(state.history.length/MAX_TICKS)*100}%`;$('tickValue').textContent=`${state.history.length} / ${MAX_TICKS} ticks`;
    $('recordingText').textContent=state.running?'Simulation running':state.history.length>=MAX_TICKS?'Simulation complete':state.tick?'Simulation paused':'Ready to run';$('recordingDot').classList.toggle('running',state.running);
    $('runIcon').textContent=state.running?'Ⅱ':'▶';$('runLabel').textContent=state.running?'Pause simulation':state.history.length>=MAX_TICKS?'Run again':state.tick?'Resume simulation':'Run simulation';
    $('lastUpdated').textContent=state.history.length?`Updated ${timeLabel(observedTick)}`:'Waiting for simulation';$('chartNow').textContent=timeLabel(observedTick);$('chartStart').textContent='T+00:00';
    const metric=$('trendMetric').value;const legend=$('chartLegend').querySelector('span:first-child');const label=metric==='risk'?'Risk index':METRICS.find(m=>m.key===metric)?.name||metric;legend.innerHTML=`<i class="legend-line risk-line" style="${metric==='risk'?'':'background:'+({heartRate:'#42e0c1',spo2:'#82bdff',sbp:'#ffbf69',respiratoryRate:'#b1a9ff',lactate:'#ff8998'}[metric]||'#42e0c1')}"></i> ${label}`;
    $('chartEmpty').hidden=state.history.length>0;renderVitals(v);renderContributions(v);renderAlerts();drawChart();
  }

  function addAlert(kind,title,detail) {
    state.alerts.unshift({kind,title,detail,time:timeLabel(state.tick)});
    state.alerts=state.alerts.slice(0,30);
  }
  function tick() {
    if(state.tick>=MAX_TICKS){stopSimulation();showToast('Simulation reached the end of its 60-tick window.');return;}
    const previous=state.history.length?state.history[state.history.length-1].vitals:null;
    const vitals=synthesizeVitals(state.tick);const risk=calculateRisk(vitals,previous);const status=statusFor(risk);const previousStatus=state.lastStatus;
    if(status!==previousStatus){
      if(status==='warning')addAlert('warning','Risk index entered elevated band',`${scenarioName()} · illustrative risk index ${risk}/100.`);
      else if(status==='critical')addAlert('critical','Risk index entered critical band',`${scenarioName()} · illustrative risk index ${risk}/100. Review synthetic vitals and trends.`);
      else if(previousStatus!=='stable')addAlert('resolved','Risk index returned to low band',`Illustrative risk index reduced to ${risk}/100.`);
    }
    if(previous&&state.tick%10===0&&state.scenario!=='stable'&&risk>=35)addAlert(status==='critical'?'critical':'warning','Trend checkpoint',`Tick ${state.tick}: risk index ${risk}/100; review the preceding time window.`);
    state.lastStatus=status;state.current=vitals;state.history.push({tick:state.tick,vitals,risk,status});state.tick+=1;
    renderDashboard(vitals,risk);
    if(state.tick>=MAX_TICKS)stopSimulation();
  }
  function stopSimulation() { if(state.timer){clearInterval(state.timer);state.timer=null;}state.running=false;if(state.history.length)renderDashboard(state.current,state.history[state.history.length-1].risk); }
  function startSimulation() { if(state.running)return;if(state.tick>=MAX_TICKS)resetSimulation();state.running=true;renderDashboard(state.current,state.history.length?state.history[state.history.length-1].risk:8);tick();if(state.tick<MAX_TICKS)state.timer=setInterval(tick,TICK_MS); }
  function toggleSimulation() { if(state.running){stopSimulation();showToast('Simulation paused.');}else{startSimulation();if(state.tick>1)showToast('Simulation resumed.');} }
  function resetSimulation() { if(state.timer)clearInterval(state.timer);state.timer=null;state.running=false;state.tick=0;state.history=[];state.alerts=[];state.lastStatus='stable';state.current={...BASE};renderDashboard(state.current,8);$('riskValue').textContent='08';$('gaugeLabel').textContent='08';$('chartEmpty').hidden=false;$('windowValue').innerHTML='00:00<span>h</span>'; }
  function showToast(message) {const el=$('toast');el.textContent=message;el.classList.add('visible');clearTimeout(state.toastTimer);state.toastTimer=setTimeout(()=>el.classList.remove('visible'),2500);}
  function exportSession() {
    if(!state.history.length){showToast('Run the simulation before exporting a session.');return;}
    const headers=['tick','elapsed_label','scenario','risk_index','risk_band',...METRICS.map(m=>m.key)];
    const rows=state.history.map(h=>[h.tick,timeLabel(h.tick),state.scenario,h.risk,h.status,...METRICS.map(m=>h.vitals[m.key])]);
    const csv=[headers,...rows].map(row=>row.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\r\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`sentinel-icu-${state.scenario}-${new Date().toISOString().slice(0,10)}.csv`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);showToast('Synthetic session CSV exported.');
  }

  $('runBtn').addEventListener('click',toggleSimulation);
  $('scenarioSelect').addEventListener('change',e=>{state.scenario=e.target.value;resetSimulation();showToast(`${scenarioName()} selected. Run the simulation to begin.`);});
  $('trendMetric').addEventListener('change',()=>{if(state.history.length)renderDashboard(state.current,state.history[state.history.length-1].risk);else drawChart();});
  $('exportBtn').addEventListener('click',exportSession);
  $('clearAlertsBtn').addEventListener('click',()=>{state.alerts=[];renderAlerts();showToast('Alert history cleared.');});
  $('dismissNotice').addEventListener('click',()=>document.querySelector('.notice-banner').remove());
  $('menuButton').addEventListener('click',()=>{const open=$('sidebar').classList.toggle('open');$('menuButton').setAttribute('aria-expanded',String(open));});
  document.querySelectorAll('.nav-link').forEach(a=>a.addEventListener('click',()=>{document.querySelectorAll('.nav-link').forEach(n=>n.classList.remove('active'));a.classList.add('active');$('sidebar').classList.remove('open');$('menuButton').setAttribute('aria-expanded','false');}));
  window.addEventListener('resize',drawChart);
  if('ResizeObserver' in window)new ResizeObserver(drawChart).observe(canvas.parentElement);
  resetSimulation();
})();
