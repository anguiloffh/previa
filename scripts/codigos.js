// Códigos de Previa Pro publicados en previa-legal/codigos.json (la app los lee al canjear y al abrirse).
// En el archivo público solo va la huella SHA-256 de cada código; los códigos y sus notas quedan en
// Documentos\Previa-llaves\codigos.txt. Después de cada cambio hay que subir previa-legal (commit + push).
//
//   node scripts/codigos.js nuevo [--dias 30] [--hasta 2026-12-31] [--nota "para quién es"]
//     --dias: días de Pro desde que se canjea (sin él, Pro para siempre)
//     --hasta: último día para canjearlo (sin él, no vence)
//   node scripts/codigos.js anular PREVIA-XXXXXX-XXXXXX   (también quita Pro a quienes ya lo canjearon)
//   node scripts/codigos.js lista
const fs=require('fs'),path=require('path'),os=require('os'),crypto=require('crypto');
const FILE=path.join(__dirname,'..','previa-legal','codigos.json');
const LOG=path.join(os.homedir(),'Documents','Previa-llaves','codigos.txt');
const ABC='ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // sin 0/O ni 1/I/L, para que no se confundan
const hash=c=>crypto.createHash('sha256').update(c.toUpperCase().replace(/[^A-Z0-9]/g,'')).digest('hex');
const part=()=>Array.from({length:6},()=>ABC[crypto.randomInt(ABC.length)]).join('');
const load=()=>fs.existsSync(FILE)?JSON.parse(fs.readFileSync(FILE,'utf8')):{codes:[],revoked:[]};
const store=j=>fs.writeFileSync(FILE,JSON.stringify(j,null,1)+'\n');
const opt=k=>{const i=process.argv.indexOf('--'+k);return i>0?process.argv[i+1]:undefined;};
const today=()=>new Date().toLocaleDateString('sv');

const [cmd,arg]=process.argv.slice(2);
const j=load();
if(cmd==='nuevo'){
  const days=opt('dias')?+opt('dias'):undefined,until=opt('hasta'),nota=opt('nota')||'';
  if(days!==undefined&&!(days>0))throw new Error('--dias debe ser un número mayor que 0');
  if(until&&!/^\d{4}-\d{2}-\d{2}$/.test(until))throw new Error('--hasta va como AAAA-MM-DD');
  const code=`PREVIA-${part()}-${part()}`;
  j.codes.push(Object.assign({h:hash(code)},until&&{until},days&&{days}));store(j);
  fs.appendFileSync(LOG,`${today()}  ${code}  Pro: ${days?days+' días':'para siempre'}  canjear hasta: ${until||'sin vencimiento'}  ${nota}\r\n`);
  console.log(`Código nuevo: ${code}\nPro: ${days?days+' días':'para siempre'} · se puede canjear hasta: ${until||'sin vencimiento'}\nAnotado en ${LOG}\nFalta subir previa-legal para que funcione.`);
}else if(cmd==='anular'){
  if(!arg)throw new Error('Falta el código a anular');
  const h=hash(arg);
  j.codes=j.codes.filter(c=>c.h!==h);if(!j.revoked.includes(h))j.revoked.push(h);store(j);
  fs.appendFileSync(LOG,`${today()}  ANULADO  ${arg.toUpperCase()}\r\n`);
  console.log(`Anulado: ${arg.toUpperCase()}\nFalta subir previa-legal para que funcione.`);
}else if(cmd==='lista'){
  console.log(`${j.codes.length} código(s) de regalo activos y ${j.revoked.length} anulado(s).`);
  if(fs.existsSync(LOG))console.log(fs.readFileSync(LOG,'utf8'));
}else console.log('Uso: node scripts/codigos.js nuevo|anular|lista (ver el comienzo del archivo)');
