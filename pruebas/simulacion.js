const {JSDOM}=require('jsdom');
const html=require('fs').readFileSync(require('path').join(__dirname,'..','previa.html'),'utf8');
function run(mode,cfgMod,players,free,mine){
  const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/',
    beforeParse(w){w.matchMedia=()=>({matches:true,addListener(){},removeListener(){}});w.scrollTo=()=>{};w.HTMLElement.prototype.getBoundingClientRect=function(){return {left:0,top:0,width:10,height:10}};}});
  const w=dom.window,d=w.document;const errs=[];
  w.addEventListener('error',e=>errs.push(e.message));
  const $=q=>d.querySelector(q);
  const click=el=>el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
  click($('#ageYes'));
  // Pro para acceder a todo; con free, la versión gratis (mazo chico, hasta 6 jugadores y 5 rondas)
  w.eval(free?'S.pro=false;S.xp=0;save();goHome();':'S.pro=true;S.xp=400;save();goHome();');
  if(mine)w.eval(`S.mine=[{id:'pk1',name:'Los del colegio',ic:'note',cards:${JSON.stringify(mine)}}];save();`);
  const tiles=[...d.querySelectorAll('#modes .mode')];
  const idx=Object.keys(w.eval('MODES')).indexOf(mode);
  click(tiles[idx]);
  w.eval(`syncDraft();`);
  if(mode==='parejas') w.eval(`D.couples=${JSON.stringify(players)};renderPlayers();`);
  else w.eval(`D.names=[${['cumple','despedida'].includes(mode)?"'Pato',":''}...${JSON.stringify(players)}];D.pi=0;D.partner='Ana';renderPlayers();`);
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
  if(free&&w.eval('[...G.used].some(id=>CARDS[id].pro)'))errs.push('carta Pro en partida gratis');
  const nMine=w.eval("[...G.used].filter(id=>CARDS[id]&&CARDS[id].k==='mine').length");
  if(mine&&!free&&!nMine)errs.push('no salió ninguna carta propia');
  if(mine&&free&&nMine)errs.push('carta propia en partida gratis');
  if(mine)console.log('  cartas propias jugadas:',nMine,'de',w.eval('G.count'));
  if(end&&w.eval("G.cfg.later!=='none'&&G.later.length<Math.max(2,Math.round(G.rounds/2))"))errs.push('faltan pruebas para después: '+w.eval('G.later.length'));
  const sp=$('#spinC'); if(sp) click(sp);
  console.log(mode+(free?' (gratis)':''),JSON.stringify(cfgMod),'steps',steps,'back',back,'end',end,'count',w.eval('G.count'),'early',w.__early||0,'leftAtEnd',w.__left,'errs',[...new Set(errs)].slice(0,5),Object.keys(seen).length,'types');
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
run('despedida',{later:'bar',rounds:3},['A']);
run('clasico',{later:'disco',rounds:12},P9.slice(0,4));
run('cumple',{later:'bar',rounds:5,spice:1},P9.slice(0,2),true);
run('clasico',{mine:['pk1'],spice:4},P9.slice(0,5),false,[{"id": "a0", "t": "reto", "l": 1, "txt": "{p}, imita a {p2} cuando llega tarde"}, {"id": "b1", "t": "reto", "l": 2, "txt": "Canta el himno del colegio"}, {"id": "c2", "t": "verdad", "l": 1, "txt": "¿Qué piensas de verdad de {p2}?"}, {"id": "d3", "t": "verdad", "l": 3, "txt": "cuenta lo que pasó en el paseo de curso"}, {"id": "e4", "t": "voto", "l": 1, "txt": "¿Quién llegaría tarde a su propio matrimonio?"}, {"id": "f5", "t": "voto", "l": 2, "txt": "¿Quién de la mesa es más probable que se quede dormido primero?"}, {"id": "g6", "t": "reto", "l": 4, "txt": "{p}, <b>hola</b> & {x5} sin llaves"}, {"id": "h7", "t": "reto", "l": 1, "txt": "{p} y {p2}: bailen una lenta"}, {"id": "a8", "t": "reto", "l": 1, "txt": "{p}, imita a {p2} cuando llega tarde"}, {"id": "b9", "t": "reto", "l": 2, "txt": "Canta el himno del colegio"}, {"id": "c10", "t": "verdad", "l": 1, "txt": "¿Qué piensas de verdad de {p2}?"}, {"id": "d11", "t": "verdad", "l": 3, "txt": "cuenta lo que pasó en el paseo de curso"}, {"id": "e12", "t": "voto", "l": 1, "txt": "¿Quién llegaría tarde a su propio matrimonio?"}, {"id": "f13", "t": "voto", "l": 2, "txt": "¿Quién de la mesa es más probable que se quede dormido primero?"}, {"id": "g14", "t": "reto", "l": 4, "txt": "{p}, <b>hola</b> & {x5} sin llaves"}, {"id": "h15", "t": "reto", "l": 1, "txt": "{p} y {p2}: bailen una lenta"}]);
run('clasico',{mine:['pk1']},P9.slice(0,4),true,[{"id": "a0", "t": "reto", "l": 1, "txt": "{p}, imita a {p2} cuando llega tarde"}, {"id": "b1", "t": "reto", "l": 2, "txt": "Canta el himno del colegio"}, {"id": "c2", "t": "verdad", "l": 1, "txt": "¿Qué piensas de verdad de {p2}?"}, {"id": "d3", "t": "verdad", "l": 3, "txt": "cuenta lo que pasó en el paseo de curso"}, {"id": "e4", "t": "voto", "l": 1, "txt": "¿Quién llegaría tarde a su propio matrimonio?"}, {"id": "f5", "t": "voto", "l": 2, "txt": "¿Quién de la mesa es más probable que se quede dormido primero?"}, {"id": "g6", "t": "reto", "l": 4, "txt": "{p}, <b>hola</b> & {x5} sin llaves"}, {"id": "h7", "t": "reto", "l": 1, "txt": "{p} y {p2}: bailen una lenta"}, {"id": "a8", "t": "reto", "l": 1, "txt": "{p}, imita a {p2} cuando llega tarde"}, {"id": "b9", "t": "reto", "l": 2, "txt": "Canta el himno del colegio"}, {"id": "c10", "t": "verdad", "l": 1, "txt": "¿Qué piensas de verdad de {p2}?"}, {"id": "d11", "t": "verdad", "l": 3, "txt": "cuenta lo que pasó en el paseo de curso"}, {"id": "e12", "t": "voto", "l": 1, "txt": "¿Quién llegaría tarde a su propio matrimonio?"}, {"id": "f13", "t": "voto", "l": 2, "txt": "¿Quién de la mesa es más probable que se quede dormido primero?"}, {"id": "g14", "t": "reto", "l": 4, "txt": "{p}, <b>hola</b> & {x5} sin llaves"}, {"id": "h15", "t": "reto", "l": 1, "txt": "{p} y {p2}: bailen una lenta"}]);
run('clasico',{spice:1,drink:'sin',mv:0},P9.slice(0,6),true);
run('cumple',{spice:1},P9.slice(0,5),true);
run('amigos',{spice:3,esc:false},P9.slice(0,6),true);
