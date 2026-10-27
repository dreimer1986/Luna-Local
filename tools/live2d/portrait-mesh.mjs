// Refine Luna's two illustration meshes for small finger bends. Midpoints retain
// the original UVs and are recomputed from Core geometry on every frame.
export function refineMesh(vertices, uvs, indices, levels = 3) {
  const originalCount = vertices.length / 2, parents = [], texture = Array.from(uvs);
  let triangles = Array.from(indices), count = originalCount;
  for (let level = 0; level < levels; level++) {
    const edges = new Map(), next = [];
    const midpoint = (a, b) => {
      const key = a < b ? `${a}:${b}` : `${b}:${a}`;
      if (edges.has(key)) return edges.get(key);
      const index = count++;
      if (index > 65535) throw Error('Portrait mesh exceeds WebGL index capacity');
      edges.set(key, index); parents.push([a, b]);
      texture.push((texture[a * 2] + texture[b * 2]) / 2, (texture[a * 2 + 1] + texture[b * 2 + 1]) / 2);
      return index;
    };
    for (let i = 0; i < triangles.length; i += 3) {
      const [a,b,c] = triangles.slice(i,i+3), ab=midpoint(a,b),bc=midpoint(b,c),ca=midpoint(c,a);
      next.push(a,ab,ca, ab,b,bc, ca,bc,c, ab,bc,ca);
    }
    triangles = next;
  }
  const positions = new Float32Array(count * 2);
  const refresh = source => {
    positions.set(source, 0);
    parents.forEach(([a,b], n) => {
      const i = (originalCount + n) * 2;
      positions[i] = (positions[a*2] + positions[b*2]) / 2;
      positions[i+1] = (positions[a*2+1] + positions[b*2+1]) / 2;
    });
  };
  refresh(vertices);
  return {vertices: positions, uvs: new Float32Array(texture), indices: new Uint16Array(triangles), refresh};
}

export function refinePortraitMeshes(core) {
  const nativeVertices = core.getDrawableVertices.bind(core), refined = new Map();
  for (const name of ['foreground_original','base_skin_completed']) {
    const i = Array.from({length: core.getDrawableCount()}, (_, n) => n).find(n => core.getDrawableId(n).getString() === name) ?? -1;
    if (i >= 0) refined.set(i, refineMesh(nativeVertices(i), core.getDrawableVertexUvs(i), core.getDrawableVertexIndices(i)));
  }
  for (const [method, field] of [['getDrawableVertices','vertices'],['getDrawableVertexUvs','uvs'],['getDrawableVertexIndices','indices']]) {
    const native = core[method].bind(core);
    core[method] = i => refined.get(i)?.[field] || native(i);
  }
  const nativeCount = core.getDrawableVertexCount.bind(core), nativeIndexCount = core.getDrawableVertexIndexCount.bind(core);
  core.getDrawableVertexCount = i => refined.has(i) ? refined.get(i).vertices.length / 2 : nativeCount(i);
  core.getDrawableVertexIndexCount = i => refined.has(i) ? refined.get(i).indices.length : nativeIndexCount(i);
  return {refresh() {for (const [i, mesh] of refined) mesh.refresh(nativeVertices(i));}};
}
