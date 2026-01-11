// A simple OBJ loader
// Supports: v, vn, f (triangles and quads)
// Does NOT support: vt (texture coords), materials, smoothing groups

export interface MeshData {
  positions: Float32Array;
  normals: Float32Array;
  indices: Uint16Array;
}

export function parseOBJ(text: string): MeshData {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  // Temp arrays to store the raw data from the file
  const rawPos: number[] = [];
  const rawNorm: number[] = [];

  const lines = text.split('\n');

  // Because OBJ indices refer to unique (pos, normal) pairs,
  // we need to map unique combinations to a single index.
  const uniqueVertices = new Map<string, number>();
  let nextIndex = 0;

  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length === 0) continue;

    const type = parts[0];

    if (type === 'v') {
      rawPos.push(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]));
    } else if (type === 'vn') {
      rawNorm.push(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]));
    } else if (type === 'f') {
      // f v1/vt1/vn1 v2/vt2/vn2 v3/vt3/vn3 ...
      // We only care about v and vn
      const faceVertices = parts.slice(1);
      
      // Triangulate (fan method)
      for (let i = 1; i < faceVertices.length - 1; i++) {
        const p0 = faceVertices[0];
        const p1 = faceVertices[i];
        const p2 = faceVertices[i + 1];

        [p0, p1, p2].forEach((vertexString) => {
          if (uniqueVertices.has(vertexString)) {
            indices.push(uniqueVertices.get(vertexString)!);
          } else {
            const [vIdxStr, _, nIdxStr] = vertexString.split('/');
            
            // OBJ is 1-based
            const vIdx = parseInt(vIdxStr) - 1;
            const nIdx = nIdxStr ? parseInt(nIdxStr) - 1 : -1;

            // Push Position
            positions.push(rawPos[vIdx * 3], rawPos[vIdx * 3 + 1], rawPos[vIdx * 3 + 2]);

            // Push Normal (or default up if missing)
            if (nIdx >= 0) {
              normals.push(rawNorm[nIdx * 3], rawNorm[nIdx * 3 + 1], rawNorm[nIdx * 3 + 2]);
            } else {
              normals.push(0, 1, 0); 
            }

            uniqueVertices.set(vertexString, nextIndex);
            indices.push(nextIndex);
            nextIndex++;
          }
        });
      }
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: new Uint16Array(indices),
  };
}
