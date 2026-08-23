"use client";

// 3D IP mesh — extracted from HomeScene.tsx (~80 lines of the IP-only
// code), so /about can have a hero piece without depending on the
// /home scroll track. Plane + transparent texture, vertex wave, mouse
// parallax + drag, auto-rotate. <img> fallback if WebGL fails.

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const IMG_SRC = "/assets/unclezhen-ip.png";
const PLANE_W = 2.35;
const SEGMENTS = 48;

export default function HeroIP() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const m: HTMLDivElement = mount; // capture for closures
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // canvas
    const canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    m.appendChild(canvas);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.set(0, 0, 4.2);

    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const key = new THREE.DirectionalLight(0xffffff, 1.05);
    key.position.set(2.2, 2.6, 3);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x6effb8, 0.35);
    fill.position.set(-3, -1, 2);
    scene.add(fill);

    // IP plane: load texture, build a plane sized to image aspect.
    const tex = new THREE.TextureLoader().load(
      IMG_SRC,
      () => {
        const iw = (tex.image as HTMLImageElement).width || 1;
        const ih = (tex.image as HTMLImageElement).height || 1;
        const ratio = iw / ih;
        plane.geometry.dispose();
        plane.geometry = new THREE.PlaneGeometry(PLANE_W * ratio, PLANE_W, SEGMENTS, SEGMENTS);
      },
      undefined,
      () => setFailed(true),
    );
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      transparent: true,
      emissive: new THREE.Color(0x0a2a18),
      emissiveIntensity: 0.85,
      metalness: 0.18,
      roughness: 0.55,
      side: THREE.DoubleSide,
    });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(PLANE_W, PLANE_W, SEGMENTS, SEGMENTS), mat);
    scene.add(plane);

    // mouse state
    const target = { rx: 0, ry: 0, ax: 0, ay: 0 };
    const drag = { x: 0, y: 0, px: 0, py: 0, down: false };
    function onMove(e: PointerEvent) {
      const r = m.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
      const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
      if (drag.down) {
        drag.x += e.clientX - drag.px;
        drag.y += e.clientY - drag.py;
        drag.px = e.clientX;
        drag.py = e.clientY;
        target.ry = Math.max(-0.9, Math.min(0.9, drag.x * 0.006));
        target.rx = Math.max(-0.7, Math.min(0.7, drag.y * 0.004));
      } else {
        target.ay = nx * 0.35;
        target.ax = -ny * 0.22;
      }
    }
    function onDown(e: PointerEvent) {
      drag.down = true;
      drag.px = e.clientX;
      drag.py = e.clientY;
      m.setPointerCapture(e.pointerId);
    }
    function onUp(e: PointerEvent) {
      drag.down = false;
      try { m.releasePointerCapture(e.pointerId); } catch {}
    }
    m.addEventListener("pointermove", onMove);
    m.addEventListener("pointerdown", onDown);
    m.addEventListener("pointerup", onUp);
    m.addEventListener("pointercancel", onUp);

    // size
    function resize() {
      const w = m.clientWidth, h = m.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(m);

    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = now - t0;
      // mouse parallax (lerped) or drag rotation
      plane.rotation.x += (target.rx + target.ax - plane.rotation.x) * 0.08;
      plane.rotation.y += (target.ry + target.ay - plane.rotation.y) * 0.08;
      // auto-rotate
      if (!drag.down && !reduced) plane.rotation.y += 0.0035;
      // vertex wave
      if (!reduced) {
        const pos = plane.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < pos.count; i++) {
          const ox = pos.getX(i), oy = pos.getY(i);
          const z =
            Math.sin(ox * 2.2 + t * 0.0022) * 0.018 +
            Math.cos(oy * 2.6 - t * 0.0017) * 0.014;
          pos.setZ(i, z);
        }
        pos.needsUpdate = true;
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      m.removeEventListener("pointermove", onMove);
      m.removeEventListener("pointerdown", onDown);
      m.removeEventListener("pointerup", onUp);
      m.removeEventListener("pointercancel", onUp);
      plane.geometry.dispose();
      mat.dispose();
      tex.dispose();
      renderer.dispose();
      if (canvas.parentNode === m) m.removeChild(canvas);
    };
  }, []);

  return (
    <div className="hero-ip">
      {failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={IMG_SRC} alt="臻叔个人 IP" />
      )}
      <div ref={mountRef} className="hero-ip__canvas" aria-label="3D IP 形象(可拖动旋转)" role="img" />
    </div>
  );
}
