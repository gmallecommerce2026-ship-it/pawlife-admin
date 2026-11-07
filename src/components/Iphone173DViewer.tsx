// components/Iphone173DViewer.tsx
'use client';

import React, { useRef, useEffect, useState, Suspense, Component, ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
    useGLTF,
    Html,
    ContactShadows,
    Environment,
    OrbitControls,
    Float,
    Center,
    useProgress,
} from '@react-three/drei';
import * as THREE from 'three';
import { Sparkles } from 'lucide-react';
import { IphoneScreenUI } from './IphoneScreenUI';
import { useIphoneSheetHandleDrag } from '@/hooks/useIphoneSheetHandleDrag';
import { useIphoneScreenDragScroll } from '@/hooks/useIphoneScreenDragScroll';

// Preload tệp mô hình 3D ngay khi file module được nạp
try {
    useGLTF.preload('/assets/images/ip-17promax.glb');
} catch (err) {
    console.warn('Preload 3D model warning:', err);
}

type ModelErrorBoundaryProps = { fallback: ReactNode; children: ReactNode };
type ModelErrorBoundaryState = { hasError: boolean };

class ModelErrorBoundary extends Component<ModelErrorBoundaryProps, ModelErrorBoundaryState> {
    constructor(props: ModelErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    render() {
        if (this.state.hasError) return this.props.fallback;
        return this.props.children;
    }
}

type DragHandlers = {
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerCancel: (e: React.PointerEvent<HTMLDivElement>) => void;
};

type PhoneModelProps = {
    pet: any;
    freezeIdle: boolean;
    sheetTop: number;
    isSheetDragging: boolean;
    isDraggingScreen: boolean;
    onScreenEnter: () => void;
    onScreenLeave: () => void;
    handleDrag: DragHandlers;
    scrollDrag: DragHandlers;
};

// Component theo dõi tiến trình tải của Three.js
function LoadingTracker({
    onProgress,
    onLoaded,
}: {
    onProgress?: (progress: number) => void;
    onLoaded?: () => void;
}) {
    const { progress, active } = useProgress();

    useEffect(() => {
        onProgress?.(progress);
        if (progress >= 100 && !active) {
            const timer = setTimeout(() => {
                onLoaded?.();
            }, 250);
            return () => clearTimeout(timer);
        }
    }, [progress, active, onProgress, onLoaded]);

    return null;
}

function GltfPhoneModel({
    pet,
    freezeIdle,
    sheetTop,
    isSheetDragging,
    isDraggingScreen,
    onScreenEnter,
    onScreenLeave,
    handleDrag,
    scrollDrag,
}: PhoneModelProps) {
    const gltf = useGLTF('/assets/images/ip-17promax.glb') as any;
    const phoneRef = useRef<THREE.Group>(null);
    const [autoScale, setAutoScale] = useState<number>(1);

    useEffect(() => {
        if (gltf?.scene) {
            const box = new THREE.Box3().setFromObject(gltf.scene);
            const size = box.getSize(new THREE.Vector3());
            const TARGET_HEIGHT = 4.75;
            if (size.y > 0) setAutoScale(TARGET_HEIGHT / size.y);
            gltf.scene.traverse((child: any) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    if (child.material) child.material.side = THREE.DoubleSide;
                }
            });
        }
    }, [gltf]);

    useFrame((state) => {
        if (!phoneRef.current || freezeIdle) return;
        phoneRef.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.8) * 0.05;
        phoneRef.current.rotation.x = Math.cos(state.clock.getElapsedTime() * 0.6) * 0.02;
    });

    return (
        <group ref={phoneRef}>
            <Center position={[0, -0.02, 0]}>
                {gltf?.scene && (
                    <primitive
                        object={gltf.scene}
                        rotation={[0, Math.PI, 0]}
                        scale={[autoScale, autoScale, autoScale]}
                    />
                )}
            </Center>
            <group position={[0, 0.37, 0.13]}>
                <Html
                    transform
                    wrapperClass={`iphone-screen-3d${isDraggingScreen ? ' is-dragging' : ''}`}
                    distanceFactor={2.4}
                    pointerEvents="auto"
                    zIndexRange={[100, 0]}
                    onPointerEnter={onScreenEnter}
                    onPointerLeave={onScreenLeave}
                    onWheel={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onTouchMove={(e) => e.stopPropagation()}
                >
                    <IphoneScreenUI
                        pet={pet}
                        sheetTop={sheetTop}
                        isSheetDragging={isSheetDragging}
                        handleDrag={handleDrag}
                        scrollDrag={scrollDrag}
                    />
                </Html>
            </group>
        </group>
    );
}

function ProceduralPhoneModel({
    pet,
    freezeIdle,
    sheetTop,
    isSheetDragging,
    isDraggingScreen,
    onScreenEnter,
    onScreenLeave,
    handleDrag,
    scrollDrag,
}: PhoneModelProps) {
    const phoneRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (!phoneRef.current || freezeIdle) return;
        phoneRef.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.8) * 0.05;
        phoneRef.current.rotation.x = Math.cos(state.clock.getElapsedTime() * 0.6) * 0.02;
    });

    return (
        <group ref={phoneRef} scale={1.15}>
            <mesh castShadow receiveShadow>
                <boxGeometry args={[2.22, 4.55, 0.28]} />
                <meshPhysicalMaterial color="#3a393d" metalness={0.85} roughness={0.2} clearcoat={1} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0.55, 1.45, -0.16]} castShadow receiveShadow>
                <boxGeometry args={[0.9, 0.9, 0.08]} />
                <meshPhysicalMaterial color="#252427" metalness={0.8} roughness={0.15} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0.35, 1.65, -0.22]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.18, 0.18, 0.06, 32]} />
                <meshPhysicalMaterial color="#050505" metalness={0.95} roughness={0.05} />
            </mesh>
            <mesh position={[0.75, 1.65, -0.22]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.18, 0.18, 0.06, 32]} />
                <meshPhysicalMaterial color="#050505" metalness={0.95} roughness={0.05} />
            </mesh>
            <mesh position={[0.55, 1.25, -0.22]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.18, 0.18, 0.06, 32]} />
                <meshPhysicalMaterial color="#050505" metalness={0.95} roughness={0.05} />
            </mesh>
            <Html
                transform
                wrapperClass={`iphone-screen-3d${isDraggingScreen ? ' is-dragging' : ''}`}
                distanceFactor={2.4}
                position={[0, -0.02, 0.55]}
                pointerEvents="auto"
                zIndexRange={[100, 0]}
                onPointerEnter={onScreenEnter}
                onScreenLeave={onScreenLeave}
                onWheel={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
            >
                <IphoneScreenUI
                    pet={pet}
                    sheetTop={sheetTop}
                    isSheetDragging={isSheetDragging}
                    handleDrag={handleDrag}
                    scrollDrag={scrollDrag}
                />
            </Html>
        </group>
    );
}

function PawVideoCursor({ x, y, visible, grabbing }: { x: number; y: number; visible: boolean; grabbing: boolean }) {
    return (
        <video
            src={grabbing ? '/assets/cursor/paw-grab.webm' : '/assets/cursor/paw-walk.webm'}
            autoPlay
            loop
            muted
            playsInline
            style={{
                position: 'fixed',
                top: y,
                left: x,
                width: 40,
                height: 40,
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
                zIndex: 9999,
                opacity: visible ? 1 : 0,
                transition: 'opacity 0.12s ease',
            }}
        />
    );
}

export default function Iphone173DViewer({ pet }: { pet: any }) {
    const [isGrabbing, setIsGrabbing] = useState(false);
    const [isOverScreen, setIsOverScreen] = useState(false);
    const [showCustomCursor, setShowCustomCursor] = useState(false);
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [isModelReady, setIsModelReady] = useState(false);

    const isOverScreenRef = useRef(false);

    // Preload toàn bộ hình ảnh của Pet và Trạm trú ẩn
    useEffect(() => {
        if (!pet) return;
        const imageUrls: string[] = [];
        if (Array.isArray(pet.images)) {
            pet.images.forEach((img: any) => {
                const url = typeof img === 'string' ? img : img?.url;
                if (url) imageUrls.push(url);
            });
        }
        if (pet.avatarUrl) imageUrls.push(pet.avatarUrl);
        if (pet.shelter?.avatarUrl) imageUrls.push(pet.shelter.avatarUrl);

        imageUrls.forEach((src) => {
            const img = new Image();
            img.src = src;
        });
    }, [pet]);

    // Timeout dự phòng
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsModelReady(true);
        }, 8000);
        return () => clearTimeout(timer);
    }, []);

    const sheetDrag = useIphoneSheetHandleDrag();
    const scrollDrag = useIphoneScreenDragScroll();

    const isInteracting = isOverScreen || sheetDrag.isDragging || scrollDrag.isDragging;

    const handleScreenEnter = () => {
        isOverScreenRef.current = true;
        setIsOverScreen(true);
    };

    const handleScreenLeave = () => {
        if (sheetDrag.isDragging || scrollDrag.isDragging) return;
        isOverScreenRef.current = false;
        setIsOverScreen(false);
    };

    const commonModelProps: PhoneModelProps = {
        pet,
        freezeIdle: isInteracting,
        sheetTop: sheetDrag.sheetTop,
        isSheetDragging: sheetDrag.isDragging || scrollDrag.isDragging,
        isDraggingScreen: sheetDrag.isDragging || scrollDrag.isDragging,
        onScreenEnter: handleScreenEnter,
        onScreenLeave: handleScreenLeave,
        handleDrag: sheetDrag,
        scrollDrag: scrollDrag,
    };

    return (
        <div
            className="iphone-3d-wrapper w-full h-full relative"
            onPointerMove={(e) => setCursorPos({ x: e.clientX, y: e.clientY })}
            onPointerEnter={() => setShowCustomCursor(true)}
            onPointerLeave={() => setShowCustomCursor(false)}
            onPointerDown={() => !isOverScreenRef.current && setIsGrabbing(true)}
            onPointerUp={() => setIsGrabbing(false)}
        >
            {/* Overlay hiển thị tiến trình tải 3D */}
            {!isModelReady && (
                <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/75 backdrop-blur-md transition-opacity duration-500 rounded-3xl">
                    <div className="relative w-16 h-16 flex items-center justify-center">
                        <div className="absolute inset-0 border-4 border-[#E89B5A]/20 rounded-full" />
                        <div className="absolute inset-0 border-4 border-[#E89B5A] border-t-transparent rounded-full animate-spin" />
                        <Sparkles className="w-6 h-6 text-[#E89B5A] animate-pulse" />
                    </div>
                    <p className="mt-4 text-sm font-semibold text-white/90 tracking-wide">
                        Đang tải mô hình 3D iPhone... {Math.round(loadingProgress)}%
                    </p>
                    <div className="w-48 h-1.5 bg-white/10 rounded-full mt-3 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-[#E89B5A] to-[#F2A465] transition-all duration-300 rounded-full"
                            style={{ width: `${Math.max(loadingProgress, 8)}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Canvas 3D mượt mà sau khi tải xong */}
            <div className={`w-full h-full transition-opacity duration-500 ${isModelReady ? 'opacity-100' : 'opacity-0'}`}>
                <Canvas camera={{ position: [0, 0, 7.5], fov: 45 }} gl={{ antialias: true, alpha: true }}>
                    <LoadingTracker
                        onProgress={(p) => setLoadingProgress(p)}
                        onLoaded={() => setIsModelReady(true)}
                    />
                    <ambientLight intensity={1.2} />
                    <directionalLight position={[10, 10, 5]} intensity={1.8} />
                    <directionalLight position={[-10, -10, 5]} intensity={0.8} />
                    <Suspense fallback={null}>
                        <Float speed={isInteracting ? 0 : 1.2} rotationIntensity={0.15} floatIntensity={0.2}>
                            <ModelErrorBoundary fallback={<ProceduralPhoneModel {...commonModelProps} />}>
                                <GltfPhoneModel {...commonModelProps} />
                            </ModelErrorBoundary>
                        </Float>
                        <Environment preset="city" />
                        <ContactShadows position={[0, -2.8, 0]} opacity={0.6} scale={10} blur={2} far={4} />
                    </Suspense>
                    <OrbitControls
                        enabled={!isOverScreen && !sheetDrag.isDragging && !scrollDrag.isDragging}
                        enableDamping
                        enableZoom={false}
                        enablePan={false}
                        minDistance={7.5}
                        maxDistance={7.5}
                        minAzimuthAngle={-Math.PI / 7}
                        maxAzimuthAngle={Math.PI / 7}
                        minPolarAngle={Math.PI / 2 - 0.2}
                        maxPolarAngle={Math.PI / 2 + 0.2}
                        rotateSpeed={0.35}
                        dampingFactor={0.08}
                    />
                </Canvas>
            </div>

            <PawVideoCursor
                x={cursorPos.x}
                y={cursorPos.y}
                visible={showCustomCursor && !isOverScreen}
                grabbing={isGrabbing}
            />
            <style jsx global>{`
                .iphone-screen-3d {
                    touch-action: none;
                }
                .iphone-screen-3d button {
                    cursor: pointer;
                }
                .iphone-screen-3d.is-dragging,
                .iphone-screen-3d.is-dragging * {
                    cursor: grabbing !important;
                }
            `}</style>
        </div>
    );
}