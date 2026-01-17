# Game of Life

Conway’s **Game of Life** is a classic cellular automaton: a grid of cells evolves over time based on a small set of rules. Each cell is either **alive** or **dead**, and its next state depends on the eight neighbors around it.

This tutorial uses a compute shader to update the grid and a render pass to display it. It also introduces a critical GPU pattern: **double buffering (ping‑ponging)**, which avoids reading and writing the same texture in one pass.

**Key learning points:**

- What Conway’s Game of Life simulates and why it is interesting.
- Why double buffering is required for correct parallel updates.
- How to implement neighborhood sampling with wrapping edges.
- How to run a compute pass followed by a render pass each frame.
- How to keep the simulation aspect ratio consistent when the canvas resizes.

## 1. What the simulation does

Each cell in a 2D grid is either alive or dead. At each step, every cell updates **simultaneously** based on its neighbors:

1. **Survival**: a live cell with 2 or 3 live neighbors stays alive.
2. **Overpopulation**: a live cell with more than 3 neighbors dies.
3. **Underpopulation**: a live cell with fewer than 2 neighbors dies.
4. **Birth**: a dead cell with exactly 3 neighbors becomes alive.

These simple local rules produce complex patterns over time.

## 2. Why double buffering is required

The update for each cell depends on the **previous** state of its neighbors. If we read and write the same texture, updates interfere with each other (race conditions). The solution is **ping‑ponging**:

- **Texture A**: read‑only input
- **Texture B**: write‑only output
- Next frame, swap roles

This guarantees every cell sees a consistent previous state.

## 3. The compute shader (simulation step)

We store the grid as a texture. Each compute thread corresponds to one cell.

```typescript
@compute @workgroup_size(8, 8)
fn cs_main(@builtin(global_invocation_id) id : vec3u) {
  let dims = textureDimensions(inputTex);
  let coords = vec2i(id.xy);
  if (coords.x >= i32(dims.x) || coords.y >= i32(dims.y)) {
    return;
  }

  // Count 8 neighbors
  var activeNeighbors = 0;
  for (var i = -1; i <= 1; i++) {
    for (var j = -1; j <= 1; j++) {
      if (i == 0 && j == 0) { continue; }
      let neighborCoords = (coords + vec2i(i, j) + vec2i(dims)) % vec2i(dims);
      let value = textureLoad(inputTex, neighborCoords, 0).r;
      if (value > 0.5) { activeNeighbors++; }
    }
  }

  let currentState = textureLoad(inputTex, coords, 0).r > 0.5;
  var nextState = 0.0;

  if (currentState) {
    if (activeNeighbors == 2 || activeNeighbors == 3) {
      nextState = 1.0;
    }
  } else {
    if (activeNeighbors == 3) {
      nextState = 1.0;
    }
  }

  textureStore(outputTex, coords, vec4f(nextState, nextState, nextState, 1.0));
}
```

### Toroidal wrapping

We use modulo to wrap the grid edges. That makes the world “wrap around” like a torus, so cells on the edge have neighbors on the opposite edge.

```wgsl
let neighborCoords = (coords + vec2i(i, j) + vec2i(dims)) % vec2i(dims);
```

## 4. Ping‑pong bind groups

We create two compute bind groups:

- Read A → Write B
- Read B → Write A

Each frame, we switch which bind group is used.

```typescript
if (step % 2 === 0) {
  computePass.setBindGroup(0, computeBindGroup1);
} else {
  computePass.setBindGroup(0, computeBindGroup2);
}
```

## 5. Rendering the current state

The render pass samples the most recent texture (A or B) and draws a full‑screen quad. We color live cells green for a “matrix” style effect:

```typescript
@fragment
fn fs_main(in : VertexOutput) -> @location(0) vec4f {
  let color = textureSample(myTexture, mySampler, in.uv).r;
  return vec4f(0.0, color, 0.0, 1.0);
}
```

## 6. Resizing and aspect ratio

The simulation grid is square, but the canvas may not be. We pass a small uniform block with the grid aspect ratio and canvas aspect ratio, then scale the quad in the vertex shader so the grid is not stretched.

```typescript
struct RenderUniforms {
  simAspect : f32,
  canvasAspect : f32,
  padding : vec2f,
}
```

Whenever the canvas resizes, we update this uniform to keep the render consistent.

## Common pitfalls

- **Reading and writing the same texture** in one compute pass.
- **Missing boundary checks** for threads outside the grid.
- **Incorrect modulo math** causing edge artifacts.
- **Aspect ratio stretch** if you render the grid directly without scaling.
