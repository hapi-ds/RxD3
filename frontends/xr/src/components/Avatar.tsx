/**
 * Avatar component for representing connected users in 3D space
 * Renders a colored sphere with a text label showing the user's email
 */

import { Text } from '@react-three/drei';

/**
 * User data for avatar representation
 */
interface AvatarUser {
  email: string;
  position?: [number, number, number];
}

/**
 * Avatar component props
 */
interface AvatarProps {
  user: AvatarUser;
}

/**
 * Generate a consistent color from an email address using a simple hash
 * @param email - User's email address
 * @returns Hex color string
 */
function hashEmailToColor(email: string): string {
  // Simple hash function to generate a number from the email
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Convert hash to RGB values
  const r = (hash & 0xFF0000) >> 16;
  const g = (hash & 0x00FF00) >> 8;
  const b = hash & 0x0000FF;

  // Ensure colors are vibrant by boosting low values
  const minBrightness = 100;
  const adjustedR = Math.max(r, minBrightness);
  const adjustedG = Math.max(g, minBrightness);
  const adjustedB = Math.max(b, minBrightness);

  // Convert to hex color
  return `#${adjustedR.toString(16).padStart(2, '0')}${adjustedG.toString(16).padStart(2, '0')}${adjustedB.toString(16).padStart(2, '0')}`;
}

/**
 * Avatar component representing a user in 3D space
 * 
 * Features:
 * - 3D sphere mesh with color derived from email
 * - Text label displaying user's email
 * - Configurable position in 3D space
 * 
 * @param props - Avatar component props
 * @returns JSX element representing the user avatar
 * 
 * @example
 * ```tsx
 * <Avatar user={{ email: 'user@example.com', position: [0, 1, 0] }} />
 * ```
 */
export function Avatar({ user }: AvatarProps) {
  // Default position if not provided
  const position = user.position || [0, 1, 0];
  
  // Generate unique color from email
  const color = hashEmailToColor(user.email);

  return (
    <group position={position}>
      {/* 3D sphere representing the user */}
      <mesh>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Text label showing user's email */}
      <Text
        position={[0, 0.5, 0]}
        fontSize={0.1}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {user.email}
      </Text>
    </group>
  );
}
