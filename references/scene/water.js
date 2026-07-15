import * as THREE from 'three';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';

function createProceduralWaterNormals() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(size, size);
  const data = img.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = x / size;
      const ny = y / size;
      const hx =
        Math.cos(nx * Math.PI * 8) * 0.35 * Math.PI * 8 +
        Math.cos((nx + ny) * Math.PI * 10) * 0.2 * Math.PI * 10;
      const hy =
        Math.cos(ny * Math.PI * 6 + 0.4) * 0.25 * Math.PI * 6 +
        Math.cos((nx + ny) * Math.PI * 10) * 0.2 * Math.PI * 10;
      const n = new THREE.Vector3(-hx, -hy, 1).normalize();
      const i = (y * size + x) * 4;
      data[i] = (n.x * 0.5 + 0.5) * 255;
      data[i + 1] = (n.y * 0.5 + 0.5) * 255;
      data[i + 2] = (n.z * 0.5 + 0.5) * 255;
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

function loadWaterNormals() {
  return new Promise((resolve) => {
    const loader = new THREE.TextureLoader();
    loader.load(
      'https://threejs.org/examples/textures/waternormals.jpg',
      (texture) => {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 4);
        resolve(texture);
      },
      undefined,
      () => resolve(createProceduralWaterNormals())
    );
  });
}

/**
 * Build open-water environment: Water + Sky + lights + fog.
 * @returns {Promise<{ water: Water, sunPos: THREE.Vector3, update: (dt: number) => void }>}
 */
export async function createWaterWorld(scene) {
  const sunPos = new THREE.Vector3();
  const phi = THREE.MathUtils.degToRad(90 - 18);
  const theta = THREE.MathUtils.degToRad(210);
  sunPos.setFromSphericalCoords(1, phi, theta);

  scene.fog = new THREE.FogExp2(0x89b3d9, 0.0008);
  scene.background = new THREE.Color(0x89b3d9);

  const sky = new Sky();
  sky.scale.setScalar(10000);
  scene.add(sky);

  const skyUniforms = sky.material.uniforms;
  skyUniforms.turbidity.value = 10;
  skyUniforms.rayleigh.value = 2;
  skyUniforms.mieCoefficient.value = 0.005;
  skyUniforms.mieDirectionalG.value = 0.8;
  skyUniforms.sunPosition.value.copy(sunPos);

  const ambient = new THREE.AmbientLight(0x445566, 0.4);
  const hemi = new THREE.HemisphereLight(0x87ceeb, 0x224433, 0.6);
  const sun = new THREE.DirectionalLight(0xffeedd, 1.5);
  sun.position.copy(sunPos).multiplyScalar(100);
  scene.add(ambient, hemi, sun);

  const waterNormals = await loadWaterNormals();
  const geometry = new THREE.PlaneGeometry(1200, 1200);
  const water = new Water(geometry, {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals,
    sunDirection: sunPos.clone().normalize(),
    sunColor: 0xffffff,
    waterColor: 0x3d6d9b,
    distortionScale: 3.7,
    side: THREE.DoubleSide,
    fog: true,
  });
  water.rotation.x = -Math.PI / 2;
  water.material.uniforms.size.value = 4.0;
  scene.add(water);

  return {
    water,
    sunPos,
    update(dt) {
      water.material.uniforms.time.value += dt * 0.5;
    },
  };
}
