import * as THREE from 'three';

/** Sparse sea markers so boat motion is readable on open water. */
export function createSeaMarkers(scene) {
  const group = new THREE.Group();
  group.name = 'SeaMarkers';

  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x3ecf9a,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  for (const r of [20, 40, 60]) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(r - 0.15, r + 0.15, 96), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.05;
    group.add(ring);
  }

  const poleGeo = new THREE.CylinderGeometry(0.12, 0.18, 3.2, 8);
  const poleMat = new THREE.MeshStandardMaterial({
    color: 0xe8a45a,
    emissive: 0x3a2010,
    metalness: 0.2,
    roughness: 0.6,
  });
  const pole = new THREE.Mesh(poleGeo, poleMat);
  pole.position.y = 1.4;
  group.add(pole);

  const cardinal = [
    { x: 0, z: 50, color: 0x5ad0ff },
    { x: 50, z: 0, color: 0xff8a5a },
    { x: 0, z: -50, color: 0x9ec9d8 },
    { x: -50, z: 0, color: 0xb8e986 },
  ];
  for (const c of cardinal) {
    const buoy = new THREE.Mesh(
      new THREE.SphereGeometry(0.7, 16, 12),
      new THREE.MeshStandardMaterial({
        color: c.color,
        emissive: c.color,
        emissiveIntensity: 0.25,
        roughness: 0.45,
      })
    );
    buoy.position.set(c.x, 0.6, c.z);
    group.add(buoy);
  }

  const grid = new THREE.GridHelper(120, 24, 0x3d6d9b, 0x1a3344);
  grid.position.y = 0.02;
  const gridMats = Array.isArray(grid.material) ? grid.material : [grid.material];
  for (const m of gridMats) {
    m.transparent = true;
    m.opacity = 0.35;
  }
  group.add(grid);

  scene.add(group);
  return group;
}
