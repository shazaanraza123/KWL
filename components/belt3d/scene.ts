/**
 * Real-time 3D render of Star Belt 001, styled as a studio product photo.
 * Vanilla three.js, imperative API, renders on demand only.
 * Units: 1 = 1 mm. Strap coordinates: x along the strap (R = 0, where the
 * leather leaves the buckle clip), y up (strap centreline y = 0), z toward camera.
 */
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { BeltView, Colorway, Side } from "@/lib/colorways";

/* ---------- size M geometry (tech pack) ---------- */
const W = 35;
const HALF = W / 2;
const LAYER = { a: 1.0, core: 1.5, b: 1.0 };
const THICK = LAYER.a + LAYER.core + LAYER.b;
const HOLES = [0, 1, 2, 3, 4, 5].map((i) => 850 + (i - 2.5) * 25.5);
const HOLE_R = 2;
const TIP = HOLES[5] + 160;
const STARS: number[] = [];
for (let x = 114; x <= HOLES[0] - 32 - 12.75; x += 65) STARS.push(x);
const STAR_W = 25.5;
const BUCKLE_X = 8; // star centroid
const POST_X = 24;
const KEEPER_X = 65;
const ENGAGED = HOLES[2]; // tail fastened on hole 3 counted from the buckle

/* ---------- shapes ---------- */
function starVerts(w: number, rot = false): [number, number][] {
  // centred on the star's centroid (centre of the inner pentagon), not its bounding box
  const D = Math.PI / 180;
  const R = w / (2 * Math.cos(18 * D));
  const r = R * 0.382;
  const out: [number, number][] = [];
  for (let i = 0; i < 10; i++) {
    const a = (90 - i * 36 + (rot ? 180 : 0)) * D;
    const rr = i % 2 ? r : R;
    out.push([rr * Math.cos(a), rr * Math.sin(a)]);
  }
  return out;
}

function roundedPath(path: THREE.Path, verts: [number, number][], ro: number, ri: number, cx = 0, cy = 0) {
  const n = verts.length;
  for (let i = 0; i < n; i++) {
    const p = verts[i];
    const prev = verts[(i - 1 + n) % n];
    const next = verts[(i + 1) % n];
    const rad = i % 2 ? ri : ro;
    const v1 = [prev[0] - p[0], prev[1] - p[1]];
    const v2 = [next[0] - p[0], next[1] - p[1]];
    const l1 = Math.hypot(v1[0], v1[1]);
    const l2 = Math.hypot(v2[0], v2[1]);
    const t = Math.min(rad, l1 * 0.45, l2 * 0.45);
    const a = [p[0] + (v1[0] / l1) * t + cx, p[1] + (v1[1] / l1) * t + cy];
    const b = [p[0] + (v2[0] / l2) * t + cx, p[1] + (v2[1] / l2) * t + cy];
    if (i === 0) path.moveTo(a[0], a[1]);
    else path.lineTo(a[0], a[1]);
    path.quadraticCurveTo(p[0] + cx, p[1] + cy, b[0], b[1]);
  }
  path.closePath();
}

type SegmentSpec = {
  /** strap position (mm from R) at the segment's left and right ends */
  p0: number;
  p1: number;
  /** scene x of strap position p: x = p + shift */
  shift: number;
  tip: boolean;
};

function stripShape(spec: SegmentSpec, layer: "a" | "core" | "b"): THREE.Shape {
  const x0 = spec.p0 + spec.shift;
  const x1 = spec.p1 + spec.shift;
  const s = new THREE.Shape();
  s.moveTo(x0, -HALF);
  if (spec.tip) {
    s.lineTo(x1 - HALF, -HALF);
    s.absarc(x1 - HALF, 0, HALF, -Math.PI / 2, Math.PI / 2, false);
  } else {
    s.lineTo(x1, -HALF);
    s.lineTo(x1, HALF);
  }
  s.lineTo(x0, HALF);
  s.lineTo(x0, -HALF);
  const inSeg = (p: number, m: number) => p - m > spec.p0 && p + m < spec.p1 - (spec.tip ? HALF : 0);
  if (layer !== "core") {
    for (const p of STARS) {
      if (!inSeg(p, STAR_W / 2 + 1)) continue;
      const h = new THREE.Path();
      // face B stars are cut rotated 180°: after the real flip they read point-up
      roundedPath(h, starVerts(STAR_W, layer === "b"), 0.6, 0.4, p + spec.shift, 0);
      s.holes.push(h);
    }
  }
  for (const p of HOLES) {
    if (!inSeg(p, HOLE_R + 0.5)) continue;
    const h = new THREE.Path();
    h.absarc(p + spec.shift, 0, HOLE_R, 0, Math.PI * 2, true);
    s.holes.push(h);
  }
  return s;
}

/** Planar caps: tangent along +x, handedness from the cap's facing so normal maps work on both faces. */
function addPlanarTangents(geo: THREE.BufferGeometry) {
  const n = geo.getAttribute("normal");
  const t = new Float32Array(n.count * 4);
  for (let i = 0; i < n.count; i++) {
    t[i * 4] = 1;
    t[i * 4 + 3] = n.getZ(i) < 0 ? -1 : 1;
  }
  geo.setAttribute("tangent", new THREE.BufferAttribute(t, 4));
  return geo;
}

/* ---------- textures ---------- */
function loadTex(loader: THREE.TextureLoader, url: string, repeat: number, color = false) {
  const t = loader.load(url);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 8;
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function starburstTexture(): THREE.CanvasTexture {
  const S = 256;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d")!;
  const m = S / 2;
  const halo = g.createRadialGradient(m, m, 0, m, m, m);
  halo.addColorStop(0, "rgba(255,255,255,1)");
  halo.addColorStop(0.035, "rgba(255,255,255,0.95)");
  halo.addColorStop(0.09, "rgba(235,242,255,0.18)");
  halo.addColorStop(0.4, "rgba(220,230,255,0.03)");
  halo.addColorStop(1, "rgba(220,230,255,0)");
  g.fillStyle = halo;
  g.fillRect(0, 0, S, S);
  const spike = (angle: number, len: number, width: number, alpha: number) => {
    g.save();
    g.translate(m, m);
    g.rotate(angle);
    const grad = g.createLinearGradient(0, 0, len, 0);
    grad.addColorStop(0, `rgba(255,255,255,${alpha})`);
    grad.addColorStop(0.35, `rgba(240,246,255,${alpha * 0.45})`);
    grad.addColorStop(1, "rgba(255,240,225,0)");
    g.fillStyle = grad;
    g.beginPath();
    g.moveTo(0, -width);
    g.lineTo(len, 0);
    g.lineTo(0, width);
    g.closePath();
    g.fill();
    g.restore();
  };
  for (let i = 0; i < 4; i++) spike((i * Math.PI) / 2, m, 3.2, 1);
  for (let i = 0; i < 4; i++) spike(Math.PI / 4 + (i * Math.PI) / 2, m * 0.45, 1.6, 0.45);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function glowTexture(): THREE.CanvasTexture {
  const S = 256;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  grad.addColorStop(0, "rgba(235,240,250,0.55)");
  grad.addColorStop(0.35, "rgba(220,228,245,0.18)");
  grad.addColorStop(1, "rgba(220,228,245,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, S, S);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ---------- easing ---------- */
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

type Anim = { start: number; dur: number; step: (k: number) => void; done?: () => void };

export type BeltSceneOptions = {
  canvas: HTMLCanvasElement;
  colorway: Colorway;
  side: Side;
  view: BeltView;
  reducedMotion: boolean;
  onFirstFrame?: () => void;
  preserveDrawingBuffer?: boolean;
};

export class BeltScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(15, 1, 10, 20000);
  private anims: Anim[] = [];
  private raf = 0;
  private needs = true;
  private first = true;
  private cw: Colorway;
  private side: Side;
  private view: BeltView;
  private reduced: boolean;
  private onFirstFrame?: () => void;

  private mats: {
    a: THREE.MeshPhysicalMaterial;
    b: THREE.MeshPhysicalMaterial;
    core: THREE.MeshPhysicalMaterial;
    edge: THREE.MeshStandardMaterial;
    hw: THREE.MeshPhysicalMaterial;
    buckle: THREE.MeshPhysicalMaterial;
  };
  private groups: Record<BeltView, { root: THREE.Group; straps: THREE.Group[] }>;
  private flashFx: { group: THREE.Group; bursts: { s: THREE.Sprite; delay: number; size: number; spin: number }[]; glow: THREE.Sprite; dots: THREE.Points; dotMat: THREE.ShaderMaterial };
  private key: THREE.SpotLight;
  private flashing = false;
  private sparkle: THREE.Texture;
  private disposed = false;
  private texturesReady = false;

  constructor(o: BeltSceneOptions) {
    this.cw = o.colorway;
    this.side = o.side;
    this.view = o.view;
    this.reduced = o.reducedMotion;
    this.onFirstFrame = o.onFirstFrame;

    const r = new THREE.WebGLRenderer({
      canvas: o.canvas,
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: !!o.preserveDrawingBuffer,
      powerPreference: "high-performance",
    });
    r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    r.setClearColor(new THREE.Color("#0d0d0d"), 1);
    r.toneMapping = THREE.NeutralToneMapping;
    r.toneMappingExposure = 0.95;
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer = r;

    const pmrem = new THREE.PMREMGenerator(r);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.45;

    // lights: soft key upper left, cool rim from behind, low fill from the right
    const key = new THREE.SpotLight(0xffffff, 4.2, 0, 0.42, 1, 0);
    key.position.set(-260, 420, 520);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.radius = 6;
    key.shadow.blurSamples = 16;
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.4;
    this.scene.add(key, key.target);
    this.key = key;
    const rim = new THREE.DirectionalLight(0xcdd8ff, 2.2);
    rim.position.set(80, 420, -380);
    const fill = new THREE.DirectionalLight(0xffffff, 0.35);
    fill.position.set(420, -80, 300);
    this.scene.add(rim, fill);

    // materials
    // first frame waits for every texture: an unloaded roughness map samples as 0 (mirror)
    const manager = new THREE.LoadingManager(() => {
      this.texturesReady = true;
      this.invalidate();
    });
    const loader = new THREE.TextureLoader(manager);
    const nrm = loadTex(loader, "/textures/leather-normal.webp", 1 / 20);
    const rough = loadTex(loader, "/textures/leather-rough.webp", 1 / 20);
    const powder = loadTex(loader, "/textures/powder-normal.webp", 1 / 18);
    this.sparkle = loadTex(loader, "/textures/bead-sparkle.webp", 1 / 26);
    const leather = () =>
      new THREE.MeshPhysicalMaterial({
        roughness: 1,
        roughnessMap: rough,
        specularIntensity: 0.75,
        normalMap: nrm,
        normalScale: new THREE.Vector2(0.55, 0.55),
      });
    this.mats = {
      a: leather(),
      b: leather(),
      core: leather(),
      edge: new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0 }),
      hw: new THREE.MeshPhysicalMaterial({
        roughness: 0.72,
        metalness: 0.25,
        normalMap: powder,
        normalScale: new THREE.Vector2(0.25, 0.25),
      }),
      buckle: new THREE.MeshPhysicalMaterial({
        roughness: 0.72,
        metalness: 0.25,
        normalMap: powder,
        normalScale: new THREE.Vector2(0.25, 0.25),
        emissive: new THREE.Color(0xffffff),
        emissiveIntensity: 0,
      }),
    };
    this.mats.core.normalScale.set(0.5, 0.5);

    this.groups = { closed: this.buildClosed(), flat: this.buildFlat() };
    this.scene.add(this.groups.closed.root, this.groups.flat.root);
    this.flashFx = this.buildFlash();

    this.applyColorway();
    this.applyView(false);
    this.applySide(false);
  }

  /* ---------- builders ---------- */
  private strapMesh(spec: SegmentSpec): THREE.Group {
    const g = new THREE.Group();
    const bevel = { bevelEnabled: true, bevelThickness: 0.18, bevelSize: 0.18, bevelSegments: 2, curveSegments: 10 };
    const layers: ["b" | "core" | "a", number, number][] = [
      ["b", -THICK / 2, LAYER.b],
      ["core", -THICK / 2 + LAYER.b, LAYER.core],
      ["a", -THICK / 2 + LAYER.b + LAYER.core, LAYER.a],
    ];
    for (const [name, z, depth] of layers) {
      const geo = new THREE.ExtrudeGeometry(stripShape(spec, name), { depth: depth - 0.36, ...bevel });
      geo.translate(0, 0, z + 0.18);
      addPlanarTangents(geo);
      const capMat = name === "a" ? this.mats.a : name === "b" ? this.mats.b : this.mats.core;
      const mesh = new THREE.Mesh(geo, [capMat, this.mats.edge]);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      g.add(mesh);
    }
    return g;
  }

  private keeperMesh(innerDepth: number): THREE.Mesh {
    const wall = 1.4;
    const outer = new THREE.Shape();
    const ih = W + 0.8;
    const rrect = (p: THREE.Path, x: number, y: number, w: number, h: number, rr: number) => {
      p.moveTo(x + rr, y);
      p.lineTo(x + w - rr, y);
      p.quadraticCurveTo(x + w, y, x + w, y + rr);
      p.lineTo(x + w, y + h - rr);
      p.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
      p.lineTo(x + rr, y + h);
      p.quadraticCurveTo(x, y + h, x, y + h - rr);
      p.lineTo(x, y + rr);
      p.quadraticCurveTo(x, y, x + rr, y);
    };
    // shape in (z, y) plane, extruded along x
    rrect(outer, -wall, -ih / 2 - wall, innerDepth + 2 * wall, ih + 2 * wall, 2.2);
    const hole = new THREE.Path();
    rrect(hole, 0, -ih / 2, innerDepth, ih, 0.8);
    outer.holes.push(hole);
    const geo = new THREE.ExtrudeGeometry(outer, { depth: 8.2, bevelEnabled: true, bevelThickness: 0.4, bevelSize: 0.4, bevelSegments: 3, curveSegments: 6 });
    // rotate: extrude axis -> x, shape x -> -z (a proper rotation keeps faces outward)
    geo.applyMatrix4(new THREE.Matrix4().set(0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 0, 1));
    const m = new THREE.Mesh(geo, this.mats.hw);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  private buckleMesh(): THREE.Group {
    const g = new THREE.Group();
    const s = new THREE.Shape();
    roundedPath(s, starVerts(78), 2.4, 1.6);
    const geo = new THREE.ExtrudeGeometry(s, { depth: 2.6, bevelEnabled: true, bevelThickness: 0.45, bevelSize: 0.7, bevelSegments: 5, curveSegments: 10 });
    addPlanarTangents(geo);
    const m = new THREE.Mesh(geo, this.mats.buckle);
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
    g.userData.front = 2.6 + 0.45;
    return g;
  }

  private buildClosed() {
    const root = new THREE.Group();
    // strap start: from inside the clip (R-40) to off frame on the right
    const start = this.strapMesh({ p0: -40, p1: 760, shift: 0, tip: false });
    start.position.set(0, 0, THICK / 2);
    // tail: comes in from the left, fastened on hole 3 at the post, ends in its tip right of the keeper
    const shift = POST_X - ENGAGED;
    const tail = this.strapMesh({ p0: -760 - shift, p1: TIP, shift, tip: true });
    tail.position.set(0, 0, THICK + 0.3 + THICK / 2);
    const keeper = this.keeperMesh(THICK * 2 + 0.6);
    keeper.position.set(KEEPER_X - 4.1, 0, THICK * 2 + 0.6 - 0.2);
    const buckle = this.buckleMesh();
    buckle.position.set(BUCKLE_X, 0, THICK * 2 + 0.3 + 1.2);
    root.add(start, tail, keeper, buckle);
    root.userData = { buckle, focus: new THREE.Vector3(BUCKLE_X, 0, 0) };
    return { root, straps: [start, tail] };
  }

  private buildFlat() {
    const root = new THREE.Group();
    const strap = this.strapMesh({ p0: -40, p1: TIP, shift: 0, tip: true });
    strap.position.set(0, 0, THICK / 2);
    const keeper = this.keeperMesh(THICK + 0.6);
    keeper.position.set(KEEPER_X - 4.1, 0, THICK + 0.6 - 0.3);
    const buckle = this.buckleMesh();
    buckle.position.set(BUCKLE_X, 0, THICK + 1.2);
    root.add(strap, keeper, buckle);
    root.userData = { buckle, focus: new THREE.Vector3((BUCKLE_X - 42 + TIP) / 2, 0, 0) };
    return { root, straps: [strap] };
  }

  private buildFlash() {
    const group = new THREE.Group();
    group.visible = false;
    const tex = starburstTexture();
    const verts = starVerts(70);
    const inside = (x: number, y: number) => {
      let c = false;
      for (let i = 0, j = verts.length - 1; i < verts.length; j = i++) {
        const [xi, yi] = verts[i];
        const [xj, yj] = verts[j];
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
      }
      return c;
    };
    const rnd = (() => {
      let s = 11;
      return () => ((s = (s * 16807) % 2147483647) / 2147483647);
    })();
    const sample = (bias: number) => {
      for (;;) {
        const x = (rnd() * 2 - 1) * 38;
        const y = (rnd() * 2 - 1) * 38;
        if (inside(x, y) && rnd() < Math.exp(-(x * x + y * y) / (bias * bias))) return [x, y];
      }
    };
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: glowTexture(), blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, transparent: true, opacity: 0 }),
    );
    glow.scale.set(190, 190, 1);
    group.add(glow);
    const bursts: { s: THREE.Sprite; delay: number; size: number; spin: number }[] = [];
    for (let i = 0; i < 8; i++) {
      const [x, y] = sample(i < 2 ? 18 : 34);
      const s = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: tex, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, transparent: true, opacity: 0, rotation: (rnd() - 0.5) * 0.5 }),
      );
      s.position.set(x, y, 4);
      group.add(s);
      bursts.push({ s, delay: rnd() * 0.3, size: 14 + rnd() * 24 + (i < 2 ? 8 : 0), spin: (rnd() - 0.5) * 0.6 });
    }
    const n = 420;
    const pos = new Float32Array(n * 3);
    const ph = new Float32Array(n);
    const sz = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const [x, y] = sample(60);
      pos.set([x, y, 3.2], i * 3);
      ph[i] = rnd() * 6.283;
      sz[i] = 1.6 + rnd() * 2.6;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("phase", new THREE.BufferAttribute(ph, 1));
    geo.setAttribute("psize", new THREE.BufferAttribute(sz, 1));
    const dotMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uLevel: { value: 0 }, uDpr: { value: this.renderer.getPixelRatio() } },
      vertexShader: `
        attribute float phase; attribute float psize; uniform float uTime; uniform float uDpr; varying float vA;
        void main(){ vA = 0.35 + 0.65*pow(0.5+0.5*sin(uTime*14.0+phase*3.0),3.0);
          gl_PointSize = psize*uDpr; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `
        uniform float uLevel; varying float vA;
        void main(){ float d = length(gl_PointCoord-0.5); float a = smoothstep(0.5,0.0,d);
          gl_FragColor = vec4(vec3(1.0), a*vA*uLevel); }`,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });
    const dots = new THREE.Points(geo, dotMat);
    group.add(dots);
    this.scene.add(group);
    return { group, bursts, glow, dots, dotMat };
  }

  /* ---------- state ---------- */
  private applyColorway() {
    const c = this.cw;
    this.mats.a.color.set(c.a.c);
    this.mats.b.color.set(c.b.c);
    this.mats.core.color.set(c.star);
    this.mats.edge.color.set(c.edge);
    this.mats.hw.color.set(c.hw);
    this.mats.buckle.color.set(c.hw);
    const light = new THREE.Color(c.hw).getHSL({ h: 0, s: 0, l: 0 }).l > 0.4;
    for (const m of [this.mats.hw, this.mats.buckle]) {
      m.roughness = light ? 0.66 : 0.72;
      m.metalness = light ? 0.05 : 0.25;
    }
    this.invalidate();
  }

  private applySide(animate: boolean) {
    const target = this.side === "a" ? 0 : Math.PI;
    const straps = [...this.groups.closed.straps, ...this.groups.flat.straps];
    if (!animate || this.reduced) {
      straps.forEach((s) => (s.rotation.x = target));
      this.invalidate();
      return;
    }
    const from = straps[0].rotation.x;
    this.run(520, (k) => straps.forEach((s) => (s.rotation.x = from + (target - from) * easeInOut(k))));
  }

  private frame() {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const w = Math.max(1, rect.width);
    const h = Math.max(1, rect.height);
    const aspect = w / h;
    this.camera.aspect = aspect;
    const mobile = w < 560;
    // closed: fixed buckle scale in px per mm, strap runs to the screen edges
    // flat: whole belt fits inside the content column (max 1100 px)
    const visibleW = this.view === "closed" ? w / (mobile ? 1.75 : 3.6) : (1180 * w) / Math.min(w, 1100);
    const visibleH = Math.max(visibleW / aspect, this.view === "closed" ? 118 : 60);
    const vfov = (this.camera.fov * Math.PI) / 180;
    const dist = visibleH / 2 / Math.tan(vfov / 2);
    const focus = this.groups[this.view].root.userData.focus as THREE.Vector3;
    const tilt = 5 * (Math.PI / 180);
    this.camera.position.set(focus.x, focus.y + Math.sin(tilt) * dist, Math.cos(tilt) * dist);
    this.camera.lookAt(focus.x, focus.y, 0);
    this.camera.updateProjectionMatrix();
    const far = this.view === "closed" ? 1 : 3.2;
    this.key.target.position.copy(focus);
    this.key.position.set(focus.x - 260 * far, 420 * far, 520 * far);
    this.key.angle = this.view === "closed" ? 0.42 : 0.5;
    this.key.shadow.camera.near = 50;
    this.key.shadow.camera.far = 6000;
    this.key.shadow.camera.updateProjectionMatrix();
    const b = this.groups[this.view].root.userData.buckle as THREE.Group;
    this.flashFx.group.position.set(b.position.x, b.position.y, b.position.z);
    return { w, h };
  }

  private applyView(animate: boolean) {
    this.groups.closed.root.visible = this.view === "closed";
    this.groups.flat.root.visible = this.view === "flat";
    this.resize();
    if (animate) this.invalidate();
  }

  /* ---------- public API ---------- */
  setColorway(c: Colorway) {
    this.cw = c;
    this.applyColorway();
  }
  setSide(s: Side, animate = true) {
    if (s === this.side) return;
    this.side = s;
    this.applySide(animate);
  }
  setView(v: BeltView) {
    if (v === this.view) return;
    this.view = v;
    this.applyView(true);
  }
  setReducedMotion(r: boolean) {
    this.reduced = r;
  }
  get isAnimating() {
    return this.anims.length > 0;
  }

  flash() {
    if (!this.cw.flash) return;
    const fx = this.flashFx;
    fx.group.visible = true;
    this.flashing = true;
    const m = this.mats.buckle;
    const baseColor = new THREE.Color(this.cw.hw);
    const litColor = new THREE.Color("#6f757e");
    if (this.reduced) {
      m.color.copy(litColor);
      m.emissiveMap = this.sparkle;
      m.emissiveIntensity = 0.55;
      m.needsUpdate = true;
      fx.glow.material.opacity = 0.45;
      fx.bursts.forEach((b, i) => {
        if (i < 6) {
          b.s.material.opacity = 0.9;
          b.s.scale.setScalar(b.size);
        }
      });
      fx.dotMat.uniforms.uLevel.value = 0.6;
      this.invalidate();
      window.setTimeout(() => this.endFlash(), 1200);
      return;
    }
    m.emissiveMap = this.sparkle;
    m.needsUpdate = true;
    const T = 1800;
    this.run(T, (k) => {
      const t = k * T;
      const up = clamp01(t / 120);
      const down = 1 - clamp01((t - 1200) / 600);
      const level = up * down;
      m.color.copy(baseColor).lerp(litColor, level);
      m.emissiveIntensity = 0.5 * level;
      fx.glow.material.opacity = 0.38 * level;
      fx.dotMat.uniforms.uLevel.value = level;
      fx.dotMat.uniforms.uTime.value = t / 1000;
      for (const b of fx.bursts) {
        const bt = clamp01((t / 1000 - b.delay) / 0.18);
        const tw = 0.85 + 0.3 * Math.sin(t / 55 + b.delay * 40) * Math.sin(t / 91 + b.size);
        const a = bt * down * (0.7 + 0.3 * tw);
        b.s.material.opacity = a;
        b.s.material.rotation += b.spin * 0.004;
        b.s.scale.setScalar(b.size * (0.7 + 0.45 * bt) * tw);
      }
    }, () => this.endFlash());
  }

  private endFlash() {
    const fx = this.flashFx;
    const m = this.mats.buckle;
    m.color.set(this.cw.hw);
    m.emissiveIntensity = 0;
    m.emissiveMap = null;
    m.needsUpdate = true;
    fx.group.visible = false;
    fx.bursts.forEach((b) => (b.s.material.opacity = 0));
    fx.glow.material.opacity = 0;
    fx.dotMat.uniforms.uLevel.value = 0;
    this.flashing = false;
    this.invalidate();
  }

  resize() {
    const canvas = this.renderer.domElement;
    const rect = canvas.getBoundingClientRect();
    this.renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height), false);
    this.frame();
    this.invalidate();
  }

  /** Render one frame now (used for capturing stills). */
  renderNow() {
    this.renderer.render(this.scene, this.camera);
  }

  private run(dur: number, step: (k: number) => void, done?: () => void) {
    this.anims.push({ start: performance.now(), dur, step, done });
    this.invalidate();
  }

  invalidate() {
    this.needs = true;
    if (!this.raf && !this.disposed) this.raf = requestAnimationFrame(this.tick);
  }

  private tick = (now: number) => {
    this.raf = 0;
    if (this.disposed) return;
    const live: Anim[] = [];
    for (const a of this.anims) {
      const k = clamp01((now - a.start) / a.dur);
      a.step(k);
      if (k < 1) live.push(a);
      else a.done?.();
    }
    this.anims = live;
    if (!this.texturesReady) return;
    this.renderer.render(this.scene, this.camera);
    if (this.first) {
      this.first = false;
      this.onFirstFrame?.();
    }
    this.needs = false;
    if (this.anims.length || this.flashing) this.raf = requestAnimationFrame(this.tick);
  };

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
    });
    this.renderer.dispose();
  }
}
