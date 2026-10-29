import {moveFullBody} from './fullbody-motion.mjs';
// Procedural soft cheek colour, following the same geometry as the face layers.
export function createBlush(gl) {
 const shaders=[];
 function compile(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));shaders.push(s);return s;}
 const program=gl.createProgram();
 gl.attachShader(program,compile(gl.VERTEX_SHADER,'attribute vec2 pos;attribute vec2 uv;uniform mat4 matrix;varying vec2 point;void main(){point=uv;gl_Position=matrix*vec4(pos,0.,1.);}'));
 gl.attachShader(program,compile(gl.FRAGMENT_SHADER,'precision mediump float;varying vec2 point;uniform float strength;void main(){float r=length(point);float a=strength*exp(-2.5*r*r)*(1.-smoothstep(.6,1.,r));gl_FragColor=vec4(vec3(1.,.20,.27)*a,a);}'));
 gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
 const pos=gl.getAttribLocation(program,'pos'),uv=gl.getAttribLocation(program,'uv'),matrix=gl.getUniformLocation(program,'matrix'),strength=gl.getUniformLocation(program,'strength');
 const positions=gl.createBuffer(),coords=gl.createBuffer(),quad=[-1,-1,1,-1,1,1,-1,-1,1,1,-1,1];
 return {
  draw(renderer,mvp,time,reduced,parameters){
   const value=Math.max(0,Math.min(1,parameters.ParamLunaShy||0));if(!value)return;
   const vertices=[],texture=[];
   for(const [cx,cy] of [[-.048,.520],[.053,.538]])for(let i=0;i<quad.length;i+=2){vertices.push(cx+quad[i]*.020,cy+quad[i+1]*.010);texture.push(quad[i],quad[i+1]);}
   const v=new Float32Array(vertices);moveFullBody(v,time,reduced,'',parameters);
   renderer.saveProfile();
   try {
    gl.useProgram(program);gl.disable(gl.SCISSOR_TEST);gl.disable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
    gl.bindBuffer(gl.ARRAY_BUFFER,positions);gl.bufferData(gl.ARRAY_BUFFER,v,gl.DYNAMIC_DRAW);gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
    gl.bindBuffer(gl.ARRAY_BUFFER,coords);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(texture),gl.STATIC_DRAW);gl.enableVertexAttribArray(uv);gl.vertexAttribPointer(uv,2,gl.FLOAT,false,0,0);
    gl.uniformMatrix4fv(matrix,false,mvp.getArray());gl.uniform1f(strength,value*.25);gl.drawArrays(gl.TRIANGLES,0,12);
   } finally {renderer.restoreProfile();}
  },
  dispose(){gl.deleteBuffer(positions);gl.deleteBuffer(coords);gl.deleteProgram(program);shaders.forEach(s=>gl.deleteShader(s));}
 };
}
