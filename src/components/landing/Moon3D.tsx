"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere, MeshDistortMaterial, Float, Stars } from "@react-three/drei";
import * as THREE from "three";

function GlowingMoon() {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.1;
    }
    if (glowRef.current) {
      const scale = 1.15 + Math.sin(clock.getElapsedTime() * 0.5) * 0.03;
      glowRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group>
      {/* Main moon sphere */}
      <Sphere ref={meshRef} args={[1, 64, 64]}>
        <MeshDistortMaterial
          color="#8B5CF6"
          emissive="#8B5CF6"
          emissiveIntensity={0.3}
          roughness={0.7}
          metalness={0.2}
          distort={0.15}
          speed={1.5}
        />
      </Sphere>

      {/* Glow layer */}
      <Sphere ref={glowRef} args={[1.15, 32, 32]}>
        <meshBasicMaterial color="#8B5CF6" transparent opacity={0.08} side={THREE.BackSide} />
      </Sphere>
    </group>
  );
}

function UserDots() {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, colors } = useMemo(() => {
    const count = 60;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const violet = new THREE.Color("#8B5CF6");
    const green = new THREE.Color("#00FF88");

    for (let i = 0; i < count; i++) {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      const r = 1.05 + Math.random() * 0.02;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      const c = Math.random() > 0.5 ? violet : green;
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return { positions: pos, colors: col };
  }, []);

  useFrame(({ clock }) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = clock.getElapsedTime() * 0.05;
    }
  });

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [positions, colors]);

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial size={0.04} vertexColors transparent opacity={0.9} sizeAttenuation />
    </points>
  );
}

export default function Moon3D() {
  return (
    <div className="w-[180px] h-[180px] mb-4">
      <Canvas
        camera={{ position: [0, 0, 3], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 3, 5]} intensity={0.8} color="#FFFFFF" />
        <pointLight position={[-3, -2, 2]} intensity={0.4} color="#00FF88" />

        <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
          <GlowingMoon />
          <UserDots />
        </Float>

        <Stars radius={8} depth={30} count={200} factor={2} saturation={0.5} fade speed={0.5} />
      </Canvas>
    </div>
  );
}
