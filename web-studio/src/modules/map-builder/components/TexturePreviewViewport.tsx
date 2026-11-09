import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface TexturePreviewViewportProps {
  textureUrl?: string;
  repeatScale: number;
  className?: string;
}

export const TexturePreviewViewport: React.FC<TexturePreviewViewportProps> = ({
  textureUrl,
  repeatScale,
  className = 'w-full h-44',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const textureRef = useRef<THREE.Texture | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 180;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(2.8, 3.2, 2.8);
    camera.lookAt(0, 0, 0);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffedd5, 1.8);
    dirLight.position.set(4, 8, 4);
    scene.add(dirLight);

    // Bevel tile 3D
    const geometry = new THREE.BoxGeometry(2, 0.28, 2);
    const material = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.65,
      metalness: 0.1,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, -0.14, 0);
    scene.add(mesh);
    meshRef.current = mesh;

    let animId = 0;
    const renderLoop = () => {
      renderer.render(scene, camera);
      animId = requestAnimationFrame(renderLoop);
    };
    renderLoop();

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      if (textureRef.current) textureRef.current.dispose();
      container.innerHTML = '';
    };
  }, []);

  // Update texture & repeat scale dynamically
  useEffect(() => {
    if (!meshRef.current || !textureUrl) return;

    const material = meshRef.current.material as THREE.MeshStandardMaterial;

    if (textureRef.current && (textureRef.current.image as HTMLImageElement)?.src === textureUrl) {
      textureRef.current.repeat.set(repeatScale, repeatScale);
      textureRef.current.needsUpdate = true;
      material.needsUpdate = true;
      return;
    }

    const loader = new THREE.TextureLoader();
    loader.load(textureUrl, (loadedTex) => {
      loadedTex.wrapS = THREE.RepeatWrapping;
      loadedTex.wrapT = THREE.RepeatWrapping;
      loadedTex.repeat.set(repeatScale, repeatScale);
      loadedTex.colorSpace = THREE.SRGBColorSpace;
      loadedTex.needsUpdate = true;

      if (textureRef.current) textureRef.current.dispose();
      textureRef.current = loadedTex;
      material.map = loadedTex;
      material.needsUpdate = true;
    });
  }, [textureUrl, repeatScale]);

  return (
    <div
      ref={containerRef}
      className={`relative rounded-lg overflow-hidden bg-slate-950 border border-cyan-500/30 flex items-center justify-center ${className}`}
    />
  );
};

