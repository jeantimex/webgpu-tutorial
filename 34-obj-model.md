# 34. Loading an OBJ Model

Rendering cubes is fun, but real 3D applications load complex meshes created in tools like Blender, Maya, or 3ds Max.

In this tutorial, we will write a simple **OBJ Parser** to load the famous **Utah Teapot** and render it with our Blinn-Phong lighting shader.

## 1. The OBJ Format

The Wavefront .obj file format is text-based and very simple to parse.
*   **`v x y z`**: A vertex position.
*   **`vn x y z`**: A vertex normal.
*   **`f v1//vn1 v2//vn2 v3//vn3`**: A face (triangle) connecting vertices and normals.

## 2. Parsing Strategy

We fetch the text file using `fetch()`, split it by newlines, and loop through the lines.

### De-indexing
One complexity of OBJ is that it can reuse position index `1` with normal index `1` in one face, and position `1` with normal `2` in another. WebGPU (and OpenGL) requires a single index per vertex.

To solve this, whenever we encounter a unique combination (e.g., `v1/vn1`), we check if we've seen it before.
*   **Yes:** Reuse the existing index.
*   **No:** Create a new vertex in our flat arrays (`positions`, `normals`) and assign it a new index.

## 3. Rendering

Once parsed, we get three typed arrays:
1.  `positions` (Float32Array)
2.  `normals` (Float32Array)
3.  `indices` (Uint16Array)

We upload these to the GPU exactly as we did with our Cube data. The rest of the pipeline (lighting, rotation) remains the same!
