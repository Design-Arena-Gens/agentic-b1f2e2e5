"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AccumulativeShadows, Environment, Float, Html, MeshTransmissionMaterial, Text, useTexture } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

type ExportRequest = {
  size: number;
  filename?: string;
};

function IsometricOrthoCamera() {
  const { size, set, camera } = useThree();
  const aspect = size.width / size.height;
  const scale = 6; // zoom-ish
  const left = (-aspect * scale) / 2;
  const right = (aspect * scale) / 2;
  const top = scale / 2;
  const bottom = -scale / 2;

  const cam = useMemo(
    () =>
      new THREE.OrthographicCamera(left, right, top, bottom, 0.1, 100),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    cam.left = left;
    cam.right = right;
    cam.top = top;
    cam.bottom = bottom;
    cam.updateProjectionMatrix();
    // Isometric angles: 35.264? pitch, 45? yaw
    const pitch = THREE.MathUtils.degToRad(35.264);
    const yaw = THREE.MathUtils.degToRad(45);
    const radius = 10;
    const x = Math.cos(yaw) * radius;
    const z = Math.sin(yaw) * radius;
    cam.position.set(x, Math.tan(pitch) * radius, z);
    cam.lookAt(0, 0.8, 0);
    set({ camera: cam as any });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aspect]);

  return null;
}

function CorrugatedPanel({
  width = 3.0,
  height = 1.6,
  depth = 0.04,
  corrugation = 28,
  curvature = 0.03
}) {
  // Build sinusoidal corrugation along horizontal axis by displacing vertices
  const geom = useMemo(() => {
    const gridX = corrugation * 8;
    const gridY = 40;
    const geometry = new THREE.PlaneGeometry(width, height, gridX, gridY);
    const position = geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const offset = Math.sin((x / (width / 2)) * Math.PI * corrugation) * curvature;
      position.setZ(i, offset);
    }
    position.needsUpdate = true;
    geometry.computeVertexNormals();
    return geometry;
  }, [width, height, corrugation, curvature]);

  return (
    <mesh geometry={geom}>
      <meshPhysicalMaterial
        color={"#0a0f19"}
        roughness={0.1}
        metalness={0.2}
        transmission={0.7}
        thickness={0.4}
        transparent
        opacity={0.9}
        ior={1.3}
        clearcoat={1}
        clearcoatRoughness={0.2}
      />
    </mesh>
  );
}

function ContainerBody() {
  // Base frame
  const frameColor = new THREE.Color("#101826");
  const edgeMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: frameColor,
        metalness: 0.9,
        roughness: 0.25
      }),
    []
  );

  const frame = useRef<THREE.Group>(null);

  // Neon green internal glow plane to help sell emissive glass
  return (
    <group>
      {/* Frame edges */}
      <group ref={frame}>
        {/* Base corners and edges as beveled boxes */}
        {[
          // Vertical posts (x, y, z, sx, sy, sz)
          [-1.55, 0.8, -0.85, 0.08, 1.6, 0.08],
          [1.55, 0.8, -0.85, 0.08, 1.6, 0.08],
          [-1.55, 0.8, 0.85, 0.08, 1.6, 0.08],
          [1.55, 0.8, 0.85, 0.08, 1.6, 0.08],
          // Top edges
          [0, 1.6, 0.85, 3.1, 0.08, 0.08],
          [0, 1.6, -0.85, 3.1, 0.08, 0.08],
          // Bottom edges
          [0, 0, 0.85, 3.1, 0.08, 0.08],
          [0, 0, -0.85, 3.1, 0.08, 0.08],
          // Side edges
          [-1.55, 0.8, 0, 0.08, 1.6, 1.7],
          [1.55, 0.8, 0, 0.08, 1.6, 1.7]
        ].map((p, i) => (
          <mesh key={i} position={[p[0], p[1], p[2]]} material={edgeMaterial}>
            <boxGeometry args={[p[3], p[4], p[5]]} />
          </mesh>
        ))}
      </group>

      {/* Corrugated glass panels */}
      {/* Left and right */}
      <group position={[0, 0.8, 0.85]}>
        <CorrugatedPanel width={3.1} height={1.6} />
      </group>
      <group position={[0, 0.8, -0.85]} rotation={[0, Math.PI, 0]}>
        <CorrugatedPanel width={3.1} height={1.6} />
      </group>
      {/* Front and back */}
      <group position={[1.55, 0.8, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <CorrugatedPanel width={1.7} height={1.6} />
      </group>
      <group position={[-1.55, 0.8, 0]} rotation={[0, Math.PI / 2, 0]}>
        <CorrugatedPanel width={1.7} height={1.6} />
      </group>
      {/* Top */}
      <group position={[0, 1.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <CorrugatedPanel width={3.1} height={1.7} corrugation={30} curvature={0.02} />
      </group>
      {/* Bottom - solid dark metal */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.12, 1.72]} />
        <meshStandardMaterial color={"#0b1220"} metalness={0.8} roughness={0.4} />
      </mesh>
    </group>
  );
}

function Coins({ count = 42 }) {
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = new THREE.Color("#f4c95d");
  useEffect(() => {
    for (let i = 0; i < count; i++) {
      const x = THREE.MathUtils.randFloatSpread(2.6);
      const z = THREE.MathUtils.randFloatSpread(1.3);
      const y = THREE.MathUtils.randFloat(0.08, 0.5) + (i % 5) * 0.015;
      const r = THREE.MathUtils.randFloat(0, Math.PI * 2);
      dummy.position.set(x, 0.08 + y * 0.03, z);
      dummy.rotation.set(-Math.PI / 2, 0, r);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  }, [count, dummy]);
  return (
    <instancedMesh ref={mesh} args={[undefined as any, undefined as any, count]}>
      <cylinderGeometry args={[0.07, 0.07, 0.02, 32]} />
      <meshStandardMaterial color={color} metalness={1} roughness={0.2} />
    </instancedMesh>
  );
}

function NeonNumbers() {
  const group = useRef<THREE.Group>(null);
  const digits = ["8", "0", "1", "6", "4", "2", "9", "3", "7", "5"];
  return (
    <group ref={group} position={[0, 0.85, 0]}>
      {digits.map((d, i) => {
        const a = (i / digits.length) * Math.PI * 2;
        const r = 0.55;
        const x = Math.cos(a) * r;
        const z = Math.sin(a) * r;
        return (
          <Float
            key={i}
            speed={1.2}
            rotationIntensity={0.2}
            floatIntensity={0.25}
          >
            <Text
              position={[x, 0.2 + (i % 3) * 0.08, z]}
              rotation={[0, -a + Math.PI / 2, 0]}
              fontSize={0.28}
              color={"#00ff88"}
              anchorX="center"
              anchorY="middle"
              outlineColor="#00ff88"
              outlineWidth={0.008}
            >
              {d}
            </Text>
          </Float>
        );
      })}
    </group>
  );
}

function GroundGlow() {
  const mesh = useRef<THREE.Mesh>(null!);
  return (
    <mesh ref={mesh} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
      <circleGeometry args={[3.2, 64]} />
      <meshBasicMaterial color={"#00ff88"} transparent opacity={0.08} />
    </mesh>
  );
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight
        position={[5, 6, 3]}
        intensity={2.2}
        color={"#9fe6c3"}
        castShadow
      />
      <spotLight
        position={[-6, 8, -4]}
        intensity={2.0}
        angle={0.45}
        penumbra={0.5}
        color={"#88c0ff"}
        castShadow
      />
      <pointLight position={[0, 1.1, 0]} intensity={1.8} color={"#00ff88"} />
    </>
  );
}

function SceneContent() {
  return (
    <group>
      <ContainerBody />
      <group position={[0, 0, 0]}>
        <Coins />
        <NeonNumbers />
      </group>
      <GroundGlow />
    </group>
  );
}

function ExportHandler() {
  const { gl, scene, camera, size } = useThree();
  const composerRef = useRef<any>(null);
  // Expose composer to parent via DOM event to render high-res frames
  useEffect(() => {
    function handler(e: Event) {
      const ev = e as CustomEvent<ExportRequest>;
      const targetSize = ev.detail.size;
      const name = ev.detail.filename || `cyber-container-${targetSize}.png`;

      const prevSize = { w: size.width, h: size.height, dpr: gl.getPixelRatio() };
      // Upscale renderer to exact targetSize square
      gl.setPixelRatio(1);
      gl.setSize(targetSize, targetSize, false);
      if (composerRef.current) {
        composerRef.current.setSize(targetSize, targetSize);
        composerRef.current.render();
      } else {
        gl.render(scene, camera);
      }
      try {
        const url = gl.domElement.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } finally {
        // Restore previous size
        gl.setSize(prevSize.w, prevSize.h, false);
        gl.setPixelRatio(prevSize.dpr);
      }
    }
    window.addEventListener("export-canvas", handler as any);
    return () => window.removeEventListener("export-canvas", handler as any);
  }, [gl, scene, camera, size]);
  return (
    <EffectComposer ref={composerRef} multisampling={8}>
      <Bloom
        intensity={1.2}
        luminanceThreshold={0.2}
        luminanceSmoothing={0.25}
        mipmapBlur
      />
      <Vignette eskil={false} offset={0.2} darkness={0.6} />
    </EffectComposer>
  );
}

export default function ContainerScene() {
  return (
    <Canvas
      gl={{
        antialias: true,
        preserveDrawingBuffer: true // required for toDataURL
      }}
      shadows
      onCreated={({ gl }) => {
        gl.setClearColor(new THREE.Color("#0b1220"));
      }}
    >
      <IsometricOrthoCamera />
      <color attach="background" args={["#0b1220"]} />
      <Suspense fallback={<Html center>Loading?</Html>}>
        <Lights />
        <SceneContent />
        <Environment preset="city" background={false} />
      </Suspense>
      <ExportHandler />
    </Canvas>
  );
}

