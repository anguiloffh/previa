const {JSDOM}=require('jsdom');
const html=require('fs').readFileSync(require('path').join(__dirname,'..','previa.html'),'utf8');
function run(mode,cfgMod,players,seed){
  const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/',
    beforeParse(w){w.matchMedia=()=>({matches:true,addListener(){},removeListener(){}});w.scrollTo=()=>{};w.HTMLElement.prototype.getBoundingClientRect=function(){return {left:0,top:0,width:10,height:10}};}});
  const w=dom.window,d=w.document;const errs=[];
  w.addEventListener('error',e=>errs.push(e.message));
  const $=q=>d.querySelector(q);
  const click=el=>el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
  click($('#ageYes'));
  // make pro to access all
  w.eval('S.pro=true;S.xp=400;save();goHome();');
  const tiles=[...d.querySelectorAll('#modes .mode')];
  const idx=Object.keys(w.eval('MODES')).indexOf(mode);
  click(tiles[idx]);
  w.eval(`syncDraft();`);
  if(mode==='parejas') w.eval(`D.couples=${JSON.stringify(players)};renderPlayers();`);
  else w.eval(`D.names=${JSON.stringify(players)};D.prota='Pato';D.partner='Ana';renderPlayers();`);
  click($('#plNext'));
  if($('#plErr').textContent) {console.log('ERR players',$('#plErr').textContent);return;}
  w.eval(`Object.assign(CFG,${JSON.stringify(cfgMod)});`);if(!d.querySelector('#stQuick .toggles .tog'))errs.push('esc not under spice');
  w.eval("const _se=showEvent;showEvent=function(ev,x,y){if(G.count<ev.due)window.__early=(window.__early||0)+1;return _se(ev,x,y);};const _fi=finish;finish=function(){window.__left=G.events.length;return _fi();};");
  click($('#stStart'));
  let steps=0,back=0;const seen={};
  while(steps<2000 && !$('#v-game').hidden){
    steps++;
    const layer=[...d.querySelectorAll('#stage .layer')].pop();
    const t=layer.className.split(' ').find(c=>c.startsWith('t-'));seen[t]=(seen[t]||0)+1;
    if(w.eval('G.cfg.phone')!=='centro' && !layer.querySelector('.reader')) errs.push('no reader');
    if(/\{[a-z]+\d?\}/.test(layer.textContent)) errs.push('token left: '+layer.textContent.slice(0,120));
    if(/undefined|null|NaN/.test(layer.textContent)) errs.push('bad text: '+layer.textContent.slice(0,160));
    const rul=layer.querySelector('.rul + .act button, .act button');
    const pw=[...layer.querySelectorAll('.pw button')];
    const btns=[...layer.querySelectorAll('.act button:not([disabled])')].filter(b=>!(b.textContent==='Girar la ruleta'&&!b.hasAttribute('aria-pressed')));
    const chips=[...layer.querySelectorAll('.vchips button')];
    const sb=layer.querySelector('.secret-box');
    if(sb){sb.dispatchEvent(new w.Event('pointerdown'));}
    const r=Math.random();
    const conf=()=>{const cb=layer.querySelector('.confirm-row button');if(!cb||cb.hidden)errs.push('no confirm');else click(cb);};
    if(r<0.04 && !d.querySelector('#gBack').disabled){click(d.querySelector('#gBack'));back++;continue;}
    if(pw.length && r<0.15){click(pw[Math.floor(Math.random()*pw.length)]);conf();continue;}
    if(sb){click([...layer.querySelectorAll('.act button')].pop());continue;}
    if(chips.length && r<0.5){click(chips[0]);conf();continue;}
    const nxt=btns.find(b=>b.textContent==='Siguiente');if(nxt){click(nxt);continue;}
    const ch=btns.filter(b=>!b.classList.contains('confirm')&&b.textContent!=='Listo, la memoricé'&&b.textContent!=='🎰 Girar la ruleta'||b.closest('.act')&&b.getAttribute('aria-pressed')!==null&&!b.classList.contains('confirm')&&b.textContent!=='Listo, la memoricé'&&b.textContent!=='Siguiente');if(ch.length){click(ch[Math.floor(Math.random()*ch.length)]);conf();continue;}
    click(layer.querySelector('.inner'));
    // lock 280ms: bypass
    w.eval('lock=false');
  }
  const end=!$('#v-end').hidden;
  const sp=$('#spinC'); if(sp) click(sp);
  console.log(mode,JSON.stringify(cfgMod),'steps',steps,'back',back,'end',end,'count',w.eval('G.count'),'early',w.__early||0,'leftAtEnd',w.__left,'errs',[...new Set(errs)].slice(0,5),Object.keys(seen).length,'types');
  if(end && mode==='despedida') console.log(d.querySelector('#v-end').textContent.replace(/\s+/g,' ').slice(0,400));
}
const P9=['Ale','Beto','Caro','Dani','Eli','Fer','Gabo','Hugo'];
run('clasico',{},P9);
run('clasico',{score:false,rounds:3},['A','B']);
run('despedida',{later:'disco',ruleta:true,max:'leve'},P9);
run('cumple',{drink:'sin',mv:2},['A','B','C']);
run('amigos',{spice:4,max:'prenda'},P9);
run('amigas',{esc:false,spice:3},P9.slice(0,4));
run('parejas',{spice:4},[['A','B'],['C','D'],['E','F']]);
run('hardcore',{},P9.concat(['I','J','K','L','M','N','O']));
run('caos',{rounds:12},P9);
