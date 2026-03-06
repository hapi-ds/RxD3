import { Canvas } from '@react-three/fiber';
import { XR, Controllers, Hands } from '@react-three/xr';

export function Scene() {
  return (
    <Canvas>
      <XR>
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />

        {/* Ground plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="green" />
        </mesh>

        {/* VR Controllers and Hand Tracking */}
        <Controllers />
        <Hands />
      </XR>
    </Canvas>
  );
}
