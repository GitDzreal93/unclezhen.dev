"use client";

import { useEffect } from "react";
import * as THREE from "three";

export default function HomeScene() {
  useEffect(() => {
    const canvas = document.getElementById("fx-canvas") as HTMLCanvasElement | null;
    const wrap = document.getElementById("fx-wrap");
    const track = document.getElementById("scroll-track");
    const fallback = document.querySelector<HTMLElement>("[data-fallback]");
    const panels = [
      document.getElementById("panel-0"),
      document.getElementById("panel-1"),
      document.getElementById("panel-2"),
    ];
    const hudScroll = document.getElementById("hud-scroll");
    const hudFps = document.getElementById("hud-fps");
    const hudScene = document.getElementById("hud-scene");
    const scrollBar = document.getElementById("scroll-bar");

    if (!canvas) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: THREE.WebGLRenderer;
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let group: THREE.Group;
    let ipMesh: THREE.Mesh | null = null;
    let ipGeo: THREE.PlaneGeometry | null = null;
    let ring: THREE.Mesh, ring2: THREE.Mesh, ring3: THREE.Mesh;
    let grid: THREE.GridHelper,
      wallGrid: THREE.GridHelper,
      particles: THREE.Points,
      stars: THREE.Points,
      glow: THREE.Mesh,
      orbitNodes: THREE.Group,
      linkLines: THREE.LineSegments,
      floaters: THREE.Group,
      knot: THREE.Mesh;
    let scrollT = 0;
    let scrollTarget = 0;
    const pointer = { x: 0, y: 0, tx: 0, ty: 0, down: false, lx: 0, ly: 0 };
    const drag = { x: 0, y: 0 };
    let running = true;
    let frame = 0;
    let lastT = performance.now();
    let fpsAcc = 0;
    let fpsN = 0;
    let ipBaseZ: Float32Array | null = null;

    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const smoothstep = (e0: number, e1: number, x: number) => {
      const t = clamp((x - e0) / (e1 - e0), 0, 1);
      return t * t * (3 - 2 * t);
    };

    function readScroll() {
      if (!track) return 0;
      const rect = track.getBoundingClientRect();
      const total = track.offsetHeight - window.innerHeight;
      if (total <= 0) return 0;
      return clamp(-rect.top / total, 0, 1);
    }

    function setPanel(p: number) {
      const names = ["boot", "orbit", "dock"];
      if (hudScene) hudScene.textContent = names[p] || "boot";
      panels.forEach((el, i) => {
        if (!el) return;
        if (i === p) el.classList.remove("is-dim");
        else el.classList.add("is-dim");
      });
    }

    function size() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }

    function makeStarTexture() {
      const c = document.createElement("canvas");
      c.width = 64;
      c.height = 64;
      const g = c.getContext("2d")!;
      const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      grd.addColorStop(0, "rgba(180,255,210,1)");
      grd.addColorStop(0.25, "rgba(100,255,160,0.55)");
      grd.addColorStop(0.55, "rgba(60,200,120,0.12)");
      grd.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = grd;
      g.fillRect(0, 0, 64, 64);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    }

    // event handler refs for cleanup
    let onPointerMove: (e: PointerEvent) => void;
    let onPointerDown: (e: PointerEvent) => void;
    let onPointerUp: () => void;
    let onScroll: () => void;
    let onResize: () => void;
    let onVisibility: () => void;

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x07120c, 0.045);

      camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
      camera.position.set(0, 0.45, 5.4);

      scene.add(new THREE.AmbientLight(0x1a3324, 0.75));
      const key = new THREE.DirectionalLight(0xc8ffe0, 1.25);
      key.position.set(3.2, 4.2, 5);
      scene.add(key);
      const fill = new THREE.DirectionalLight(0x2f8f58, 0.5);
      fill.position.set(-4.2, 0.8, 2);
      scene.add(fill);
      const rim = new THREE.PointLight(0x66ff99, 1.8, 16, 2);
      rim.position.set(0.4, 1.4, 2.8);
      scene.add(rim);
      const backL = new THREE.PointLight(0x1a6b44, 1.1, 20, 2);
      backL.position.set(-1.5, -0.5, -3);
      scene.add(backL);

      grid = new THREE.GridHelper(36, 54, 0x3dff8a, 0x163826);
      grid.position.y = -1.65;
      (grid.material as THREE.Material & { opacity: number; depthWrite: boolean }).transparent = true;
      (grid.material as THREE.Material & { opacity: number }).opacity = 0.42;
      (grid.material as THREE.Material & { depthWrite: boolean }).depthWrite = false;
      scene.add(grid);

      wallGrid = new THREE.GridHelper(22, 28, 0x2a6b44, 0x12301f);
      wallGrid.rotation.x = Math.PI / 2;
      wallGrid.position.set(0.2, 2.4, -5.2);
      (wallGrid.material as THREE.Material & { opacity: number }).transparent = true;
      (wallGrid.material as THREE.Material & { opacity: number }).opacity = 0.2;
      scene.add(wallGrid);

      const starCount = 420;
      const starGeo = new THREE.BufferGeometry();
      const starPos = new Float32Array(starCount * 3);
      for (let si = 0; si < starCount; si++) {
        starPos[si * 3] = (Math.random() - 0.5) * 40;
        starPos[si * 3 + 1] = (Math.random() - 0.5) * 24;
        starPos[si * 3 + 2] = -4 - Math.random() * 28;
      }
      starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
      stars = new THREE.Points(
        starGeo,
        new THREE.PointsMaterial({
          color: 0xa8ffd0,
          map: makeStarTexture(),
          size: 0.09,
          transparent: true,
          opacity: 0.85,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          sizeAttenuation: true,
        })
      );
      scene.add(stars);

      const pCount = 220;
      const pGeo = new THREE.BufferGeometry();
      const pos = new Float32Array(pCount * 3);
      const pBase = new Float32Array(pCount * 3);
      for (let i = 0; i < pCount; i++) {
        const px = (Math.random() - 0.5) * 16;
        const py = (Math.random() - 0.5) * 9;
        const pz = (Math.random() - 0.5) * 12 - 0.5;
        pos[i * 3] = px;
        pos[i * 3 + 1] = py;
        pos[i * 3 + 2] = pz;
        pBase[i * 3] = px;
        pBase[i * 3 + 1] = py;
        pBase[i * 3 + 2] = pz;
      }
      pGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      particles = new THREE.Points(
        pGeo,
        new THREE.PointsMaterial({
          color: 0x7dffb0,
          map: makeStarTexture(),
          size: 0.055,
          transparent: true,
          opacity: 0.7,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          sizeAttenuation: true,
        })
      );
      particles.userData.base = pBase;
      scene.add(particles);

      group = new THREE.Group();
      group.position.set(0.9, 0.08, 0);
      scene.add(group);

      ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.58, 0.014, 10, 128),
        new THREE.MeshBasicMaterial({ color: 0x55ff99, transparent: true, opacity: 0.55 })
      );
      ring.rotation.x = Math.PI / 2.35;
      group.add(ring);

      ring2 = new THREE.Mesh(
        new THREE.TorusGeometry(1.95, 0.008, 8, 120),
        new THREE.MeshBasicMaterial({ color: 0x33cc77, transparent: true, opacity: 0.28 })
      );
      ring2.rotation.x = Math.PI / 1.65;
      ring2.rotation.y = 0.45;
      group.add(ring2);

      ring3 = new THREE.Mesh(
        new THREE.TorusGeometry(2.35, 0.005, 6, 140),
        new THREE.MeshBasicMaterial({ color: 0x88ffbb, transparent: true, opacity: 0.16 })
      );
      ring3.rotation.x = Math.PI / 2.1;
      ring3.rotation.z = 0.6;
      group.add(ring3);

      group.add(
        new THREE.LineSegments(
          new THREE.EdgesGeometry(new THREE.BoxGeometry(2.45, 2.85, 0.38)),
          new THREE.LineBasicMaterial({ color: 0x66ffaa, transparent: true, opacity: 0.38 })
        )
      );

      const ico = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.28, 0)),
        new THREE.LineBasicMaterial({ color: 0x7dffb0, transparent: true, opacity: 0.55 })
      );
      ico.position.set(1.9, 0.9, 0.4);
      group.add(ico);
      group.userData.ico = ico;

      knot = new THREE.Mesh(
        new THREE.TorusKnotGeometry(0.22, 0.045, 80, 10),
        new THREE.MeshStandardMaterial({
          color: 0x1a3d2a,
          emissive: 0x22ff88,
          emissiveIntensity: 0.35,
          metalness: 0.55,
          roughness: 0.35,
          transparent: true,
          opacity: 0.85,
        })
      );
      knot.position.set(-1.75, -0.85, 0.55);
      group.add(knot);

      glow = new THREE.Mesh(
        new THREE.CircleGeometry(1.55, 64),
        new THREE.MeshBasicMaterial({
          color: 0x22ff88,
          transparent: true,
          opacity: 0.09,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      glow.position.z = -0.22;
      group.add(glow);

      orbitNodes = new THREE.Group();
      group.add(orbitNodes);
      const nodePts: THREE.Vector3[] = [];
      const nodeMat = new THREE.MeshStandardMaterial({
        color: 0x0d1f16,
        emissive: 0x44ff99,
        emissiveIntensity: 0.8,
        metalness: 0.4,
        roughness: 0.35,
      });
      for (let n = 0; n < 8; n++) {
        const ang = (n / 8) * Math.PI * 2;
        const rad = 2.05 + (n % 2) * 0.25;
        const node = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 12), nodeMat.clone());
        node.position.set(Math.cos(ang) * rad, Math.sin(ang * 1.3) * 0.35, Math.sin(ang) * rad * 0.35);
        node.userData.base = node.position.clone();
        node.userData.phase = ang;
        orbitNodes.add(node);
        nodePts.push(node.position);
      }
      const linkPos: number[] = [];
      for (let a = 0; a < nodePts.length; a++) {
        const b = (a + 1) % nodePts.length;
        const c = (a + 3) % nodePts.length;
        linkPos.push(nodePts[a].x, nodePts[a].y, nodePts[a].z, nodePts[b].x, nodePts[b].y, nodePts[b].z);
        linkPos.push(nodePts[a].x, nodePts[a].y, nodePts[a].z, nodePts[c].x, nodePts[c].y, nodePts[c].z);
      }
      const linkGeo = new THREE.BufferGeometry();
      linkGeo.setAttribute("position", new THREE.Float32BufferAttribute(linkPos, 3));
      linkLines = new THREE.LineSegments(
        linkGeo,
        new THREE.LineBasicMaterial({ color: 0x55ff99, transparent: true, opacity: 0.22 })
      );
      group.add(linkLines);

      floaters = new THREE.Group();
      scene.add(floaters);
      function panelTex(lines: string[]) {
        const c = document.createElement("canvas");
        c.width = 512;
        c.height = 288;
        const g = c.getContext("2d")!;
        g.fillStyle = "rgba(6,18,12,0.92)";
        g.fillRect(0, 0, 512, 288);
        g.strokeStyle = "rgba(100,255,160,0.45)";
        g.lineWidth = 3;
        g.strokeRect(8, 8, 496, 272);
        g.fillStyle = "rgba(100,255,160,0.9)";
        g.font = "600 22px JetBrains Mono, monospace";
        g.fillText("zhen@lab", 28, 48);
        g.fillStyle = "rgba(160,220,180,0.75)";
        g.font = "18px JetBrains Mono, monospace";
        lines.forEach((ln, idx) => {
          g.fillText(ln, 28, 96 + idx * 36);
        });
        const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace;
        return t;
      }
      const panelSpecs = [
        { lines: ["> whoami", "zhen_shu", "role: builder"], pos: [-2.8, 1.1, -1.2], rot: 0.25 },
        { lines: ["> ls modules/", "blog  projects", "shop  game"], pos: [2.9, -0.2, -0.8], rot: -0.3 },
        { lines: ["> ./render --ip", "webgl: ok", "scroll: linked"], pos: [-2.4, -1.0, 0.2], rot: 0.15 },
      ];
      panelSpecs.forEach((spec) => {
        const mesh = new THREE.Mesh(
          new THREE.PlaneGeometry(1.55, 0.88),
          new THREE.MeshBasicMaterial({
            map: panelTex(spec.lines),
            transparent: true,
            opacity: 0.72,
            side: THREE.DoubleSide,
            depthWrite: false,
          })
        );
        mesh.position.set(spec.pos[0], spec.pos[1], spec.pos[2]);
        mesh.rotation.y = spec.rot;
        mesh.userData.baseY = spec.pos[1];
        mesh.userData.phase = Math.random() * Math.PI * 2;
        floaters.add(mesh);
      });

      const loader = new THREE.TextureLoader();
      loader.load(
        "/assets/zhen-shu-ip.png",
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          const aspect = tex.image.width / tex.image.height;
          const ih = 2.35;
          const iw = ih * aspect;
          ipGeo = new THREE.PlaneGeometry(iw, ih, 48, 48);
          const posAttr = ipGeo.attributes.position;
          ipBaseZ = new Float32Array(posAttr.count);
          for (let k = 0; k < posAttr.count; k++) ipBaseZ[k] = posAttr.getZ(k);

          ipMesh = new THREE.Mesh(
            ipGeo,
            new THREE.MeshStandardMaterial({
              map: tex,
              transparent: true,
              roughness: 0.38,
              metalness: 0.18,
              side: THREE.DoubleSide,
              emissive: new THREE.Color(0x0a2a18),
              emissiveIntensity: 0.28,
            })
          );
          group.add(ipMesh);

          const back = new THREE.Mesh(
            new THREE.PlaneGeometry(iw * 1.02, ih * 1.02),
            new THREE.MeshBasicMaterial({
              color: 0x06140c,
              transparent: true,
              opacity: 0.7,
              side: THREE.BackSide,
            })
          );
          back.position.z = -0.04;
          group.add(back);

          if (fallback) fallback.classList.add("is-hidden");
          size();
          animate();
        },
        undefined,
        () => {
          size();
          animate();
        }
      );

      onPointerMove = (e: PointerEvent) => {
        pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
        pointer.ty = -((e.clientY / window.innerHeight) * 2 - 1);
        if (pointer.down) {
          drag.y += (e.clientX - pointer.lx) * 0.006;
          drag.x += (e.clientY - pointer.ly) * 0.004;
          drag.x = clamp(drag.x, -0.75, 0.75);
          pointer.lx = e.clientX;
          pointer.ly = e.clientY;
        }
      };
      onPointerDown = (e: PointerEvent) => {
        if ((e.target as HTMLElement).closest("a,button,input,textarea,label,.modal,.nav-drawer")) return;
        pointer.down = true;
        pointer.lx = e.clientX;
        pointer.ly = e.clientY;
      };
      onPointerUp = () => {
        pointer.down = false;
      };
      onScroll = () => {
        scrollTarget = readScroll();
      };
      onResize = () => size();

      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerdown", onPointerDown);
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onResize);
      scrollTarget = readScroll();

      function animate() {
        if (!running) return;
        frame = requestAnimationFrame(animate);
        const now = performance.now();
        const dt = Math.min(0.05, (now - lastT) / 1000);
        lastT = now;
        fpsAcc += 1 / Math.max(dt, 0.001);
        fpsN++;
        if (fpsN >= 20) {
          if (hudFps) hudFps.textContent = String(Math.round(fpsAcc / fpsN));
          fpsAcc = 0;
          fpsN = 0;
        }

        scrollTarget = readScroll();
        scrollT = lerp(scrollT, scrollTarget, reduced ? 1 : 0.08);

        if (hudScroll) hudScroll.textContent = Math.round(scrollT * 100) + "%";
        if (scrollBar) scrollBar.style.width = Math.round(scrollT * 100) + "%";

        let p = 0;
        if (scrollT > 0.38) p = 1;
        if (scrollT > 0.72) p = 2;
        setPanel(p);

        pointer.x = lerp(pointer.x, pointer.tx, 0.06);
        pointer.y = lerp(pointer.y, pointer.ty, 0.06);

        const camZ = lerp(5.6, 2.95, smoothstep(0, 0.88, scrollT));
        const camY = lerp(0.5, 0.12, scrollT) + pointer.y * 0.14;
        const camX = lerp(-0.2, 0.4, scrollT) + pointer.x * 0.22;
        camera.position.x = lerp(camera.position.x, camX, 0.08);
        camera.position.y = lerp(camera.position.y, camY, 0.08);
        camera.position.z = lerp(camera.position.z, camZ, 0.08);
        camera.lookAt(0.35 + scrollT * 0.35, 0.04, 0);
        camera.fov = lerp(40, 34, smoothstep(0.2, 0.9, scrollT));
        camera.updateProjectionMatrix();

        group.rotation.y =
          -0.32 + scrollT * 1.65 + drag.y + pointer.x * 0.28 + Math.sin(now * 0.00035) * 0.04;
        group.rotation.x = 0.06 + scrollT * 0.38 + drag.x * 0.18 + pointer.y * 0.12;
        group.position.x = lerp(1.1, 0.08, smoothstep(0, 1, scrollT));
        group.position.y = (reduced ? 0 : Math.sin(now * 0.00115) * 0.07) + scrollT * -0.18;
        group.position.z = scrollT * 0.65;
        group.scale.setScalar(lerp(0.9, 1.22, smoothstep(0.08, 0.92, scrollT)));

        if (ring) {
          ring.rotation.z = now * 0.00075 + scrollT * 2.4;
          ring.rotation.x = Math.PI / 2.35 + scrollT * 0.55;
          (ring.material as THREE.Material & { opacity: number }).opacity = lerp(0.32, 0.78, scrollT);
        }
        if (ring2) {
          ring2.rotation.z = -now * 0.0005 - scrollT * 1.5;
          (ring2.material as THREE.Material & { opacity: number }).opacity = lerp(0.14, 0.48, scrollT);
        }
        if (ring3) {
          ring3.rotation.z = now * 0.00028 + scrollT;
          (ring3.material as THREE.Material & { opacity: number }).opacity = lerp(0.08, 0.28, scrollT);
        }
        if (glow) (glow.material as THREE.Material & { opacity: number }).opacity = lerp(0.05, 0.18, scrollT);
        if (knot) {
          knot.rotation.x = now * 0.0012;
          knot.rotation.y = now * 0.0009 + scrollT;
          (knot.material as THREE.MeshStandardMaterial).emissiveIntensity = lerp(0.25, 0.7, scrollT);
        }
        if (group.userData.ico) {
          group.userData.ico.rotation.x = now * 0.001;
          group.userData.ico.rotation.y = -now * 0.0014;
        }

        if (orbitNodes) {
          orbitNodes.children.forEach((node, idx) => {
            const ph = node.userData.phase + now * 0.0004;
            const b = node.userData.base as THREE.Vector3;
            node.position.x = b.x + Math.sin(ph) * 0.08;
            node.position.y = b.y + Math.cos(ph * 1.2) * 0.1;
            node.position.z = b.z + Math.sin(ph * 0.7) * 0.06;
            node.scale.setScalar(0.85 + 0.25 * Math.sin(now * 0.003 + idx));
          });
          if (linkLines) {
            const arr = (linkLines.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
            const nodes = orbitNodes.children;
            let li = 0;
            for (let ai = 0; ai < nodes.length; ai++) {
              const n0 = nodes[ai].position;
              const n1 = nodes[(ai + 1) % nodes.length].position;
              const n2 = nodes[(ai + 3) % nodes.length].position;
              arr[li++] = n0.x; arr[li++] = n0.y; arr[li++] = n0.z;
              arr[li++] = n1.x; arr[li++] = n1.y; arr[li++] = n1.z;
              arr[li++] = n0.x; arr[li++] = n0.y; arr[li++] = n0.z;
              arr[li++] = n2.x; arr[li++] = n2.y; arr[li++] = n2.z;
            }
            linkLines.geometry.attributes.position.needsUpdate = true;
            (linkLines.material as THREE.Material & { opacity: number }).opacity = lerp(0.12, 0.35, scrollT);
          }
        }

        if (ipMesh && ipGeo && ipBaseZ && !reduced) {
          const posA = ipGeo.attributes.position as THREE.BufferAttribute;
          for (let vi = 0; vi < posA.count; vi++) {
            const x = posA.getX(vi);
            const y = posA.getY(vi);
            const wave =
              Math.sin(x * 2.2 + now * 0.0022) * 0.018 +
              Math.cos(y * 2.6 - now * 0.0017) * 0.014 +
              scrollT * 0.01 * Math.sin(x * 3 + y * 2);
            posA.setZ(vi, ipBaseZ[vi] + wave);
          }
          posA.needsUpdate = true;
          ipGeo.computeVertexNormals();
          (ipMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = lerp(0.22, 0.55, scrollT);
        }

        if (grid) {
          grid.position.z = scrollT * 4.2;
          const gm = (Array.isArray(grid.material) ? grid.material[0] : grid.material) as
            | (THREE.Material & { opacity: number })
            | undefined;
          if (gm) gm.opacity = lerp(0.22, 0.55, scrollT);
        }
        if (wallGrid) wallGrid.position.x = Math.sin(now * 0.0002) * 0.15;

        if (particles) {
          particles.rotation.y = now * 0.00012 + scrollT * 0.35;
          const parr = (particles.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
          const base = particles.userData.base as Float32Array;
          for (let j = 0; j < parr.length; j += 3) {
            parr[j + 1] = base[j + 1] + Math.sin(now * 0.001 + base[j]) * 0.18;
            parr[j + 2] = base[j + 2] + scrollT * 1.4;
          }
          particles.geometry.attributes.position.needsUpdate = true;
          const pm = particles.material as THREE.PointsMaterial;
          pm.opacity = lerp(0.35, 0.9, scrollT);
          pm.size = lerp(0.04, 0.07, scrollT);
        }

        if (stars) {
          stars.rotation.y = now * 0.00004;
          (stars.material as THREE.Material & { opacity: number }).opacity = lerp(0.45, 0.95, scrollT);
        }

        if (floaters) {
          floaters.children.forEach((panel) => {
            panel.position.y =
              panel.userData.baseY + Math.sin(now * 0.001 + panel.userData.phase) * (reduced ? 0 : 0.08);
            panel.rotation.y = panel.rotation.y * 0.99 + pointer.x * 0.08 * 0.01;
            ((panel as THREE.Mesh).material as THREE.Material & { opacity: number }).opacity = lerp(
              0.35,
              0.82,
              smoothstep(0.15, 0.75, scrollT)
            );
            panel.lookAt(camera.position.x * 0.3, panel.position.y, camera.position.z);
          });
        }

        const restFade = smoothstep(0.92, 1.05, scrollT);
        if (wrap) wrap.style.opacity = String(1 - restFade * 0.55);

        renderer.render(scene, camera);
      }

      onVisibility = () => {
        if (document.hidden) {
          running = false;
          cancelAnimationFrame(frame);
        } else {
          running = true;
          lastT = performance.now();
          animate();
        }
      };
      document.addEventListener("visibilitychange", onVisibility);
    } catch {
      if (fallback) fallback.style.opacity = "0.55";
      if (hudScene) hudScene.textContent = "fallback";
    }

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      try {
        renderer?.dispose();
      } catch {}
    };
  }, []);

  return (
    <div className="fx-canvas-wrap" id="fx-wrap" aria-hidden="true">
      <canvas id="fx-canvas"></canvas>
      <div className="fx-fallback" data-fallback>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/zhen-shu-ip.png" alt="" width={680} height={680} />
      </div>
      <div className="fx-vignette"></div>
    </div>
  );
}
