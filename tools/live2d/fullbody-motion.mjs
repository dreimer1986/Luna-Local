// Gentle motion for the private V9 body and its transplanted portrait face.
// Applied afresh to Core output, with identical head transforms for every face layer.
const smooth = (a, b, x) => {const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
export function fullBodyParameters(time, reduced=false) {
  const a=reduced?0:1;
  return {
    ParamArmLB01:a*Math.sin(time*.41)*2,
    ParamArmRB01:a*Math.sin(time*.37+1.4)*2,
    ParamArmLB02:a*Math.sin(time*.53+.8)*2,
    ParamArmRB02:a*Math.sin(time*.47+2)*2,
    ParamArmLB03:a*Math.sin(time*.61)*1.5,
    ParamArmRB03:a*Math.sin(time*.57+1.7)*1.5,
    ParamArmRB02Y:0, ParamHandLB:0, ParamBreath:0,
  };
}
export function moveFullBody(vertices,time,reduced=false,id='') {
  if(reduced)return;
  const tilt=.009*Math.sin(time*.43), c=Math.cos(tilt),s=Math.sin(tilt);
  const breath=Math.sin(time*1.35),sway=.0025*Math.sin(time*.31);
  const hand=['ArtMesh0','ArtMesh5'].includes(id);
  for(let i=0;i<vertices.length;i+=2){
    const x=vertices[i],y=vertices[i+1],head=smooth(.40,.46,y),body=smooth(-.65,.1,y);
    const hx=x,hy=y-.44,chest=smooth(.0,.18,y)*(1-smooth(.35,.44,y));
    const side=x<0?-1:1;
    // Distal hand relaxation follows the transformed hand; the wrist stays fixed.
    const distal=hand?1-smooth(-.09,-.025,y):0;
    const flex=.5+.5*Math.sin(time*.63+(side>0?1.6:0));
    vertices[i]=x+head*(hx*c-hy*s-hx)+sway*body+x*chest*breath*.003+side*distal*flex*.0007;
    vertices[i+1]=y+head*(hx*s+hy*c-hy)+body*breath*.0012+distal*flex*.0012;
  }
}
