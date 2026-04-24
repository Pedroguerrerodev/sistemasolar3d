import { useEffect, useRef } from "react";
import * as THREE from "three";

const SUN_TEXTURE =
  "https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/sunmap.jpg";

interface Props {
  size?: number;
}

function startRayCanvas(canvas: HTMLCanvasElement, total: number, r: number): () => void {
  const ctx = canvas.getContext("2d")!;
  const cx = total / 2;
  const cy = total / 2;

  type Streamer = {
    angle: number;
    baseLen: number;
    ampLen: number;
    speed: number;
    phase: number;
    strokeW: number;
    blur: number;
    r: number; g: number; b: number;
    segments: number;
    curl: number; // curvatura lateral
  };

  const NUM_RAYS = 60;
  const streamers: Streamer[] = Array.from({ length: NUM_RAYS }, (_, i) => {
    const long = i % 5 === 0;
    const mid = i % 2 === 0 && !long;
    const rr = long ? 235 + Math.floor(Math.random() * 20) : 255;
    const gg = long ? 80 + Math.floor(Math.random() * 60) : mid ? 140 + Math.floor(Math.random() * 80) : 200 + Math.floor(Math.random() * 55);
    const bb = long ? 0 : mid ? 10 : 30;
    return {
      angle: (i / NUM_RAYS) * Math.PI * 2 + Math.random() * 0.15,
      baseLen: long ? r * 0.9 : mid ? r * 0.4 : r * 0.18,
      ampLen: long ? r * 0.55 : mid ? r * 0.22 : r * 0.10,
      speed: 0.3 + Math.random() * 0.6,
      phase: Math.random() * Math.PI * 2,
      strokeW: long ? 1.2 + Math.random() * 0.8 : mid ? 0.8 + Math.random() * 0.6 : 0.4 + Math.random() * 0.5,
      blur: long ? 14 + Math.random() * 8 : mid ? 8 + Math.random() * 6 : 4 + Math.random() * 4,
      r: rr, g: gg, b: bb,
      segments: long ? 12 : mid ? 7 : 4,
      curl: (Math.random() - 0.5) * 0.35,
    };
  });

  let t = 0;
  let animId: number;
  let globalAngle = 0;

  const draw = () => {
    animId = requestAnimationFrame(draw);
    t += 0.008;
    globalAngle += 0.0005;

    ctx.clearRect(0, 0, total, total);
    ctx.globalCompositeOperation = "lighter";

    for (const s of streamers) {
      const pulse = 0.5 + 0.5 * Math.sin(t * s.speed + s.phase);
      const len = s.baseLen + s.ampLen * pulse;
      const a = s.angle + globalAngle;
      const alpha = 0.35 + 0.4 * pulse;

      // Efecto del resplandor (antes shadowBlur, ahora linea gruesa semi transparente)
      ctx.beginPath();
      let px = cx + Math.cos(a) * r;
      let py = cy + Math.sin(a) * r;
      ctx.moveTo(px, py);

      const segLen = len / s.segments;
      for (let seg = 1; seg <= s.segments; seg++) {
        const frac = seg / s.segments;
        const drift = s.curl * frac * frac * r * 0.6;
        const perpA = a + Math.PI / 2;
        const dist = r + segLen * seg;
        const nx = cx + Math.cos(a) * dist + Math.cos(perpA) * drift;
        const ny = cy + Math.sin(a) * dist + Math.sin(perpA) * drift;
        ctx.lineTo(nx, ny);
      }

      ctx.save();
      ctx.strokeStyle = `rgba(${s.r},${s.g},${s.b},${alpha * 0.4})`;
      ctx.lineWidth = s.strokeW * 4;
      ctx.lineCap = "round";
      ctx.stroke();
      ctx.restore();

      // Línea central
      ctx.save();
      ctx.strokeStyle = `rgba(${s.r},${s.g},${s.b},${alpha})`;
      ctx.lineWidth = s.strokeW;
      ctx.lineCap = "round";
      ctx.stroke();
      ctx.restore();
    }

    // Segundo pase: resplandor corona difuso
    ctx.globalCompositeOperation = "source-over";
    const halo = ctx.createRadialGradient(cx, cy, r * 0.85, cx, cy, r * 1.9);
    halo.addColorStop(0, "rgba(255,160,30,0.18)");
    halo.addColorStop(0.45, "rgba(255,80,0,0.07)");
    halo.addColorStop(1, "rgba(0,0,0,0)");
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.9, 0, Math.PI * 2);
    ctx.fillStyle = halo;
    ctx.fill();
  };

  draw();
  return () => cancelAnimationFrame(animId);
}

export default function SunCanvas({ size = 260 }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const rayRef = useRef<HTMLCanvasElement>(null);

  // El canvas de rayos es 1.7x el diametro de la esfera
  const total = Math.round(size * 1.7);
  const offset = (total - size) / 2;
  const radius = size / 2;

  useEffect(() => {
    const rayCanvas = rayRef.current!;
    rayCanvas.width = total;
    rayCanvas.height = total;
    const stopRays = startRayCanvas(rayCanvas, total, radius);

    const mount = mountRef.current!;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.z = 4.2;

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.NoToneMapping;
    mount.appendChild(renderer.domElement);

    const geo = new THREE.SphereGeometry(1, 32, 32);
    const mat = new THREE.MeshBasicMaterial({ color: "#ff9922" });
    const sun = new THREE.Mesh(geo, mat);
    scene.add(sun);

    const loader = new THREE.TextureLoader();
    loader.load(SUN_TEXTURE, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      mat.map = tex;
      mat.color.set(0xffd580); // tinte cálido para evitar blanco puro
      mat.needsUpdate = true;
    });

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      sun.rotation.y += 0.0012;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      stopRays();
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (mount.contains(renderer.domElement))
        mount.removeChild(renderer.domElement);
    };
  }, [size, total, radius]);

  return (
    <div style={{ position: "relative", width: size, height: size, overflow: "visible" }}>
      {/* Rayos corona — canvas 2D centrado sobre la esfera */}
      <canvas
        ref={rayRef}
        style={{
          position: "absolute",
          top: -offset,
          left: -offset,
          width: total,
          height: total,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Esfera solar Three.js */}
      <div
        ref={mountRef}
        style={{
          position: "relative",
          zIndex: 1,
          width: size,
          height: size,
          borderRadius: "50%",
          overflow: "hidden",
          boxShadow: `
            0 0 ${size * 0.10}px ${size * 0.04}px rgba(255,210,80,1),
            0 0 ${size * 0.22}px ${size * 0.06}px rgba(255,140,0,0.75)
          `,
        }}
      />
    </div>
  );
}
