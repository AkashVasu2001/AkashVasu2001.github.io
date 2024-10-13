import { useGLTF } from "@react-three/drei";
import { useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";

export function Model(props) {
  const { nodes, materials } = useGLTF("/final.gltf");
  const groupRef = useRef();
  const [hoveredMesh, setHoveredMesh] = useState(null);
  const [clickedMeshes, setClickedMeshes] = useState([]);
  const emissiveDecayRate = 0.05;
  const emissiveMaxIntensity = 0.5;
  const emissiveClickedIntensity = 0.6;
  const dimmedEmissive = 0.05;

  const [animationPlaying, setAnimationPlaying] = useState(true);

  useEffect(() => {
    let intervalId;
    let flickerCount = 0;
    const flickerTime = 7000;
    const flickerInterval = 100;

    const flickerEffect = () => {
      flickerCount++;
      const randomMesh = groupRef.current.children[Math.floor(Math.random() * groupRef.current.children.length)];
      if (randomMesh.material) {
        randomMesh.material.emissiveIntensity = emissiveMaxIntensity;
        setTimeout(() => {
          randomMesh.material.emissiveIntensity = dimmedEmissive;
        }, flickerInterval);
      }

      if (flickerCount * flickerInterval >= flickerTime) {
        clearInterval(intervalId);
        setAnimationPlaying(false);
      }
    };

    intervalId = setInterval(flickerEffect, flickerInterval);
    return () => clearInterval(intervalId);
  }, []);

  useFrame(({ raycaster, pointer, camera }) => {
    if (!animationPlaying && groupRef.current) {
      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(groupRef.current.children, true);
      let foundHoveredMesh = null;

      for (const intersect of intersects) {
        const intersectedMesh = intersect.object;
        // Skip specific geometry and background plane
        if (intersectedMesh.geometry === nodes.Text006.geometry || intersectedMesh.name === "BackgroundPlane") {
          continue;
        }
        foundHoveredMesh = intersectedMesh;
        break;
      }

      // Handle hover state
      if (foundHoveredMesh) {
        if (foundHoveredMesh !== hoveredMesh && !clickedMeshes.includes(foundHoveredMesh)) {
          setHoveredMesh(foundHoveredMesh);
        }
        if (hoveredMesh && !clickedMeshes.includes(hoveredMesh)) {
          hoveredMesh.material.emissiveIntensity = emissiveMaxIntensity;
        }
      } else if (hoveredMesh && !clickedMeshes.includes(hoveredMesh)) {
        if (hoveredMesh.material.emissiveIntensity > dimmedEmissive) {
          hoveredMesh.material.emissiveIntensity = Math.max(dimmedEmissive, hoveredMesh.material.emissiveIntensity - emissiveDecayRate);
        } else {
          setHoveredMesh(null);
        }
      }

      // Update clicked meshes' intensity
      clickedMeshes.forEach((clickedMesh) => {
        clickedMesh.material.emissiveIntensity = emissiveClickedIntensity;
      });

      groupRef.current.children.forEach((mesh) => {
        if (!clickedMeshes.includes(mesh) && mesh !== hoveredMesh) {
          mesh.material.emissiveIntensity = dimmedEmissive;
        }
      });
    }
  });

  const handleLeftClick = (event) => {
    if (event.button === 0 && hoveredMesh) {
      if (clickedMeshes.includes(hoveredMesh)) {
        // If already clicked, remove from array
        setClickedMeshes((prev) => {
          hoveredMesh.material.emissiveIntensity = dimmedEmissive; // Reset emissive intensity
          return prev.filter(mesh => mesh !== hoveredMesh);
        });
      } else {
        // Add new mesh to clicked array
        setClickedMeshes((prev) => {
          hoveredMesh.material.emissive = new THREE.Color(0x00ffff); // Set to cyan
          hoveredMesh.material.emissiveIntensity = emissiveClickedIntensity; // Set clicked intensity
          return [...prev, hoveredMesh];
        });
      }
    }
  };

  useEffect(() => {
    window.addEventListener("pointerdown", handleLeftClick);
    return () => {
      window.removeEventListener("pointerdown", handleLeftClick);
    };
  }, [hoveredMesh, clickedMeshes]);

  return (
    <>
      <mesh name="BackgroundPlane" position={[0, 0, -0.5]} rotation={[0, 0, 0]} scale={[10, 10, 1]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color={new THREE.Color(0x444444)} />
      </mesh>

      <group ref={groupRef} {...props} dispose={null}>
        <mesh
          geometry={nodes.Text006.geometry}
          material={materials["CCL Matte Metal Black"]}
          position={[0, 0.392, 0.006]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[1, 0.791, 1]}
          receiveShadow
        />

        {[nodes.Text008, nodes.Text009, nodes.Text010, nodes.Text011, nodes.Text012, nodes.Text013].map(
          (textNode, index) => (
            <mesh
              key={index}
              geometry={textNode.geometry}
              material={materials.Neon.clone()}
              position={[0, 0.392, 0.04]}
              rotation={[Math.PI / 2, 0, 0]}
              scale={[1, 0.382, 1]}
              castShadow={false}
              receiveShadow={false}
              material-emissive={new THREE.Color(0x00ffff)} // Set cyan emissive color for neon effect
              toneMapped={false}
            />
          )
        )}
      </group>

      {/* Bloom Post-Processing Effect */}
      <EffectComposer>
        <Bloom
          intensity={1.5} // Keep intensity moderate
          luminanceThreshold={0} // Threshold for brightness
          luminanceSmoothing={1} // Controls the smoothness of the bloom
          radius={15} // Increase radius for wider spread of the bloom
        />
      </EffectComposer>
    </>
  );
}

useGLTF.preload("/final.gltf");
