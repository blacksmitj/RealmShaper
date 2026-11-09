import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const THUMBNAIL_WIDTH = 256;
const THUMBNAIL_HEIGHT = 256;

/**
 * Membuat thumbnail asli dari file 3D .glb menggunakan Three.js offscreen WebGL renderer.
 * @param file File .glb atau ArrayBuffer/Blob
 * @returns DataURL bertipe image/webp
 */
export async function generateGlbThumbnail(file: File | Blob): Promise<string> {
  const buffer = await file.arrayBuffer();

  return new Promise<string>((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = THUMBNAIL_WIDTH;
    canvas.height = THUMBNAIL_HEIGHT;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, false);
    renderer.setPixelRatio(1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    const scene = new THREE.Scene();

    // Studio Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xfff7ed, 2.2);
    dirLight1.position.set(5, 10, 7);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x93c5fd, 1.2);
    dirLight2.position.set(-6, -4, -5);
    scene.add(dirLight2);

    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);

    const loader = new GLTFLoader();
    loader.parse(
      buffer,
      '',
      (gltf) => {
        const root = gltf.scene || gltf.scenes[0];
        scene.add(root);

        // Auto-center & Frame Bounding Box
        const box = new THREE.Box3().setFromObject(root);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z, 0.1);

        root.position.sub(center);

        // Position camera isometric-style
        const distance = maxDim * 2.2;
        camera.position.set(distance * 0.9, distance * 0.75, distance * 0.9);
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();

        renderer.render(scene, camera);
        const dataUrl = canvas.toDataURL('image/webp', 0.9);

        // Cleanup
        renderer.dispose();
        scene.clear();
        resolve(dataUrl);
      },
      (error) => {
        renderer.dispose();
        reject(error);
      }
    );
  });
}

/**
 * Membuat thumbnail asli dari file gambar tekstur lantai menggunakan Three.js offscreen renderer pada isometric tile plane.
 * @param file File gambar tekstur (PNG, JPG, WebP)
 * @param repeatScale Skala repetisi ubin (default 1.0)
 * @returns DataURL bertipe image/webp
 */
export async function generateTextureThumbnail(
  file: File | Blob,
  repeatScale = 1.0
): Promise<string> {
  const objectUrl = URL.createObjectURL(file);

  return new Promise<string>((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = THUMBNAIL_WIDTH;
    canvas.height = THUMBNAIL_HEIGHT;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, false);
    renderer.setPixelRatio(1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;

    const scene = new THREE.Scene();

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffedd5, 1.6);
    dirLight.position.set(4, 6, 4);
    scene.add(dirLight);

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
    camera.position.set(2.8, 3.2, 2.8);
    camera.lookAt(0, 0, 0);

    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      objectUrl,
      (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(repeatScale, repeatScale);
        texture.colorSpace = THREE.SRGBColorSpace;

        // Create angled bevel floor tile mesh
        const geometry = new THREE.BoxGeometry(2, 0.25, 2);
        const material = new THREE.MeshStandardMaterial({
          map: texture,
          color: '#ffffff',
          roughness: 0.6,
          metalness: 0.1,
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0, -0.1, 0);
        scene.add(mesh);

        renderer.render(scene, camera);
        const dataUrl = canvas.toDataURL('image/webp', 0.9);

        // Cleanup
        URL.revokeObjectURL(objectUrl);
        texture.dispose();
        material.dispose();
        geometry.dispose();
        renderer.dispose();
        scene.clear();
        resolve(dataUrl);
      },
      undefined,
      (err) => {
        URL.revokeObjectURL(objectUrl);
        renderer.dispose();
        reject(err);
      }
    );
  });
}

