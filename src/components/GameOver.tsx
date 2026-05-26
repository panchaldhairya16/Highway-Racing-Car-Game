/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RotateCcw, Home, Car, Trophy, Coins, Award, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface GameOverProps {
  score: number;
  coins: number;
  distance: number;
  isNewHighScore: boolean;
  onRestart: () => void;
  onGoHome: () => void;
  onGoGarage: () => void;
}

export default function GameOver({
  score,
  coins,
  distance,
  isNewHighScore,
  onRestart,
  onGoHome,
  onGoGarage
}: GameOverProps) {
  return (
    <div id="game-over-screen" className="w-full max-w-xl mx-auto bg-zinc-950/90 border border-zinc-805 rounded-3xl p-6 md:p-8 text-center shadow-2xl backdrop-blur-md select-none">
      
      {/* SHINING NEW HIGH SCORE AWARD */}
      {isNewHighScore ? (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, type: 'spring' }}
          className="flex flex-col items-center mb-6"
        >
          <div className="p-4 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-full mb-3 animate-bounce">
            <Trophy className="w-8 h-8" />
          </div>
          <span className="text-yellow-400 font-mono text-[10px] tracking-[0.3em] font-extrabold uppercase animate-pulse">
            NEW ALL-TIME RECORD!
          </span>
          <h2 className="text-2xl font-black text-white mt-1">
            HIGHWAY CHAMPION
          </h2>
        </motion.div>
      ) : (
        <div className="flex flex-col items-center mb-6">
          <div className="p-4 bg-red-500/10 text-red-400 border border-red-500/15 rounded-full mb-3">
            <Award className="w-8 h-8" />
          </div>
          <span className="text-zinc-505 font-mono text-[10px] tracking-[0.25em] font-bold uppercase">
            END OF TRANSMISSION
          </span>
          <h2 className="text-2xl font-black text-white mt-1 uppercase tracking-tight">
            VEHICLE DESTROYED
          </h2>
        </div>
      )}

      {/* RENDER RUN PERFORMANCE METRICS GRID */}
      <div className="grid grid-cols-3 gap-3 bg-zinc-900/40 border border-zinc-900/60 p-4 rounded-2xl mb-8">
        {/* TOTAL POINTS ACCRUED */}
        <div className="flex flex-col">
          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider mb-1">SCORE</span>
          <span className="text-lg font-mono font-bold text-white mb-0.5">{score.toLocaleString()}</span>
          <span className="text-[9px] font-mono text-zinc-500">points</span>
        </div>

        {/* DISTANCE TRAVELED (Meters) */}
        <div className="flex flex-col border-x border-zinc-800/50">
          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider mb-1">DISTANCE</span>
          <span className="text-lg font-mono font-bold text-cyan-400 mb-0.5">{distance.toLocaleString()}</span>
          <span className="text-[9px] font-mono text-zinc-500">meters</span>
        </div>

        {/* COINS PURSED */}
        <div className="flex flex-col">
          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider mb-1">COINS MET</span>
          <span className="text-lg font-mono font-bold text-yellow-400 mb-0.5">+{coins}</span>
          <span className="text-[9px] font-mono text-zinc-500">credits</span>
        </div>
      </div>

      {/* CORE ACTION DECKS */}
      <div className="flex flex-col gap-3">
        <button
          onClick={onRestart}
          className="w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-zinc-950 font-bold text-sm rounded-2xl tracking-wider cursor-pointer hover:shadow-2xl transition-all flex items-center justify-center gap-2 "
        >
          <RotateCcw className="w-4 h-4" /> RETRY RACE
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onGoGarage}
            className="py-3 bg-zinc-90 w-full bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-200 hover:text-white font-bold font-mono text-xs rounded-2xl cursor-pointer transition-all uppercase flex items-center justify-center gap-2"
          >
            <Car className="w-4 h-4" /> GARAGE SHOP
          </button>

          <button
            onClick={onGoHome}
            className="py-3 bg-zinc-90 w-full bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-200 hover:text-white font-bold font-mono text-xs rounded-2xl cursor-pointer transition-all uppercase flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" /> START MENU
          </button>
        </div>
      </div>

      {/* FUN CONSOLE TIP */}
      <p className="text-[10px] font-mono text-zinc-500 mt-6 select-none uppercase tracking-wide">
        💡 Pro-Tip: Collect cyan Nitro powerups to smash through incoming cars safely!
      </p>
    </div>
  );
}
