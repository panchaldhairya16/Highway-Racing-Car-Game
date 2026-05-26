/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GameState, GameStats, Car, Environment } from './types';
import { CARS, ENVIRONMENTS } from './data/gameConfig';
import StartMenu from './components/StartMenu';
import Garage from './components/Garage';
import GameOver from './components/GameOver';
import RetroGameCanvas from './components/RetroGameCanvas';
import { AudioSynth } from './utils/audio';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [selectedCarId, setSelectedCarId] = useState<string>('cruiser');
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string>('NEON_CITY');
  
  // Game running states (for current frame recap)
  const [lastRunStats, setLastRunStats] = useState({
    score: 0,
    coins: 0,
    distance: 0
  });
  const [isNewHighScore, setIsNewHighScore] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Global aggregate stats
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    highScore: 0,
    coinsCount: 0,
    totalCoins: 25, // starting gift coins to help unlock things!
    distance: 0,
    maxSpeedAchieved: 0,
    unlockedCarIds: ['cruiser']
  });

  // Load stats from localStorage on first mount
  useEffect(() => {
    try {
      const storedHighScore = localStorage.getItem('arcade_highScore');
      const storedCoins = localStorage.getItem('arcade_totalCoins');
      const storedDistance = localStorage.getItem('arcade_totalDistance');
      const storedCars = localStorage.getItem('arcade_unlockedCars');
      const storedMute = localStorage.getItem('arcade_isMuted');
      const storedCarId = localStorage.getItem('arcade_activeCarId');

      const loadedStats: GameStats = {
        score: 0,
        highScore: storedHighScore ? parseInt(storedHighScore, 10) : 0,
        coinsCount: 0,
        totalCoins: storedCoins ? parseInt(storedCoins, 10) : 25,
        distance: storedDistance ? parseInt(storedDistance, 10) : 0,
        maxSpeedAchieved: 0,
        unlockedCarIds: storedCars ? JSON.parse(storedCars) : ['cruiser']
      };

      setStats(loadedStats);

      if (storedCarId) {
        setSelectedCarId(storedCarId);
      }

      if (storedMute !== null) {
        const parsedMuted = storedMute === 'true';
        setIsMuted(parsedMuted);
        AudioSynth.setMute(parsedMuted);
      }
    } catch (e) {
      console.error('Failed to parse storage configuration', e);
    }
  }, []);

  // Sync mute state on click
  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    AudioSynth.setMute(nextMute);
    localStorage.setItem('arcade_isMuted', String(nextMute));
  };

  // Steer vehicles unlock
  const handleUnlockCar = (carId: string, cost: number) => {
    if (stats.totalCoins >= cost && !stats.unlockedCarIds.includes(carId)) {
      const nextCoins = stats.totalCoins - cost;
      const nextUnlockedList = [...stats.unlockedCarIds, carId];

      const updatedStats = {
        ...stats,
        totalCoins: nextCoins,
        unlockedCarIds: nextUnlockedList
      };

      setStats(updatedStats);
      setSelectedCarId(carId);

      // Save to disk
      localStorage.setItem('arcade_totalCoins', String(nextCoins));
      localStorage.setItem('arcade_unlockedCars', JSON.stringify(nextUnlockedList));
      localStorage.setItem('arcade_activeCarId', carId);

      // Confirmation Audio Feedback FX
      AudioSynth.playRepair();
    }
  };

  const handleSelectCar = (carId: string) => {
    if (stats.unlockedCarIds.includes(carId)) {
      setSelectedCarId(carId);
      localStorage.setItem('arcade_activeCarId', carId);
    }
  };

  const handleUpgradeStat = (statName: 'handling' | 'acceleration') => {
    // Upgrades handle simple permanent stat increases, deduct coins
    const cost = statName === 'handling' ? 40 : 50;
    if (stats.totalCoins >= cost) {
      const nextCoins = stats.totalCoins - cost;
      const updatedStats = {
        ...stats,
        totalCoins: nextCoins
      };
      setStats(updatedStats);
      localStorage.setItem('arcade_totalCoins', String(nextCoins));
      AudioSynth.playRepair();
    }
  };

  // Coordinate Game Finish Run statistics
  const handleGameOver = (finalScore: number, finalCoins: number, distance: number) => {
    const isNewRecord = finalScore > stats.highScore;
    setIsNewHighScore(isNewRecord);

    const nextHighScore = isNewRecord ? finalScore : stats.highScore;
    const nextTotalCoins = stats.totalCoins + finalCoins;
    const nextDistance = stats.distance + distance;

    const updatedStats = {
      ...stats,
      highScore: nextHighScore,
      totalCoins: nextTotalCoins,
      distance: nextDistance
    };

    setStats(updatedStats);
    setLastRunStats({
      score: finalScore,
      coins: finalCoins,
      distance
    });

    // Write persistence updates
    localStorage.setItem('arcade_highScore', String(nextHighScore));
    localStorage.setItem('arcade_totalCoins', String(nextTotalCoins));
    localStorage.setItem('arcade_totalDistance', String(nextDistance));

    setGameState('GAMEOVER');
  };

  const activeCar = CARS.find((c) => c.id === selectedCarId) || CARS[0];
  const activeEnvironment = ENVIRONMENTS.find((e) => e.id === selectedEnvironmentId) || ENVIRONMENTS[0];

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center bg-[#05000d] relative overflow-hidden">
      
      {/* Dynamic ambient starfields moving behind UI pages */}
      <div className="absolute inset-0 z-0 bg-transparent pointer-events-none opacity-40">
        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-white rounded-full animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping [animation-duration:3s]" />
        <div className="absolute bottom-1/4 right-1/3 w-1 h-1 bg-purple-500 rounded-full animate-pulse [animation-duration:4s]" />
        <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-yellow-400 rounded-full animate-ping [animation-duration:5s]" />
      </div>

      <main className="w-full h-full max-w-7xl mx-auto flex items-center justify-center p-4 relative z-10">
        {gameState === 'MENU' && (
          <StartMenu
            stats={stats}
            selectedEnvironmentId={selectedEnvironmentId}
            onSelectEnvironment={setSelectedEnvironmentId}
            selectedCarId={selectedCarId}
            onOpenGarage={() => setGameState('GARAGE')}
            onStartGame={() => setGameState('PLAYING')}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
          />
        )}

        {gameState === 'GARAGE' && (
          <Garage
            stats={stats}
            selectedCarId={selectedCarId}
            onSelectCar={handleSelectCar}
            onUnlockCar={handleUnlockCar}
            onUpgradeStat={handleUpgradeStat}
            onBack={() => setGameState('MENU')}
          />
        )}

        {gameState === 'PLAYING' && (
          <RetroGameCanvas
            gameState={gameState}
            selectedCar={activeCar}
            environment={activeEnvironment}
            onGameOver={handleGameOver}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
          />
        )}

        {gameState === 'GAMEOVER' && (
          <GameOver
            score={lastRunStats.score}
            coins={lastRunStats.coins}
            distance={lastRunStats.distance}
            isNewHighScore={isNewHighScore}
            onRestart={() => setGameState('PLAYING')}
            onGoHome={() => setGameState('MENU')}
            onGoGarage={() => setGameState('GARAGE')}
          />
        )}
      </main>
    </div>
  );
}
