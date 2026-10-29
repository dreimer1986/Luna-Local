import {moveFullBody} from '../fullbody-motion.mjs';
import {refineMesh} from '../portrait-mesh.mjs';
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
// Ear clipping preserves exact polygon boundaries; no raster masks or new artwork.
export function triangulate(points){
 const area=points.reduce((v,p,i)=>{const q=points[(i+1)%points.length];return v+p[0]*q[1]-q[0]*p[1]},0);
 const order=points.map((_,i)=>i);if(area<0)order.reverse();const triangles=[];
 while(order.length>3){let found=false;
  for(let j=0;j<order.length;j++){
   const a=order[(j+order.length-1)%order.length],b=order[j],c=order[(j+1)%order.length];
   if(cross(points[a],points[b],points[c])<=1e-8)continue;
   if(order.some(i=>i!==a&&i!==b&&i!==c&&cross(points[a],points[b],points[i])>=0&&cross(points[b],points[c],points[i])>=0&&cross(points[c],points[a],points[i])>=0))continue;
   triangles.push(a,b,c);order.splice(j,1);found=true;break;
  }
  if(!found)throw Error('Invalid clothing polygon');
 }
 triangles.push(...order);return triangles;
}
export function outfitMesh(part){
 const v=[],uv=[];for(const [x,y] of part.points){v.push((x-512)/1024,(768-y)/1024);uv.push(x/1024,y/1536);}
 const mesh=refineMesh(new Float32Array(v),new Float32Array(uv),triangulate(part.points),4);
 return {...mesh,id:part.id,rest:mesh.vertices.slice()};
}

// An arm is one continuous mesh. Apply the hand transform only below its wrist;
// using the hand ID for the entire arm would rotate the shoulder around the wrist.
export function moveClothingMesh(mesh,time,reduced,parameters){
 mesh.vertices.set(mesh.rest);moveFullBody(mesh.vertices,time,reduced,mesh.id,parameters);
 const handID=mesh.id==='ArtMesh0'?'ArtMesh2':mesh.id==='ArtMesh5'?'ArtMesh7':null;
 if(!handID)return;
 mesh.handVertices??=new Float32Array(mesh.rest.length);mesh.handVertices.set(mesh.rest);
 moveFullBody(mesh.handVertices,time,reduced,handID,parameters);
 for(let i=0;i<mesh.rest.length;i+=2){
  const t=Math.max(0,Math.min(1,(.015-mesh.rest[i+1])/.035)),w=t*t*(3-2*t);
  mesh.vertices[i]+=w*(mesh.handVertices[i]-mesh.vertices[i]);
  mesh.vertices[i+1]+=w*(mesh.handVertices[i+1]-mesh.vertices[i+1]);
 }
}
