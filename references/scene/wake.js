import * as THREE from 'three';

const MAX_PTS = 90;
const LIFE_WINDOW = 2.6;
const MAX_PART = 360;
const Y_LIFT = 0.04;

function makeFoamTexture() {
  const s = 64;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0.0, 'rgba(255,255,255,0.95)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.55)');
  g.addColorStop(1.0, 'rgba(255,255,255,0.0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const img = ctx.getImageData(0, 0, s, s);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 70;
    img.data[i + 3] = Math.max(0, Math.min(255, img.data[i + 3] + n));
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

function setV(arr, i, p, y) {
  arr[i * 3] = p.x;
  arr[i * 3 + 1] = y;
  arr[i * 3 + 2] = p.z;
}

/**
 * V-shaped foam ribbon + particle splash wake (see references/尾迹制作笔记.txt).
 */
export function createWake(scene, options = {}) {
  const halfLength = options.halfLength ?? 4;
  const sternOffset = options.sternOffset ?? halfLength * 0.88;
  const halfBeam = options.halfBeam ?? 0.55;
  const emitPerFrame = options.emitPerFrame ?? 2;

  const ptsL = [];
  const ptsR = [];
  const tmpL = new THREE.Vector3();
  const tmpR = new THREE.Vector3();
  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();

  // --- ribbon ---
  const maxSeg = MAX_PTS - 1;
  const maxVerts = maxSeg * 4;
  const ribbonPos = new Float32Array(maxVerts * 3);
  const ribbonAlpha = new Float32Array(maxVerts);
  const ribbonUv = new Float32Array(maxVerts * 2);
  const ribbonIndex = new Uint32Array(maxSeg * 6);

  for (let s = 0; s < maxSeg; s++) {
    const v = s * 4;
    const i = s * 6;
    ribbonIndex[i] = v;
    ribbonIndex[i + 1] = v + 1;
    ribbonIndex[i + 2] = v + 2;
    ribbonIndex[i + 3] = v;
    ribbonIndex[i + 4] = v + 2;
    ribbonIndex[i + 5] = v + 3;
  }

  const ribbonGeo = new THREE.BufferGeometry();
  ribbonGeo.setAttribute('position', new THREE.BufferAttribute(ribbonPos, 3));
  ribbonGeo.setAttribute('aAlpha', new THREE.BufferAttribute(ribbonAlpha, 1));
  ribbonGeo.setAttribute('uv', new THREE.BufferAttribute(ribbonUv, 2));
  ribbonGeo.setIndex(new THREE.BufferAttribute(ribbonIndex, 1));
  ribbonGeo.setDrawRange(0, 0);

  const ribbonMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uColor: { value: new THREE.Color(0xeaf6ff) },
    },
    vertexShader: /* glsl */ `
      attribute float aAlpha;
      varying float vAlpha;
      varying vec2 vUv;
      void main() {
        vAlpha = aAlpha;
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      varying float vAlpha;
      varying vec2 vUv;
      void main() {
        float edge = smoothstep(0.0, 0.18, vUv.y) * smoothstep(1.0, 0.82, vUv.y);
        float a = vAlpha * (0.55 + 0.45 * edge);
        if (a < 0.01) discard;
        gl_FragColor = vec4(uColor, a);
      }
    `,
  });

  const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
  ribbon.frustumCulled = false;
  ribbon.renderOrder = 2;
  scene.add(ribbon);

  // --- particles ---
  const partPos = new Float32Array(MAX_PART * 3);
  const partAlpha = new Float32Array(MAX_PART);
  const partSize = new Float32Array(MAX_PART);
  const partVel = new Float32Array(MAX_PART * 3);
  const partLife = new Float32Array(MAX_PART);
  const partMaxLife = new Float32Array(MAX_PART);
  let partCursor = 0;

  const partGeo = new THREE.BufferGeometry();
  partGeo.setAttribute('position', new THREE.BufferAttribute(partPos, 3));
  partGeo.setAttribute('aAlpha', new THREE.BufferAttribute(partAlpha, 1));
  partGeo.setAttribute('aSize', new THREE.BufferAttribute(partSize, 1));
  partGeo.setDrawRange(0, 0);

  const foamMap = makeFoamTexture();
  const partMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uMap: { value: foamMap },
      uPixel: { value: Math.min(window.devicePixelRatio || 1, 2) },
    },
    vertexShader: /* glsl */ `
      attribute float aAlpha;
      attribute float aSize;
      varying float vAlpha;
      uniform float uPixel;
      void main() {
        vAlpha = aAlpha;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * (300.0 / -mv.z) * uPixel;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap;
      varying float vAlpha;
      void main() {
        vec4 tex = texture2D(uMap, gl_PointCoord);
        float a = tex.a * vAlpha;
        if (a < 0.02) discard;
        gl_FragColor = vec4(0.95, 0.98, 1.0, a);
      }
    `,
  });

  const particles = new THREE.Points(partGeo, partMat);
  particles.frustumCulled = false;
  particles.renderOrder = 3;
  scene.add(particles);

  function sternAnchors(x, y, z, headingDeg) {
    const yaw = THREE.MathUtils.degToRad(headingDeg);
    const sinY = Math.sin(yaw);
    const cosY = Math.cos(yaw);
    forward.set(sinY, 0, cosY);
    right.set(cosY, 0, -sinY);

    // 双桨锚点：船尾中心后退 sternOffset，再左右半桨距
    const cx = x - sinY * sternOffset;
    const cz = z - cosY * sternOffset;
    const rx = right.x * halfBeam;
    const rz = right.z * halfBeam;

    tmpL.set(cx - rx, y, cz - rz);
    tmpR.set(cx + rx, y, cz + rz);
    return { sternL: tmpL, sternR: tmpR, forward };
  }

  function spawnParticle(origin, fwd) {
    const idx = partCursor % MAX_PART;
    partCursor += 1;
    partPos[idx * 3] = origin.x + (Math.random() - 0.5) * halfBeam * 0.4;
    partPos[idx * 3 + 1] = Math.max(0.05, origin.y + 0.08);
    partPos[idx * 3 + 2] = origin.z + (Math.random() - 0.5) * halfBeam * 0.4;

    const back = -0.85 - Math.random() * 0.45;
    partVel[idx * 3] = fwd.x * back + (Math.random() - 0.5) * 0.25;
    partVel[idx * 3 + 1] = 0.04 + Math.random() * 0.06;
    partVel[idx * 3 + 2] = fwd.z * back + (Math.random() - 0.5) * 0.25;

    const life = 0.7 + Math.random() * 0.55;
    partLife[idx] = life;
    partMaxLife[idx] = life;
    partSize[idx] = (0.45 + Math.random() * 0.55) * 5.0;
    partAlpha[idx] = 1;
  }

  function rebuildRibbon(now) {
    while (ptsL.length && now - ptsL[0].born > LIFE_WINDOW) {
      ptsL.shift();
      ptsR.shift();
    }
    const n = Math.min(ptsL.length, ptsR.length);
    if (n < 2) {
      ribbonGeo.setDrawRange(0, 0);
      return;
    }

    const segs = Math.min(n - 1, maxSeg);
    let v = 0;
    for (let i = 0; i < segs; i++) {
      const a0 = Math.min(1, (now - ptsL[i].born) / LIFE_WINDOW);
      const a1 = Math.min(1, (now - ptsL[i + 1].born) / LIFE_WINDOW);
      const yL0 = ptsL[i].pos.y + Y_LIFT;
      const yR0 = ptsR[i].pos.y + Y_LIFT;
      const yR1 = ptsR[i + 1].pos.y + Y_LIFT;
      const yL1 = ptsL[i + 1].pos.y + Y_LIFT;

      setV(ribbonPos, v + 0, ptsL[i].pos, yL0);
      setV(ribbonPos, v + 1, ptsR[i].pos, yR0);
      setV(ribbonPos, v + 2, ptsR[i + 1].pos, yR1);
      setV(ribbonPos, v + 3, ptsL[i + 1].pos, yL1);

      const al0 = (1 - a0) * 0.55;
      const al1 = (1 - a1) * 0.55;
      ribbonAlpha[v + 0] = al0;
      ribbonAlpha[v + 1] = al0;
      ribbonAlpha[v + 2] = al1;
      ribbonAlpha[v + 3] = al1;

      ribbonUv[(v + 0) * 2] = i / segs;
      ribbonUv[(v + 0) * 2 + 1] = 0;
      ribbonUv[(v + 1) * 2] = i / segs;
      ribbonUv[(v + 1) * 2 + 1] = 1;
      ribbonUv[(v + 2) * 2] = (i + 1) / segs;
      ribbonUv[(v + 2) * 2 + 1] = 1;
      ribbonUv[(v + 3) * 2] = (i + 1) / segs;
      ribbonUv[(v + 3) * 2 + 1] = 0;

      v += 4;
    }

    ribbonGeo.attributes.position.needsUpdate = true;
    ribbonGeo.attributes.aAlpha.needsUpdate = true;
    ribbonGeo.attributes.uv.needsUpdate = true;
    ribbonGeo.setDrawRange(0, segs * 6);
  }

  function updateParticles(dt) {
    let alive = 0;
    for (let i = 0; i < MAX_PART; i++) {
      if (partLife[i] <= 0) {
        partAlpha[i] = 0;
        continue;
      }
      partLife[i] -= dt;
      if (partLife[i] <= 0) {
        partLife[i] = 0;
        partAlpha[i] = 0;
        continue;
      }

      partVel[i * 3 + 1] -= 0.6 * dt;
      partPos[i * 3] += partVel[i * 3] * dt;
      partPos[i * 3 + 1] += partVel[i * 3 + 1] * dt;
      partPos[i * 3 + 2] += partVel[i * 3 + 2] * dt;
      if (partPos[i * 3 + 1] < 0.02) {
        partPos[i * 3 + 1] = 0.02;
        partVel[i * 3 + 1] *= -0.25;
      }
      const lf = partLife[i] / partMaxLife[i];
      partAlpha[i] = Math.pow(lf, 0.6);
      partSize[i] *= 1.0 + dt * 0.5;
      alive += 1;
    }

    partGeo.attributes.position.needsUpdate = true;
    partGeo.attributes.aAlpha.needsUpdate = true;
    partGeo.attributes.aSize.needsUpdate = true;
    partGeo.setDrawRange(0, MAX_PART);
    return alive;
  }

  let sampleAcc = 0;

  function update(pose, dt) {
    if (!pose) return;
    const now = performance.now() * 0.001;
    sampleAcc += dt;

    // sample every frame (notes); skip if almost still
    const { sternL, sternR, forward: fwd } = sternAnchors(
      pose.x,
      pose.y,
      pose.z,
      pose.heading
    );

    if (sampleAcc >= 0.04) {
      sampleAcc = 0;
      ptsL.push({ pos: sternL.clone(), born: now });
      ptsR.push({ pos: sternR.clone(), born: now });
      if (ptsL.length > MAX_PTS) {
        ptsL.shift();
        ptsR.shift();
      }

      for (let n = 0; n < emitPerFrame; n++) {
        spawnParticle(n % 2 === 0 ? sternL : sternR, fwd);
      }
    }

    rebuildRibbon(now);
    updateParticles(dt);
  }

  function clear() {
    ptsL.length = 0;
    ptsR.length = 0;
    for (let i = 0; i < MAX_PART; i++) {
      partLife[i] = 0;
      partAlpha[i] = 0;
    }
    ribbonGeo.setDrawRange(0, 0);
    partGeo.setDrawRange(0, 0);
  }

  function dispose() {
    scene.remove(ribbon);
    scene.remove(particles);
    ribbonGeo.dispose();
    ribbonMat.dispose();
    partGeo.dispose();
    partMat.dispose();
    foamMap.dispose();
  }

  return { ribbon, particles, update, clear, dispose };
}
