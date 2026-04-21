import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';

const PLANETS = [
  { id: 'pluto', name: 'PLUTO', distance: '39.5 AU', color: '#8B7355', radius: 30 },
  { id: 'neptune', name: 'NEPTUNE', distance: '30.06 AU', color: '#274687', radius: 30 },
  { id: 'uranus', name: 'URANUS', distance: '19.18 AU', color: '#82b3d1', radius: 30 },
  { id: 'saturn', name: 'SATURN', distance: '9.539 AU', color: '#e3cb8f', radius: 30 },
  { id: 'jupiter', name: 'JUPITER', distance: '5.203 AU', color: '#c99b75', radius: 30 },
  { id: 'mars', name: 'MARS', distance: '1.524 AU', color: '#c1440e', radius: 30 },
  { id: 'earth', name: 'EARTH', distance: '1 AU', color: '#4b759e', radius: 30 },
  { id: 'venus', name: 'VENUS', distance: '0.723 AU', color: '#e89c51', radius: 30 },
  { id: 'mercury', name: 'MERCURY', distance: '0.39 AU', color: '#888888', radius: 30 },
];

// Reverse so Mercury is at Z=0, Venus at Z=-400, etc.
const SCENE_PLANETS = [...PLANETS].reverse();
const SPACING = 400;

const BASE_URL = 'https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/';
const TEXTURE_URLS: Record<string, string> = {
  mercury: BASE_URL + 'mercurymap.jpg',
  venus: BASE_URL + 'venusmap.jpg',
  earth: BASE_URL + 'earthmap1k.jpg',
  mars: BASE_URL + 'marsmap1k.jpg',
  jupiter: BASE_URL + 'jupitermap.jpg',
  saturn: BASE_URL + 'saturnmap.jpg',
  uranus: BASE_URL + 'uranusmap.jpg',
  neptune: BASE_URL + 'neptunemap.jpg',
  pluto: BASE_URL + 'plutomap1k.jpg',
};

const BUMP_URLS: Record<string, string> = {
  mercury: BASE_URL + 'mercurybump.jpg',
  venus: BASE_URL + 'venusbump.jpg',
  earth: BASE_URL + 'earthbump1k.jpg',
  mars: BASE_URL + 'marsbump1k.jpg',
  pluto: BASE_URL + 'plutobump1k.jpg',
};

// Simple procedural noise texture generator
function generateNoiseTexture(baseColor: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 512, 512);

  const imageData = ctx.getImageData(0, 0, 512, 512);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 30;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }

  ctx.putImageData(imageData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export default function PlanetScene({ activeIndex, onPlanetChange }: { activeIndex: number, onPlanetChange: (idx: number) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const cameraRigRef = useRef<THREE.Group | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const rimLightRef = useRef<THREE.DirectionalLight | null>(null);
  const planetsRef = useRef<THREE.Mesh[]>([]);
  const atmospheresRef = useRef<THREE.Mesh[]>([]);

  const lookAtTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const activeIndexRef = useRef(activeIndex);
  const prevSceneIndexRef = useRef(SCENE_PLANETS.length - 1 - activeIndex);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = null; // transparent — StarField visible behind
    // Fog exponencial que desvanece planetas lejanos sin cubrir el fondo
    scene.fog = new THREE.FogExp2('#000000', 0.0022);
    sceneRef.current = scene;

    // Camera setup
    const cameraRig = new THREE.Group();
    cameraRigRef.current = cameraRig;
    scene.add(cameraRig);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 3000);
    cameraRef.current = camera;
    cameraRig.add(camera);

    // Initial Camera Position
    const initialSceneIndex = SCENE_PLANETS.length - 1 - activeIndex;
    const initialActivePlanet = SCENE_PLANETS[initialSceneIndex];
    const initialTargetZ = -initialSceneIndex * SPACING;
    const initialLookAtIndex = initialSceneIndex + 1;
    const initialLookAtZ = -initialLookAtIndex * SPACING;

    const initialCamY = initialActivePlanet.radius * 1.6;
    const initialCamZRelative = initialActivePlanet.radius * 1.7;

    cameraRig.position.set(0, 0, initialTargetZ);
    camera.position.set(0, initialCamY, initialCamZRelative);
    lookAtTargetRef.current.set(0, -initialActivePlanet.radius * 2.2, initialLookAtZ);
    camera.lookAt(lookAtTargetRef.current);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.02);
    scene.add(ambientLight);

    // Main sun light (directional) attached to cameraRig
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
    sunLight.position.set(0, 50, 100); // Move light further back so shadow camera covers the planet
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 1000;
    sunLight.shadow.camera.left = -100;
    sunLight.shadow.camera.right = 100;
    sunLight.shadow.camera.top = 100;
    sunLight.shadow.camera.bottom = -100;
    sunLight.shadow.bias = -0.001;
    cameraRig.add(sunLight);

    // Strong rim light from above and behind the active planet
    const rimLight = new THREE.DirectionalLight(initialActivePlanet.color, 6);
    rimLight.position.set(0, 50, -100); // Light from behind
    cameraRig.add(rimLight);
    rimLightRef.current = rimLight;

    // Add targets to cameraRig so lights always point relative to the camera
    cameraRig.add(sunLight.target);
    sunLight.target.position.set(0, 0, 0);

    cameraRig.add(rimLight.target);
    rimLight.target.position.set(0, 0, 0);

    const textureLoader = new THREE.TextureLoader();

    // Create Planets
    SCENE_PLANETS.forEach((p, i) => {
      const zPos = -i * SPACING;

      const geometry = new THREE.SphereGeometry(p.radius, 128, 128);

      // Try to load texture, fallback to procedural
      let texture;
      let bumpTexture;
      if (TEXTURE_URLS[p.id]) {
        texture = textureLoader.load(TEXTURE_URLS[p.id]);
        texture.colorSpace = THREE.SRGBColorSpace;
      } else {
        texture = generateNoiseTexture(p.color);
      }

      if (BUMP_URLS[p.id]) {
        bumpTexture = textureLoader.load(BUMP_URLS[p.id]);
      }

      const material = new THREE.MeshStandardMaterial({
        map: texture,
        color: TEXTURE_URLS[p.id] ? 0xffffff : p.color,
        roughness: 0.8,
        metalness: 0.1,
        bumpMap: bumpTexture || (['uranus', 'neptune'].includes(p.id) ? null : texture),
        bumpScale: bumpTexture ? (p.id === 'mercury' ? 0.5 : 2.0) : 0.5,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.position.set(0, 0, zPos);
      mesh.rotation.y = Math.random() * Math.PI;
      // Tilt axis slightly
      mesh.rotation.z = Math.random() * 0.2;
      scene.add(mesh);
      planetsRef.current.push(mesh);

      // Atmosphere glow (Fresnel-like effect using custom shader)
      const atmosGeom = new THREE.SphereGeometry(p.radius * 1.15, 64, 64);
      const atmosMat = new THREE.ShaderMaterial({
        uniforms: THREE.UniformsUtils.merge([
          THREE.UniformsLib['fog'],
          {
            c: { value: 0.3 },
            p: { value: 4.0 },
            glowColor: { value: new THREE.Color(p.color) }
          }
        ]),
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vPositionNormal;
          ${THREE.ShaderChunk.fog_pars_vertex}
          void main() {
            vNormal = normalize( normalMatrix * normal );
            vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
            vPositionNormal = normalize( -mvPosition.xyz );
            gl_Position = projectionMatrix * mvPosition;
            ${THREE.ShaderChunk.fog_vertex}
          }
        `,
        fragmentShader: `
          uniform float c;
          uniform float p;
          uniform vec3 glowColor;
          varying vec3 vNormal;
          varying vec3 vPositionNormal;
          ${THREE.ShaderChunk.fog_pars_fragment}
          void main() {
            float intensity = pow( max(0.0, c - dot(vNormal, vPositionNormal)), p );
            vec3 glow = glowColor * intensity * 2.0;
            gl_FragColor = vec4( glow, intensity * 1.5 );
            ${THREE.ShaderChunk.fog_fragment}
          }
        `,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
        fog: true,
      });

      const atmosMesh = new THREE.Mesh(atmosGeom, atmosMat);
      atmosMesh.position.set(0, 0, zPos);
      scene.add(atmosMesh);
      atmospheresRef.current.push(atmosMesh);
    });

    // Mouse Drag to Rotate and Click to Select
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let clickStartX = 0;
    let clickStartY = 0;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseDown = (event: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: event.clientX, y: event.clientY };
      clickStartX = event.clientX;
      clickStartY = event.clientY;
    };

    const onMouseUp = (event: MouseEvent) => {
      isDragging = false;

      // Handle click for planet selection
      if (Math.abs(event.clientX - clickStartX) < 5 && Math.abs(event.clientY - clickStartY) < 5) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObjects(planetsRef.current);
        if (intersects.length > 0) {
          const clickedMesh = intersects[0].object;
          const index = planetsRef.current.indexOf(clickedMesh as THREE.Mesh);
          if (index !== -1) {
            const originalIndex = SCENE_PLANETS.length - 1 - index;
            onPlanetChange(originalIndex);
          }
        }
      }
    };

    const onMouseMove = (event: MouseEvent) => {
      // Manual Rotation
      if (isDragging) {
        const deltaMove = {
          x: event.clientX - previousMousePosition.x,
          y: event.clientY - previousMousePosition.y
        };

        const activeMesh = planetsRef.current[SCENE_PLANETS.length - 1 - activeIndexRef.current];
        if (activeMesh) {
          activeMesh.rotation.y += deltaMove.x * 0.005;
          activeMesh.rotation.x += deltaMove.y * 0.005;
        }

        previousMousePosition = { x: event.clientX, y: event.clientY };
      }
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);

    // Animation Loop
    let animationFrameId: number;
    const render = () => {
      const currentActiveSceneIndex = SCENE_PLANETS.length - 1 - activeIndexRef.current;

      planetsRef.current.forEach((p, i) => {
        if (!isDragging || i !== currentActiveSceneIndex) {
          p.rotation.y += 0.002; // Auto rotation
        }
      });

      camera.lookAt(lookAtTargetRef.current);

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(render);
    };
    render();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Call once to set initial size correctly

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(animationFrameId);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();

      // Dispose geometries and materials
      planetsRef.current.forEach(p => {
        p.geometry.dispose();
        (p.material as THREE.Material).dispose();
      });
      atmospheresRef.current.forEach(a => {
        a.geometry.dispose();
        (a.material as THREE.Material).dispose();
      });

      planetsRef.current = [];
      atmospheresRef.current = [];
    };
  }, []);

  // Handle Planet Change Transition
  useEffect(() => {
    if (!cameraRef.current || !sceneRef.current || !cameraRigRef.current) return;

    gsap.killTweensOf(cameraRef.current.position);
    gsap.killTweensOf(cameraRigRef.current.position);
    gsap.killTweensOf(lookAtTargetRef.current);

    const sceneIndex = SCENE_PLANETS.length - 1 - activeIndex;
    const activePlanet = SCENE_PLANETS[sceneIndex];
    const targetZ = -sceneIndex * SPACING;

    const lookAtIndex = sceneIndex + 1;
    const lookAtZ = -lookAtIndex * SPACING;

    const prevSceneIndex = prevSceneIndexRef.current;

    // Position camera to create the massive horizon effect
    const camY = activePlanet.radius * 1.6;
    const camZRelative = activePlanet.radius * 1.7;

    gsap.to(cameraRigRef.current.position, {
      z: targetZ,
      duration: 2.5,
      ease: "power3.inOut"
    });

    gsap.to(cameraRef.current.position, {
      x: 0,
      y: camY,
      z: camZRelative,
      duration: 2.5,
      ease: "power3.inOut"
    });

    gsap.to(lookAtTargetRef.current, {
      x: 0,
      y: -activePlanet.radius * 2.2, // Push the next planet below the label text
      z: lookAtZ,
      duration: 2.5,
      ease: "power3.inOut"
    });

    if (rimLightRef.current) {
      const targetColor = new THREE.Color(activePlanet.color);
      gsap.to(rimLightRef.current.color, {
        r: targetColor.r,
        g: targetColor.g,
        b: targetColor.b,
        duration: 2.5,
        ease: "power3.inOut"
      });
    }

    prevSceneIndexRef.current = sceneIndex;

  }, [activeIndex]);

  return <div ref={containerRef} className="absolute inset-0 w-full h-full z-0" />;
}
