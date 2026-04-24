const fs = require('fs');
let code = fs.readFileSync('src/components/PlanetScene.tsx', 'utf8');
const replacement = } else if (p.id === 'pulsar') {
        // Núcleo brillante y denso de estrella de neutrones
        mesh.material = new THREE.MeshStandardMaterial({
          color: 0x88ccff,
          emissive: 0x0055ff,
          emissiveIntensity: 1.2,
          roughness: 0.1,
          metalness: 0.8
        });

        // Halo de radiación (Glow externo sutil)
        const haloGeom = new THREE.SphereGeometry(radius * 1.3, 32, 32);
        const haloMat = new THREE.MeshBasicMaterial({
          color: 0x00aaff,
          transparent: true,
          opacity: 0.3,
          blending: THREE.AdditiveBlending,
          side: THREE.BackSide,
          depthWrite: false
        });
        mesh.add(new THREE.Mesh(haloGeom, haloMat));

        // Campos magnéticos rotatorios (Anillos de energía)
        const ringGeom = new THREE.TorusGeometry(radius * 2.2, 0.4, 16, 100);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0x00ffff,
          transparent: true,
          opacity: 0.4,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        
        const ring1 = new THREE.Mesh(ringGeom, ringMat);
        ring1.rotation.x = Math.PI / 3;
        mesh.add(ring1);
        
        const ring2 = new THREE.Mesh(ringGeom, ringMat);
        ring2.rotation.y = Math.PI / 3;
        mesh.add(ring2);

        // Jets de emisión polares dobles
        const jetLength = 800;
        const jetInnerGeom = new THREE.CylinderGeometry(0.5, 3, jetLength, 16, 1, true);
        const jetOuterGeom = new THREE.CylinderGeometry(2, 20, jetLength, 32, 1, true);
        
        const jetInnerMat = new THREE.MeshBasicMaterial({
          color: 0xffffff, transparent: true, opacity: 0.8,
          blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
        });
        const jetOuterMat = new THREE.MeshBasicMaterial({
          color: 0x00aaff, transparent: true, opacity: 0.2,
          blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
        });

        // Grupo Norte
        const northJet = new THREE.Group();
        northJet.add(new THREE.Mesh(jetInnerGeom, jetInnerMat));
        northJet.add(new THREE.Mesh(jetOuterGeom, jetOuterMat));
        northJet.position.y = jetLength / 2 + 15;
        mesh.add(northJet);

        // Grupo Sur
        const southJet = new THREE.Group();
        southJet.add(new THREE.Mesh(jetInnerGeom, jetInnerMat));
        southJet.add(new THREE.Mesh(jetOuterGeom, jetOuterMat));
        southJet.position.y = -(jetLength / 2 + 15);
        southJet.rotation.x = Math.PI;
        mesh.add(southJet);

        mesh.userData.isPulsar = true;;
code = code.replace(/} else if \(p\.id === 'pulsar'\) \{[\s\S]*?mesh\.userData\.isPulsar = true;/m, replacement);
fs.writeFileSync('src/components/PlanetScene.tsx', code);
