// Dibuja el ícono de Previa (bola de disco con dos brillos sobre verde azulado con remolino) y la pantalla
// de carga, y deja los PNG base en assets/. Después: npx capacitor-assets generate (arma todos los tamaños).
// Uso: npm run icons
const fs=require('fs'),path=require('path'),sharp=require('sharp');
const out=path.join(__dirname,'..','assets');fs.mkdirSync(out,{recursive:true});

const C={red:'#E14936',teal:'#44AEAA',teal2:'#60BFBA',must:'#EBAF35',cream:'#FDF3E0',ink:'#1B1A1A'};
const BLADE='M0 0C40-30 60-90 40-150L100-150C110-80 70-20 0 0z';
// Remolino de la app (6 aspas tono sobre tono)
const swirl=(sc,cx=50,cy=50)=>`<g transform="translate(${cx} ${cy}) scale(${sc})">${[0,1,2,3,4,5].map(i=>`<path d="${BLADE}" fill="${C.teal2}" transform="rotate(${i*60})"/>`).join('')}</g>`;
// Bola de disco: la misma del juego (símbolo i-disco), escalada
const disco=(x,y,s)=>`<g transform="translate(${x} ${y}) scale(${s})">
 <defs><clipPath id="cp"><circle cx="24" cy="27" r="18"/></clipPath></defs>
 <path d="M24 2v7" stroke="${C.ink}" stroke-width="2.4"/>
 <g clip-path="url(#cp)"><rect x="6" y="9" width="36" height="36" fill="${C.cream}"/>
 <rect x="6" y="9" width="9" height="9" fill="${C.red}"/><rect x="24" y="9" width="9" height="9" fill="${C.must}"/>
 <rect x="15" y="18" width="9" height="9" fill="${C.teal}"/><rect x="33" y="18" width="9" height="9" fill="${C.red}"/>
 <rect x="6" y="27" width="9" height="9" fill="${C.must}"/><rect x="24" y="27" width="9" height="9" fill="${C.teal}"/>
 <rect x="15" y="36" width="9" height="9" fill="${C.red}"/><rect x="33" y="36" width="9" height="9" fill="${C.must}"/></g>
 <circle cx="24" cy="27" r="18" fill="none" stroke="${C.ink}" stroke-width="2.4"/></g>`;
const sparkle=(x,y,s)=>`<path transform="translate(${x} ${y}) scale(${s}) translate(-24 -24)" d="M24 3C26 18 30 22 45 24 30 26 26 30 24 45 22 30 18 26 3 24 18 22 22 18 24 3z" fill="${C.must}" stroke="${C.ink}" stroke-width="2.6" stroke-linejoin="round"/>`;
// Dibujo del frente: bola centrada y los dos brillos (en una caja de 100 x 100)
const front=()=>`${disco(14,10,1.5)}${sparkle(80,22,.36)}${sparkle(20,80,.26)}`;
const svg=(body,w=100,h=100)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`;

// Android adaptativo: capacitor-assets ya pone cada capa en la zona visible (margen de 16,7%),
// así que el frente y el fondo van con el mismo encuadre que el ícono completo.
const files={
  'icon-only.png':svg(`<rect width="100" height="100" fill="${C.teal}"/>${swirl(.55)}${front()}`),
  'icon-background.png':svg(`<rect width="100" height="100" fill="${C.teal}"/>${swirl(.55)}`),
  'icon-foreground.png':svg(front()),
  // Pantalla de carga: verde azulado con la bola al centro
  'splash.png':svg(`<rect width="100" height="100" fill="${C.teal}"/><g transform="translate(37.5 37.5) scale(.25)">${front()}</g>`),
  'splash-dark.png':svg(`<rect width="100" height="100" fill="${C.teal}"/><g transform="translate(37.5 37.5) scale(.25)">${front()}</g>`)
};
(async()=>{
  for(const [name,s] of Object.entries(files)){
    const size=name.startsWith('splash')?2732:1024;
    await sharp(Buffer.from(s),{density:Math.ceil(72*size/100)}).resize(size,size).png().toFile(path.join(out,name));
    console.log('assets/'+name,size+'px');
  }
})();
