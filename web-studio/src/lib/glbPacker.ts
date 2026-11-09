import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

/**
 * Menggabungkan file GLB dan file Texture (PNG/JPG) menjadi satu file GLB utuh (Embedded).
 * Sangat berguna untuk model low-poly bergaya atlas palette (seperti KayKit / Synty)
 * yang mengekspor tekstur secara loose/eksternal.
 *
 * @param glbFile File .glb mentah
 * @param textureFile File gambar tekstur (PNG/JPG) opsional
 * @returns Blob bertipe model/gltf-binary yang sudah berisi tekstur ter-embed
 */
export async function packGlbWithTexture(
  glbFile: File | Blob,
  textureFile?: File | Blob | null
): Promise<Blob> {
  // Jika tidak ada file tekstur yang dilampirkan, return file aslinya
  if (!textureFile) {
    if (glbFile instanceof Blob && glbFile.type === 'model/gltf-binary') {
      return glbFile;
    }
    const buffer = await glbFile.arrayBuffer();
    return new Blob([buffer], { type: 'model/gltf-binary' });
  }

  const glbBuffer = await glbFile.arrayBuffer();
  const textureDataUrl = await readBlobAsDataUrl(textureFile);

  return new Promise<Blob>((resolve, reject) => {
    // Siapkan LoadingManager untuk menangani request path tekstur eksternal
    // yang hilang (seperti "Textures/colormap.png") agar parser tidak error/reject
    const loadingManager = new THREE.LoadingManager();
    loadingManager.setURLModifier((url) => {
      // Jika gltf mencoba meminta URL gambar eksternal, alihkan ke tekstur yang diupload atau transparent 1x1 pixel
      if (url.match(/\.(png|jpg|jpeg|webp)$/i) || url.startsWith('Textures/')) {
        return textureDataUrl;
      }
      return url;
    });

    const gltfLoader = new GLTFLoader(loadingManager);
    const textureLoader = new THREE.TextureLoader(loadingManager);

    // 1. Muat Tekstur
    textureLoader.load(
      textureDataUrl,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.flipY = false; // Standar UV glTF 2.0
        texture.needsUpdate = true;

        // 2. Parse GLB Buffer
        gltfLoader.parse(
          glbBuffer,
          '',
          (gltf) => {
            const root = gltf.scene || gltf.scenes[0];

            // 3. Terapkan Tekstur ke Seluruh Mesh
            root.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                if (mesh.material) {
                  if (Array.isArray(mesh.material)) {
                    mesh.material.forEach((mat) => {
                      applyTextureToMaterial(mat, texture);
                    });
                  } else {
                    applyTextureToMaterial(mesh.material, texture);
                  }
                }
              }
            });

            // 4. Export Kembali menjadi Single Binary GLB
            const exporter = new GLTFExporter();
            exporter.parse(
              root,
              (result) => {
                if (result instanceof ArrayBuffer) {
                  const packedBlob = new Blob([result], { type: 'model/gltf-binary' });
                  resolve(packedBlob);
                } else {
                  // Fallback jika exporter mengembalikan JSON string
                  const jsonStr = JSON.stringify(result);
                  const packedBlob = new Blob([jsonStr], { type: 'model/gltf+json' });
                  resolve(packedBlob);
                }
              },
              (err) => reject(err),
              {
                binary: true,
                embedImages: true,
              }
            );
          },
          (err) => reject(err)
        );
      },
      undefined,
      (err) => reject(err)
    );
  });
}

function applyTextureToMaterial(mat: THREE.Material, texture: THREE.Texture) {
  if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshBasicMaterial) {
    mat.map = texture;
    mat.needsUpdate = true;
  }
}

function readBlobAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
