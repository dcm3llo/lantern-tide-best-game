import { LEVELS, HARBOR, projected, routeEnd, isWater } from './model.mjs';
export const COLORS=['#80e4cf','#f3bd82','#bcb0ef'];
export const point=(x,y)=>[105+x*80,74+y*68];
function path(ctx,points,fill,stroke) {
  ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();
  if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.stroke();}
}
function island(ctx,x,y,seed,tall=false) {
  const pts=Array.from({length:9},(_,i)=>{const a=i*Math.PI*2/9,r=23+Math.sin(seed*7+i*3)*7;return [x+Math.cos(a)*r,y+Math.sin(a)*r*.66];});
  ctx.lineWidth=9;path(ctx,pts,'#2c5a61','#163d4a');
  ctx.lineWidth=1;path(ctx,pts,'#25454a','#5b7770');
  path(ctx,[[x-18,y+5],[x-4,y-23],[x+7,y-13],[x+20,y+7]],'#4a6461','#769088');
  path(ctx,[[x-4,y-23],[x+2,y-8],[x+7,y-13]],'#a1aaa0');
  ctx.fillStyle='#b8b794';ctx.fillRect(x-15,y+10,5,2);
}
function lighthouse(ctx,x,y,t) {
  const g=ctx.createRadialGradient(x,y-49,0,x,y-49,110);g.addColorStop(0,'#f9d88745');g.addColorStop(1,'#f9d88700');
  ctx.fillStyle=g;ctx.fillRect(x-110,y-160,220,220);
  ctx.save();ctx.translate(x,y-49);ctx.rotate(-.25+Math.sin(t*.18)*.14);
  const beam=ctx.createLinearGradient(0,0,-360,0);beam.addColorStop(0,'#f5d68955');beam.addColorStop(1,'#f5d68900');
  path(ctx,[[0,-3],[-440,-90],[-440,65],[0,3]],beam);ctx.restore();
  ctx.lineWidth=1;path(ctx,[[x-21,y+16],[x-12,y-33],[x+11,y-33],[x+21,y+16]],'#d8d4b5','#f5e6bc');
  path(ctx,[[x-16,y-5],[x+16,y-5],[x+13,y-16],[x-13,y-16]],'#c76c53');
  ctx.fillStyle='#102a36';ctx.fillRect(x-5,y+2,10,14);
  ctx.fillStyle='#233d43';ctx.fillRect(x-16,y-39,32,6);
  ctx.fillStyle='#f9d785';ctx.fillRect(x-11,y-54,22,15);
  path(ctx,[[x-19,y-54],[x,y-67],[x+19,y-54]],'#546d69','#a9b8a0');
  ctx.strokeStyle='#d6ce9a';ctx.beginPath();ctx.moveTo(x,y-67);ctx.lineTo(x,y-78);ctx.stroke();
}
function boat(ctx,b,color,selected,t) {
  const [x,y]=point(b.x,b.y);ctx.save();ctx.translate(x,y+Math.sin(t*2+b.id)*1.6);
  if(selected){ctx.strokeStyle=color;ctx.lineWidth=1.4;ctx.setLineDash([3,5]);ctx.beginPath();ctx.ellipse(0,1,29,23,0,0,7);ctx.stroke();ctx.setLineDash([]);}
  ctx.fillStyle='#020f1c65';ctx.beginPath();ctx.ellipse(0,15,23,7,0,0,7);ctx.fill();
  path(ctx,[[-20,3],[22,3],[11,16],[-12,16]],color,'#e1eee0');
  ctx.strokeStyle='#dfd8bd';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,3);ctx.lineTo(0,-24);ctx.stroke();
  path(ctx,[[2,-21],[2,0],[18,0]],'#f8e6ba');path(ctx,[[-3,-18],[-3,0],[-15,0]],'#aec7c0');
  ctx.fillStyle='#091e2a';ctx.font='bold 10px Segoe UI';ctx.textAlign='center';ctx.fillText(String(b.id+1),0,13);
  ctx.restore();
}
export function drawChart(canvas,s,selected,t=0) {
  const ctx=canvas.getContext('2d'),l=LEVELS[s.index];ctx.clearRect(0,0,860,560);
  const bg=ctx.createLinearGradient(0,0,860,560);bg.addColorStop(0,'#0c3143');bg.addColorStop(1,'#09202e');ctx.fillStyle=bg;ctx.fillRect(0,0,860,560);
  // Hand-built bathymetric contours, not imported assets.
  ctx.strokeStyle='#42717a18';ctx.lineWidth=1;
  for(let j=0;j<14;j++){ctx.beginPath();for(let x=-20;x<900;x+=6){const y=20+j*42+Math.sin(x*.009+j*.7)*22+Math.sin(x*.025)*5; x===-20?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.stroke();}
  for(let i=0;i<70;i++){const x=(i*139.7)%860,y=(i*79.3)%560;ctx.fillStyle='#a6d2cb18';ctx.fillRect(x,y,1.4,1.4);}
  ctx.font='9px Segoe UI';ctx.textAlign='center';ctx.fillStyle='#6a9298';
  for(let x=0;x<9;x++)ctx.fillText(String.fromCharCode(65+x),105+x*80,24);
  for(let y=0;y<7;y++)ctx.fillText(String(y+1),35,78+y*68);
  ctx.strokeStyle='#729e9c15';ctx.lineWidth=.7;
  for(let y=0;y<8;y++){ctx.beginPath();ctx.moveTo(65,40+y*68);ctx.lineTo(785,40+y*68);ctx.stroke();}
  for(let x=0;x<10;x++){ctx.beginPath();ctx.moveTo(65+x*80,40);ctx.lineTo(65+x*80,516);ctx.stroke();}
  // Haven island and tower sit in the target cell, with light over the open water.
  const [hx,hy]=point(...HARBOR);ctx.fillStyle='#2a504d';ctx.beginPath();ctx.ellipse(hx+35,hy+9,57,68,-.2,0,7);ctx.fill();
  ctx.strokeStyle='#e6c77a70';ctx.lineWidth=1;ctx.setLineDash([4,6]);ctx.beginPath();ctx.ellipse(hx,hy+17,34,30,0,0,7);ctx.stroke();ctx.setLineDash([]);
  lighthouse(ctx,hx+30,hy-4,t);ctx.fillStyle='#f0d58e';ctx.font='bold 8px Segoe UI';ctx.fillText('HAVEN',hx,hy+56);
  l.reefs.forEach(([x,y],i)=>{const p=point(x,y);island(ctx,...p,i+s.index*9);});
  l.currents.forEach(([x,y,dx,dy])=>{const [px,py]=point(x,y);ctx.save();ctx.translate(px,py);ctx.rotate(Math.atan2(dy,dx));
    ctx.strokeStyle='#6dd8c7';ctx.lineWidth=2;ctx.globalAlpha=.55+Math.sin(t*1.7+x)*.12;ctx.beginPath();ctx.moveTo(-18,0);ctx.lineTo(16,0);ctx.moveTo(8,-7);ctx.lineTo(16,0);ctx.lineTo(8,7);ctx.stroke();
    ctx.strokeStyle='#71d9c630';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-19,-10);ctx.lineTo(3,-10);ctx.moveTo(-19,10);ctx.lineTo(3,10);ctx.stroke();ctx.restore();});
  s.ships.forEach(b=>{
    if(b.safe)return;
    ctx.strokeStyle=COLORS[b.id];ctx.lineWidth=2.2;ctx.setLineDash([5,5]);ctx.globalAlpha=.65;ctx.beginPath();ctx.moveTo(...point(b.x,b.y));
    for(const [x,y] of b.route){ctx.lineTo(...point(x,y));const [a,c]=projected(s,x,y);ctx.lineTo(...point(a,c));}ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;
    if(b.route.length){const [x,y]=point(...routeEnd(s,b));ctx.fillStyle=COLORS[b.id];ctx.beginPath();ctx.arc(x,y,4,0,7);ctx.fill();}
  });
  const ship=s.ships[selected];
  if(ship&&!ship.safe&&s.status==='playing'){
    const [x,y]=routeEnd(s,ship);
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const a=x+dx,b=y+dy;if(!isWater(s,a,b)||!isWater(s,...projected(s,a,b)))continue;
      const [px,py]=point(a,b);ctx.strokeStyle='#e8e8bc55';ctx.lineWidth=1;ctx.beginPath();ctx.arc(px,py,8,0,7);ctx.stroke();ctx.fillStyle='#eee3b955';ctx.fillRect(px-1,py-1,2,2);
    }
  }
  s.ships.filter(b=>!b.safe).forEach(b=>boat(ctx,b,COLORS[b.id],b.id===selected,t));
  // Squall creeps across the left margin as the deadline approaches.
  const progress=s.turn/l.limit;ctx.fillStyle=`rgba(116,135,168,${progress*.17})`;
  for(let i=0;i<6;i++){ctx.beginPath();ctx.ellipse(-65+progress*125,50+i*105,55+progress*55,80,0,0,7);ctx.fill();}
  ctx.fillStyle='#8eafb07a';ctx.font='italic 11px Georgia';ctx.textAlign='left';ctx.fillText('The sea remembers every light.',69,544);
  ctx.textAlign='right';ctx.font='9px Segoe UI';ctx.fillText('L A N T E R N   T I D E',788,544);
}
export const towerSeal=`<svg class="seal" viewBox="0 0 200 300" aria-hidden="true"><circle cx="103" cy="120" r="86" fill="none" stroke="#50716c"/><circle cx="103" cy="120" r="71" fill="none" stroke="#50716c" stroke-dasharray="2 9"/><path d="M94 92L0 50V138Z" fill="#edca7920"/><path d="M108 92L200 50V138Z" fill="#edca7920"/><path d="M76 226L92 104H114L132 226Z" fill="#d3d4b8"/><path d="M84 164H123L120 145H87Z" fill="#c26f58"/><path d="M90 102V83H116V102" fill="#f2ce78"/><path d="M82 83L103 65L124 83Z" fill="#69847c"/><path d="M99 67V44" stroke="#e8c77b"/><path d="M99 226V201H110V226" fill="#173745"/><path d="M38 239Q75 219 113 233T180 239M30 255Q72 235 110 251T185 255M54 271Q94 256 155 270" fill="none" stroke="#6bc6b0" stroke-width="2"/><circle cx="103" cy="36" r="3" fill="#efce83"/></svg>`;
