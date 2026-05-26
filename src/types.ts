/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameState = 'MENU' | 'GARAGE' | 'PLAYING' | 'GAMEOVER';

export interface Car {
  id: string;
  name: string;
  description: string;
  maxSpeed: number; // pixels/frame or abstract
  acceleration: number;
  handling: number; // lane transition speed
  color: string;
  secondaryColor: string;
  unlocked: boolean;
  cost: number;
  perk: string;
}

export type EnvironmentId = 'NEON_CITY' | 'SUNSET_DESERT' | 'OUTRUN_GRID';

export interface Environment {
  id: EnvironmentId;
  name: string;
  skyColor: string;
  horizonColor: string;
  roadColor: string;
  laneColor: string;
  accentColor: string;
  ambientParticles: 'RAIN' | 'SUN_DUST' | 'GRID_STARS';
  difficultyMultiplier: number;
}

export interface Obstacle {
  id: string;
  x: number; // X position relative to road center (-1 to 1)
  y: number; // Y position along road (px)
  lane: number; // 0, 1, 2, or 3
  speed: number;
  width: number;
  height: number;
  color: string;
  type: 'PASSENGER' | 'TRUCK' | 'SPORTS' | 'POLICE';
  laneChanging?: boolean;
  changeTargetLane?: number;
  changeTimer?: number;
}

export interface Collectible {
  id: string;
  x: number; // X position relative to road center
  y: number; // Y position along road
  lane: number;
  width: number;
  height: number;
  type: 'COIN' | 'NITRO' | 'SHIELD' | 'REPAIR';
  collected: boolean;
  pulseScale: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  alpha: number;
}

export interface GameStats {
  score: number;
  highScore: number;
  coinsCount: number;
  totalCoins: number;
  distance: number;
  maxSpeedAchieved: number;
  unlockedCarIds: string[];
}
