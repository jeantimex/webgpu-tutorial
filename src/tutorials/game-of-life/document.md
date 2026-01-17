# Game of Life (Double Buffering)

In this tutorial, we will implement **Conway's Game of Life**, a cellular automata simulation. This example introduces a critical pattern in GPU programming: **Double Buffering (or Ping-Ponging)**.

**Key Learning Points:**
- Why we can't read and write to the same resource in one pass.
- Setting up two textures and swapping their roles every frame.
- Implementing toroidal (wrapping) coordinates in WGSL.
- Using a frame loop to drive the simulation.

## 1. The Need for Double Buffering

In the Game of Life, the next state of a cell depends on its current neighbors. If we tried to use a single buffer:
1. Thread A updates Cell (0,0).
2. Thread B reads Cell (0,0) to calculate Cell (0,1).
3. **Problem**: Thread B might read the *new* value instead of the *old* value, leading to incorrect simulation (race conditions).

**The Solution**:
- **Texture A**: Read Only.
- **Texture B**: Write Only.
- Frame 1: Read A -> Write B.
- Frame 2: Read B -> Write A.

## 2. Toroidal Coordinates (Wrapping)

To make the grid infinite, we want cells on the left edge to see neighbors on the right edge. We use the modulo operator `%` to wrap coordinates.

```wgsl
let dims = textureDimensions(inputTex);
let coords = vec2i(id.xy);

// Wrap around: (coords + offset + dims) % dims
let neighborCoords = (coords + vec2i(i, j) + vec2i(dims)) % vec2i(dims);
```

## 3. The Rules of Life

The logic is simple but powerful:
1.  **Overpopulation**: A live cell with >3 neighbors dies.
2.  **Solitude**: A live cell with <2 neighbors dies.
3.  **Survival**: A live cell with 2 or 3 neighbors stays alive.
4.  **Birth**: A dead cell with exactly 3 neighbors becomes alive.
