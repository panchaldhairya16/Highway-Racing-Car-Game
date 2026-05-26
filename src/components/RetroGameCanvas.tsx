/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import { Play, RotateCcw, Shield as ShieldIcon, Zap, Volume2, VolumeX, Flame, Heart } from 'lucide-react';
import { GameState, Car, Environment, Obstacle, Collectible, Particle, GameStats } from '../types';
import { AudioSynth } from '../utils/audio';

interface RetroGameCanvasProps {
  gameState: GameState;
  selectedCar: Car;
  environment: Environment;
  onGameOver: (finalScore: number, finalCoins: number, distance: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export default function RetroGameCanvas({
  gameState,
  selectedCar,
  environment,
  onGameOver,
  isMuted,
  onToggleMute
}: RetroGameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Core Game State
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [coinsCollected, setCoinsCollected] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [distState, setDistState] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [health, setHealth] = useState(100);
  const [hasShield, setHasShield] = useState(false);
  const [isNitro, setIsNitro] = useState(false);
  const [nitroFuel, setNitroFuel] = useState(100);

  // Control Keys state
  const keysPressedRef = useRef<{ [key: string]: boolean }>({});
  
  // Game Loop References
  const stateRef = useRef({
    score: 0,
    coins: 0,
    speed: 0,
    targetSpeed: 0,
    distance: 0,
    playerX: 0, // from -1.8 to 1.8 (covers the lanes, center is 0)
    playerY: 0,
    health: 100,
    hasShield: false,
    shieldTimer: 0,
    isNitro: false,
    nitroTimer: 0,
    nitroFuel: 100,
    invincibleTimer: 0,
    shake: 0,
    laneWidth: 65,
    roadOffsetY: 0,
    obstacles: [] as Obstacle[],
    collectibles: [] as Collectible[],
    particles: [] as Particle[],
    roadCurves: 0 as number,
    targetCurve: 0 as number,
    curveChangeTimer: 0,
    environmentIndex: 0,
    frameIndex: 0,
    lastObstacleSpawn: 0,
    lastCollectibleSpawn: 0,
    gameDifficulty: 1.0,
    totalDistance: 0,
    isCrashActive: false,
    crashCooldown: 0
  });

  // Track the actual active status
  useEffect(() => {
    stateRef.current.hasShield = selectedCar.id === 'beast'; // Interceptor starts with free shield
    setHasShield(selectedCar.id === 'beast');
  }, [selectedCar]);

  // Synchronize dynamic status
  useEffect(() => {
    // Reset state on restart
    if (gameState === 'PLAYING') {
      setIsPlaying(true);
      setScore(0);
      setCoinsCollected(0);
      setSpeed(0);
      setDistState(0);
      setMultiplier(1);
      setHealth(100);
      setHasShield(selectedCar.id === 'beast');
      setIsNitro(false);
      setNitroFuel(100);

      stateRef.current = {
        score: 0,
        coins: 0,
        speed: 0,
        targetSpeed: 0,
        distance: 0,
        playerX: 0,
        playerY: 0,
        health: 100,
        hasShield: selectedCar.id === 'beast',
        shieldTimer: 0,
        isNitro: false,
        nitroTimer: 0,
        nitroFuel: 100,
        invincibleTimer: 0,
        shake: 0,
        laneWidth: 65,
        roadOffsetY: 0,
        obstacles: [],
        collectibles: [],
        particles: [],
        roadCurves: 0,
        targetCurve: 0,
        curveChangeTimer: 0,
        environmentIndex: 0,
        frameIndex: 0,
        lastObstacleSpawn: 0,
        lastCollectibleSpawn: 0,
        gameDifficulty: 1.0 * environment.difficultyMultiplier,
        totalDistance: 0,
        isCrashActive: false,
        crashCooldown: 0
      };

      // Ensure audio engine starts up
      AudioSynth.startEngine();
      AudioSynth.playMusic();
    } else {
      setIsPlaying(false);
      AudioSynth.stopEngine();
      AudioSynth.stopMusic();
    }
  }, [gameState, selectedCar, environment]);

  // Key Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressedRef.current[e.key.toLowerCase()] = true;
      keysPressedRef.current[e.code.toLowerCase()] = true;

      // Start engine sound on first keyboard interaction
      if (gameState === 'PLAYING') {
        AudioSynth.startEngine();
        AudioSynth.playMusic();
      }

      // Quick boost trigger using space or shift
      if (e.key === ' ' || e.key === 'Shift') {
        e.preventDefault();
        triggerNitroBoost();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressedRef.current[e.key.toLowerCase()] = false;
      keysPressedRef.current[e.code.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  const triggerNitroBoost = () => {
    const s = stateRef.current;
    if (s.isNitro || s.nitroFuel < 20 || s.isCrashActive) return;
    s.isNitro = true;
    s.nitroTimer = 180; // 3 seconds at 60fps
    setIsNitro(true);
    s.shake = 15;
    AudioSynth.playNitro();
    
    // Add fiery boost particles
    for (let i = 0; i < 30; i++) {
      createExhaustParticles(0, 150, true);
    }
  };

  // On-screen Touch Controls Helper
  const handleOnScreenSteer = (direction: 'left' | 'right' | 'boost' | 'brake', isActive: boolean) => {
    keysPressedRef.current[direction] = isActive;
    if (gameState === 'PLAYING') {
      AudioSynth.startEngine();
      AudioSynth.playMusic();
    }
    if (direction === 'boost' && isActive) {
      triggerNitroBoost();
    }
  };

  // Create customized visual particles
  const createBlastParticles = (x: number, y: number, color: string, count = 12) => {
    const particles = stateRef.current.particles;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 3 + Math.random() * 4,
        life: 0,
        maxLife: 20 + Math.random() * 20,
        alpha: 1
      });
    }
  };

  const createExhaustParticles = (x: number, y: number, isSuperBurn = false) => {
    const s = stateRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Convert relative coordinates of rear wheels to canvas units
    const screenX = canvas.width / 2 + s.playerX * s.laneWidth;
    const screenY = canvas.height - 130;

    const particles = s.particles;
    const count = isSuperBurn ? 4 : 1;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: screenX + (Math.random() * 16 - 8),
        y: screenY,
        vx: (Math.random() * 2 - 1) - (s.roadCurves * 1.5), // drift slightly based on turn
        vy: 3 + Math.random() * 5 + (s.speed * 0.2), // shoot backwards relative to speed
        color: isSuperBurn 
          ? `hsla(${180 + Math.random() * 40}, 100%, 70%, 1)` // Cyber cyan flames
          : `rgba(255, ${100 + Math.random() * 100}, 0, 0.6)`, // Yellow/orange spark lines
        size: isSuperBurn ? 4 + Math.random() * 4 : 2 + Math.random() * 3,
        life: 0,
        maxLife: isSuperBurn ? 15 + Math.random() * 15 : 10 + Math.random() * 10,
        alpha: 0.9
      });
    }
  };

  // Core Simulation and Render Thread
  useEffect(() => {
    if (!isPlaying) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high-DPI scaling
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    let animationId: number;

    const gameLoop = () => {
      const w = rect.width;
      const h = rect.height;
      
      const s = stateRef.current;
      s.frameIndex++;

      // Clear Screen with beautiful ambient neon sky
      ctx.fillStyle = environment.skyColor;
      ctx.fillRect(0, 0, w, h);

      // Handle custom Screen Shake effect
      ctx.save();
      if (s.shake > 0.2) {
        const shakeX = (Math.random() * 2 - 1) * s.shake;
        const shakeY = (Math.random() * 2 - 1) * s.shake;
        ctx.translate(shakeX, shakeY);
        s.shake *= 0.9; // decay
      }

      // --- 1. Draw Parallax Background (Sky details, Moon, Neon Mountains) ---
      drawBackground(ctx, w, h, s.roadCurves, s.frameIndex);

      // --- 2. Physics & Controls Updates ---
      updateControls(s);
      updateSpeed(s);
      updateCollisions(s, w, h);
      updateEntities(s, w, h);

      // --- 3. Render 3D Perspective Road & Markings ---
      drawRoad(ctx, w, h, s);

      // --- 4. Render Entities (Collectibles & Traffic Cars) ---
      drawCollectibles(ctx, s, h);
      drawObstacles(ctx, s, h);

      // --- 5. Render Glowing Dynamic Particles ---
      drawParticles(ctx, s);

      // --- 6. Render Player customizable Vehicle ---
      drawPlayerCar(ctx, w, h, s);

      // --- 7. Draw Visual FX Overlay (Nitro glows, Crash Flashes, HUD speed lines) ---
      drawVisualOverlays(ctx, w, h, s);

      // Restore Screen Shake transform
      ctx.restore();

      // --- 8. Sync metrics to React UI to update HUD gauges in real-time ---
      if (s.frameIndex % 3 === 0) {
        setScore(Math.floor(s.score));
        setCoinsCollected(s.coins);
        setSpeed(Math.floor(s.speed * 12)); // Scaled to "km/h"
        setDistState(Math.floor(s.totalDistance / 10));
        setMultiplier(s.isNitro ? 3 : (1 + Math.floor(s.speed / 4)));
        setHealth(s.health);
        setHasShield(s.hasShield);
        setIsNitro(s.isNitro);
        setNitroFuel(Math.floor(s.nitroFuel));
      }

      // Continuous Game Over Check
      if (s.health <= 0) {
        AudioSynth.stopEngine();
        AudioSynth.stopMusic();
        AudioSynth.playCrash();
        onGameOver(Math.floor(s.score), s.coins, Math.floor(s.totalDistance / 10));
        setIsPlaying(false);
        return;
      }

      animationId = requestAnimationFrame(gameLoop);
    };

    // Begin looping
    animationId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isPlaying, environment, selectedCar]);

  // Handle Resize correctly conforming to guidelines
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Control steering actions smoothly
  const updateControls = (s: any) => {
    const kp = keysPressedRef.current;
    
    // Steering
    let steerDir = 0;
    if (kp['a'] || kp['arrowleft'] || kp['left']) {
      steerDir = -1;
    } else if (kp['d'] || kp['arrowright'] || kp['right']) {
      steerDir = 1;
    }

    // Apply smooth handling movement & limit x range
    const steerSpeed = selectedCar.handling * (0.6 + (s.speed * 0.04));
    s.playerX += steerDir * steerSpeed;
    s.playerX = Math.max(-1.9, Math.min(1.9, s.playerX));

    // Handle background road bending/curvature parallax
    s.curveChangeTimer--;
    if (s.curveChangeTimer <= 0) {
      s.targetCurve = (Math.random() * 2 - 1) * 1.5; // New curve angle
      s.curveChangeTimer = 180 + Math.random() * 150; // hold for 3-5 seconds
    }
    // Interpolate curves smoothly
    s.roadCurves += (s.targetCurve - s.roadCurves) * 0.015;
  };

  // Speed mechanics handling
  const updateSpeed = (s: any) => {
    const kp = keysPressedRef.current;
    
    // Auto or Manual Accelerator control
    let isBraking = kp['s'] || kp['arrowdown'] || kp['brake'];
    let isAccelerating = kp['w'] || kp['arrowup'] || kp['boost'] || !isBraking; // constant acceleration

    if (s.isCrashActive) {
      s.targetSpeed = 0;
      s.speed += (0 - s.speed) * 0.15; // sudden brake
      return;
    }

    // Determine target speed benchmark based on current powerups
    if (s.isNitro) {
      s.targetSpeed = selectedCar.maxSpeed * 1.55;
      s.nitroTimer--;
      s.nitroFuel = Math.max(0, s.nitroFuel - 0.55); // Burn fuel
      if (s.nitroTimer <= 0 || s.nitroFuel <= 0) {
        s.isNitro = false;
        setIsNitro(false);
      }
      // Add thrust fire particles
      if (s.frameIndex % 2 === 0) {
        createExhaustParticles(0, 0, true);
      }
    } else {
      // Normal driving
      if (isBraking) {
        s.targetSpeed = selectedCar.maxSpeed * 0.18; // decelerate to crawl
        s.speed += (s.targetSpeed - s.speed) * 0.12;
      } else if (isAccelerating) {
        s.targetSpeed = selectedCar.maxSpeed;
        const accelRate = selectedCar.acceleration * s.gameDifficulty;
        s.speed += (s.targetSpeed - s.speed) * accelRate;
      }

      // Recharge nitro fuel of vehicle when not boosting
      if (s.nitroFuel < 100 && s.frameIndex % 4 === 0) {
        s.nitroFuel = Math.min(100, s.nitroFuel + 0.35);
      }
    }

    // Accumulate total running distances and score
    s.totalDistance += s.speed;
    const basePts = (s.speed * 0.1) * (s.isNitro ? 3 : 1) * s.gameDifficulty;
    s.score += basePts;

    // Tick down invinvible phase
    if (s.invincibleTimer > 0) s.invincibleTimer--;
    if (s.crashCooldown > 0) s.crashCooldown--;

    // Update ongoing engine frequency pitch based on relative speed
    const relativePercent = s.speed / (selectedCar.maxSpeed * 1.5);
    AudioSynth.updateEngine(isNaN(relativePercent) ? 0 : relativePercent);
  };

  // Handle entity movements (scrolling down path)
  const updateEntities = (s: any, w: number, h: number) => {
    // 1. Particle Systems updates
    s.particles = s.particles.filter((p: Particle) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life++;
      p.alpha = 1 - (p.life / p.maxLife);
      return p.life < p.maxLife;
    });

    // Ambient Rain/Weather details
    if (environment.ambientParticles === 'RAIN' && s.frameIndex % 2 === 0 && s.speed > 2) {
      s.particles.push({
        x: Math.random() * w,
        y: 0,
        vx: -2 - (s.roadCurves * 3),
        vy: 12 + Math.random() * 5 + (s.speed * 0.4),
        color: 'rgba(150, 180, 255, 0.45)',
        size: 1 + Math.random() * 2,
        life: 0,
        maxLife: 45,
        alpha: 0.6
      });
    } else if (environment.ambientParticles === 'SUN_DUST' && s.frameIndex % 3 === 0) {
      s.particles.push({
        x: Math.random() * w, 
        y: 0,
        vx: -1 + Math.random() * 2 - (s.roadCurves * 1.2),
        vy: 1 + Math.random() * 2 + (s.speed * 0.05),
        color: 'rgba(255, 220, 120, 0.25)',
        size: 2 + Math.random() * 3,
        life: 0,
        maxLife: 120,
        alpha: 0.5
      });
    } else if (environment.ambientParticles === 'GRID_STARS' && s.frameIndex % 4 === 0) {
      s.particles.push({
        x: Math.random() * w,
        y: 0,
        vx: -s.roadCurves * 2,
        vy: 1.5 + (s.speed * 0.05),
        color: environment.accentColor,
        size: 1.5,
        life: 0,
        maxLife: 150,
        alpha: 0.8
      });
    }

    // Scroll offset of visual lines
    s.roadOffsetY = (s.roadOffsetY + s.speed) % 80;

    // --- 2. Spawners logic with scaling difficulty ---
    const spawnMultiplier = 1.0 - (Math.min(s.totalDistance / 24000, 0.4)); // gets shorter over time
    const minSpawnDelay = 35 * spawnMultiplier;

    if (s.totalDistance - s.lastObstacleSpawn > 320 && s.obstacles.length < 5) {
      if (Math.random() < 0.35) {
        spawnObstacle(s);
        s.lastObstacleSpawn = s.totalDistance;
      }
    }

    if (s.totalDistance - s.lastCollectibleSpawn > 220 && s.collectibles.length < 4) {
      if (Math.random() < 0.45) {
        spawnCollectible(s);
        s.lastCollectibleSpawn = s.totalDistance;
      }
    }

    // 3. Move Traffic Cars down relative to camera/player speed
    s.obstacles = s.obstacles.filter((obs: Obstacle) => {
      // Net relative speed. If boosting, lane traffic moves down faster!
      const relativeSpeed = s.speed - obs.speed;
      obs.y += relativeSpeed;

      // Realtime lane switching AI logic for Police and aggressive sports cars
      if (obs.type === 'POLICE' && s.frameIndex % 20 === 0 && Math.random() < 0.18 && !obs.laneChanging) {
        // police attempts to target player lane
        const targetLane = Math.min(3, Math.max(0, Math.floor((s.playerX + 2) * 1)));
        if (targetLane !== obs.lane) {
          obs.laneChanging = true;
          obs.changeTargetLane = targetLane;
          obs.changeTimer = 30; // 30 frames transition
        }
      }

      // Smooth custom lane changes
      if (obs.laneChanging && obs.changeTargetLane !== undefined) {
        obs.changeTimer = (obs.changeTimer || 0) - 1;
        const targetX = obs.changeTargetLane;
        obs.x += (targetX - obs.lane) * 0.04;
        
        if (obs.changeTimer <= 0) {
          obs.lane = obs.changeTargetLane;
          obs.laneChanging = false;
        }
      }

      // bounds checking
      return obs.y < h + 150 && obs.y > -200;
    });

    // 4. Move Collectibles down
    s.collectibles = s.collectibles.filter((item: Collectible) => {
      item.y += s.speed;
      item.pulseScale = 1 + Math.sin(s.frameIndex * 0.15) * 0.08;
      return item.y < h + 100 && !item.collected;
    });
  };

  const spawnObstacle = (s: any) => {
    const lane = Math.floor(Math.random() * 4); // 4 lanes total (0, 1, 2, 3)
    const y = -140; // start off-screen top

    // Car types roster
    const types: ('PASSENGER' | 'TRUCK' | 'SPORTS' | 'POLICE')[] = ['PASSENGER', 'SPORTS', 'TRUCK', 'POLICE'];
    const chosenType = types[Math.floor(Math.random() * types.length)];

    let speedVal = 4 + Math.random() * 2.5; // speeds range
    let col = '#00f2fe';

    switch (chosenType) {
      case 'SPORTS':
        speedVal = 6 + Math.random() * 2;
        col = '#f9d976';
        break;
      case 'TRUCK':
        speedVal = 3 + Math.random() * 1.5;
        col = '#4facfe';
        break;
      case 'POLICE':
        speedVal = 5 + Math.random() * 2.5;
        col = '#ff003c';
        break;
      default:
        col = '#e0c3fc';
    }

    s.obstacles.push({
      id: `obs_${s.frameIndex}`,
      x: lane, // lane coordinates handled dynamically below
      y,
      lane,
      speed: speedVal,
      width: 44,
      height: 78,
      color: col,
      type: chosenType
    });
  };

  const spawnCollectible = (s: any) => {
    const lane = Math.floor(Math.random() * 4);
    const y = -100;

    // Distribute weights of items spawning
    const roll = Math.random();
    let type: 'COIN' | 'NITRO' | 'SHIELD' | 'REPAIR' = 'COIN';
    
    if (roll < 0.65) {
      type = 'COIN';
    } else if (roll < 0.80) {
      type = 'NITRO';
    } else if (roll < 0.92) {
      type = 'REPAIR';
    } else {
      type = 'SHIELD';
    }

    s.collectibles.push({
      id: `coll_${s.frameIndex}`,
      x: lane,
      y,
      lane,
      width: 28,
      height: 28,
      type,
      collected: false,
      pulseScale: 1.0
    });
  };

  // Collision calculation models
  const updateCollisions = (s: any, w: number, h: number) => {
    if (s.isCrashActive) return;

    // Define player's bounding box relative to central road
    const playerWidth = 46;
    const playerHeight = 84;
    const px = w / 2 + s.playerX * s.laneWidth;
    const py = h - 130;  // static bottom offset

    // Define collection magnet coefficient based on Active Car Perk
    const isMagnetic = selectedCar.perk.includes('Magnetic');
    const attractionDistance = isMagnetic ? 75 : 45;

    // --- 1. Collectibles collision check ---
    s.collectibles.forEach((item: Collectible) => {
      // Convert lane index to absolute canvas X coordinates
      const collX = w / 2 + (item.x - 1.5) * s.laneWidth;
      
      // Compute Euclidian Distance
      const dx = px - collX;
      const dy = py - item.y;
      const distanceToPlayer = Math.sqrt(dx * dx + dy * dy);

      // Active Magnet attraction effect towards player
      if (isMagnetic && distanceToPlayer <= 120 && !item.collected) {
        const speedMagnet = 4.5 + (s.speed * 0.15);
        item.x += (s.playerX + 1.5 - item.x) * 0.16; // pull coordinate smoothly
        item.y += (py - item.y) * 0.16;
      }

      if (distanceToPlayer < attractionDistance && !item.collected) {
        item.collected = true;

        if (item.type === 'COIN') {
          s.coins += 1;
          s.score += 80 * s.gameDifficulty;
          AudioSynth.playCoin();
          createBlastParticles(collX, item.y, '#ffd700', 8);
        } else if (item.type === 'NITRO') {
          s.nitroFuel = Math.min(100, s.nitroFuel + 35);
          s.score += 150;
          AudioSynth.playNitro();
          createBlastParticles(collX, item.y, '#00f3ff', 8);
        } else if (item.type === 'SHIELD') {
          s.hasShield = true;
          AudioSynth.playShield();
          createBlastParticles(collX, item.y, '#bd00ff', 12);
        } else if (item.type === 'REPAIR') {
          s.health = Math.min(100, s.health + 25);
          AudioSynth.playRepair();
          createBlastParticles(collX, item.y, '#39ff14', 10);
        }
      }
    });

    // --- 2. Traffic Obstacles Collision check ---
    s.obstacles.forEach((obs: Obstacle) => {
      const obsX = w / 2 + (obs.x - 1.5) * s.laneWidth;

      // Tight bounding boxes for car crashes
      const horizontalSafetyMargin = 12;
      const verticalSafetyMargin = 16;

      const playerLeft = px - playerWidth / 2 + horizontalSafetyMargin;
      const playerRight = px + playerWidth / 2 - horizontalSafetyMargin;
      const playerTop = py - playerHeight / 2 + verticalSafetyMargin;
      const playerBottom = py + playerHeight / 2 - verticalSafetyMargin;

      const obsLeft = obsX - obs.width / 2 + horizontalSafetyMargin;
      const obsRight = obsX + obs.width / 2 - horizontalSafetyMargin;
      const obsTop = obs.y - obs.height / 2 + verticalSafetyMargin;
      const obsBottom = obs.y + obs.height / 2 - verticalSafetyMargin;

      const keysOverlapping = 
        playerRight > obsLeft && 
        playerLeft < obsRight && 
        playerBottom > obsTop && 
        playerTop < obsBottom;

      if (keysOverlapping) {
        // Crash scenario!
        if (s.isNitro) {
          // If Nitro is active: player is invincible and blows up traffic obstacles!
          createBlastParticles(obsX, obs.y, '#ff003c', 20);
          AudioSynth.playCrash();
          s.score += 300; // Extra drift hit reward
          s.shake = 18;
          // Filter out blown up car from highway list
          s.obstacles = s.obstacles.filter((o: Obstacle) => o.id !== obs.id);
          return;
        }

        // Check active temporary invicibility frames
        if (s.invincibleTimer > 0) return;

        if (s.hasShield) {
          // Consume shield to block the damage and send back the vehicle
          s.hasShield = false;
          s.invincibleTimer = 90; // invincibility frame safety cushion
          s.shake = 14;
          AudioSynth.playCrash();
          createBlastParticles(obsX, obs.y, '#bd00ff', 24);
          obs.y -= 200; // bounce it back
          return;
        }

        // Standard direct health depletion crash
        s.health = Math.max(0, s.health - 34); // takes roughly 3 strikes to die
        s.isCrashActive = true;
        s.shake = 22;
        AudioSynth.playCrash();
        createBlastParticles(px, py, '#ffffff', 30);
        createBlastParticles(px, py, selectedCar.color, 15);

        // Slow player down completely and trigger red visual cooldown
        setTimeout(() => {
          s.isCrashActive = false;
          s.invincibleTimer = 120; // 2 seconds flashing period
        }, 900);
      }
    });
  };

  // --- RENDERING ROUTINES ---

  // Dynamic parallax skies, planetary grids, or rotating suns
  const drawBackground = (ctx: CanvasRenderingContext2D, w: number, h: number, roadCurve: number, frame: number) => {
    // Horizon division line
    const horizonY = h * 0.38;

    // Accent background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, horizonY);
    gradient.addColorStop(0, environment.skyColor);
    gradient.addColorStop(0.7, environment.horizonColor);
    gradient.addColorStop(1, environment.roadColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, horizonY);

    // Render Neon Grid Sun / Wireframe moon in background
    if (environment.id === 'NEON_CITY') {
      // Cyber moon or futuristic neon skyline silhouettes
      ctx.save();
      ctx.shadowBlur = 18;
      ctx.shadowColor = '#bd00ff';
      ctx.fillStyle = 'rgba(189, 0, 255, 0.15)';
      ctx.beginPath();
      // Drift horizon offset slightly based on curve steer direction
      const sunX = w * 0.5 - (roadCurve * 45); 
      ctx.arc(sunX, horizonY - 40, 60, 0, Math.PI, true);
      ctx.fill();
      ctx.restore();

      // Cyber retro horizontal scanlines on the moon
      ctx.fillStyle = environment.skyColor;
      for (let sy = horizonY - 100; sy < horizonY - 40; sy += 8) {
        ctx.fillRect(w * 0.5 - 110 - (roadCurve * 45), sy, 220, 3);
      }
    } else if (environment.id === 'SUNSET_DESERT') {
      // Big retro neon layered sun
      const sunX = w * 0.5 - (roadCurve * 45);
      const sunY = horizonY - 10;
      const baseRadius = 75;

      ctx.fillStyle = '#ff3366';
      ctx.beginPath();
      ctx.arc(sunX, sunY, baseRadius, Math.PI, 0, false);
      ctx.fill();

      // Draw horizontal striping sunset lines
      ctx.fillStyle = environment.skyColor;
      for (let i = 0; i < 9; i++) {
        const stripeY = sunY - (i * 7) - 3;
        const thickness = 1.5 + (i * 0.65);
        ctx.fillRect(sunX - 100, stripeY, 200, thickness);
      }

      // Desert distant wireframe mountains
      ctx.strokeStyle = '#ff5e36';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      ctx.lineTo(w * 0.25 - (roadCurve * 30), horizonY - 30);
      ctx.lineTo(w * 0.45 - (roadCurve * 30), horizonY);
      ctx.lineTo(w * 0.68 - (roadCurve * 30), horizonY - 50);
      ctx.lineTo(w * 0.85 - (roadCurve * 30), horizonY);
      ctx.stroke();
    } else if (environment.id === 'OUTRUN_GRID') {
      // Starry digital sky
      ctx.fillStyle = 'rgba(0, 255, 204, 0.04)';
      ctx.beginPath();
      ctx.ellipse(w / 2 - (roadCurve * 40), horizonY - 20, 150, 40, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // Render the scrolling infinite highway road
  const drawRoad = (ctx: CanvasRenderingContext2D, w: number, h: number, s: any) => {
    const horizonY = h * 0.38;
    const roadY = horizonY;

    // Background scrolling lane lines
    const sideLinesCount = 30;
    
    // Draw outer green/cyber perspective grid floor
    ctx.fillStyle = environment.roadColor;
    ctx.fillRect(0, horizonY, w, h - horizonY);

    // Draw grid tracks under cybergrid theme
    if (environment.id === 'OUTRUN_GRID') {
      ctx.strokeStyle = 'rgba(0, 255, 204, 0.12)';
      ctx.lineWidth = 1;
      const gridLines = 24;
      for (let i = 0; i < gridLines; i++) {
        const xOffset = (w / gridLines) * i - (s.roadCurves * 30);
        ctx.beginPath();
        ctx.moveTo(xOffset, h);
        ctx.lineTo(w / 2 + (i - gridLines/2) * 5, horizonY);
        ctx.stroke();
      }
    }

    // Render road base asphalt bed with perspective tapering
    ctx.fillStyle = 'rgba(10, 5, 20, 0.95)';
    ctx.beginPath();
    ctx.moveTo(w * 0.5 - 40, horizonY);
    ctx.lineTo(w * 0.5 + 40, horizonY);
    ctx.lineTo(w * 0.5 + 230, h);
    ctx.lineTo(w * 0.5 - 230, h);
    ctx.closePath();
    ctx.fill();

    // Road glowing borders
    ctx.strokeStyle = environment.accentColor;
    ctx.lineWidth = 3.5;
    ctx.shadowBlur = 8;
    ctx.shadowColor = environment.accentColor;
    
    // Left border
    ctx.beginPath();
    ctx.moveTo(w * 0.5 - 40 - (s.roadCurves * 15), horizonY);
    ctx.quadraticCurveTo(w * 0.5 - 100 - (s.roadCurves * 60), h - (h-horizonY)*0.4, w * 0.5 - 230, h);
    ctx.stroke();

    // Right border
    ctx.beginPath();
    ctx.moveTo(w * 0.5 + 40 - (s.roadCurves * 15), horizonY);
    ctx.quadraticCurveTo(w * 0.5 + 100 - (s.roadCurves * 60), h - (h-horizonY)*0.4, w * 0.5 + 230, h);
    ctx.stroke();

    ctx.shadowBlur = 0; // reset glow

    // Draw scrolling dashed lane indicators
    ctx.strokeStyle = environment.laneColor;
    ctx.lineWidth = 2;
    
    const linesToDraw = 12;
    for (let i = 0; i < linesToDraw; i++) {
      // Pseudo-3D perspective projection scaling coefficients
      const screenPos = (i * 80 + s.roadOffsetY) % (h - horizonY);
      const ratio = screenPos / (h - horizonY); // from 0 (top horizon) to 1 (bottom screen)
      
      const segmentY = horizonY + ratio * (h - horizonY);
      const segmentWidth = 1 + ratio * 6; // lines get chunkier close to viewer
      const currentRoadWidth = 80 + ratio * 380; // road spreads out down the screen

      ctx.fillStyle = environment.laneColor;

      // Render 3 internal lines to split lanes 0, 1, 2, 3
      for (let laneIdx = 1; laneIdx <= 3; laneIdx++) {
        // Find x offset relative to centered lane division
        const relativeLaneCenter = (laneIdx / 4) - 0.5;
        const laneX = w / 2 + relativeLaneCenter * currentRoadWidth - (s.roadCurves * (1 - ratio) * 45);
        
        ctx.fillRect(
          laneX - segmentWidth / 2, 
          segmentY, 
          segmentWidth, 
          8 + ratio * 18 // lines get longer
        );
      }
    }
  };

  // Render player car with stunning glow trails, indicators and damage states
  const drawPlayerCar = (ctx: CanvasRenderingContext2D, w: number, h: number, s: any) => {
    // Flash transparently during invincible cushion
    if (s.invincibleTimer > 0 && Math.floor(s.frameIndex / 6) % 2 === 0) {
      return;
    }

    // Lane X mapping
    const px = w / 2 + s.playerX * s.laneWidth;
    const py = h - 130;

    const carW = 46;
    const carH = 84;

    ctx.save();
    ctx.translate(px, py);

    // Apply slight tilting rotation angle when steering hard or turning
    const steerOffset = keysPressedRef.current['a'] || keysPressedRef.current['arrowleft'] || keysPressedRef.current['left']
      ? -0.05
      : (keysPressedRef.current['d'] || keysPressedRef.current['arrowright'] || keysPressedRef.current['right'] ? 0.05 : 0);
    ctx.rotate(steerOffset);

    // 1. Drawing Tyre Tracks and glowing exhaust heat
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(-carW/2 - 2, carH/2 - 24, 7, 18); // rear left wheel
    ctx.fillRect(carW/2 - 5, carH/2 - 24, 7, 18);  // rear right
    ctx.fillRect(-carW/2 - 2, -carH/2 + 10, 7, 15); // front left
    ctx.fillRect(carW/2 - 5, -carH/2 + 10, 7, 15);  // front right

    // 2. Main Car body composite chassis
    ctx.fillStyle = selectedCar.color;
    ctx.beginPath();
    ctx.moveTo(-carW/2 + 6, -carH/2 + 12);
    ctx.lineTo(carW/2 - 6, -carH/2 + 12);
    ctx.lineTo(carW/2, -carH/2 + 25);
    ctx.lineTo(carW/2, carH/2 - 10);
    ctx.lineTo(-carW/2, carH/2 - 10);
    ctx.closePath();
    ctx.fill();

    // Secondary colored stripes / design elements
    ctx.fillStyle = selectedCar.secondaryColor;
    ctx.fillRect(-carW/2 + 13, -carH/2 + 30, 4, carH - 45);
    ctx.fillRect(carW/2 - 17, -carH/2 + 30, 4, carH - 45);

    // 3. Cabin glass / Windshield
    ctx.fillStyle = 'rgba(10, 15, 30, 0.85)';
    ctx.strokeStyle = selectedCar.secondaryColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-carW/2 + 10, -carH/2 + 42);
    ctx.lineTo(carW/2 - 10, -carH/2 + 42);
    ctx.lineTo(carW/2 - 13, -carH/2 + 65);
    ctx.lineTo(-carW/2 + 13, -carH/2 + 65);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 4. Taillights and Headlights indicators
    ctx.fillStyle = s.speed > 5 ? '#ff253a' : '#aa0010'; // Brake lights get brighter when slowing
    ctx.fillRect(-carW/2 + 4, carH/2 - 12, 8, 4);
    ctx.fillRect(carW/2 - 12, carH/2 - 12, 8, 4);

    // Glowing front beams
    ctx.fillStyle = '#ffffe0';
    ctx.fillRect(-carW/2 + 5, -carH/2 + 8, 5, 4);
    ctx.fillRect(carW/2 - 10, -carH/2 + 8, 5, 4);

    // Headlight volume triangles projecting forward
    ctx.fillStyle = 'rgba(255, 255, 220, 0.12)';
    ctx.beginPath();
    ctx.moveTo(-carW/2 + 7, -carH/2 + 8);
    ctx.lineTo(-carW/2 - 55, -carH/2 - 400);
    ctx.lineTo(-carW/2 + 75, -carH/2 - 400);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 220, 0.12)';
    ctx.beginPath();
    ctx.moveTo(carW/2 - 7, -carH/2 + 8);
    ctx.lineTo(carW/2 - 75, -carH/2 - 400);
    ctx.lineTo(carW/2 + 55, -carH/2 - 400);
    ctx.closePath();
    ctx.fill();

    // 5. Spoiling spoiler bar
    ctx.fillStyle = '#0f0f12';
    ctx.fillRect(-carW/2 - 3, carH/2 - 7, carW + 6, 6);

    // 6. Active Energy Shield Bubble FX
    if (s.hasShield) {
      ctx.save();
      ctx.strokeStyle = '#bd00ff';
      ctx.shadowColor = '#bd00ff';
      ctx.shadowBlur = 12;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, carH * 0.58, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 7. Fire exhaust flames when Boosting
    if (s.isNitro) {
      ctx.fillStyle = '#00f7ff';
      const flameH = 20 + Math.random() * 25;
      ctx.beginPath();
      ctx.moveTo(-10, carH/2 - 6);
      ctx.lineTo(0, carH/2 - 6 + flameH);
      ctx.lineTo(10, carH/2 - 6);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  };

  // Render obstacles / Traffic Cars with detailed body graphics
  const drawObstacles = (ctx: CanvasRenderingContext2D, s: any, screenH: number) => {
    s.obstacles.forEach((obs: Obstacle) => {
      // Horizon curve offset index calculation
      const obsRatio = obs.y / screenH;
      const horizontalOffset = s.roadCurves * (1 - obsRatio) * 45;

      // Absolute X location mapped
      const obsX = (canvasRef.current!.width / window.devicePixelRatio) / 2 + (obs.x - 1.5) * s.laneWidth - horizontalOffset;

      ctx.save();
      ctx.translate(obsX, obs.y);

      // Tyre blocks
      ctx.fillStyle = '#1c1b1c';
      ctx.fillRect(-obs.width/2 - 1, obs.height/2 - 20, 5, 14);
      ctx.fillRect(obs.width/2 - 4, obs.height/2 - 20, 5, 14);
      ctx.fillRect(-obs.width/2 - 1, -obs.height/2 + 10, 5, 12);
      ctx.fillRect(obs.width/2 - 4, -obs.height/2 + 10, 5, 12);

      // Chassis body drawing
      ctx.fillStyle = obs.color;
      ctx.beginPath();
      ctx.moveTo(-obs.width/2 + 4, -obs.height/2 + 10);
      ctx.lineTo(obs.width/2 - 4, -obs.height/2 + 10);
      ctx.lineTo(obs.width/2, -obs.height/2 + 20);
      ctx.lineTo(obs.width/2, obs.height/2 - 8);
      ctx.lineTo(-obs.width/2, obs.height/2 - 8);
      ctx.closePath();
      ctx.fill();

      // Windshield glass
      ctx.fillStyle = 'rgba(20, 25, 40, 0.82)';
      ctx.fillRect(-obs.width/2 + 7, -obs.height/2 + 30, obs.width - 14, 18);

      // Taillights
      ctx.fillStyle = '#ff2b2b';
      ctx.fillRect(-obs.width/2 + 2, obs.height/2 - 10, 6, 3);
      ctx.fillRect(obs.width/2 - 8, obs.height/2 - 10, 6, 3);

      // Police flashes (Siren strobe triggers state)
      if (obs.type === 'POLICE') {
        const flashes = Math.floor(s.frameIndex / 8) % 2 === 0;
        ctx.fillStyle = flashes ? '#ff003c' : '#0072ff';
        ctx.beginPath();
        ctx.arc(0, -5, 6, 0, Math.PI * 2);
        ctx.fill();

        // Warning light strobes extending in arcs
        ctx.strokeStyle = flashes ? 'rgba(255, 0, 60, 0.15)' : 'rgba(0, 114, 255, 0.15)';
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.arc(0, -5, 45, Math.PI, 0);
        ctx.stroke();
      }

      ctx.restore();
    });
  };

  // Render spinning pickups
  const drawCollectibles = (ctx: CanvasRenderingContext2D, s: any, screenH: number) => {
    s.collectibles.forEach((item: Collectible) => {
      const itemRatio = item.y / screenH;
      const horizontalOffset = s.roadCurves * (1 - itemRatio) * 45;
      const itemX = (canvasRef.current!.width / window.devicePixelRatio) / 2 + (item.x - 1.5) * s.laneWidth - horizontalOffset;

      ctx.save();
      ctx.translate(itemX, item.y);
      ctx.scale(item.pulseScale, item.pulseScale);

      let tokenColor = '#ffd700'; // Coin defaults gold
      let iconSymbol = '$';

      switch (item.type) {
        case 'NITRO':
          tokenColor = '#00f7ff';
          iconSymbol = 'N';
          break;
        case 'SHIELD':
          tokenColor = '#bd00ff';
          iconSymbol = 'S';
          break;
        case 'REPAIR':
          tokenColor = '#39ff14';
          iconSymbol = '+';
          break;
        default:
          tokenColor = '#ffd700';
          iconSymbol = '©';
      }

      // Outer rings neon glows with shadows
      ctx.shadowBlur = 10;
      ctx.shadowColor = tokenColor;

      ctx.fillStyle = tokenColor;
      ctx.beginPath();
      ctx.arc(0, 0, item.width / 2, 0, Math.PI * 2);
      ctx.fill();

      // Inner details
      ctx.fillStyle = '#0a0518';
      ctx.beginPath();
      ctx.arc(0, 0, item.width / 2.7, 0, Math.PI * 2);
      ctx.fill();

      // Symbol text letter
      ctx.fillStyle = tokenColor;
      ctx.font = 'bold 12px "JetBrains Mono", Courier, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(iconSymbol, 0, 0.5);

      ctx.restore();
    });
  };

  // Particle render thread
  const drawParticles = (ctx: CanvasRenderingContext2D, s: any) => {
    s.particles.forEach((p: Particle) => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0; // Reset alpha
  };

  // Score multiplier alerts, crash alerts to display feedback overlays
  const drawVisualOverlays = (ctx: CanvasRenderingContext2D, w: number, h: number, s: any) => {
    // Red border heartbeat alert when health collapses
    if (s.health < 35) {
      const intensity = 0.15 + Math.sin(s.frameIndex * 0.14) * 0.15;
      ctx.strokeStyle = `rgba(255, 0, 60, ${intensity})`;
      ctx.lineWidth = 15;
      ctx.strokeRect(0, 0, w, h);
    }

    // High velocity speed horizontal warp indicators
    if (s.speed > 11) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
      ctx.lineWidth = 1;

      for (let i = 0; i < 8; i++) {
        // dynamic flying speed trails
        const sy = (i * 125 + s.frameIndex * 12) % h;
        const sx = Math.random() * w;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx, sy + 40);
        ctx.stroke();
      }
    }
  };

  return (
    <div id="game-stage-container" ref={containerRef} className="relative w-full h-full flex flex-col justify-between overflow-hidden">
      {/* HUD - HEADING READOUTS IN MODERN JETBRAINS MONO PARING */}
      <div id="game-hud-panel" className="absolute top-4 left-4 right-4 z-10 flex flex-wrap gap-4 items-center justify-between bg-zinc-950/75 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10 select-none">
        
        {/* STATS: METRIC SCORE */}
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono tracking-wider text-zinc-400 uppercase">SCORE</span>
            <span className="text-xl font-mono font-bold text-white tracking-tight">{score.toLocaleString()}</span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] font-mono tracking-wider text-zinc-400 uppercase">DISTANCE</span>
            <span className="text-xl font-mono font-bold text-emerald-400">{distState} <span className="text-xs text-zinc-400 font-normal">m</span></span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] font-mono tracking-wider text-zinc-400 uppercase">MULTIPLIER</span>
            <span className={`text-xl font-mono font-bold px-2 py-0.5 rounded text-center ${isNitro ? 'bg-cyan-500 text-black animate-pulse' : 'bg-zinc-800 text-purple-400'}`}>
              x{multiplier}
            </span>
          </div>
        </div>

        {/* METERS: HEART HEALTH & SHIELD */}
        <div className="flex items-center gap-6">
          {/* HEALTH STATE */}
          <div className="flex items-center gap-3 bg-zinc-900/40 px-3 py-1.5 rounded-lg border border-white/5">
            <Heart className={`w-5 h-5 ${health < 35 ? 'text-red-500 fill-red-500 animate-ping' : 'text-red-500 fill-red-500'}`} />
            <div className="flex flex-col w-24">
              <span className="text-[9px] font-mono text-zinc-400 uppercase leading-none mb-1">HEALTH</span>
              <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${health < 35 ? 'bg-red-500' : health < 60 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                  style={{ width: `${health}%` }}
                />
              </div>
            </div>
          </div>

          {/* NITRO GAS FUEL */}
          <div className="flex items-center gap-3 bg-zinc-900/40 px-3 py-1.5 rounded-lg border border-white/5">
            <Zap className={`w-5 h-5 ${isNitro ? 'text-cyan-400 fill-cyan-400 animate-pulse' : 'text-cyan-400'}`} />
            <div className="flex flex-col w-24">
              <span className="text-[9px] font-mono text-zinc-400 uppercase leading-none mb-1">NITRO BOOST</span>
              <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-cyan-400 transition-all duration-300"
                  style={{ width: `${nitroFuel}%` }}
                />
              </div>
            </div>
          </div>

          {/* GOLD TOKENS */}
          <div className="flex items-center gap-3 bg-zinc-900/40 px-3.5 py-1.5 rounded-lg border border-white/5">
            <span className="text-yellow-400 font-bold font-mono text-lg animate-pulse">©</span>
            <div className="flex flex-col">
              <span className="text-[9px] font-mono text-zinc-400 uppercase leading-none">COINS</span>
              <span className="text-sm font-semibold font-mono text-white">{coinsCollected}</span>
            </div>
          </div>

          {/* POWERUP SHIELD BUBBLE INDICATOR */}
          <div className={`p-2 rounded-lg border transition-all ${hasShield ? 'bg-purple-950/40 border-purple-500/40 text-purple-400' : 'bg-zinc-900 border-zinc-800 text-zinc-600'}`}>
            <ShieldIcon className={`w-4 h-4 ${hasShield ? 'animate-bounce' : ''}`} />
          </div>

          {/* DYNAMIC AUDIO MUTE TOGGLE */}
          <button 
            onClick={onToggleMute}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-lg text-white transition-all cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* RENDER STAGE CANVAS */}
      <canvas 
        id="retro-highway-canvas"
        ref={canvasRef} 
        className="w-full flex-grow bg-slate-950 block" 
        style={{ touchAction: 'none' }}
      />

      {/* DYNAMIC FOOTER READOUTS: HUD ON-SCREEN SPEEEDOMETER & INSTRUCTIONS */}
      <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-col md:flex-row gap-4 items-center justify-between pointer-events-none">
        
        {/* SPEEDOMETER IN mono TECH GRAPHICS */}
        <div className="flex items-end gap-3 bg-zinc-950/85 backdrop-blur px-5 py-3 rounded-2xl border border-white/10 pointer-events-auto shadow-2xl">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-zinc-500 tracking-wider">SPEED</span>
            <span className="text-3xl font-mono font-black text-white tracking-tighter tabular-nums">
              {speed} <span className="text-sm font-normal text-zinc-500 tracking-normal">KM/H</span>
            </span>
          </div>
          <div className="h-7 w-[2px] bg-zinc-800 mx-1" />
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-zinc-500 tracking-wider">VEHICLE</span>
            <span className="text-xs font-mono font-bold text-zinc-300" style={{ color: selectedCar.color }}>
              {selectedCar.name.toUpperCase()}
            </span>
          </div>
        </div>

        {/* MOBILE STEER & INTERACTION CONTROLS */}
        <div id="mobile-control-overlay" className="flex items-center gap-3 pointer-events-auto md:hidden w-full max-w-sm ml-auto select-none">
          <button
            onMouseDown={() => handleOnScreenSteer('left', true)}
            onMouseUp={() => handleOnScreenSteer('left', false)}
            onTouchStart={(e) => { e.preventDefault(); handleOnScreenSteer('left', true); }}
            onTouchEnd={(e) => { e.preventDefault(); handleOnScreenSteer('left', false); }}
            className="flex-1 py-4 bg-zinc-950/80 border border-white/10 active:bg-zinc-800 text-white font-mono rounded-xl text-center cursor-pointer active:scale-95 transition-transform"
          >
            ◁ LEFT
          </button>
          
          <div className="flex flex-col gap-2 flex-1">
            <button
              onMouseDown={() => handleOnScreenSteer('boost', true)}
              onMouseUp={() => handleOnScreenSteer('boost', false)}
              onTouchStart={(e) => { e.preventDefault(); handleOnScreenSteer('boost', true); }}
              onTouchEnd={(e) => { e.preventDefault(); handleOnScreenSteer('boost', false); }}
              className="py-3 bg-cyan-950/90 border border-cyan-500/30 text-cyan-400 font-mono text-xs rounded-xl text-center active:scale-95 transition-transform"
            >
              🚀 BOOST
            </button>
            <button
              onMouseDown={() => handleOnScreenSteer('brake', true)}
              onMouseUp={() => handleOnScreenSteer('brake', false)}
              onTouchStart={(e) => { e.preventDefault(); handleOnScreenSteer('brake', true); }}
              onTouchEnd={(e) => { e.preventDefault(); handleOnScreenSteer('brake', false); }}
              className="py-2 bg-red-950/80 border border-red-500/20 text-red-400 font-mono text-[10px] rounded-lg text-center"
            >
              BRAKE
            </button>
          </div>

          <button
            onMouseDown={() => handleOnScreenSteer('right', true)}
            onMouseUp={() => handleOnScreenSteer('right', false)}
            onTouchStart={(e) => { e.preventDefault(); handleOnScreenSteer('right', true); }}
            onTouchEnd={(e) => { e.preventDefault(); handleOnScreenSteer('right', false); }}
            className="flex-1 py-4 bg-zinc-950/80 border border-white/10 active:bg-zinc-800 text-white font-mono rounded-xl text-center cursor-pointer active:scale-95 transition-transform"
          >
            RIGHT ▷
          </button>
        </div>

        {/* DESKTOP GUIDES */}
        <div className="hidden md:flex items-center gap-4 bg-zinc-950/75 backdrop-blur px-4 py-2 rounded-xl border border-white/5 text-[11px] text-zinc-400 font-mono">
          <span>← / A : Steer Left</span>
          <span>•</span>
          <span>→ / D : Steer Right</span>
          <span>•</span>
          <span>↓ / S : Brake</span>
          <span>•</span>
          <span className="bg-cyan-950/50 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded text-[10px]">SPACE / SHIFT : NITRO BOOST</span>
        </div>

      </div>
    </div>
  );
}
