// Arena Rivals — Practice vs AI add-on.
// Load AFTER the main game script:  <script src="practice.js"></script>  (right before </body>)
(()=>{
const D=[{rt:.8,acc:.28,dmg:8,fr:.5,sp:4.2},{rt:.45,acc:.42,dmg:11,fr:.32,sp:5.2},{rt:.22,acc:.58,dmg:14,fr:.22,sp:6}];
const NAMES=["Bot Alpha","Bot Bravo","Bot Charlie","Bot Delta"];
const SP=[[0,29],[0,-29],[29,0],[-29,0],[20,20],[-20,-20],[20,-20],[-20,20]];
let bots=[],lv=D[1],on=0,lt=performance.now();
const eye=new THREE.Vector3(),tgt=new THREE.Vector3(),dir=new THREE.Vector3();

// ---- menu UI
const go=$("go"),lab=document.createElement("label"),sel=document.createElement("select"),pb=document.createElement("button");
sel.id="diff";sel.style.cssText="width:100%;box-sizing:border-box;padding:8px;margin:3px 0 8px;border-radius:6px;border:1px solid rgba(128,128,128,.5);background:var(--panel);color:var(--fg);font-size:14px";
["Easy","Normal","Hard"].forEach((n,i)=>{const o=document.createElement("option");o.value=i;o.textContent=n;if(i===1)o.selected=true;sel.appendChild(o)});
lab.append("Practice difficulty",sel);lab.style.cssText="display:block;margin-top:10px";
pb.id="prac";pb.textContent="🤖 Practice vs AI";pb.style.cssText="margin-top:4px;background:#3a6ea5";
go.after(lab,pb);
pb.onclick=()=>{if(!started){started=true;start()}go.onclick()};
go.addEventListener("click",()=>{if(!on){pb.style.display="none";lab.style.display="none"}});

// ---- helpers
function refresh(){peersNow=bots.map(b=>({peer:b.id,isMe:false,sameTab:false,presence:{n:b.n,k:b.k,d:b.d}}));score()}
function after(){setTimeout(()=>{bots.forEach(b=>{b.k=b.d=0});refresh()},5100)}
function spawnBot(b){let s=SP[0],best=-1;
 for(let i=0;i<3;i++){const c=SP[Math.random()*SP.length|0],d=Math.hypot(c[0]-me.p.x,c[1]-me.p.z);if(d>best){best=d;s=c}}
 b.p.set(s[0],0,s[1]);b.vy=0;b.gr=0;b.hp=100;b.alive=true;b.cd=1;b.aw=0;b.turn=0;b.yaw=Math.atan2(-(me.p.x-s[0]),-(me.p.z-s[1]));
 const r=remotes[b.id];r.tx=s[0];r.ty=0;r.tz=s[1];r.g.position.set(s[0],0,s[1]);r.g.visible=true}
function killBot(b){b.alive=false;b.d++;b.rt=3;remotes[b.id].g.visible=false;
 me.k++;coins+=25;save();wpTxt();feed(me.name+" ›› "+b.n);refresh();
 if(me.k>=10&&!wn){coins+=150;save();wpTxt();win(me.name);after()}}
function botScored(id){const b=bots.find(x=>x.id===id);if(!b)return;b.k++;feed(b.n+" ›› "+me.name);refresh();
 if(b.k>=10&&!wn){win(b.n);after()}}
function hitMe(b){if(!me.alive)return;me.hp-=lv.dmg;flash();hud();if(me.hp<=0)die(b.id)}

// ---- stand-in "room": the game's own shots/kills go through here instead of Firebase
const fake={peers:()=>[{peer:"me",isMe:true,sameTab:true,presence:{}}],presence:()=>Promise.resolve(),on(){return()=>{}},onPeers(){return()=>{}},
 emit(t,d){
  if(t==="hit"&&d){const b=bots.find(x=>x.id===d.to);if(b&&b.alive){b.hp-=Math.max(0,Math.min(100,+d.dmg||0));if(b.hp<=0)killBot(b)}}
  else if(t==="kill"&&d&&d.k)botScored(d.k);
  return Promise.resolve()}};

function start(){
 lv=D[+sel.value]||D[1];on=1;room=fake;
 bots=NAMES.map((n,i)=>{const id="bot"+i,b={id,n,p:new THREE.Vector3(),vy:0,gr:0,hp:100,alive:true,k:0,d:0,rt:0,sd:1,sw:1,turn:0,ta:0,aw:0,cd:1,yaw:0};
  remotes[id]={g:mk(hue(id+"x")),first:false,tx:0,ty:0,tz:0,yaw:0,pit:0,sl:false,n};return b});
 bots.forEach(spawnBot);refresh();$("st").textContent="Practice vs AI · "+sel.options[sel.selectedIndex].text+" · first to 10 kills"}

// ---- bot brain
function tick(t){requestAnimationFrame(tick);const dt=Math.max(0,Math.min(.05,(t-lt)/1e3));lt=t;if(!on||!active)return;
 for(const b of bots){const r=remotes[b.id];
  if(!b.alive){b.rt-=dt;if(b.rt<=0)spawnBot(b);continue}
  const dx=me.p.x-b.p.x,dz=me.p.z-b.p.z,dist=Math.hypot(dx,dz)||.01;
  // line of sight
  let los=false,L=0;
  if(me.alive&&dist<60){eye.set(b.p.x,b.p.y+1.6,b.p.z);tgt.set(me.p.x,me.p.y+1.2,me.p.z);dir.subVectors(tgt,eye);L=dir.length();dir.normalize();ray.set(eye,dir);ray.far=L;los=!ray.intersectObjects(solids)[0]}
  b.aw=los?b.aw+dt:0;
  // turn to face the player
  const want=Math.atan2(-dx,-dz),df=((want-b.yaw+Math.PI*3)%(Math.PI*2))-Math.PI;b.yaw+=df*Math.min(1,dt*8);
  // movement: close in, then strafe; sidestep when blocked
  const ang=Math.atan2(dz,dx);let mv=1,side=0;
  if(los){if(dist<5)mv=-1;else if(dist<10)mv=0;side=b.sd;b.sw-=dt;if(b.sw<=0){b.sd=Math.random()<.5?-1:1;b.sw=.8+Math.random()*1.4}}
  let a=ang;if(b.turn>0){b.turn-=dt;a=ang+b.ta;mv=1;side=0}
  let vx=Math.cos(a)*mv-Math.sin(a)*side,vz=Math.sin(a)*mv+Math.cos(a)*side;
  const l=Math.hypot(vx,vz);if(!me.alive&&b.turn<=0){vx=vz=0}
  if(l>0){vx=vx/l*lv.sp*dt;vz=vz/l*lv.sp*dt}
  let hit=false;
  if(!blocked(b.p.x+vx,b.p.z,b.p.y))b.p.x+=vx;else hit=true;
  if(!blocked(b.p.x,b.p.z+vz,b.p.y))b.p.z+=vz;else hit=true;
  if(hit&&l>0){if(b.turn<=0){b.turn=.6;b.ta=(Math.random()<.5?-1:1)*(1+Math.random()*.8)}if(b.gr){b.vy=8.5;b.gr=0}}
  const g=ground(b.p.x,b.p.z,b.p.y);b.vy-=24*dt;b.p.y+=b.vy*dt;
  if(b.p.y<=g||(b.gr&&b.vy<=0&&b.p.y-g<.4)){b.p.y=g;b.vy=0;b.gr=1}else b.gr=0;
  // shooting
  b.cd-=dt;
  if(los&&me.alive&&b.aw>lv.rt&&b.cd<=0&&dist<55){
   b.cd=lv.fr+Math.random()*.1;
   r.g.updateMatrixWorld(true);const u=r.g.userData,o=u.mz?u.mz.getWorldPosition(new THREE.Vector3()).toArray():eye.toArray();
   const ok=Math.random()<Math.max(.08,lv.acc-dist*.006),e=tgt.toArray();
   if(!ok){e[0]+=(Math.random()-.5)*2.4;e[1]+=(Math.random()-.5)*2.4;e[2]+=(Math.random()-.5)*2.4}
   tracer(o,e.map(v=>+v.toFixed(2)));flashAt(o,.4);r.rc=.3;
   if(ok)hitMe(b)}
  // publish to the renderer the same way a real remote player would
  r.tx=b.p.x;r.ty=b.p.y;r.tz=b.p.z;r.yaw=b.yaw;r.pit=Math.atan2((me.p.y+1.2)-(b.p.y+1.6),dist);r.sl=false;r.g.visible=true}}
requestAnimationFrame(tick);
})();
