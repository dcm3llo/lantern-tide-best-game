// Pure rescue simulation. Rendering and input never determine the rules.
export const WIDTH=9, HEIGHT=7, HARBOR=[8,3];
export const LEVELS=[
  {name:'The Glasswater',subtitle:'Learn to borrow the tide',limit:22,starts:[[0,1],[0,5]],reefs:[[3,2],[4,2],[4,3],[2,4],[5,5]],currents:[[2,1,1,0],[4,1,1,0],[6,1,0,1],[2,5,1,0],[4,4,1,0]]},
  {name:'Needle Passage',subtitle:'Three lights, one narrow crossing',limit:25,starts:[[0,0],[0,3],[0,6]],reefs:[[2,1],[2,2],[2,4],[4,3],[5,1],[5,5],[6,4]],currents:[[1,0,1,0],[3,0,1,0],[6,0,0,1],[1,3,0,-1],[3,2,1,0],[1,6,1,0],[3,6,1,0],[6,6,1,0]]},
  {name:'The Last Watch',subtitle:'Bring everyone home before the squall',limit:24,starts:[[0,1],[0,3],[0,5]],reefs:[[2,2],[3,2],[4,4],[5,4],[6,2],[6,5],[3,6]],currents:[[1,1,1,0],[3,1,1,0],[5,1,0,1],[1,3,1,0],[3,3,1,0],[6,3,1,0],[1,5,1,0],[3,5,0,-1],[7,5,0,-1]]}
];
export function createNight(index=0) {
  const l=LEVELS[index];
  return {index,turn:0,energy:8,hull:3,rescued:0,status:'playing',score:0,
    ships:l.starts.map(([x,y],id)=>({id,x,y,route:[],safe:false})),
    events:['Plot a route. Borrow the tide. Bring them home.']};
}
export function isWater(s,x,y) {
  return x>=0 && x<WIDTH && y>=0 && y<HEIGHT && !LEVELS[s.index].reefs.some(r=>r[0]===x&&r[1]===y);
}
export function projected(s,x,y) {
  const c=LEVELS[s.index].currents.find(c=>c[0]===x&&c[1]===y);
  return c?[x+c[2],y+c[3]]:[x,y];
}
export function routeEnd(s,ship) {
  return ship.route.length?projected(s,...ship.route.at(-1)):[ship.x,ship.y];
}
export function planStep(s,id,x,y) {
  const ship=s.ships[id];
  if(s.status!=='playing'||!ship||ship.safe)return false;
  const [a,b]=routeEnd(s,ship);
  if(Math.abs(a-x)+Math.abs(b-y)!==1||!isWater(s,x,y))return false;
  const [nx,ny]=projected(s,x,y);
  if(!isWater(s,nx,ny))return false;
  ship.route.push([x,y]);
  return true;
}
export function advance(s) {
  if(s.status!=='playing')return false;
  const moving=s.ships.filter(b=>!b.safe&&b.route.length);
  if(!moving.length||s.energy<moving.length)return false;
  s.events=[];
  for(const ship of moving){
    const [x,y]=ship.route.shift();
    [ship.x,ship.y]=projected(s,x,y);
    s.energy--;
    if(ship.x===HARBOR[0]&&ship.y===HARBOR[1]){
      ship.safe=true;ship.route=[];s.rescued++;s.score+=100;
      s.events.push(`Vessel ${ship.id+1} reached the lantern haven.`);
    }
  }
  for(let i=0;i<s.ships.length;i++)for(let j=i+1;j<s.ships.length;j++){
    const a=s.ships[i],b=s.ships[j];
    if(!a.safe&&!b.safe&&a.x===b.x&&a.y===b.y){s.hull--;s.events.push('Crossed signals! Hull integrity lost.');}
  }
  finishTurn(s);
  if(!s.events.length)s.events.push('The fleet follows your light.');
  return true;
}
function finishTurn(s) {
  s.turn++;
  if(s.ships.every(b=>b.safe)){s.status='won';s.score+=Math.max(0,LEVELS[s.index].limit-s.turn)*10+s.hull*25;}
  else if(s.hull<=0||s.turn>=LEVELS[s.index].limit){s.status='lost';s.events.push('The storm closed the passage.');}
}
// Non-mutating preview lets the keeper catch crossed signals before committing.
export function forecast(s) {
  const destinations=s.ships.filter(b=>!b.safe).map(b=>({id:b.id,p:b.route.length?projected(s,...b.route[0]):[b.x,b.y]}));
  const conflicts=[];
  for(let i=0;i<destinations.length;i++)for(let j=i+1;j<destinations.length;j++){
    const a=destinations[i],b=destinations[j];
    if(a.p[0]===b.p[0]&&a.p[1]===b.p[1]&&!(a.p[0]===8&&a.p[1]===3))conflicts.push([a.id,b.id]);
  }
  const cost=s.ships.filter(b=>!b.safe&&b.route.length).length;
  return {cost,conflicts,canSail:cost>0&&cost<=s.energy};
}
export function recharge(s) {
  if(s.status!=='playing')return false;
  s.energy=Math.min(8,s.energy+3);
  s.events=['Lantern recharged +3. The fleet holds; the storm draws nearer.'];
  finishTurn(s);
  return true;
}
