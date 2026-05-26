/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Car, Environment } from '../types';

export const CARS: Car[] = [
  {
    id: 'cruiser',
    name: 'Sunset Cruiser',
    description: 'A reliable balanced muscle car, highly tuned for precision cruising down the coastline lanes.',
    maxSpeed: 10,
    acceleration: 0.12,
    handling: 0.08,
    color: '#ff5e36', // Coral red-orange
    secondaryColor: '#ffe066', // Golden yellow
    unlocked: true,
    cost: 0,
    perk: 'Easy Steer: Balanced recovery and handling controls.'
  },
  {
    id: 'drifter',
    name: 'Neon Horizon',
    description: 'Lightweight tuner running a high-frequency carbon chassis. Attracts road coins from 20% further away.',
    maxSpeed: 11.5,
    acceleration: 0.14,
    handling: 0.10,
    color: '#00f7ff', // Vibrant cyan
    secondaryColor: '#bd00ff', // Hot purple
    unlocked: false,
    cost: 80,
    perk: 'Magnetic: 1.2x larger coin and item collection radius.'
  },
  {
    id: 'stealth',
    name: 'Carbon Phantom',
    description: 'Futuristic hyper-car built of dark-matter composites, sustaining longer nitro boosts on highways.',
    maxSpeed: 13,
    acceleration: 0.16,
    handling: 0.09,
    color: '#1a1a1a', // Stealth black
    secondaryColor: '#39ff14', // Acid green
    unlocked: false,
    cost: 180,
    perk: 'Nitro King: Boost durations last 25% longer with exhaust trails.'
  },
  {
    id: 'beast',
    name: 'Apex Interceptor',
    description: 'Experimental reinforced police cruiser equipped with thick alloy bumpers, absorbing one shield collision.',
    maxSpeed: 14,
    acceleration: 0.18,
    handling: 0.11,
    color: '#ff0055', // Shocking pink
    secondaryColor: '#ffffff', // Clean white
    unlocked: false,
    cost: 350,
    perk: 'Shield Block: Starts every race with a free defense barrier!'
  }
];

export const ENVIRONMENTS: Environment[] = [
  {
    id: 'NEON_CITY',
    name: 'Neon Metropolis',
    skyColor: '#0a0518',
    horizonColor: '#1d0c2e',
    roadColor: '#110b1f',
    laneColor: '#4d2078',
    accentColor: '#bd00ff',
    ambientParticles: 'RAIN',
    difficultyMultiplier: 1.0
  },
  {
    id: 'SUNSET_DESERT',
    name: 'Outrun Desert',
    skyColor: '#fd5e53',
    horizonColor: '#ffe366',
    roadColor: '#281316',
    laneColor: '#781c1c',
    accentColor: '#ff5e36',
    ambientParticles: 'SUN_DUST',
    difficultyMultiplier: 1.25
  },
  {
    id: 'OUTRUN_GRID',
    name: 'Cosmic Cybergrid',
    skyColor: '#000000',
    horizonColor: '#0c2e26',
    roadColor: '#030f0d',
    laneColor: '#105244',
    accentColor: '#00ffcc',
    ambientParticles: 'GRID_STARS',
    difficultyMultiplier: 1.5
  }
];

export const UPGRADE_COSTS = {
  handling: 40,
  acceleration: 50,
  shield: 60
};
