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

function makeOvalCurve(
  radiusX: number,
  radiusY: number,
  segments: number
): THREE.CatmullRomCurve3 {
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
  sceneTheme.rimLight.color.setHex(0x334455);
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
    const containerElement = container;

    try {
      const testCanvas = document.createElement("canvas");
      const gl = testCanvas.getContext("webgl") || testCanvas.getContext("webgl2");
      if (!gl) return;
    } catch {
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 1000);
    camera.position.set(0, 0, 32);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });

    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.cssText =
      "display:block;width:100%;height:100%;pointer-events:auto;";
    containerElement.appendChild(renderer.domElement);

    const baseMaterial = new THREE.MeshStandardMaterial({
      metalness: 1,
      roughness: 0.22,
      side: THREE.FrontSide,
    });

    const radiusX = 0.55;
    const radiusY = 0.95;
    const tubeRadius = 0.19;

    const ovalCurve = makeOvalCurve(radiusX, radiusY, 72);
    const linkGeometry = new THREE.TubeGeometry(ovalCurve, 90, tubeRadius, 14, true);

    const linkCount = 8;
    const anchor = new THREE.Vector3(0, 14, 0);

    const linkHeight = radiusY * 2;
    const restDistance = linkHeight - tubeRadius * 2;

    // Configurações de Física Avançada e Estabilização
    const substeps = 12;
    const constraintIterations = 16;
    const gravity = -700;
    const damping = 0.99; // Amortecimento global ligeiramente maior para evitar tremores espontâneos
    const entryStartOffset = 20;

    // Margens rígidas: impede elasticidade visual
    const maxDistance = restDistance + 0.01;
    const minDistance = restDistance * 0.95;

    const pointerPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    const pointerWorld = new THREE.Vector3();

    type Particle = {
      mesh: THREE.Mesh<THREE.TubeGeometry, THREE.MeshStandardMaterial>;
      pos: THREE.Vector3;
      prev: THREE.Vector3;
    };

    const particles: Particle[] = [];
    const linkMaterials: THREE.MeshStandardMaterial[] = [];

    for (let i = 0; i <= linkCount; i += 1) {
      const pos = new THREE.Vector3(
        anchor.x,
        anchor.y + entryStartOffset - i * restDistance,
        0
      );

      const material = baseMaterial.clone();
      const mesh = new THREE.Mesh(linkGeometry, material);
      mesh.castShadow = false;

      if (i === 0) {
        mesh.visible = false;
      }

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

    // Controle de estado do Mouse/Pointer
    let draggedParticleIndex: number | null = null;
    const dragOffset = new THREE.Vector3();
    const targetDragPos = new THREE.Vector3();
    const projectedParticle = new THREE.Vector3();

    function setPointerWorld(event: PointerEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointerNdc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
      raycaster.setFromCamera(pointerNdc, camera);
      raycaster.ray.intersectPlane(pointerPlane, pointerWorld);
    }

    function onPointerDown(event: PointerEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      ) return;

      setPointerWorld(event);

      let closestIndex = 1;
      let closestDistance = Number.POSITIVE_INFINITY;

      for (let i = 1; i < particles.length; i += 1) {
        projectedParticle.copy(particles[i].pos).project(camera);
        const particleX = rect.left + ((projectedParticle.x + 1) / 2) * rect.width;
        const particleY = rect.top + ((1 - projectedParticle.y) / 2) * rect.height;
        const distance = Math.hypot(event.clientX - particleX, event.clientY - particleY);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = i;
        }
      }

      if (closestDistance > 32) return;

      draggedParticleIndex = closestIndex;
      dragOffset.subVectors(particles[closestIndex].pos, pointerWorld);
      // Evita saltos repentinos ao clicar capturando o ponto exato atual
      targetDragPos.copy(particles[closestIndex].pos);
      event.preventDefault();
    }

    function onPointerMove(event: PointerEvent) {
      if (draggedParticleIndex === null) return;
      setPointerWorld(event);
      // Atualiza de forma suave o alvo para onde a mola virtual deve puxar o elo
      targetDragPos.copy(pointerWorld).add(dragOffset);
      event.preventDefault();
    }

    function onPointerUp() {
      draggedParticleIndex = null;
    }

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    function orientLink(
      mesh: THREE.Mesh,
      a: THREE.Vector3,
      b: THREE.Vector3,
      index: number
    ) {
      const direction = new THREE.Vector3().subVectors(b, a);
      if (direction.lengthSq() < 0.0001) return;
      direction.normalize();

      const base = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direction
      );
      mesh.quaternion.copy(base);

      if (index % 2 !== 0) {
        const roll = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
        mesh.quaternion.multiply(roll);
      }
    }

    let animationFrame = 0;
    let lastTime = window.performance.now();
    let entryOffset = entryStartOffset;

    function fixAnchor() {
      particles[0].pos.set(anchor.x, anchor.y + entryOffset, anchor.z);
      particles[0].prev.copy(particles[0].pos);
    }

    function animate(now: number) {
      const delta = Math.min((now - lastTime) / 1000, 0.04);
      lastTime = now;

      entryOffset *= Math.pow(0.03, delta);
      const subDelta = delta / substeps;

      for (let step = 0; step < substeps; step += 1) {
        for (let i = 1; i <= linkCount; i += 1) {
          const p = particles[i];

          let vx = (p.pos.x - p.prev.x) * damping;
          let vy = (p.pos.y - p.prev.y) * damping;
          let vz = (p.pos.z - p.prev.z) * damping;

          p.prev.copy(p.pos);
          p.pos.x += vx;
          p.pos.y += vy + gravity * subDelta * subDelta;
          p.pos.z += vz;

          // Se este elo estiver sendo arrastado, aplicamos uma força de mola controlada
          if (i === draggedParticleIndex) {
            const springStiffness = 350; // Quão firme a mola puxa o elo em direção ao mouse
            const springDamping = 12;    // Evita tremores de mola no ponto de contato

            const fx = (targetDragPos.x - p.pos.x) * springStiffness - (vx / subDelta) * springDamping;
            const fy = (targetDragPos.y - p.pos.y) * springStiffness - (vy / subDelta) * springDamping;
            const fz = (targetDragPos.z - p.pos.z) * springStiffness - (vz / subDelta) * springDamping;

            // Aplica a aceleração gerada pela força da mola virtual
            p.pos.x += fx * subDelta * subDelta;
            p.pos.y += fy * subDelta * subDelta;
            p.pos.z += fz * subDelta * subDelta;
          }
        }

        fixAnchor();

        for (let iteration = 0; iteration < constraintIterations; iteration += 1) {
          for (let i = 0; i < linkCount; i += 1) {
            const a = particles[i];
            const b = particles[i + 1];

            const dx = b.pos.x - a.pos.x;
            const dy = b.pos.y - a.pos.y;
            const dz = b.pos.z - a.pos.z;

            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.0001;

            let target = restDistance;
            if (distance > maxDistance) target = maxDistance;
            else if (distance < minDistance) target = minDistance;

            const diff = (distance - target) / distance;

            const aFixed = i === 0;
            // Nenhum nó intermediário se comporta como massa infinita pura agora,
            // permitindo que a restrição distribua a tração suavemente pela corrente.

            const scalarA = aFixed ? 0.0 : 0.5;
            const scalarB = aFixed ? 1.0 : 0.5;

            if (!aFixed) {
              a.pos.x += dx * diff * scalarA;
              a.pos.y += dy * diff * scalarA;
              a.pos.z += dz * diff * scalarA;
            }

            b.pos.x -= dx * diff * scalarB;
            b.pos.y -= dy * diff * scalarB;
            b.pos.z -= dz * diff * scalarB;

            // Fricção de aproximação extrema (reduz colisão elástica violenta entre elos)
            if (distance < restDistance * 0.98) {
              const friction = 0.88;
              b.prev.x = b.pos.x - (b.pos.x - b.prev.x) * friction;
              b.prev.y = b.pos.y - (b.pos.y - b.prev.y) * friction;
              b.prev.z = b.pos.z - (b.pos.z - b.prev.z) * friction;
              if (!aFixed) {
                a.prev.x = a.pos.x - (a.pos.x - a.prev.x) * friction;
                a.prev.y = a.pos.y - (a.pos.y - a.prev.y) * friction;
                a.prev.z = a.pos.z - (a.pos.z - a.prev.z) * friction;
              }
            }
          }
          fixAnchor();
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
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      sceneThemeRef.current = null;
      renderer.dispose();
      linkGeometry.dispose();
      baseMaterial.dispose();
      linkMaterials.forEach((m) => m.dispose());
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      <div
        className="
          pointer-events-auto
          absolute
          md:right-48
          right-8
          translate-x-2/4

          lg:left-1/2
          lg:right-auto
          lg:-translate-x-1/2
          lg:-translate-y-[5%]

          h-[60rem]
          w-[60rem]
          max-w-none
          overflow-visible
        "
        ref={containerRef}
      />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-300 to-transparent opacity-70 dark:via-white/10" />
    </div>
  );
}