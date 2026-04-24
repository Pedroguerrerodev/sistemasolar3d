import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
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
const DEEP_SPACE_GAP = 8000;
const DEEP_SPACE_IDS = ['blackhole', 'trappist', 'kepler'];

function getZPos(index: number, planetsArray: any[]) {
  if (index === 0) return 0;
  let z = 0;
  for (let i = 1; i <= index; i++) {
    const curr = planetsArray[i];
    const prev = planetsArray[i - 1];

    const currIsDeepSpace = curr && DEEP_SPACE_IDS.includes(curr.id);
    const prevIsDeepSpace = prev && DEEP_SPACE_IDS.includes(prev.id);

    if (currIsDeepSpace !== prevIsDeepSpace) {
      z -= DEEP_SPACE_GAP;
    } else {
      z -= SPACING;
    }
  }
  return z;
}

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

export default function PlanetScene({ activeIndex, onPlanetChange, planetsData }: { activeIndex: number, onPlanetChange: (idx: number) => void, planetsData?: any[] }) {
  const activePlanetsList = planetsData || PLANETS;
  const SCENE_PLANETS = [...activePlanetsList].reverse();

  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const cameraRigRef = useRef<THREE.Group | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const rimLightRef = useRef<THREE.DirectionalLight | null>(null);
  const planetsRef = useRef<THREE.Mesh[]>([]);
  const atmospheresRef = useRef<THREE.Mesh[]>([]);
  const ringMeshesRef = useRef<THREE.Points[]>([]);

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

    const aspect = window.innerWidth / window.innerHeight;
    // Adaptar el Campo de Visión (FOV) para vistas verticales (móviles)
    // Evita que los planetas se vean excesivamente grandes y se recorten.
    const fov = aspect < 1 ? Math.min(75, 45 / aspect) : 45;

    const camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 3000);
    cameraRef.current = camera;
    cameraRig.add(camera);

    // Initial Camera Position
    const initialSceneIndex = SCENE_PLANETS.length - 1 - activeIndex;
    const initialActivePlanet = SCENE_PLANETS[initialSceneIndex] || SCENE_PLANETS[0];
    const initialTargetZ = getZPos(initialSceneIndex, SCENE_PLANETS);
    const initialLookAtIndex = initialSceneIndex + 1;
    const initialLookAtZ = getZPos(initialLookAtIndex, SCENE_PLANETS);

    const defaultRadius = 30;
    const pRadius = initialActivePlanet.radius || defaultRadius;

    let initialCamY = pRadius * 1.6;
    let initialCamZRelative = pRadius * 1.7;

    if (initialActivePlanet.id === 'blackhole') {
      initialCamY = pRadius * 5.0; // Alejamos la cámara verticalmente
      initialCamZRelative = pRadius * 14.0; // Y horizontalmente
    }

    cameraRig.position.set(0, 0, initialTargetZ);
    camera.position.set(0, initialCamY, initialCamZRelative);
    lookAtTargetRef.current.set(0, -pRadius * 2.2, initialLookAtZ);
    camera.lookAt(lookAtTargetRef.current);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Post-processing setup
    const renderScene = new RenderPass(scene, camera);
    const renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      colorSpace: THREE.SRGBColorSpace,
    });
    const composer = new EffectComposer(renderer, renderTarget);
    composer.addPass(renderScene);

    // Bloom Pass to make the rim lights and atmospheres glow
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.35,   // strength (bajado de 0.6 para que no queme la imagen)
      0.5,    // radius
      0.85    // threshold (subido de 0.1 para que SOLO lo ultra-brillante haga Bloom)
    );
    composer.addPass(bloomPass);

    // Output Pass needed for sRGB color mapping in newer Three.js versions with composer
    const outputPass = new OutputPass();
    composer.addPass(outputPass);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.05);
    scene.add(ambientLight);

    // Main sun light (directional) attached to cameraRig
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.8);
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
    const rimLight = new THREE.DirectionalLight(initialActivePlanet.color, 3.5);
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
      const zPos = getZPos(i, SCENE_PLANETS);
      const radius = p.radius || 30;

      let geometry: THREE.SphereGeometry | THREE.BufferGeometry = new THREE.SphereGeometry(radius, 128, 128);

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

      let material;

      if (p.id === 'blackhole') {
        // Hitbox invisible, mucho más grande para facilitar el clic en la bola y disco
        geometry = new THREE.SphereGeometry(radius * 4.5, 32, 32);
        material = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
      } else {
        material = new THREE.MeshStandardMaterial({
          map: texture,
          color: TEXTURE_URLS[p.id] ? 0xffffff : p.color,
          roughness: 0.8,
          metalness: 0.1,
          bumpMap: bumpTexture || (['uranus', 'neptune'].includes(p.id) ? null : texture),
          bumpScale: bumpTexture ? (p.id === 'mercury' ? 0.5 : 2.0) : 0.5,
        });
      }

      const mesh = new THREE.Mesh(geometry, material);
      mesh.userData = { isBlackHole: p.id === 'blackhole' };

      if (p.id === 'blackhole') {
        // Esfera negra visual
        const visualGeom = new THREE.SphereGeometry(radius, 128, 128);
        const visualMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const visualMesh = new THREE.Mesh(visualGeom, visualMat);
        mesh.add(visualMesh);

        const innerRadius = radius * 1.1;
        const outerRadius = radius * 5.5;

        // 1. Crear disco de acreción espectacular con miles de partículas
        const diskGeom = new THREE.BufferGeometry();
        // Reducimos las particulas a 30k para asegurar fluidez y evitamos anillos planos básicos
        const particleCount = 30000;
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        const colorCore = new THREE.Color(0xffffee); // Blanco incandescente muy caliente
        const colorHot = new THREE.Color(0xff6600); // Naranja plasma intenso
        const colorCold = new THREE.Color(0x330000); // Rojo oscuro borde

        for (let j = 0; j < particleCount; j++) {
          // Distribución cuadrática: muchas más partículas cerca del borde del agujero
          const rFactor = Math.pow(Math.random(), 2.0);
          const r = innerRadius + rFactor * (outerRadius - innerRadius);
          const angle = Math.random() * Math.PI * 2;

          // Variación vertical gaussiana (más fino en el interior, más disperso en el exterior)
          const maxThickness = Math.max(0.1, rFactor * 2.5);
          // Usamos suma de randoms para centrar más en Y=0
          const yFactor = (Math.random() + Math.random() + Math.random()) / 3 - 0.5;
          const y = yFactor * maxThickness * radius;

          // Generamos en el eje horizontal XZ
          positions[j * 3] = Math.cos(angle) * r;
          positions[j * 3 + 1] = y;
          positions[j * 3 + 2] = Math.sin(angle) * r;

          // Temperatura de color interpolada
          const color = new THREE.Color();
          if (rFactor < 0.15) {
            color.lerpColors(colorCore, colorHot, rFactor / 0.15);
          } else {
            color.lerpColors(colorHot, colorCold, (rFactor - 0.15) / 0.85);
          }
          colors[j * 3] = color.r;
          colors[j * 3 + 1] = color.g;
          colors[j * 3 + 2] = color.b;
        }

        diskGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        diskGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const diskMat = new THREE.PointsMaterial({
          size: Math.max(0.1, radius * 0.05), // tamaño escalado proporcionalmente
          vertexColors: true,
          blending: THREE.AdditiveBlending,
          transparent: true,
          opacity: 0.95,
          depthWrite: false,
          sizeAttenuation: true
        });

        const accretionDisk = new THREE.Points(diskGeom, diskMat);

        // Inclinar el sistema para la perspectiva "Interstellar"
        accretionDisk.rotation.x = 0.3;
        accretionDisk.rotation.z = -0.15;

        mesh.add(accretionDisk);

        // 2. Halo de distorsión gravitacional (Corona simulada con Shader)
        const coronaGeom = new THREE.SphereGeometry(radius * 1.5, 32, 32);
        const coronaMat = new THREE.ShaderMaterial({
          uniforms: THREE.UniformsUtils.merge([
            THREE.UniformsLib['fog'],
            {
              c: { value: 0.7 },
              p: { value: 3.5 },
              glowColor: { value: new THREE.Color(0xff5500) }
            }
          ]),
          vertexShader: `
            varying vec3 vNormal;
            ${THREE.ShaderChunk.fog_pars_vertex}
            void main() {
              vNormal = normalize(normalMatrix * normal);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              ${THREE.ShaderChunk.fog_vertex}
            }
          `,
          fragmentShader: `
            uniform float c;
            uniform float p;
            uniform vec3 glowColor;
            varying vec3 vNormal;
            ${THREE.ShaderChunk.fog_pars_fragment}
            void main() {
              // Fresnel brillante en los bordes para simular lente térmica
              float intensity = pow(abs(c - dot(vNormal, vec3(0.0, 0.0, 1.0))), p);
              gl_FragColor = vec4(glowColor, intensity * 0.8);
              ${THREE.ShaderChunk.fog_fragment}
            }
          `,
          side: THREE.BackSide,
          blending: THREE.AdditiveBlending,
          transparent: true,
          depthWrite: false,
          fog: true
        });
        const corona = new THREE.Mesh(coronaGeom, coronaMat);
        // Evitamos que vibre o parpadee pegándolo atrás
        mesh.add(corona);

        // Evitamos que emita sombras en la bounding box o sus hijos
        mesh.castShadow = false;
        mesh.receiveShadow = false;
      } else {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }

      mesh.position.set(0, 0, zPos);
      mesh.rotation.y = Math.random() * Math.PI;
      // Tilt axis slightly
      mesh.rotation.z = Math.random() * 0.2;
      scene.add(mesh);
      planetsRef.current.push(mesh);

      // Atmosphere glow (Fresnel-like effect using custom shader)
      if (p.id !== 'blackhole') {
        const atmosGeom = new THREE.SphereGeometry(radius * 1.15, 64, 64);
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
      } else {
        atmospheresRef.current.push(null as any);
      }

      // --- ADDITIVE PARTICLE RINGS FOR SATURN & URANUS ---
      // Performance optimized for mobile using points
      if (p.id === 'saturn' || p.id === 'uranus') {
        const isSaturn = p.id === 'saturn';
        // Extremely low draw call overhead for thousands of particles
        const particleCount = isSaturn ? 8000 : 3000;
        const ringGeom = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        const innerRadius = radius * 1.3;
        const outerRadius = isSaturn ? radius * 2.5 : radius * 1.8;
        const colorObj = new THREE.Color(p.color);

        for (let j = 0; j < particleCount; j++) {
          const radius = innerRadius + Math.random() * (outerRadius - innerRadius);
          const angle = Math.random() * Math.PI * 2;

          // Slight vertical variation
          const thickness = isSaturn ? 0.8 : 0.3;
          const y = (Math.random() - 0.5) * thickness;

          positions[j * 3] = Math.cos(angle) * radius;
          positions[j * 3 + 1] = y;
          positions[j * 3 + 2] = Math.sin(angle) * radius;

          // Gentle random coloring close to base color
          const mixedColor = colorObj.clone().offsetHSL(
            (Math.random() - 0.5) * 0.1,
            0,
            (Math.random() - 0.5) * 0.2
          );
          colors[j * 3] = mixedColor.r;
          colors[j * 3 + 1] = mixedColor.g;
          colors[j * 3 + 2] = mixedColor.b;
        }

        ringGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        ringGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const ringMat = new THREE.PointsMaterial({
          size: 0.25,
          vertexColors: true,
          transparent: true,
          opacity: 0.8,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });

        const ringMesh = new THREE.Points(ringGeom, ringMat);
        ringMesh.position.set(0, 0, zPos);
        ringMesh.rotation.x = Math.PI / 2 - 0.2; // Tilt it!
        ringMesh.rotation.y = 0.1;

        scene.add(ringMesh);
        ringMeshesRef.current.push(ringMesh);
      }
    });

    // Mouse Drag to Rotate and Click to Select
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let clickStartX = 0;
    let clickStartY = 0;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // Parallax variables
    let targetParallaxX = 0;
    let targetParallaxY = 0;
    let currentParallaxX = 0;
    let currentParallaxY = 0;

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
      // Parallax effect calculations
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = -(event.clientY / window.innerHeight) * 2 + 1;

      // Target offset based on mouse position
      targetParallaxX = x * -20; // 20 units max offset
      targetParallaxY = y * -20;

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

    // --- TOUCH SUPPORT PARA MÓVILES ---
    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length > 0) {
        isDragging = true;
        previousMousePosition = { x: event.touches[0].clientX, y: event.touches[0].clientY };
        clickStartX = event.touches[0].clientX;
        clickStartY = event.touches[0].clientY;
      }
    };

    const onTouchMove = (event: TouchEvent) => {
      if (isDragging && event.touches.length > 0) {
        const deltaMove = {
          x: event.touches[0].clientX - previousMousePosition.x,
          y: event.touches[0].clientY - previousMousePosition.y
        };

        const activeMesh = planetsRef.current[SCENE_PLANETS.length - 1 - activeIndexRef.current];
        if (activeMesh) {
          activeMesh.rotation.y += deltaMove.x * 0.005;
          activeMesh.rotation.x += deltaMove.y * 0.005;
        }

        previousMousePosition = { x: event.touches[0].clientX, y: event.touches[0].clientY };
      }
    };

    const onTouchEnd = (event: TouchEvent) => {
      isDragging = false;
      targetParallaxX = 0;
      targetParallaxY = 0;
    };

    // Device Orientation parallax for mobile devices
    const handleOrientation = (event: DeviceOrientationEvent) => {
      // Gamma is the left-to-right tilt in degrees, where right is positive
      // Beta is the front-to-back tilt in degrees, where front is positive
      const maxTilt = 30;

      let gamma = event.gamma || 0;
      let beta = event.beta || 0;

      // Cap values to prevent jumping if device is turned over
      gamma = Math.min(Math.max(gamma, -maxTilt), maxTilt);
      // Adjust beta to center around roughly 45 degrees (holding phone angle)
      beta = Math.min(Math.max(beta - 45, -maxTilt), maxTilt);

      // Calculate a pseudo-X/Y (like the mouse values from -1 to 1) 
      const x = gamma / maxTilt;
      const y = -(beta / maxTilt);

      targetParallaxX = x * -15; // Slightly weaker on mobile
      targetParallaxY = y * -15;
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('deviceorientation', handleOrientation);

    // Animation Loop
    let animationFrameId: number;
    const render = () => {
      const currentActiveSceneIndex = SCENE_PLANETS.length - 1 - activeIndexRef.current;

      // Parallax smoothing effect
      currentParallaxX += (targetParallaxX - currentParallaxX) * 0.05;
      currentParallaxY += (targetParallaxY - currentParallaxY) * 0.05;

      planetsRef.current.forEach((p, i) => {
        if (!isDragging || i !== currentActiveSceneIndex) {
          if (p.userData.isBlackHole) {
            // Rotamos el agujero negro sobre Y solo un poco, y animamos el disco 
            // Si queremos que el disco de acreción no tambalee, rotamos en Z (giro plano)
            p.rotation.y += 0.0005;
          } else {
            p.rotation.y += 0.002; // Auto rotation
          }
        }

        // Animación específica del Anillo de Acreción interno
        if (p.userData.isBlackHole) {
          // children[0] es la esfera negra, children[1] es el disco (accretionDisk)
          const disk = p.children[1];
          if (disk) disk.rotation.y -= 0.003;
        }

        // Apply slight offset to ALL planets from parallax.
        // In three.js to give the illusion of flying camera, we can shift the scene items slightly
        // We only move the X and Y positions. Z remains unchanged.
        const baseZPos = getZPos(SCENE_PLANETS.length - 1 - i, SCENE_PLANETS);

        // Items further away shift less to create faux-depth
        const depthFactor = 1.0;

        p.position.x = currentParallaxX * depthFactor;
        p.position.y = currentParallaxY * depthFactor;

        // Keep atmospheres locked to planet
        if (atmospheresRef.current[i]) {
          atmospheresRef.current[i].position.x = p.position.x;
          atmospheresRef.current[i].position.y = p.position.y;
        }

        // Keep rings locked to planet
        const isSaturn = SCENE_PLANETS[i]?.id === 'saturn';
        const isUranus = SCENE_PLANETS[i]?.id === 'uranus';
        if (isSaturn || isUranus) {
          const ringMesh = ringMeshesRef.current.find(r => Math.abs(r.position.z - baseZPos) < 1);
          if (ringMesh) {
            ringMesh.position.x = p.position.x;
            ringMesh.position.y = p.position.y;
          }
        }
      });

      // Rotar sutilmente los anillos para dar vida (sin afectar rendimiento)
      ringMeshesRef.current.forEach(r => {
        r.rotation.z -= 0.0005;
      });

      camera.lookAt(lookAtTargetRef.current);

      composer.render();
      animationFrameId = requestAnimationFrame(render);
    };
    render();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const width = document.documentElement.clientWidth;
      const height = document.documentElement.clientHeight;
      const tAspect = width / height;
      camera.aspect = tAspect;
      // Actualizar FOV dinámicamente si rotan el tablet o cambian el tamaño
      camera.fov = tAspect < 1 ? Math.min(75, 45 / tAspect) : 45;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
      composer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Call once to set initial size correctly

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('deviceorientation', handleOrientation);
      cancelAnimationFrame(animationFrameId);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();

      // Dispose geometries and materials
      planetsRef.current.forEach(p => {
        if (p.geometry) p.geometry.dispose();
        if (p.material) (p.material as THREE.Material).dispose();

        if (p.userData.isBlackHole) {
          p.children.forEach(c => {
            const childMesh = c as THREE.Mesh;
            if (childMesh.geometry) childMesh.geometry.dispose();
            if (childMesh.material) {
              if (Array.isArray(childMesh.material)) {
                childMesh.material.forEach(m => m.dispose());
              } else {
                childMesh.material.dispose();
              }
            }
          });
        }
      });
      atmospheresRef.current.forEach(a => {
        if (a) {
          a.geometry.dispose();
          (a.material as THREE.Material).dispose();
        }
      });
      ringMeshesRef.current.forEach(r => {
        r.geometry.dispose();
        (r.material as THREE.Material).dispose();
      });

      planetsRef.current = [];
      atmospheresRef.current = [];
      ringMeshesRef.current = [];
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
    const targetZ = getZPos(sceneIndex, SCENE_PLANETS);

    const lookAtIndex = sceneIndex + 1;
    const lookAtZ = getZPos(lookAtIndex, SCENE_PLANETS);

    const prevSceneIndex = prevSceneIndexRef.current;
    const pRadius = activePlanet?.radius || 30;

    // Position camera to create the massive horizon effect
    let camY = pRadius * 1.6;
    let camZRelative = pRadius * 1.7;

    if (activePlanet?.id === 'blackhole') {
      camY = pRadius * 4.0; // Distancia extra para apreciar SGR-A en su totalidad
      camZRelative = pRadius * 14.0;
    }

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
      y: -pRadius * 2.2, // Push the next planet below the label text
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
