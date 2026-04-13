'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, MeshDistortMaterial, Float } from '@react-three/drei';
import * as THREE from 'three';

// ==========================================
// 1. O AMBIENTE 3D (A Lua e o Portal)
// ==========================================
function CenaCosmica({ stage }) {
  const moonRef = useRef();
  const portalRef = useRef();
  const cameraRef = useRef();

  useFrame((state, delta) => {
    // Rotação suave constante da lua
    if (moonRef.current) {
      moonRef.current.rotation.y += delta * 0.2;
    }

    // Efeito de Warp Jump (Abertura do Portal)
    if (stage === 'warp') {
      // A lua encolhe e desaparece
      if (moonRef.current) moonRef.current.scale.lerp(new THREE.Vector3(0, 0, 0), 0.1);
      
      // O anel de luz (portal) expande violentamente
      if (portalRef.current) {
        portalRef.current.scale.lerp(new THREE.Vector3(20, 20, 20), 0.05);
        portalRef.current.material.opacity = THREE.MathUtils.lerp(portalRef.current.material.opacity, 1, 0.1);
      }

      // A câmera mergulha para a frente
      state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, -10, 0.02);
    }
  });

  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight position={[5, 5, 5]} intensity={2} color="#D4AF37" /> {/* Luz Dourada */}
      
      <Stars radius={100} depth={50} count={7000} factor={4} saturation={0} fade speed={stage === 'warp' ? 5 : 1} />

      {/* A Lua de Obsidiana com veios dourados implícitos pela luz */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        <mesh ref={moonRef} position={[0, 0, 0]}>
          <sphereGeometry args={[1.5, 64, 64]} />
          <MeshDistortMaterial 
            color="#050505" // Obsidiana
            roughness={0.1}
            metalness={0.8}
            distort={stage === 'idle' ? 0.2 : 0.6} // Fica instável quando a dança começa
            speed={stage === 'idle' ? 2 : 6}
          />
        </mesh>
      </Float>

      {/* O Portal (Invisível no início) */}
      <mesh ref={portalRef} position={[0, 0, -2]} scale={0}>
        <ringGeometry args={[1.8, 2.0, 64]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>
    </>
  );
}

// ==========================================
// 2. O DIRETOR DA CENA (Frontend 2D + 3D)
// ==========================================
export default function IntroCinematica({ onPortalOpen }) {
  // Fases: 'idle' (esperando) -> 'dance' (Yin Yang) -> 'warp' (Portal)
  const [stage, setStage] = useState('idle'); 

  const iniciarRitual = () => {
    if (stage !== 'idle') return;
    
    setStage('dance');
    
    // Após 3 segundos de dança, abre o portal
    setTimeout(() => {
      setStage('warp');
      
      // Após 2 segundos de mergulho da câmera, avisa a página principal para mostrar os livros
      setTimeout(() => {
        if (onPortalOpen) onPortalOpen();
      }, 2000);
      
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian overflow-hidden cursor-pointer" onClick={iniciarRitual}>
      
      {/* Camada de Fundo: O Motor 3D */}
      <div className="absolute inset-0 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
          <CenaCosmica stage={stage} />
        </Canvas>
      </div>

      {/* Camada Frontal: Tipografia Editorial e Guardiões */}
      <AnimatePresence>
        {stage !== 'warp' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, filter: 'blur(10px)', scale: 1.2 }}
            transition={{ duration: 1 }}
            className="relative z-10 flex flex-col items-center justify-center w-full h-full pointer-events-none"
          >
            {/* Título de Luxo */}
            <motion.h1 
              animate={stage === 'dance' ? { y: -150, opacity: 0 } : { y: 0, opacity: 1 }}
              className="text-6xl font-serif tracking-[0.3em] text-gold uppercase mb-8"
            >
              Biblioteca Andromeda
            </motion.h1>

            {/* A Coreografia Yin-Yang dos Gatos */}
            <motion.div 
              className="absolute top-1/2 left-1/2 w-[400px] h-[400px] -mt-[200px] -ml-[200px]"
              animate={stage === 'dance' ? { rotate: 360, scale: 0.5 } : { rotate: 0, scale: 1 }}
              transition={{ duration: 2.5, ease: "easeInOut" }}
            >
              {/* Noir (Gato Preto - Sombra) */}
              <motion.div 
                className="absolute top-0 left-1/2 -ml-16 w-32 h-32 flex items-center justify-center"
                animate={stage === 'dance' ? { rotate: -360 } : {}} // Rotação reversa para o gato não ficar de cabeça para baixo
                transition={{ duration: 2.5, ease: "easeInOut" }}
              >
                {/* Substitua esta div pelo seu <RiveNoir /> */}
                <div className="w-16 h-16 bg-black rounded-full shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center justify-center text-xs text-white">Noir</div>
              </motion.div>

              {/* Luna (Gata Branca - Luz) */}
              <motion.div 
                className="absolute bottom-0 left-1/2 -ml-16 w-32 h-32 flex items-center justify-center"
                animate={stage === 'dance' ? { rotate: -360 } : {}}
                transition={{ duration: 2.5, ease: "easeInOut" }}
              >
                {/* Substitua esta div pelo seu <RiveLuna /> */}
                <div className="w-16 h-16 bg-white rounded-full shadow-[0_0_20px_rgba(212,175,55,0.4)] flex items-center justify-center text-xs text-black">Luna</div>
              </motion.div>
            </motion.div>

            {/* Instrução Inicial */}
            <motion.p 
              animate={stage === 'dance' ? { opacity: 0 } : { opacity: 0.5 }}
              className="absolute bottom-20 text-sm tracking-[0.5em] uppercase font-sans text-silver"
            >
              Clique para despertar os guardiões
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}