// Revisa el sistema de XP y niveles: umbrales, XP por partida y partidas reales de principio a fin.
// Uso: node pruebas/xp.js
const {JSDOM}=require('jsdom');
const html=require('fs').readFileSync(require('path').join(__dirname,'..','previa.html'),'utf8');
let fallas=0;
const ok=(cond,msg)=>{if(!cond){fallas++;console.log('FALLA:',msg);}};

function nuevo(){
  const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/',
    beforeParse(w){w.matchMedia=()=>({matches:true});w.scrollTo=()=>{};}});
  const w=dom.window,d=w.document;
  const c=e=>e.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
  c(d.querySelector('#ageYes'));
  return {w,d,c};
}
// Juega una partida completa eligiendo siempre la primera opción
function jugar(t,mode,rounds,names,cortarEn,cfg){
  const {w,d,c}=t;
  w.eval('goHome()');
  c(d.querySelectorAll('#modes .mode')[Object.keys(w.eval('MODES')).indexOf(mode)]);
  w.eval(`syncDraft();D.names=${JSON.stringify(names)};D.pi=0;renderPlayers();`);
  c(d.querySelector('#plNext'));
  w.eval(`CFG.rounds=${rounds};Object.assign(CFG,${JSON.stringify(cfg||{})})`);
  c(d.querySelector('#stStart'));
  for(let i=0;i<3000&&!d.querySelector('#v-game').hidden;i++){
    if(cortarEn&&w.eval('G.count')>=cortarEn){w.eval('finish()');break;}
    const L=[...d.querySelectorAll('#stage .layer')].pop();
    const sig=[...L.querySelectorAll('.act button')].find(b=>b.textContent==='Siguiente');
    if(sig){c(sig);continue;}
    const sb=L.querySelector('.secret-box');
    if(sb){sb.dispatchEvent(new w.Event('pointerdown'));c([...L.querySelectorAll('.act button')].pop());continue;}
    const op=L.querySelector('.act button[aria-pressed]');
    if(op){c(op);c(L.querySelector('.confirm-row button'));continue;}
    c(L.querySelector('.inner'));w.eval('lock=false');
  }
}

// 1. Umbrales de nivel
{
  const {w}=nuevo();
  const n=xp=>w.eval(`level(${xp}).n`);
  ok(n(0)===1&&n(99)===1&&n(100)===2,'el nivel 2 empieza en 100 XP');
  ok(n(3999)===9&&n(4000)===10,'el nivel 10 empieza en 4.000 XP');
  ok(w.eval('level(5500).stars')===1&&w.eval('level(5499).stars')===0,'una estrella de leyenda cada 1.500 XP sobre el nivel 10');
  let prev=0;for(let x=0;x<=12000;x+=50){const v=n(x);ok(v>=prev,'los niveles nunca bajan al sumar XP');prev=v;}
}

// 2. XP por partida según largo y modo
{
  const {w}=nuevo();
  const modos=Object.keys(w.eval('MODES'));
  for(const r of [3,5,8,12]){
    let anterior=0;
    for(const m of modos){
      const xp=w.eval(`gameXP(${r},'${m}',true,0,6)`);
      ok(xp>=15&&xp<=90,`partida completa de ${r} rondas en ${m} da entre 15 y 90 XP (dio ${xp})`);
      const mitad=w.eval(`gameXP(${r},'${m}',false,${r*3},6)`);
      ok(mitad<xp,`cortar a la mitad da menos XP que terminar (${r} rondas, ${m})`);
    }
    const base=w.eval(`gameXP(${r},'clasico',true,0,6)`);
    ok(base>anterior,'más rondas dan más XP');anterior=base;
  }
  ok(w.eval(`gameXP(5,'hardcore',true,0,6)`)>w.eval(`gameXP(5,'clasico',true,0,6)`),'Hardcore da más XP que Clásico');
}

// 3. Primera partida real: Clásico, 5 rondas, 3 jugadores
{
  const t=nuevo();
  jugar(t,'clasico',5,['Ana','Beto','Caro']);
  const xp=t.w.eval('S.xp'),logros=t.w.eval('S.ach.reduce((a,id)=>a+TIERS[ACH.find(x=>x.id===id).tier].xp,0)');
  const esperado=t.w.eval("gameXP(5,'clasico',true,0,6)");
  ok(!t.d.querySelector('#v-end').hidden,'la partida llega a la pantalla final');
  ok(t.w.eval("S.ach.includes('primera')"),'terminar la partida da el logro Primera previa');
  ok(xp-logros===esperado,`la partida suma su XP según largo y modo (esperado ${esperado}, dio ${xp-logros})`);
  ok(xp-logros<100,'una partida sola nunca suma 100 XP o más');
  ok(t.w.eval('level(S.xp).n')===1||logros>25,'si solo sale Primera previa, después de la primera partida se sigue en el nivel 1');
  console.log('Primera partida (Clásico, 5 rondas):',xp-logros,'XP de partida +',logros,'XP de logros (',t.w.eval('S.ach.join(", ")'),') → nivel',t.w.eval('level(S.xp).n'));
}

// 4. Partida cortada a la mitad: suma menos que una completa y no da el logro Primera previa
{
  const t=nuevo();
  jugar(t,'clasico',5,['Ana','Beto','Caro'],15);
  const xp=t.w.eval('S.xp');
  ok(xp<t.w.eval("gameXP(5,'clasico',true,0,6)"),`una partida cortada suma menos XP (dio ${xp})`);
  ok(!t.w.eval("S.ach.includes('primera')"),'cortar la partida no da el logro Primera previa');
  console.log('Partida cortada a las 15 cartas:',xp,'XP');
}

// 5. Varias partidas seguidas: se sube de nivel de a poco
{
  const t=nuevo();
  const log=[];
  for(let i=0;i<5;i++){jugar(t,'clasico',5,['Ana','Beto','Caro']);log.push(t.w.eval('S.xp'));}
  const logros=t.w.eval('S.ach.reduce((a,id)=>a+TIERS[ACH.find(x=>x.id===id).tier].xp,0)'),partidas=log[4]-logros;
  ok(t.w.eval(`level(${partidas}).n`)<=3,`la XP de 5 partidas cortas, sin logros, deja como máximo en el nivel 3 (${partidas} XP)`);
  console.log('5 partidas de 5 rondas:',partidas,'XP de partidas +',logros,'XP de logros (',t.w.eval('S.ach.join(", ")'),') → nivel',t.w.eval('level(S.xp).n'));
}

// 6. Una sola partida, aunque sea larga, sin alcohol y con el picante al máximo, no sube al nivel 2
{
  const t=nuevo();
  t.w.eval('S.pro=true');
  jugar(t,'clasico',8,['Ana','Beto','Caro'],0,{spice:4,drink:'sin'});
  ok(t.w.eval('level(S.xp).n')===1,`una partida sola no sube al nivel 2 (quedó con ${t.w.eval('S.xp')} XP)`);
  ok(!t.w.eval("S.ach.includes('sincensura')")&&!t.w.eval("S.ach.includes('sano')"),'Sin censura y Previa sana piden 3 partidas');
  console.log('Partida de 8 rondas, sin alcohol y Sin censura:',t.w.eval('S.xp'),'XP (',t.w.eval('S.ach.join(", ")'),') → nivel',t.w.eval('level(S.xp).n'));
}

console.log(fallas?`${fallas} fallas`:'Todo bien: el sistema de XP funciona como se espera.');
process.exitCode=fallas?1:0;
