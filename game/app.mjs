import { LEVELS, createNight, planStep, advance, recharge, routeEnd, isWater, forecast } from './model.mjs';
import { drawChart, towerSeal } from './render.mjs';
import { sound, toggleMute } from './audio.mjs';
const $=id=>document.getElementById(id);
const names=['Wren','Morrow','Solace'];
let state=createNight(),selected=0,mode='title',total=0,toastTimer;
const overlay=$('overlay'),canvas=$('ocean');
function message(text){$('toast').textContent=text;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),2400);}
function hideOverlay(){overlay.classList.add('hidden');overlay.innerHTML='';}
function showCard(html,style=''){overlay.classList.remove('hidden');overlay.innerHTML=`<section class="card ${style}" role="dialog" aria-modal="true">${html}</section>`;overlay.querySelector('button')?.focus();}
function showTitle(){mode='title';update();showCard(`${towerSeal}<div class="content"><span class="eyebrow">AN ORIGINAL TACTICAL RESCUE GAME</span><h2>LANTERN<br><em>TIDE</em></h2><p class="lede">One light. Three nights.<br>A fleet that needs to find its way home.</p><button id="begin" class="primary">Begin the watch →</button><button id="learn">How to play</button><p class="fine">NO TIMER PRESSURE · THINK, PLOT, THEN SAIL</p></div>`);$('begin').onclick=()=>start(0,true);$('learn').onclick=()=>showGuide('title');}
function start(index,reset=false){if(reset)total=0;state=createNight(index);selected=0;mode='playing';hideOverlay();sound('charge');update();}
function showGuide(back=mode){mode='guide';showCard(`<span class="eyebrow">THE KEEPER'S FIELD GUIDE</span><h2>Let the tide do the work.</h2><ol><li><b>Select a vessel</b> on the chart, in the fleet list, or with 1–3. Click adjacent water cells to build its route. Arrow keys also plot. Small rings show legal next cells.</li><li><b>Borrow the turquoise currents.</b> Enter an arrow and it carries the ship one extra cell for free. Route from the arrow's landing cell, not the arrow itself.</li><li><b>Advance with Space.</b> Every routed vessel takes one step together, costing 1 charge each. Unrouted ships hold. Avoid ending two ships on the same cell: collisions cost a hull point.</li><li><b>Recharge with R:</b> regain 3 charge (max 8); ships hold, but the storm advances one turn. Every advance also costs one turn. C clears a route.</li><li><b>Rescue everyone</b> at the gold haven before the storm countdown reaches zero. Survive all three nights. P pauses; M mutes. Nothing moves until you decide.</li></ol><button class="primary" id="close-guide">${back==='title'?'Back to title':'Return to chart'}</button>`,'guide');$('close-guide').onclick=()=>{if(back==='title')showTitle();else{mode=back;hideOverlay();update();}};}
function togglePause(){if(mode==='playing'){mode='paused';showCard(`<span class="eyebrow">THE SEA CAN WAIT</span><h2>Watch paused.</h2><p class="lede">Your routes are safe. Take your time.</p><button class="primary" id="resume">Resume watch</button><button id="retry">Restart night</button>`);$('resume').onclick=togglePause;$('retry').onclick=()=>start(state.index);}else if(mode==='paused'){mode='playing';hideOverlay();}update();}
function result(){mode='result';const won=state.status==='won',final=won&&state.index===2; sound(won?'win':'lost');
  showCard(`${towerSeal}<div class="content"><span class="eyebrow">${won?'WATCH COMPLETE / '+String(state.index+1).padStart(2,'0'):'SIGNAL LOST'}</span><h2>${final?'Every light.<br><em>Home.</em>':won?'A safe<br><em>passage.</em>':'The sea<br><em>grew dark.</em>'}</h2><p class="lede">${final?'Eight vessels. Three nights. You held the last light against the tide.':won?'The fleet rests in the haven. Another watch is waiting beyond the headland.':'The storm reached the passage before every ship was safe. A shorter route could change the night.'}</p><div class="result-stats"><div><strong>${state.rescued}/${state.ships.length}</strong><span>VESSELS SAFE</span></div><div><strong>${total+state.score}</strong><span>KEEPER SCORE</span></div><div><strong>${state.turn}</strong><span>TURNS</span></div></div><button id="continue" class="primary">${final?'Play again ↻':won?'Next night →':'Retry night ↻'}</button><button id="restart">Restart entire watch</button><p class="fine">${won?'LIGHTS KEPT. PROMISES KEPT.':'TIP: MOVE SHIPS TOGETHER TO SAVE STORM TURNS.'}</p></div>`);
  $('continue').onclick=()=>{if(final)start(0,true);else if(won){total+=state.score;start(state.index+1);}else start(state.index);};$('restart').onclick=()=>start(0,true);update();
}
function select(id){if(mode!=='playing'||state.ships[id]?.safe)return;selected=id;sound('plot');update();}
function plot(x,y){if(mode!=='playing')return;
  if(planStep(state,selected,x,y)){sound('plot');update();}else{sound('error');message('Choose adjacent open water from the route endpoint.');}
}
function tick(kind){if(mode!=='playing')return;const was=state.rescued;
  const ok=kind==='charge'?recharge(state):advance(state);
  if(!ok){sound('error');message(state.ships.some(b=>b.route.length)?'Not enough charge. Recharge or clear a route.':'Plot at least one route before advancing.');return;}
  sound(state.rescued>was?'rescue':kind==='charge'?'charge':'sail');
  if(state.ships[selected].safe)selected=state.ships.find(b=>!b.safe)?.id??0;
  update();if(state.status!=='playing')result();
}
function update(){
  const l=LEVELS[state.index];$('app').dataset.mode=mode;$('app').dataset.status=state.status;$('app').dataset.night=state.index;$('app').dataset.turn=state.turn;
  $('night-label').textContent=`NIGHT ${String(state.index+1).padStart(2,'0')} / 03 · ${l.subtitle.toUpperCase()}`;
  $('night-name').textContent=l.name;$('rescued').textContent=`${state.rescued} / ${state.ships.length}`;
  $('storm').innerHTML=`${Math.max(0,l.limit-state.turn)} <small>turns</small>`;$('storm').classList.toggle('danger',l.limit-state.turn<=5);
  $('energy-text').textContent=`${state.energy} / 8`;$('energy').innerHTML=Array.from({length:8},(_,i)=>`<i class="bar ${i<state.energy?'on':''}"></i>`).join('');
  $('hull').textContent=Array.from({length:3},(_,i)=>i<state.hull?'◆':'◇').join(' ');
  $('fleet').innerHTML=state.ships.map(b=>`<button class="ship-button ${selected===b.id&&!b.safe?'selected':''}" data-ship="${b.id}" ${b.safe?'disabled':''} aria-pressed="${selected===b.id}"><b>${b.safe?'✓':String(b.id+1).padStart(2,'0')} · ${names[b.id]}</b><span>${b.safe?'In haven':b.route.length+' steps plotted'}</span></button>`).join('');
  $('fleet').querySelectorAll('button').forEach(b=>b.onclick=()=>select(+b.dataset.ship));
  $('log').textContent=state.events.join(' ');$('pause').textContent=mode==='paused'?'▶ Resume':'Ⅱ Pause';
  $('phase').textContent=mode==='paused'?'WATCH PAUSED':state.status==='playing'?'PLAN → COMMIT → RESCUE':state.status==='won'?'ALL LIGHTS HOME':'THE STORM ARRIVED';
  const preview=forecast(state),cost=preview.cost;
  $('forecast').textContent=preview.conflicts.length?'⚠ Crossed signals next turn. Clear or reroute a vessel.':cost>state.energy?'Low lantern charge. Recharge before sailing.':cost?`${cost} vessel${cost>1?'s':''} sailing · ${cost} charge · 1 storm turn`:'Plot a route to preview the fleet.';
  $('forecast').classList.toggle('danger',preview.conflicts.length>0||cost>state.energy);
  $('sail').innerHTML=`Advance fleet${cost?' · '+cost+' charge':''} <kbd>SPACE</kbd>`;
  $('hint').textContent=`${names[selected]} selected · ${state.ships[selected].route.length} steps queued · Click adjacent cells, or plot with arrow keys.`;
  for(const cell of $('grid').children){const x=+cell.dataset.x,y=+cell.dataset.y;const ship=state.ships.find(b=>!b.safe&&b.x===x&&b.y===y);cell.setAttribute('aria-label',`${String.fromCharCode(65+x)}${y+1}${ship?' vessel '+names[ship.id]:!isWater(state,x,y)?' reef':x===8&&y===3?' haven':' water'}`);cell.classList.toggle('invalid',!isWater(state,x,y));}
  drawChart(canvas,state,selected,performance.now()/1000);
}
for(let y=0;y<7;y++)for(let x=0;x<9;x++){
  const button=document.createElement('button');button.className='cell';button.dataset.x=x;button.dataset.y=y;
  button.onclick=()=>{const b=state.ships.find(b=>!b.safe&&b.x===x&&b.y===y);if(b)select(b.id);else plot(x,y);};$('grid').append(button);
}
$('sail').onclick=()=>tick('sail');$('charge').onclick=()=>tick('charge');
$('clear').onclick=()=>{if(mode==='playing'){state.ships[selected].route=[];update();sound('plot');}};
$('pause').onclick=togglePause;$('help').onclick=()=>{if(mode==='playing'||mode==='title')showGuide();};
$('home').onclick=e=>{e.preventDefault();if(mode==='title')return;if(mode==='playing')togglePause();};
$('mute').onclick=()=>{const muted=toggleMute();$('mute').textContent=muted?'♪ Sound off':'♪ Sound on';$('mute').setAttribute('aria-pressed',String(muted));};
window.addEventListener('keydown',e=>{
  const key=e.key.toLowerCase();
  if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(key))e.preventDefault();
  if(key==='m'){$('mute').click();return;}
  if(key==='p'||key==='escape'){if(mode==='playing'||mode==='paused')togglePause();return;}
  if(mode==='title'&&key==='enter'){start(0,true);return;}
  if(mode!=='playing')return;
  if(['1','2','3'].includes(key)){if(state.ships[+key-1])select(+key-1);return;}
  if(key===' '){tick('sail');return;}if(key==='r'){tick('charge');return;}if(key==='c'){$('clear').click();return;}
  const direction={arrowright:[1,0],arrowleft:[-1,0],arrowup:[0,-1],arrowdown:[0,1]}[key];
  if(direction){const [x,y]=routeEnd(state,state.ships[selected]);plot(x+direction[0],y+direction[1]);}
});
let lastFrame=0;function animate(now){if(now-lastFrame>40){drawChart(canvas,state,selected,mode==='paused'?0:now/1000);lastFrame=now;}requestAnimationFrame(animate);}
showTitle();requestAnimationFrame(animate);
