'use client';

import React, { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Html, ContactShadows, Environment, PresentationControls } from '@react-three/drei';
import * as THREE from 'three';

// Component giao diện bên trong điện thoại
const PhoneScreenUI = () => {
  return (
    <div className="w-[393px] h-[852px] bg-white rounded-[45px] overflow-hidden flex flex-col pointer-events-auto">
      {/* Thay bằng UI thật của bạn hoặc dùng iframe */}
      <iframe 
        src="https://pawlife.vn" // Thay link web của bạn vào đây
        className="w-full h-full border-none"
        title="Phone Screen"
      />
    </div>
  );
};

export default function InteractiveIphone({ url = '/models/iphone17promax.glb' }) {
  // Load model (thay đường dẫn tới file của bạn)
  const { nodes, materials } = useGLTF(url) as any;
  
  const [isFocused, setIsFocused] = useState(false);
  const phoneRef = useRef<THREE.Group>(null);

  // Animation camera khi click vào điện thoại (Phóng to/Thu nhỏ)
  useFrame((state) => {
    const targetPosition = isFocused 
      ? new THREE.Vector3(0, 0, 3)  // Phóng to khi focus
      : new THREE.Vector3(0, 0, 7); // Xa ra khi un-focus
      
    const targetRotation = isFocused
      ? new THREE.Euler(0, 0, 0)    // Thẳng mặt khi focus
      : new THREE.Euler(0, -Math.PI / 5, 0); // Nghiêng nhẹ khi ở chế độ xem

    // Làm mượt chuyển động của camera
    state.camera.position.lerp(targetPosition, 0.05);
    
    // Nếu không dùng PresentationControls, bạn có thể tự xoay model ở đây
    if (phoneRef.current) {
        // phoneRef.current.quaternion.slerp(new THREE.Quaternion().setFromEuler(targetRotation), 0.05);
    }
  });

  return (
    <group 
      ref={phoneRef}
      onClick={(e) => {
        e.stopPropagation();
        setIsFocused(!isFocused); // Toggle trạng thái focus
      }}
      // Cursor biến thành pointer khi hover
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = 'auto')}
      dispose={null}
    >
      {/* 
        CHÚ Ý QUAN TRỌNG: 
        Thay nodes.Body, nodes.Screen, materials... bằng tên thực tế từ file GLTF của bạn (dùng gltfjsx để xem)
      */}
      
      {/* Vỏ điện thoại */}
      <mesh geometry={nodes.Body.geometry} material={materials.BodyMaterial} />
      
      {/* Màn hình điện thoại */}
      <mesh geometry={nodes.Screen.geometry} material={materials.ScreenMaterial}>
        {/* Component Html transform chính là "phép thuật" */}
        <Html
          transform
          wrapperClass="html-screen"
          distanceFactor={1.17} // Tinh chỉnh độ scale của UI cho khớp với màn hình 3D
          position={[0, 0, 0.01]} // Đẩy nhẹ UI lên trên mặt mesh một chút để tránh z-fighting (cắt hình)
          // Tắt tương tác chuột khi chưa focus để user không click nhầm khi đang xoay model
          style={{ pointerEvents: isFocused ? 'auto' : 'none' }}
        >
          <PhoneScreenUI />
        </Html>
      </mesh>
    </group>
  );
}