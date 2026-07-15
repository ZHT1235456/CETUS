import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Align model nose to world +Z before applying heading.
 * 相对导出轴向机头轴向：逆时针旋转 90°（+Y）。
 */
const MODEL_BOW_ALIGN_RAD = Math.PI / 2;

/**
 * Load USV.glb and expose setPose / update for smoothed motion.
 * Heading convention: 0° = velocity toward +Z, degrees, atan2(vx, vz).
 * Visual yaw follows motion direction so bow stays aligned with speed.
 */
export async function createUSV(scene) {
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync('/assets/USV.glb');
  const root = gltf.scene;

  root.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  // Bow (+X in many assets) → +Z, then heading rotates around Y
  root.rotation.y = MODEL_BOW_ALIGN_RAD;

  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const targetLength = 8;
  const scale = maxDim > 0 ? targetLength / maxDim : 1;
  root.scale.setScalar(scale);

  box.setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());
  root.position.sub(center);
  box.setFromObject(root);
  // 略抬高：相对水面吃水线往上挪一点
  root.position.y -= box.min.y * 0.15;
  root.position.y += 0.55;

  box.setFromObject(root);
  const sizeAfter = box.getSize(new THREE.Vector3());
  const halfLength = targetLength * 0.5;
  const beam = Math.min(sizeAfter.x, sizeAfter.z);
  // 双螺旋桨：左右锚点半间距（约 22% 船宽），略收于船尾外缘
  const halfBeam = Math.max(0.45, beam * 0.22);
  // 锚点落在尾部桨位，略短于半船长，避免拖到船体后方过远
  const sternOffset = halfLength * 0.88;

  const pivot = new THREE.Group();
  pivot.name = 'USVPivot';
  pivot.add(root);
  scene.add(pivot);

  const current = {
    x: 0,
    y: 0,
    z: 0,
    heading: 0,
  };
  const target = { ...current };
  let hasTarget = false;
  let prevX = 0;
  let prevZ = 0;

  function setPose({ x = 0, y = 0, z = 0, heading = 0 } = {}) {
    target.x = Number(x) || 0;
    target.y = Number(y) || 0;
    target.z = Number(z) || 0;
    const h = Number(heading);
    target.heading = Number.isFinite(h) ? h : 0;
    if (!hasTarget) {
      current.x = target.x;
      current.y = target.y;
      current.z = target.z;
      current.heading = target.heading;
      prevX = current.x;
      prevZ = current.z;
      hasTarget = true;
      apply();
    }
  }

  function lerpAngle(a, b, t) {
    let diff = ((((b - a) % 360) + 540) % 360) - 180;
    return a + diff * t;
  }

  function apply() {
    pivot.position.set(current.x, current.y, current.z);
    const yaw = THREE.MathUtils.degToRad(current.heading);
    pivot.rotation.set(0, yaw, 0);
  }

  function update(dt) {
    if (!hasTarget) return;
    const alpha = 1 - Math.exp(-8 * dt);
    current.x += (target.x - current.x) * alpha;
    current.y += (target.y - current.y) * alpha;
    current.z += (target.z - current.z) * alpha;

    const dx = current.x - prevX;
    const dz = current.z - prevZ;
    const moved2 = dx * dx + dz * dz;
    // Prefer velocity direction so bow matches motion
    if (moved2 > 1e-6) {
      const velHeading = (Math.atan2(dx, dz) * 180) / Math.PI;
      current.heading = lerpAngle(current.heading, velHeading, Math.min(1, alpha * 1.8));
    } else {
      current.heading = lerpAngle(current.heading, target.heading, alpha);
    }
    prevX = current.x;
    prevZ = current.z;
    apply();
  }

  return {
    pivot,
    setPose,
    update,
    getPose: () => ({ ...current }),
    halfLength,
    halfBeam,
    sternOffset,
  };
}
