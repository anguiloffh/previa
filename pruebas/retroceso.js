const {JSDOM}=require('jsdom');const html=require('fs').readFileSync(require('path').join(__dirname,'..','previa.html'),'utf8');
function test(mode,cfg){
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/',beforeParse(w){w.matchMedia=()=>({matches:true});w.scrollTo=()=>{};w.HTMLCanvasElement.prototype.getContext=()=>null;}});
const w=dom.window,d=w.document;const c=e=>e.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
c(d.querySelector('#ageYes'));w.eval('S.pro=true;S.xp=400;goHome()');
c(d.querySelectorAll('#modes .mode')[Object.keys(w.eval('MODES')).indexOf(mode)]);
w.eval("syncDraft();D.names=['P','A','B','C','D','E','F'];D.pi=0;renderPlayers();");
d.querySelectorAll('#plList input').forEach((i,k)=>{if(!i.value)i.value='Z'+k});
c(d.querySelector('#plNext'));w.eval(`Object.assign(CFG,${JSON.stringify(cfg)})`);c(d.querySelector('#stStart'));
const last=()=>[...d.querySelectorAll('#stage .layer')].pop();
const sig=()=>{const L=last();return L.className+'|'+L.querySelector('.txt').textContent+'|'+(L.querySelector('.reader')||{}).textContent;};
// do choice k on current card; returns whether advanced
function act(k){const L=last();
  const nb=[...L.querySelectorAll('.act button')].find(b=>b.textContent==='Siguiente');if(nb){c(nb);return;}
  const sb=L.querySelector('.secret-box');if(sb){sb.dispatchEvent(new w.Event('pointerdown'));c([...L.querySelectorAll('.act button')].pop());return;}
  const ch=[...L.querySelectorAll('.act button[aria-pressed], .vchips button')];
  if(ch.length && k<ch.length){c(ch[k]);c(L.querySelector('.confirm-row button'));const nb2=[...last().querySelectorAll('.act button')].find(b=>b.textContent==='Siguiente');if(nb2)c(nb2);return;}
  c(L.querySelector('.inner'));w.eval('lock=false');}
let diffs=0,checks=0;
for(let i=0;i<55 && !d.querySelector('#v-game').hidden;i++){
  act(0);const t1=sig();
  if(d.querySelector('#v-game').hidden)break;
  c(d.querySelector('#gBack'));
  act(1);const t2=sig();checks++;
  if(t1!==t2){diffs++;if(diffs<4)console.log('DIFF\n '+t1.slice(0,150)+'\n '+t2.slice(0,150));}
}
console.log(mode,'checks',checks,'diffs',diffs);
}
test('clasico',{});test('despedida',{ruleta:true,spice:4});test('caos',{});test('hardcore',{});
