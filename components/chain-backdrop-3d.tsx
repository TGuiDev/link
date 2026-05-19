"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

type ChainBackdrop3DProps = {
  theme: "light" | "dark";
};

type ChainSceneTheme = {
  ambientLight: THREE.AmbientLight;
  keyLight: THREE.DirectionalLight;
  linkMaterials: THREE.MeshStandardMaterial[];
  rimLight: THREE.DirectionalLight;
};

function makeOvalCurve(radiusX: number, radiusY: number, segments: number): THREE.CatmullRomCurve3 {
  const points: THREE.Vector3[] = [];

  for (let i = 0; i <= segments; i += 1) {
    const t = (i / segments) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(t) * radiusX, Math.sin(t) * radiusY, 0));
  }

  return new THREE.CatmullRomCurve3(points, true, "catmullrom", 0.5);
}

function applySceneTheme(sceneTheme: ChainSceneTheme, theme: "light" | "dark") {
  const isDark = theme === "dark";

  sceneTheme.linkMaterials.forEach((material) => {
    material.color.setHex(isDark ? 0xd0d8e0 : 0x8a9ba8);
    material.emissive.setHex(isDark ? 0x0a1520 : 0x000000);
    material.emissiveIntensity = isDark ? 0.3 : 0;
    material.roughness = isDark ? 0.22 : 0.3;
    material.needsUpdate = true;
  });

  sceneTheme.keyLight.intensity = isDark ? 4.5 : 3.5;
  sceneTheme.rimLight.color.setHex(isDark ? 0x4488cc : 0x334455);
  sceneTheme.rimLight.intensity = isDark ? 3 : 1.8;
  sceneTheme.ambientLight.intensity = isDark ? 0.7 : 1;
}

export function ChainBackdrop3D({ theme }: ChainBackdrop3DProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneThemeRef = useRef<ChainSceneTheme | null>(null);
  const themeRef = useRef(theme);

  useEffect(() => {
    themeRef.current = theme;

    if (sceneThemeRef.current) {
      applySceneTheme(sceneThemeRef.current, theme);
    }
  }, [theme]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const containerElement: HTMLDivElement = container;

    try {
      const testCanvas = document.createElement("canvas");
      const gl = testCanvas.getContext("webgl") || testCanvas.getContext("webgl2");
      if (!gl) return;
    } catch {
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 1000);
    camera.position.set(0, 0, 28);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.cssText = "display:block;width:100%;height:100%;pointer-events:auto;";
    containerElement.appendChild(renderer.domElement);

    const baseMaterial = new THREE.MeshStandardMaterial({
      metalness: 1,
      roughness: 0.22,
      side: THREE.FrontSide
    });

    const ovalCurve = makeOvalCurve(0.52, 0.88, 72);
    const linkGeometry = new THREE.TubeGeometry(ovalCurve, 90, 0.2, 14, true);

    const linkCount = 10;
    const anchor = new THREE.Vector3(0, -2, 0);
    const restDistance = 0.88 * 2 * 0.7;
    const substeps = 6;
    const gravity = -22;
    const damping = 0.985;

    type Particle = {
      mesh: THREE.Mesh<THREE.TubeGeometry, THREE.MeshStandardMaterial>;
      pos: THREE.Vector3;
      prev: THREE.Vector3;
    };

    const particles: Particle[] = [];
    const linkMaterials: THREE.MeshStandardMaterial[] = [];

    for (let i = 0; i <= linkCount; i += 1) {
      const pos = new THREE.Vector3(anchor.x, anchor.y - i * restDistance, 0);
      const material = baseMaterial.clone();
      const mesh = new THREE.Mesh(linkGeometry, material);

      mesh.castShadow = false;
      if (i === 0) mesh.visible = false;

      scene.add(mesh);
      linkMaterials.push(material);
      particles.push({ pos: pos.clone(), prev: pos.clone(), mesh });
    }

    const keyLight = new THREE.DirectionalLight(0xffffff, 4.5);
    keyLight.position.set(3, 5, 6);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x4488cc, 3);
    rimLight.position.set(-5, -2, 3);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.8);
    fillLight.position.set(1, -5, 4);
    scene.add(fillLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    sceneThemeRef.current = { ambientLight, keyLight, linkMaterials, rimLight };
    applySceneTheme(sceneThemeRef.current, themeRef.current);

    function resize() {
      const { width, height } = containerElement.getBoundingClientRect();
      renderer.setSize(width, height);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(containerElement);
    resize();

    let isDragging = false;
    const lastPointer = { x: 0, y: 0 };
    const impulse = new THREE.Vector3();

    function localPointer(event: PointerEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      return {
        x: (event.clientX - rect.left) / rect.width - 0.5,
        y: (event.clientY - rect.top) / rect.height - 0.5
      };
    }

    function onPointerDown(event: PointerEvent) {
      isDragging = true;
      const pointer = localPointer(event);
      lastPointer.x = pointer.x;
      lastPointer.y = pointer.y;
    }

    function onPointerMove(event: PointerEvent) {
      if (!isDragging) return;

      const pointer = localPointer(event);
      impulse.x += (pointer.x - lastPointer.x) * 24;
      impulse.y -= (pointer.y - lastPointer.y) * 24;
      lastPointer.x = pointer.x;
      lastPointer.y = pointer.y;
    }

    function onPointerUp() {
      isDragging = false;
    }

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    function orientLink(mesh: THREE.Mesh, a: THREE.Vector3, b: THREE.Vector3, index: number) {
      const direction = new THREE.Vector3().subVectors(b, a).normalize();
      if (direction.lengthSq() < 0.0001) return;

      const base = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
      mesh.quaternion.copy(base);

      if (index % 2 !== 0) {
        const roll = new THREE.Quaternion().setFromAxisAngle(direction, Math.PI / 2);
        mesh.quaternion.premultiply(roll);
      }
    }

    let animationFrame = 0;
    let lastTime = window.performance.now();
    let entryOffset = 15;

    function animate(now: number) {
      const delta = Math.min((now - lastTime) / 1000, 0.04);
      lastTime = now;

      entryOffset *= Math.pow(0.03, delta);
      const currentImpulse = impulse.clone();
      impulse.set(0, 0, 0);

      const subDelta = delta / substeps;

      for (let step = 0; step < substeps; step += 1) {
        for (let i = 1; i <= linkCount; i += 1) {
          const particle = particles[i];
          const vx = (particle.pos.x - particle.prev.x) * damping;
          const vy = (particle.pos.y - particle.prev.y) * damping;
          const vz = (particle.pos.z - particle.prev.z) * damping;

          particle.prev.copy(particle.pos);
          particle.pos.x += vx + currentImpulse.x * subDelta;
          particle.pos.y += vy + gravity * subDelta * subDelta + currentImpulse.y * subDelta;
          particle.pos.z += vz;
        }

        particles[0].pos.set(anchor.x, anchor.y + entryOffset, anchor.z);
        particles[0].prev.copy(particles[0].pos);

        for (let iteration = 0; iteration < 6; iteration += 1) {
          for (let i = 0; i < linkCount; i += 1) {
            const a = particles[i];
            const b = particles[i + 1];
            const dx = b.pos.x - a.pos.x;
            const dy = b.pos.y - a.pos.y;
            const dz = b.pos.z - a.pos.z;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.0001;
            const difference = ((distance - restDistance) / distance) * 0.5;
            const cx = dx * difference;
            const cy = dy * difference;
            const cz = dz * difference;

            if (i > 0) {
              a.pos.x += cx;
              a.pos.y += cy;
              a.pos.z += cz;
            }

            b.pos.x -= cx;
            b.pos.y -= cy;
            b.pos.z -= cz;
          }

          particles[0].pos.set(anchor.x, anchor.y + entryOffset, anchor.z);
        }
      }

      for (let i = 1; i <= linkCount; i += 1) {
        const a = particles[i - 1].pos;
        const b = particles[i].pos;
        const mesh = particles[i].mesh;

        mesh.position.lerpVectors(a, b, 0.5);
        orientLink(mesh, a, b, i);
      }

      renderer.render(scene, camera);
      animationFrame = window.requestAnimationFrame(animate);
    }

    animationFrame = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      sceneThemeRef.current = null;
      renderer.dispose();
      linkGeometry.dispose();
      baseMaterial.dispose();
      linkMaterials.forEach((material) => material.dispose());
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div className="pointer-events-auto absolute left-[30vw]  h-[40rem] w-[40rem] max-w-none overflow-hidden" ref={containerRef} />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-300 to-transparent opacity-70 dark:via-white/10" />
    </div>
  );
}
