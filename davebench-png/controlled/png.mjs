import {PNG} from 'pngjs';
import {createHash} from 'node:crypto';
export function inspect(bytes, geometry=true) {
 const p=PNG.sync.read(Buffer.from(bytes),{checkCRC:true});
 if(p.width!==1200||p.height!==900)throw Error('Contract requires exactly1200x900');
 const result={width:p.width,height:p.height,pixels:p.width*p.height,pixelSha256:createHash('sha256').update(p.data).digest('hex')};
 if(geometry){
  let x0=1200,y0=900,x1=-1,y1=-1,opaque=true;
  for(let y=0;y<900;y++)for(let x=0;x<1200;x++){
   const i=(y*1200+x)*4;if(p.data[i+3]!==255)opaque=false;
   if(Math.min(p.data[i],p.data[i+1],p.data[i+2])<245){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
  }
  if(!opaque)throw Error('PNG is not opaque');
  if(x1<0)throw Error('No visible content');
  if(x0<30||y0<30||x1>=1170||y1>=870)throw Error('Contract margin/fit failed');
  result.inkBounds={x0,y0,x1,y1};
 }
 return result;
}
