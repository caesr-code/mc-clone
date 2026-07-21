(function(){
  'use strict';
  const V=window.Voidlands;
  function hash3(x,y,z,seed){let h=seed>>>0;h^=Math.imul(x,374761393);h^=Math.imul(y,668265263);h^=Math.imul(z,2147483647);h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967295}
  function value2(x,z,seed){const xi=Math.floor(x),zi=Math.floor(z),xf=x-xi,zf=z-zi;const u=V.smooth(xf),v=V.smooth(zf);const a=hash3(xi,0,zi,seed),b=hash3(xi+1,0,zi,seed),c=hash3(xi,0,zi+1,seed),d=hash3(xi+1,0,zi+1,seed);return V.lerp(V.lerp(a,b,u),V.lerp(c,d,u),v)*2-1}
  function value3(x,y,z,seed){const xi=Math.floor(x),yi=Math.floor(y),zi=Math.floor(z),xf=x-xi,yf=y-yi,zf=z-zi;const u=V.smooth(xf),v=V.smooth(yf),w=V.smooth(zf);let c=[];for(let dz=0;dz<2;dz++)for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++)c.push(hash3(xi+dx,yi+dy,zi+dz,seed));const x00=V.lerp(c[0],c[1],u),x10=V.lerp(c[2],c[3],u),x01=V.lerp(c[4],c[5],u),x11=V.lerp(c[6],c[7],u);return(V.lerp(V.lerp(x00,x10,v),V.lerp(x01,x11,v),w)*2-1)}
  function fbm2(x,z,seed,oct=5,lac=2,gain=.5){let sum=0,amp=.5,freq=1,norm=0;for(let i=0;i<oct;i++){sum+=value2(x*freq,z*freq,seed+i*1013)*amp;norm+=amp;freq*=lac;amp*=gain}return sum/norm}
  function ridged2(x,z,seed,oct=4){let sum=0,amp=.6,f=1,n=0;for(let i=0;i<oct;i++){const q=1-Math.abs(value2(x*f,z*f,seed+i*991));sum+=q*q*amp;n+=amp;f*=2.1;amp*=.48}return sum/n}
  V.Noise={hash3,value2,value3,fbm2,ridged2};
})();
