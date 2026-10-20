// Arma la carpeta www/ que Capacitor mete dentro de la app.
// Copia previa.html como index.html y cambia Google Fonts por las fuentes incluidas en la app.
// Uso: npm run build  (se corre solo antes de "npx cap sync")
const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..'),out=path.join(root,'www'),fontsOut=path.join(out,'fonts');
fs.rmSync(out,{recursive:true,force:true});
fs.mkdirSync(fontsOut,{recursive:true});

const fonts=[
  ['Rammetto One',400,'@fontsource/rammetto-one/files/rammetto-one-latin-400-normal.woff2'],
  ...[400,500,600,700,800,900].map(w=>['Rubik',w,`@fontsource/rubik/files/rubik-latin-${w}-normal.woff2`])
];
let css='';
for(const [family,weight,src] of fonts){
  const file=path.basename(src);
  fs.copyFileSync(path.join(root,'node_modules',src),path.join(fontsOut,file));
  css+=`@font-face{font-family:"${family}";font-style:normal;font-weight:${weight};font-display:swap;src:url(${file}) format("woff2")}\n`;
}
fs.writeFileSync(path.join(fontsOut,'fonts.css'),css);

let html=fs.readFileSync(path.join(root,'previa.html'),'utf8');
const google=/<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">\s*<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossorigin>\s*<link href="https:\/\/fonts\.googleapis\.com[^"]*" rel="stylesheet">/;
if(!google.test(html))throw new Error('No se encontró el bloque de Google Fonts en previa.html');
html=html.replace(google,'<link href="fonts/fonts.css" rel="stylesheet">');
fs.writeFileSync(path.join(out,'index.html'),html);
for(const f of ['privacidad.html'])if(fs.existsSync(path.join(root,f)))fs.copyFileSync(path.join(root,f),path.join(out,f));
console.log('www/ listo:',fs.readdirSync(out).join(', '),'· fuentes:',fonts.length);
