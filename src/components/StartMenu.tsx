/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, Car as CarIcon, Volume2, VolumeX, Shield, Award, Trophy, Info, Sparkles, Navigation } from 'lucide-react';
import { GameStats, Environment, Car } from '../types';
import { ENVIRONMENTS, CARS } from '../data/gameConfig';
import { motion } from 'motion/react';

interface StartMenuProps {
  stats: GameStats;
  selectedEnvironmentId: string;
  onSelectEnvironment: (envId: any) => void;
  selectedCarId: string;
  onOpenGarage: () => void;
  onStartGame: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export default function StartMenu({
  stats,
  selectedEnvironmentId,
  onSelectEnvironment,
  selectedCarId,
  onOpenGarage,
  onStartGame,
  isMuted,
  onToggleMute
}: StartMenuProps) {
  const activeCar = CARS.find(c => c.id === selectedCarId) || CARS[0];
  const activeEnv = ENVIRONMENTS.find(e => e.id === selectedEnvironmentId) || ENVIRONMENTS[0];

  return (
    <div id="start-menu-panel" className="w-full max-w-4xl mx-auto flex flex-col gap-6 md:gap-8 select-none">
      
      {/* HEADER LOGO CONTAINER WITH MOTION FLOATING ENGINE */}
      <motion.div 
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center relative py-8 px-4 bg-zinc-950/45 border border-zinc-900 rounded-3xl backdrop-blur-md overflow-hidden"
      >
        {/* PARALLAX GLOW DECORATIONS */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-32 bg-purple-500/10 blur-3xl rounded-full" />
        <div className="absolute top-10 left-10 w-4 h-4 rounded-full bg-cyan-500/20 blur" />
        <div className="absolute bottom-10 right-10 w-6 h-6 rounded-full bg-pink-500/20 blur" />

        <span className="text-xs font-mono tracking-[0.35em] text-cyan-400 uppercase font-bold mb-3 block">
          8-BIT RETRO SPEEDWAY
        </span>
        
        <h1 className="text-4xl md:text-6xl font-black font-sans tracking-tight text-white mb-2 relative">
          HIGHWAY <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-pink-500 to-purple-500">RACER</span>
        </h1>

        <p className="text-xs text-zinc-400 font-mono tracking-wide max-w-lg mx-auto leading-relaxed mt-2.5">
          Steer down high-velocity neon highways. Dodge lanes of incoming traffic, absorb shields, trigger nitro thrusters, and drift into first place!
        </p>
      </motion.div>

      {/* CORE STATS OVERVIEW BENTO GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* HIGH SCORE CARD */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-zinc-90 w-full p-4 border border-zinc-900 rounded-2xl flex items-center gap-4 bg-zinc-950/40 backdrop-blur"
        >
          <div className="p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/15 text-yellow-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-mono tracking-wide text-zinc-500 uppercase">HIGH SCORE</span>
            <span className="text-lg font-mono font-bold text-white leading-none mt-1">{stats.highScore.toLocaleString()}</span>
          </div>
        </motion.div>

        {/* BANK POOL CARD */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-zinc-90 w-full p-4 border border-zinc-900 rounded-2xl flex items-center gap-4 bg-zinc-950/40 backdrop-blur"
        >
          <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/15 text-cyan-400">
            <Award className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-mono tracking-wide text-zinc-500 uppercase">TOTAL DISTANCE</span>
            <span className="text-lg font-mono font-bold text-white leading-none mt-1">{stats.distance.toLocaleString()} m</span>
          </div>
        </motion.div>

        {/* CURRENT PILOT CARD */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-zinc-90 w-full p-4 border border-zinc-900 rounded-2xl flex items-center gap-4 bg-zinc-950/40 backdrop-blur"
        >
          <div className="p-3 bg-fuchsia-500/10 rounded-xl border border-fuchsia-500/15 text-fuchsia-400">
            <CarIcon className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-mono tracking-wide text-zinc-500 uppercase">ACTIVE CONFIG</span>
            <span className="text-xs font-mono font-bold text-white leading-none mt-1.5" style={{ color: activeCar.color }}>
              {activeCar.name.toUpperCase()}
            </span>
          </div>
        </motion.div>
      </div>

      {/* RENDER TRACK ENVIRONMENT SELECTOR - BENTO SPLIT */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        
        {/* ENVIRONMENT SELECTOR Column - Left */}
        <div className="md:col-span-7 bg-zinc-950/40 border border-zinc-900 rounded-3xl p-5 md:p-6 backdrop-blur flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
              <Navigation className="w-4 h-4 text-cyan-400" /> SELECT TRACK SECTOR
            </h3>

            <div className="flex flex-col gap-3">
              {ENVIRONMENTS.map((env) => {
                const isActive = env.id === selectedEnvironmentId;
                return (
                  <button
                    key={env.id}
                    onClick={() => onSelectEnvironment(env.id)}
                    className={`flex items-center justify-between p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-zinc-900/90 border-white/20 shadow-lg' 
                        : 'bg-zinc-950/60 border-zinc-900 hover:border-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full border border-white/10"
                        style={{ backgroundColor: env.accentColor }}
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-white">{env.name}</span>
                        <span className="text-[10px] font-mono text-zinc-500">
                          Multiplier: <span className="text-emerald-400 font-bold">{env.difficultyMultiplier}x</span>
                        </span>
                      </div>
                    </div>

                    {isActive && (
                      <span className="text-[10px] font-mono font-bold text-cyan-400 tracking-wider">
                        ACTIVE TRACK
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-zinc-900/60 flex items-center gap-3 text-xs font-mono text-zinc-400">
            <Info className="w-4 h-4 text-cyan-500" />
            <span>Select tougher track sectors to unlock larger score multipliers!</span>
          </div>
        </div>

        {/* LAUNCH DECK COLUMN - Right */}
        <div className="md:col-span-5 bg-zinc-950/40 border border-zinc-900 rounded-3xl p-6 backdrop-blur flex flex-col justify-between text-center relative overflow-hidden">
          
          <div className="flex flex-col items-center">
            {/* Ambient track visualization block */}
            <div 
              className="w-full h-32 rounded-2xl relative mb-4 border border-zinc-900 shadow-inner flex items-center justify-center overflow-hidden"
              style={{ background: `radial-gradient(circle, ${activeEnv.horizonColor}, ${activeEnv.skyColor})` }}
            >
              {/* Drawing retro lane indicator grid inside preview box */}
              <div className="absolute inset-y-0 w-12 border-x border-dashed border-white/10 flex flex-col justify-between py-2">
                <div className="h-4 w-1 bg-white/20 self-center" />
                <div className="h-4 w-1 bg-white/20 self-center" />
                <div className="h-4 w-1 bg-white/20 self-center" />
              </div>

              {/* Glowing launch icon details */}
              <motion.div
                animate={{ y: [4, -4, 4] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div 
                  className="w-10 h-16 rounded-xl border border-white/5 shadow-2xl relative flex flex-col justify-between p-1.5"
                  style={{ background: `linear-gradient(135deg, ${activeCar.color}, ${activeCar.secondaryColor})` }}
                >
                  <div className="h-5 w-full bg-zinc-900/60 rounded-md" />
                  <div className="h-1.5 w-6 bg-zinc-900 mx-auto rounded-sm" />
                </div>
              </motion.div>
            </div>

            <h4 className="text-sm font-bold text-white mb-1">READY FOR THE GRID</h4>
            <p className="text-[11px] text-zinc-500 font-mono tracking-wide">
              Selected Track: {activeEnv.name.toUpperCase()}
            </p>
          </div>

          <div className="flex flex-col gap-3 mt-6">
            <button
              onClick={onStartGame}
              className="w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-zinc-950 font-bold text-sm rounded-2xl tracking-wider hover:shadow-2xl hover:shadow-cyan-500/10 cursor-pointer active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-zinc-950 text-zinc-950" /> START RACING
            </button>

            <button
              onClick={onOpenGarage}
              className="w-full py-3.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-200 hover:text-white font-bold font-mono text-xs rounded-2xl border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-all uppercase flex items-center justify-center gap-2"
            >
              <CarIcon className="w-4 h-4" /> ENTER GARAGE
            </button>
          </div>

          {/* QUICK MUTE TOGGLER */}
          <div className="flex justify-center gap-4 mt-4">
            <button 
              onClick={onToggleMute}
              className="p-2 border border-zinc-900/60 hover:border-zinc-800 hover:bg-zinc-900/40 rounded-xl text-zinc-400 hover:text-white transition-all pointer-events-auto cursor-pointer flex items-center gap-2 text-xs font-mono"
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-3.5 h-3.5" /> MUSIC DISABLED
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 animate-pulse" /> PROCEDURAL SFX ON
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
