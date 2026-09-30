import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface HolographicCard3DProps {
  memberName?: string;
  memberId?: string;
  tier?: string;
  expiry?: string;
  className?: string;
}

export const HolographicCard3D: React.FC<HolographicCard3DProps> = ({
  memberName = 'Valued Member',
  memberId = 'PB-PLUS-2026',
  tier = 'VIP PASS',
  expiry = '12/27',
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check WebGL availability
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setWebglSupported(false);
        return;
      }
    } catch {
      setWebglSupported(false);
      return;
    }

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 230;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.z = 5.2;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = false;
    container.appendChild(renderer.domElement);

    // 2. Card Dimensions (ISO/IEC 7810 ID-1 standard ratio ~ 1.586)
    const cardWidth = 3.4;
    const cardHeight = 2.14;
    const cardDepth = 0.04;
    const geometry = new THREE.BoxGeometry(cardWidth, cardHeight, cardDepth, 1, 1, 1);

    // 3. Procedural Front Texture Canvas
    const createFrontCanvas = () => {
      const cvs = document.createElement('canvas');
      cvs.width = 1024;
      cvs.height = 646;
      const ctx = cvs.getContext('2d');
      if (!ctx) return cvs;

      // Base Gradient: Deep Obsidian & Warm Amber
      const grad = ctx.createLinearGradient(0, 0, 1024, 646);
      grad.addColorStop(0, '#1c1917');
      grad.addColorStop(0.35, '#292524');
      grad.addColorStop(0.75, '#431407');
      grad.addColorStop(1, '#18181b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 646);

      // Subtle Background Noise / Wave Lines
      ctx.strokeStyle = 'rgba(251, 146, 60, 0.12)';
      ctx.lineWidth = 2;
      for (let i = -200; i < 1200; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.bezierCurveTo(i + 150, 200, i - 100, 450, i + 80, 646);
        ctx.stroke();
      }

      // Large Paw Print Watermark in background
      ctx.fillStyle = 'rgba(249, 115, 22, 0.07)';
      ctx.beginPath();
      ctx.arc(820, 360, 130, 0, Math.PI * 2);
      ctx.arc(710, 210, 50, 0, Math.PI * 2);
      ctx.arc(800, 150, 50, 0, Math.PI * 2);
      ctx.arc(900, 170, 48, 0, Math.PI * 2);
      ctx.arc(970, 240, 45, 0, Math.PI * 2);
      ctx.fill();

      // Top Header: PetBhai Logo + Brand
      ctx.fillStyle = '#f97316';
      ctx.font = 'bold 44px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText('🐾 PetBhai', 70, 95);

      // Tier Badge Pill
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.strokeStyle = 'rgba(251, 146, 60, 0.4)';
      ctx.lineWidth = 2;
      ctx.roundRect(780, 60, 175, 50, 25);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffedd5';
      ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(tier, 868, 93);
      ctx.textAlign = 'left';

      // Golden EMV Chip
      const chipGrad = ctx.createLinearGradient(70, 160, 190, 250);
      chipGrad.addColorStop(0, '#fde047');
      chipGrad.addColorStop(0.5, '#eab308');
      chipGrad.addColorStop(1, '#ca8a04');
      ctx.fillStyle = chipGrad;
      ctx.roundRect(70, 170, 110, 85, 12);
      ctx.fill();
      ctx.strokeStyle = '#a16207';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Chip circuit details
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1;
      ctx.strokeRect(95, 170, 60, 85);
      ctx.beginPath();
      ctx.moveTo(70, 212);
      ctx.lineTo(180, 212);
      ctx.stroke();

      // Contactless wave icon
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 3;
      for (let r = 16; r <= 32; r += 8) {
        ctx.beginPath();
        ctx.arc(220, 212, r, -Math.PI / 3, Math.PI / 3);
        ctx.stroke();
      }

      // Member ID (Spaced Card Number)
      ctx.fillStyle = '#fed7aa';
      ctx.font = 'bold 36px monospace';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 4;
      ctx.fillText(memberId, 70, 390);

      // Cardholder Details Header
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#a8a29e';
      ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText('MEMBER NAME', 70, 485);
      ctx.fillText('VALID THRU', 820, 485);

      // Cardholder Name
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText(memberName.toUpperCase(), 70, 528);

      // Expiry
      ctx.font = 'bold 28px monospace';
      ctx.fillText(expiry, 820, 525);

      // VIP Golden Bottom Ribbon
      const ribbonGrad = ctx.createLinearGradient(0, 610, 1024, 646);
      ribbonGrad.addColorStop(0, '#f97316');
      ribbonGrad.addColorStop(0.5, '#fb923c');
      ribbonGrad.addColorStop(1, '#ea580c');
      ctx.fillStyle = ribbonGrad;
      ctx.fillRect(0, 620, 1024, 26);

      return cvs;
    };

    // 4. Procedural Back Texture Canvas
    const createBackCanvas = () => {
      const cvs = document.createElement('canvas');
      cvs.width = 1024;
      cvs.height = 646;
      const ctx = cvs.getContext('2d');
      if (!ctx) return cvs;

      ctx.fillStyle = '#18181b';
      ctx.fillRect(0, 0, 1024, 646);

      // Magnetic Stripe
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 80, 1024, 110);

      // Signature & Security Strip
      ctx.fillStyle = '#e7e5e4';
      ctx.fillRect(70, 240, 680, 75);

      ctx.fillStyle = '#57534e';
      ctx.font = 'italic 20px "Brush Script MT", cursive, sans-serif';
      ctx.fillText('Authorized Signature - PetBhai VIP Member', 90, 285);

      // CVV Box
      ctx.fillStyle = '#f5f5f4';
      ctx.fillRect(755, 240, 120, 75);
      ctx.fillStyle = '#1c1917';
      ctx.font = 'bold 24px monospace';
      ctx.fillText('882', 790, 288);

      // Info text
      ctx.fillStyle = '#a8a29e';
      ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText('PetBhai+ Premium Concierge: +880 1700-000000', 70, 400);
      ctx.fillText('24/7 Priority Emergency Support • Dhaka, Bangladesh', 70, 435);
      ctx.fillText('Visit www.petbhai.com/plus for digital member benefits', 70, 470);

      // Barcode
      ctx.fillStyle = '#ffffff';
      for (let x = 70; x < 950; x += Math.random() > 0.4 ? 8 : 4) {
        ctx.fillRect(x, 520, Math.random() > 0.5 ? 4 : 2, 60);
      }

      return cvs;
    };

    const frontTexture = new THREE.CanvasTexture(createFrontCanvas());
    frontTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const backTexture = new THREE.CanvasTexture(createBackCanvas());
    backTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    // Side edge material (metallic gold)
    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.9,
      roughness: 0.2,
    });

    const frontMaterial = new THREE.MeshStandardMaterial({
      map: frontTexture,
      metalness: 0.4,
      roughness: 0.25,
    });

    const backMaterial = new THREE.MeshStandardMaterial({
      map: backTexture,
      metalness: 0.4,
      roughness: 0.35,
    });

    // BoxGeometry materials order: [+X, -X, +Y, -Y, +Z (Front), -Z (Back)]
    const materials = [
      edgeMaterial,
      edgeMaterial,
      edgeMaterial,
      edgeMaterial,
      frontMaterial,
      backMaterial,
    ];

    const cardMesh = new THREE.Mesh(geometry, materials);
    scene.add(cardMesh);

    // 5. Lighting: Ambient + Dynamic Point Lights for Holographic Sheen
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff7ed, 2.2);
    keyLight.position.set(3, 4, 5);
    scene.add(keyLight);

    // Moving colored light for iridescent foil glow
    const foilLight = new THREE.PointLight(0xf97316, 3.5, 12);
    foilLight.position.set(0, 0, 3);
    scene.add(foilLight);

    const rimLight = new THREE.PointLight(0x38bdf8, 2.0, 10);
    rimLight.position.set(-3, -2, 2);
    scene.add(rimLight);

    // 6. Interaction & Tilt Physics
    let targetRotX = 0;
    let targetRotY = 0;
    let currentRotX = 0;
    let currentRotY = 0;
    let isFlipped = false;

    const handlePointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      targetRotY = (isFlipped ? Math.PI : 0) + x * 0.45;
      targetRotX = -y * 0.35;

      foilLight.position.x = x * 3;
      foilLight.position.y = y * 2;
    };

    const handlePointerLeave = () => {
      targetRotX = 0;
      targetRotY = isFlipped ? Math.PI : 0;
      foilLight.position.set(0, 0, 3);
    };

    const handleClick = () => {
      isFlipped = !isFlipped;
      targetRotY = isFlipped ? Math.PI : 0;
    };

    // Mobile DeviceOrientation (Gyroscope)
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null && e.beta !== null) {
        // gamma is left-to-right tilt in [-90, 90]
        const tiltX = Math.max(-30, Math.min(30, e.gamma)) / 30;
        // beta is front-to-back tilt in [-180, 180]
        const tiltY = (Math.max(10, Math.min(70, e.beta)) - 40) / 30;

        targetRotY = (isFlipped ? Math.PI : 0) + tiltX * 0.4;
        targetRotX = -tiltY * 0.3;
        foilLight.position.x = tiltX * 2.5;
        foilLight.position.y = -tiltY * 2;
      }
    };

    container.addEventListener('mousemove', handlePointerMove);
    container.addEventListener('mouseleave', handlePointerLeave);
    container.addEventListener('click', handleClick);

    if (
      window.DeviceOrientationEvent &&
      typeof (window.DeviceOrientationEvent as any).requestPermission !== 'function'
    ) {
      window.addEventListener('deviceorientation', handleOrientation);
    }

    // 7. Render Loop with On-Demand Visibility Check
    let animationFrameId: number;
    let isVisible = true;

    const observer = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0.1 }
    );
    observer.observe(container);

    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (!isVisible) return;

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Smooth interpolation (lerp)
      currentRotX += (targetRotX - currentRotX) * 0.1;
      currentRotY += (targetRotY - currentRotY) * 0.1;

      // Gentle floating / idle breathing
      const idleBob = Math.sin(elapsed * 1.5) * 0.04;
      const idleTilt = Math.cos(elapsed * 1.2) * 0.03;

      cardMesh.rotation.x = currentRotX + idleTilt;
      cardMesh.rotation.y = currentRotY;
      cardMesh.position.y = idleBob;

      renderer.render(scene, camera);
    };

    animate();

    // 8. Resize Handler
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth || 360;
      const newH = container.clientHeight || 230;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    // 9. Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', handlePointerMove);
      container.removeEventListener('mouseleave', handlePointerLeave);
      container.removeEventListener('click', handleClick);
      window.removeEventListener('deviceorientation', handleOrientation);
      observer.disconnect();
      cancelAnimationFrame(animationFrameId);

      geometry.dispose();
      frontTexture.dispose();
      backTexture.dispose();
      materials.forEach((m) => m.dispose());
      renderer.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [memberName, memberId, tier, expiry]);

  if (!webglSupported) {
    // 2D CSS Fallback Card
    return (
      <div
        className={`relative mx-auto w-full max-w-[380px] aspect-[1.586/1] rounded-3xl p-6 bg-gradient-to-br from-zinc-900 via-stone-900 to-amber-950 text-white shadow-2xl border border-orange-500/30 flex flex-col justify-between ${className}`}
      >
        <div className="flex justify-between items-center">
          <span className="font-extrabold text-orange-500 text-lg">🐾 PetBhai</span>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 border border-white/20">
            {tier}
          </span>
        </div>
        <div className="my-auto font-mono text-xl font-bold tracking-widest text-orange-200">
          {memberId}
        </div>
        <div className="flex justify-between items-end text-xs">
          <div>
            <p className="text-zinc-400 text-[10px]">MEMBER NAME</p>
            <p className="font-bold text-sm">{memberName}</p>
          </div>
          <div>
            <p className="text-zinc-400 text-[10px]">EXPIRES</p>
            <p className="font-bold text-sm">{expiry}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative mx-auto flex flex-col items-center justify-center cursor-pointer select-none group ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 3D Canvas Mounting Point */}
      <div
        ref={mountRef}
        className="w-full max-w-[420px] h-[250px] sm:h-[270px] touch-none flex items-center justify-center"
        aria-label="Interactive 3D VIP Membership Card"
        role="img"
      />

      {/* Interactive Helper Hint */}
      <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 opacity-80 group-hover:opacity-100 transition-opacity">
        <svg
          className="w-3.5 h-3.5 text-orange-500 animate-pulse"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
          />
        </svg>
        <span>Tilt to inspect holographic foil • Click to flip</span>
      </div>
    </div>
  );
};

export default HolographicCard3D;
