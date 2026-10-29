import {outfitMesh,moveClothingMesh} from './mesh.mjs';
import {winterParts} from './winter.mjs';
// Isolated clothing study. Drawn beneath the original Cubism face, using V10 poses.
export function createWinterStudy(gl,bitmap,bodyBitmap){
 for(const image of [bitmap,bodyBitmap])if(image.width!==1024||image.height!==1536)throw Error("Winter material must be 1024 x 1536");
 const meshes=winterParts.map(outfitMesh),shaders=[];
 function compile(type,code){const s=gl.createShader(type);shaders.push(s);gl.shaderSource(s,code);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
 const program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,'attribute vec2 pos;attribute vec2 uv;uniform mat4 matrix;varying vec2 tex;void main(){tex=uv;gl_Position=matrix*vec4(pos,0.,1.);}'));
 gl.attachShader(program,compile(gl.FRAGMENT_SHADER,'precision mediump float;varying vec2 tex;uniform sampler2D image;void main(){gl_FragColor=texture2D(image,tex);}'));
 gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
 const textures=[bitmap,bodyBitmap].map(image=>{
 const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);return texture;});
 const pos=gl.getAttribLocation(program,'pos'),uv=gl.getAttribLocation(program,'uv'),matrix=gl.getUniformLocation(program,'matrix'),image=gl.getUniformLocation(program,'image');
 const vertices=gl.createBuffer(),coords=gl.createBuffer(),indices=gl.createBuffer();
 return {
 draw(renderer,mvp,time,reduced,parameters){renderer.saveProfile();try{
  gl.useProgram(program);gl.disable(gl.SCISSOR_TEST);gl.disable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.colorMask(true,true,true,true);
  gl.activeTexture(gl.TEXTURE0);gl.uniform1i(image,0);gl.uniformMatrix4fv(matrix,false,mvp.getArray());
  for(const m of meshes){gl.bindTexture(gl.TEXTURE_2D,textures[m.id==='legs'||m.id==='ArtMesh10'?1:0]);moveClothingMesh(m,time,reduced,parameters);
   gl.bindBuffer(gl.ARRAY_BUFFER,vertices);gl.bufferData(gl.ARRAY_BUFFER,m.vertices,gl.DYNAMIC_DRAW);gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
   gl.bindBuffer(gl.ARRAY_BUFFER,coords);gl.bufferData(gl.ARRAY_BUFFER,m.uvs,gl.STATIC_DRAW);gl.enableVertexAttribArray(uv);gl.vertexAttribPointer(uv,2,gl.FLOAT,false,0,0);
   gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indices);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,m.indices,gl.STATIC_DRAW);gl.drawElements(gl.TRIANGLES,m.indices.length,gl.UNSIGNED_SHORT,0);
  }
 }finally{renderer.restoreProfile();}},
 dispose(){for(const b of [vertices,coords,indices])gl.deleteBuffer(b);textures.forEach(t=>gl.deleteTexture(t));gl.deleteProgram(program);shaders.forEach(s=>gl.deleteShader(s));}
 };
}
