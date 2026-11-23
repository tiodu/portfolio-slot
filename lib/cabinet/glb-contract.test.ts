import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { GLB_REEL } from "./glb-metrics";

/*
  The contract between Blender and the code: part names exist, and each reel's UVs
  wrap round the drum the way the code's 9-face strip expects.
  - u = angle from the front towards the top, divided by a full turn
  - v = (half width + x) / width, measured from the top, as glTF does (flipY is false)
  So face i of the strip is at the front when the reel is turned by i * FACE + half a face.
*/
const file = readFileSync(new URL("../../public/models/cabinet.glb", import.meta.url));
const jsonLength = file.readUInt32LE(12);
const gltf = JSON.parse(file.subarray(20, 20 + jsonLength).toString("utf8"));
const bin = file.subarray(20 + jsonLength + 8);

type Accessor = { bufferView: number; byteOffset?: number; count: number; type: string };

function read(accessorIndex: number): { data: Float32Array; size: number } {
  const accessor: Accessor = gltf.accessors[accessorIndex];
  const view = gltf.bufferViews[accessor.bufferView];
  const size = accessor.type === "VEC3" ? 3 : 2;
  const offset = bin.byteOffset + (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  const data = new Float32Array(bin.buffer.slice(offset, offset + accessor.count * size * 4));
  return { data, size };
}

function node(name: string) {
  return gltf.nodes.find((entry: { name?: string }) => entry.name === name);
}

const TAU = Math.PI * 2;
const WIDTH = GLB_REEL.width;
const CAP_UV = [0.004, 0.5];

describe("cabinet.glb contract", () => {
  it("has the parts the code drives", () => {
    const names = [
      "Reel0", "Reel1", "Reel2", "LeverPivot", "TopperAnchor",
      "Sticker_Figma", "Sticker_Claude", "Sticker_ShipIt", "ReelShade",
    ];
    for (const name of names) assert.ok(node(name), `${name} is missing`);
    const bulbs = gltf.nodes.filter((entry: { name?: string }) => /^Bulb\d\d$/.test(entry.name ?? ""));
    assert.equal(bulbs.length, 45);
  });

  for (const index of [0, 1, 2]) {
    it(`wraps Reel${index} round the drum like the 9-face strip`, () => {
      const reel = node(`Reel${index}`);
      const primitive = gltf.meshes[reel.mesh].primitives[0];
      const position = read(primitive.attributes.POSITION).data;
      const uv = read(primitive.attributes.TEXCOORD_0).data;
      let checked = 0;
      for (let vertex = 0; vertex < position.length / 3; vertex += 1) {
        const x = position[vertex * 3];
        const y = position[vertex * 3 + 1];
        const z = position[vertex * 3 + 2];
        // The end caps all point at one plain-paper spot, so they carry no symbol.
        if (Math.abs(uv[vertex * 2] - CAP_UV[0]) < 1e-3 && Math.abs(uv[vertex * 2 + 1] - CAP_UV[1]) < 1e-3) continue;
        const theta = Math.atan2(y, z); // from the front (+z) towards the top (+y)
        const expectU = theta / TAU;
        const turns = uv[vertex * 2] - expectU;
        assert.ok(Math.abs(turns - Math.round(turns)) < 1e-3, `u is off at vertex ${vertex}`);
        // The bevel at each rim blends v towards the cap, so only check clear of it.
        if (Math.abs(x) < WIDTH / 2 - 0.006) {
          assert.ok(Math.abs(uv[vertex * 2 + 1] - (WIDTH / 2 + x) / WIDTH) < 1e-3, `v is off at vertex ${vertex}`);
        }
        checked += 1;
      }
      assert.ok(checked > 40, "too few drum vertices checked");
      const maxRadius = Math.max(...Array.from({ length: position.length / 3 }, (_, v) => Math.hypot(position[v * 3 + 1], position[v * 3 + 2])));
      assert.ok(Math.abs(maxRadius - GLB_REEL.radius) < 1e-3, "drum radius changed; update GLB_REEL");
    });
  }
});
