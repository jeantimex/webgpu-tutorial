# Texture Atlas (Cube Map)

In the previous tutorial, we mapped a single image onto all faces of a cube. But what if we want a **different image** on each face (e.g., a dice with numbers 1-6)?

We *could* load 6 separate textures, but switching textures during rendering is expensive. A better approach is to combine all images into a single large image called a **Texture Atlas**.

### The Generated Atlas
In this tutorial, we programmatically generate an atlas that looks like this:

| Col 1 | Col 2 | Col 3 |
| :---: | :---: | :---: |
| **1** | **2** | **3** |
| **4** | **5** | **6** |

*(Each cell has a unique background color and a number center-aligned)*

## 1. What is a Texture Atlas?

A texture atlas is a large image containing multiple sub-images. For this tutorial, we generate a 512x512 image containing a 3x2 grid of numbers:

| 1 | 2 | 3 |
|---|---|---|
| 4 | 5 | 6 |

## 2. UV Mapping for Regions

Instead of mapping every face to the full `0..1` range, we calculate specific UV coordinates for each sub-region.

Since our grid is 3 columns by 2 rows:
- **Width of one cell (U step)**: 1 / 3 ≈ 0.333
- **Height of one cell (V step)**: 1 / 2 = 0.5

### Example: Mapping Number '5' (Center-Bottom)
- **Column**: 1 (2nd column) -> `U_start = 1 * 0.333`
- **Row**: 1 (2nd row) -> `V_start = 1 * 0.5`

The UVs for the four corners of this face would be:
- (0.333, 0.5)
- (0.666, 0.5)
- (0.666, 1.0)
- (0.333, 1.0)

## 3. Generating the Texture

In this example, we don't even load an image file! We use the HTML5 Canvas 2D API to draw the numbers and colors programmatically, convert it to an `ImageBitmap`, and then upload it to the GPU.

```typescript
const offscreen = document.createElement('canvas');
const ctx = offscreen.getContext('2d');
// Draw rectangles and text...
const atlasBitmap = await createImageBitmap(offscreen);
```

This technique is incredibly useful for generating dynamic textures, text labels, or debugging information.

```