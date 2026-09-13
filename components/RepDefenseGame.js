"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import CoinIcon from "./CoinIcon";

export default function RepDefenseGame() {
  const [gameMode, setGameMode] = useState("levelSelect");
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [maxLevelUnlocked, setMaxLevelUnlocked] = useState(1);
  const [difficulty, setDifficulty] = useState("medium");
  const [speed, setSpeed] = useState(1);
  const [autoPlay, setAutoPlay] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [currentWave, setCurrentWave] = useState(0);
  const [eloPoints, setEloPoints] = useState(0);  // Exercise points
  const [gamePoints, setGamePoints] = useState(0); // GP (game points for purchasing)
  const [coins, setCoins] = useState(0);           // Coins earned

  // Round values for display (actual values remain as decimals in database)
  const displayEloPoints = Math.round(eloPoints);
  const displayGamePoints = Math.round(gamePoints);
  const displayCoins = Math.round(coins);
  const [troopTypes, setTroopTypes] = useState([]);
  const [userTroops, setUserTroops] = useState([]);
  const [enemies, setEnemies] = useState([]);
  const [playerTowerHealth, setPlayerTowerHealth] = useState(100);
  const [enemyTowerHealth, setEnemyTowerHealth] = useState(50);
  const [selectedTroop, setSelectedTroop] = useState(null);
  const [troopMaxHits, setTroopMaxHits] = useState({}); // Store max hits for each troop type
  const [isBossLevel, setIsBossLevel] = useState(false);
  const [bossData, setBossData] = useState(null);
  const [congratsMessage, setCongratsMessage] = useState("");
  const [showCongrats, setShowCongrats] = useState(false);
  const [lastCoinsEarned, setLastCoinsEarned] = useState(0);
  const [troopSortMode, setTroopSortMode] = useState("cheapest"); // "cheapest", "expensive", "recent"
  const [troopUsageTimes, setTroopUsageTimes] = useState({}); // Track when each troop was last used
  const isCompletingLevelRef = useRef(false);
  
  const gameLoopRef = useRef(null);
  const canvasRef = useRef(null);

  // Fetch user game data
  useEffect(() => {
    if (gameMode === "levelSelect") {
      fetch("/api/game/me")
        .then((res) => res.json())
        .then((data) => {
          console.log("Fetched game data:", data);
          setEloPoints(data.elo || 0);      // Exercise points
          setGamePoints(data.gp || 0);      // Game points (for purchasing)
          setCoins(data.coins || 0);        // Coins
          // Set max level unlocked from user data (or default to 1)
          setMaxLevelUnlocked(data.maxLevelUnlocked || 1);
          console.log("Set maxLevelUnlocked to:", data.maxLevelUnlocked || 1);
        })
        .catch(console.error);
    }
  }, [gameMode]); // Refetch when gameMode changes to levelSelect

  // Fetch troop types
  useEffect(() => {
    fetch("/api/game/troops")
      .then((res) => res.json())
      .then((data) => {
        setTroopTypes(data.troopTypes);
        if (data.troopTypes.length > 0) {
          setSelectedTroop(data.troopTypes[0].id);
          // Store max hits for each troop type
          const maxHitsMap = {};
          data.troopTypes.forEach(troop => {
            maxHitsMap[troop.id] = troop.maxHits || 3;
          });
          setTroopMaxHits(maxHitsMap);
        }
      })
      .catch(console.error);
  }, []);

  // Start level
  const startLevel = (level) => {
    const isBoss = level % 5 === 0; // Every 5 levels is a boss level
    setIsBossLevel(isBoss);
    
    // Calculate boss stats for boss levels
    if (isBoss) {
      const bossHealthMultiplier = Math.min(5, 1 + (level / 20)); // Max 5x health at level 100
      const bossDamageMultiplier = Math.min(3, 1 + (level / 25)); // Max 3x damage at level 100
      const bossSize = Math.min(2.5, 1 + (level / 30)); // Max 2.5x size at level 100
      
      setBossData({
        health: Math.floor((50 + (level - 1) * 10) * bossHealthMultiplier),
        damage: Math.floor((5 + level * 0.5) * bossDamageMultiplier),
        size: bossSize,
        color: level >= 20 ? "#FF4444" : "#FFD700", // Gold for boss, red for normal enemy at level 20+
        isBoss: level < 20 // Only boss if level < 20
      });
    } else {
      setBossData(null);
    }
    
    setGameMode("levelPlaying");
    setSelectedLevel(level);
    setCurrentLevel(level);
    setCurrentWave(0);
    // Player tower HP = user's ELO
    setPlayerTowerHealth(Math.floor(eloPoints));
    // Enemy tower HP scales with level: 50 HP at level 1, increases by level
    setEnemyTowerHealth(50 + (level - 1) * 10);
    setUserTroops([]);
    setEnemies([]);
    isCompletingLevelRef.current = false; // Reset completion flag
    startWave(0, level);
  };

  // Start a new wave
  const startWave = (waveNum, level) => {
    const newWave = waveNum + 1;

    let enemyCount, baseEnemyHealth, baseDamage;

    // Level mode: difficulty scales with level
    const levelMultiplier = Math.pow(1.08, level - 1);
    enemyCount = Math.floor((2 + newWave * 1.2) * levelMultiplier);
    baseEnemyHealth = Math.floor((5 + newWave * 3) * levelMultiplier);
    baseDamage = Math.floor((1 + newWave * 0.3) * levelMultiplier);

    const difficultyMultiplier = {
      easy: 0.6,
      medium: 1.0,
      hard: 1.4,
    }[difficulty] || 1.0;

    const newEnemies = [];
    const enemyColors = ["#FF4444", "#FF6666", "#FF8888", "#FFAAAA", "#CC0000", "#990000"];

    // Check if this is a boss level wave (wave 2 of boss levels)
    const isBossWave = isBossLevel && newWave === 2;

    // Spawn enemies from left side (enemy tower at x=30) walking right
    for (let i = 0; i < Math.ceil(enemyCount * difficultyMultiplier); i++) {
      const baseSpeed = 1.5 + (difficulty === "hard" ? 1.0 : difficulty === "medium" ? 0.5 : 0.2);
      
      // For boss wave, spawn one boss at the end
      if (isBossWave && i === Math.ceil(enemyCount * difficultyMultiplier) - 1 && bossData) {
        newEnemies.push({
          id: `boss-${Date.now()}`,
          x: 30 + Math.random() * 50,
          y: 400,
          health: bossData.health,
          maxHealth: bossData.health,
          damage: bossData.damage,
          speed: baseSpeed * 0.5, // Boss is slower
          attackCooldown: 0,
          color: bossData.color,
          shape: "star",
          size: bossData.size || 1.5,
          isBoss: bossData.isBoss,
        });
      } else {
        newEnemies.push({
          id: `enemy-${Date.now()}-${i}`,
          x: 30 + Math.random() * 50, // Start near enemy tower (left side)
          y: 400, // Ground level
          health: Math.floor(baseEnemyHealth * difficultyMultiplier),
          maxHealth: Math.floor(baseEnemyHealth * difficultyMultiplier),
          damage: Math.floor(baseDamage * difficultyMultiplier),
          speed: baseSpeed + Math.random() * 0.5,
          attackCooldown: 0,
          color: enemyColors[Math.floor(Math.random() * enemyColors.length)],
          shape: "circle",
          size: 1,
          isBoss: false,
        });
      }
    }

    setCurrentWave(newWave);
    setEnemies(newEnemies);
  };

  // Purchase troops with scaled cost based on level
  const purchaseTroop = async (troopTypeId, quantity = 1) => {
    const troopType = troopTypes.find((t) => t.id === troopTypeId);
    if (!troopType) return;

    // Track usage time for recent sorting
    setTroopUsageTimes(prev => ({
      ...prev,
      [troopTypeId]: Date.now()
    }));

    const difficultyMultiplier = {
      easy: 0.5,
      medium: 1.0,
      hard: 1.5,
    }[difficulty] || 1.0;

    // Level-based cost scaling: costs increase exponentially with level
    // Level 1: no multiplier, Level 10: 1.5x, Level 100: 5x, Level 500: 25x
    const levelCostMultiplier = Math.pow(1.02, Math.max(0, currentLevel - 1));

    const totalCost = Math.floor(troopType.cost * quantity * difficultyMultiplier * levelCostMultiplier);
    if (gamePoints < totalCost) {
      alert("Insufficient points!");
      return;
    }

    try {
      const res = await fetch("/api/game/troops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ troopTypeId, quantity, actualCost: totalCost }),
      });
      
      const data = await res.json();
      if (data.ok) {
        setGamePoints(data.remainingPoints);
        
        // Broadcast GP update to navbar
        window.dispatchEvent(new CustomEvent('gpUpdated', { detail: { gp: data.remainingPoints } }));
        
      const newTroops = [];
        for (let i = 0; i < quantity; i++) {
          const maxHits = troopMaxHits[troopTypeId] || 3;
          newTroops.push({
            id: `troop-${Date.now()}-${i}`,
            typeId: troopTypeId,
            name: troopType.name,
            damage: troopType.damage,
            attackSpeed: troopType.attackSpeed,
            maxHits: maxHits,
            hitsRemaining: maxHits,
            color: troopType.color || "#4ECDC4",
            shape: troopType.shape || "circle",
            x: 700 + Math.random() * 30, // Start near player tower (right side)
            y: 400, // Ground level
            health: 15,
            maxHealth: 15,
            attackCooldown: 0,
          });
        }
        
        setUserTroops((prev) => [...prev, ...newTroops]);
      }
    } catch (error) {
      console.error("Failed to purchase troops:", error);
    }
  };

  // Auto-play logic
  const autoPlayPurchase = useCallback(() => {
    if (!autoPlay || gamePoints < 1) return;
    
    const difficultyMultiplier = {
      easy: 0.5,
      medium: 1.0,
      hard: 1.5,
    }[difficulty] || 1.0;
    
    // Level-based cost scaling
    const levelCostMultiplier = Math.pow(1.02, Math.max(0, currentLevel - 1));
    
    const affordableTroops = troopTypes.filter((t) => {
      const scaledCost = Math.floor(t.cost * difficultyMultiplier * levelCostMultiplier);
      return scaledCost <= gamePoints;
    });
    
    if (affordableTroops.length > 0) {
      const cheapest = affordableTroops.reduce((min, t) => {
        const scaledCost = Math.floor(t.cost * difficultyMultiplier * levelCostMultiplier);
        const minScaledCost = Math.floor(min.cost * difficultyMultiplier * levelCostMultiplier);
        return scaledCost < minScaledCost ? t : min;
      });
      purchaseTroop(cheapest.id, 1);
    }
  }, [autoPlay, gamePoints, troopTypes, difficulty, currentLevel]);

  // Game loop
  useEffect(() => {
    const isPlaying = gameMode === "levelPlaying";
    if (!isPlaying) {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
      return;
    }

    let lastTime = performance.now();
    const tickRate = (1000 / speed) / 4;

    const gameLoop = (currentTime) => {
      const deltaTime = currentTime - lastTime;
      
      if (deltaTime >= tickRate) {
        lastTime = currentTime;
        
        // Player troops: move left, fight enemies, attack enemy tower
        setUserTroops((prevTroops) => {
          return prevTroops.map((troop) => {
            let newCooldown = troop.attackCooldown - 1;
            let newX = troop.x;
            
            // Find nearest enemy
            const nearestEnemy = enemies.reduce((nearest, enemy) => {
              const dist = Math.abs(enemy.x - troop.x);
              if (!nearest || dist < Math.abs(nearest.x - troop.x)) {
                return enemy;
              }
              return nearest;
            }, null);
            
            if (nearestEnemy) {
              const dist = Math.abs(nearestEnemy.x - troop.x);
              
              // Move toward enemy if out of range
              if (dist > 60) {
                const moveSpeed = 2;
                newX = troop.x - moveSpeed;
              }
              
              // Attack if in range
              if (dist <= 60 && newCooldown <= 0) {
                setEnemies((prevEnemies) => {
                  return prevEnemies.map((enemy) => {
                    if (enemy.id === nearestEnemy.id) {
                      return { ...enemy, health: enemy.health - troop.damage };
                    }
                    return enemy;
                  });
                });
                newCooldown = 60 / troop.attackSpeed;
              }
            } else {
              // No enemies, move toward enemy tower (left side)
              if (troop.x > 100) {
                newX = troop.x - 2;
              } else {
                // Attack enemy tower
                if (newCooldown <= 0) {
                  setEnemyTowerHealth((prev) => Math.max(0, prev - troop.damage));
                  newCooldown = 60 / troop.attackSpeed;
                }
              }
            }
            
            return { ...troop, x: newX, attackCooldown: newCooldown };
          });
        });

        // Enemy troops: move right, fight player troops, attack player tower
        setEnemies((prevEnemies) => {
          return prevEnemies.map((enemy) => {
            let newCooldown = enemy.attackCooldown - 1;
            let newX = enemy.x;
            
            // Find nearest player troop
            const nearestTroop = userTroops.reduce((nearest, troop) => {
              const dist = Math.abs(troop.x - enemy.x);
              if (!nearest || dist < Math.abs(nearest.x - enemy.x)) {
                return troop;
              }
              return nearest;
            }, null);
            
            if (nearestTroop) {
              const dist = Math.abs(nearestTroop.x - enemy.x);
              
              // Move toward troop if out of range
              if (dist > 60) {
                newX = enemy.x + enemy.speed;
              }
              
              // Attack if in range
              if (dist <= 60 && newCooldown <= 0) {
                setUserTroops((prevTroops) => {
                  return prevTroops.map((troop) => {
                    if (troop.id === nearestTroop.id) {
                      return { ...troop, hitsRemaining: Math.max(0, troop.hitsRemaining - 1) };
                    }
                    return troop;
                  });
                });
                newCooldown = 30;
              }
            } else {
              // No player troops, move toward player tower (right side)
              if (enemy.x < 700) {
                newX = enemy.x + enemy.speed;
              } else {
                // Attack player tower
                if (newCooldown <= 0) {
                  setPlayerTowerHealth((prev) => Math.max(0, prev - enemy.damage));
                  newCooldown = 30;
                }
              }
            }
            
            return { ...enemy, x: newX, attackCooldown: newCooldown };
          });
        });

        setEnemies((prevEnemies) => prevEnemies.filter((e) => e.health > 0));
        
        // Remove troops that have used all their hits
        setUserTroops((prevTroops) => prevTroops.filter((t) => t.hitsRemaining > 0));

        setEnemies((prevEnemies) => {
          if (prevEnemies.length === 0) {
            setTimeout(() => {
              // Level: spawn next wave
              const wavesPerLevel = 2;
              if (currentWave < wavesPerLevel) {
                startWave(currentWave, currentLevel);
              }
            }, 500);
          }
          return prevEnemies;
        });

        // Check win condition (enemy tower destroyed)
        if (enemyTowerHealth <= 0 && !isCompletingLevelRef.current) {
          completeLevel(true);
        }

        // Check lose condition (player tower destroyed)
        if (playerTowerHealth <= 0 && !isCompletingLevelRef.current) {
          completeLevel(false);
        }

        if (autoPlay) {
          autoPlayPurchase();
        }
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameMode, speed, autoPlay, currentWave, currentLevel, playerTowerHealth, enemyTowerHealth, enemies, userTroops, autoPlayPurchase, isBossLevel, bossData, troopMaxHits]);

  // Complete level
  const completeLevel = async (won) => {
    // Prevent multiple simultaneous completions using ref for immediate blocking
    if (isCompletingLevelRef.current) return;
    isCompletingLevelRef.current = true;
    
    if (won) {
      setGameMode("levelWon");
      // Max level is updated server-side and refreshed from API response
      
      // Show congratulations message
      const messages = [
        "🔥 Keep it up!",
        "💪 You're on fire!",
        "⭐ Awesome job!",
        "🎉 Great work!",
        "✨ Incredible!",
        "🚀 Level mastered!",
        "💯 Perfect execution!",
        "🏆 You're unstoppable!",
        "⚡ Phenomenal!",
        "🎯 Precision victory!",
      ];
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      setCongratsMessage(randomMsg);
      setShowCongrats(true);
      setTimeout(() => setShowCongrats(false), 3000);
    } else {
      setGameMode("levelLost");
    }
    
    try {
      const res = await fetch("/api/game/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          difficulty,
          levelReached: currentLevel,
          result: won ? "win" : "loss",
          isInfinityMode: false,
        }),
      });
      
      const data = await res.json();
      console.log("Game run response:", data); // Debug log

      if (data.ok) {
        // Update max level unlocked immediately from response
        console.log("Setting maxLevelUnlocked to:", data.maxLevelUnlocked);
        if (data.maxLevelUnlocked) {
          setMaxLevelUnlocked(data.maxLevelUnlocked);
        }

        // Refresh all currencies from server
        const meRes = await fetch("/api/game/me");
        if (meRes.ok) {
          const meData = await meRes.json();
          console.log("Game me response:", meData); // Debug log
          setEloPoints(meData.elo || 0);
          setGamePoints(meData.gp || 0);
          setCoins(meData.coins || 0);
          setMaxLevelUnlocked(meData.maxGameLevelReached || 1);

          // Broadcast coin update to navbar and shop
          window.dispatchEvent(new CustomEvent('coinsUpdated', { detail: { coins: meData.coins || 0 } }));

          // Broadcast GP update to navbar
          window.dispatchEvent(new CustomEvent('gpUpdated', { detail: { gp: meData.gp || 0 } }));
        }

        // Store coins earned for display (show even if duplicate, so user knows what they got)
        if (data.coinsEarned > 0) {
          setLastCoinsEarned(data.coinsEarned);
        }
      } else {
        console.error("Game run failed:", data.error);
      }
    } catch (error) {
      console.error("Failed to record game run:", error);
    } finally {
      isCompletingLevelRef.current = false;
    }
  };

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    const isPlaying = gameMode === "levelPlaying" || gameMode === "infinityPlaying";
    if (!canvas || !isPlaying) return;
    
    const ctx = canvas.getContext("2d");
    
    const drawShape = (x, y, size, color, shape) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      
      switch (shape) {
        case "circle":
          ctx.arc(x, y, size, 0, Math.PI * 2);
          break;
        case "square":
          ctx.rect(x - size, y - size, size * 2, size * 2);
          break;
        case "triangle":
          ctx.moveTo(x, y - size);
          ctx.lineTo(x + size, y + size);
          ctx.lineTo(x - size, y + size);
          ctx.closePath();
          break;
        case "star":
          const starPoints = [
            [0.5, 0], [0.61, 0.35], [0.98, 0.35], [0.68, 0.57], 
            [0.79, 0.91], [0.5, 0.7], [0.21, 0.91], [0.32, 0.57], 
            [0.02, 0.35], [0.39, 0.35]
          ];
          starPoints.forEach(([px, py], i) => {
            const x1 = x + (px - 0.5) * size * 2;
            const y1 = y + (py - 0.5) * size * 2;
            if (i === 0) ctx.moveTo(x1, y1);
            else ctx.lineTo(x1, y1);
          });
          ctx.closePath();
          break;
        default:
          ctx.arc(x, y, size, 0, Math.PI * 2);
      }
      
      ctx.fill();
    };
    
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw sky background
      ctx.fillStyle = "#87CEEB";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw ground
      ctx.fillStyle = "#8B4513";
      ctx.fillRect(0, 420, canvas.width, 80);
      ctx.fillStyle = "#228B22";
      ctx.fillRect(0, 420, canvas.width, 20);
      
      // Draw player tower (right side)
      ctx.fillStyle = "#696969";
      ctx.fillRect(680, 300, 60, 120);
      ctx.fillStyle = "#808080";
      ctx.fillRect(690, 280, 40, 30);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 12px Arial";
      ctx.fillText("YOU", 695, 295);
      ctx.fillText(`${Math.floor(playerTowerHealth)}/${Math.floor(eloPoints)}`, 690, 315);
      
      // Draw enemy tower (left side)
      ctx.fillStyle = "#8B0000";
      ctx.fillRect(30, 300, 60, 120);
      ctx.fillStyle = "#A52A2A";
      ctx.fillRect(40, 280, 40, 30);
      ctx.fillStyle = "#fff";
      ctx.fillText("ENEMY", 45, 295);
      const enemyMaxHP = 50 + (currentLevel - 1) * 10;
      ctx.fillText(`${Math.floor(enemyTowerHealth)}/${enemyMaxHP}`, 40, 315);
      
      // Draw user troops (walking right)
      userTroops.forEach((troop) => {
        drawShape(troop.x, troop.y, 10, troop.color || "#4ECDC4", troop.shape || "circle");
        ctx.fillStyle = "#333";
        ctx.fillRect(troop.x - 12, troop.y - 18, 24, 4);
        ctx.fillStyle = "#4CAF50";
        ctx.fillRect(troop.x - 12, troop.y - 18, 24 * (troop.hitsRemaining / troop.maxHits), 4);
      });
      
      // Draw enemies (walking left) - with boss size support
      enemies.forEach((enemy) => {
        const size = (enemy.size || 1) * 12;
        drawShape(enemy.x, enemy.y, size, enemy.color || "#FF4444", enemy.shape || "circle");
        ctx.fillStyle = "#333";
        const barWidth = 28 * (enemy.size || 1);
        const barHeight = 4 * (enemy.size || 1);
        ctx.fillRect(enemy.x - barWidth/2, enemy.y - 20 - barHeight, barWidth, barHeight);
        ctx.fillStyle = "#f44336";
        ctx.fillRect(enemy.x - barWidth/2, enemy.y - 20 - barHeight, barWidth * (enemy.health / enemy.maxHealth), barHeight);
      });
      
      if (gameMode === "levelPlaying") {
        requestAnimationFrame(render);
      }
    };
    
    render();
  }, [gameMode, userTroops, enemies, playerTowerHealth, enemyTowerHealth, eloPoints, currentLevel]);

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">Rep Defense</h1>
        <Link
          href="/game/leaderboard"
          className="text-sm text-blue-500 underline"
        >
          View ELO Leaderboard →
        </Link>
      </div>
      
      {/* Game Stats */}
      <div className="grid grid-cols-5 gap-4 mb-4">
        <div className="bg-white border rounded p-3">
          <div className="text-sm text-gray-600"><strong>ELO</strong></div>
          <div className="text-xl font-bold">{displayEloPoints.toLocaleString()}</div>
          <p className="text-xs text-gray-500 mt-1">Exercise Points</p>
        </div>
        <div className="bg-white border rounded p-3">
          <div className="text-sm text-gray-600"><strong>GP</strong></div>
          <div className="text-xl font-bold">{displayGamePoints.toLocaleString()}</div>
          <p className="text-xs text-gray-500 mt-1">Game Points</p>
        </div>
        <div className="bg-white border rounded p-3">
          <CoinIcon size={20} className="text-yellow-600 mb-2" />
          <div className="text-xl font-bold text-yellow-600">{displayCoins.toLocaleString()}</div>
          <p className="text-xs text-gray-500 mt-1">Coins</p>
        </div>
        {(gameMode === "levelPlaying" || gameMode === "levelWon" || gameMode === "levelLost") && (
          <div className="bg-white border rounded p-3">
            <div className="text-sm text-gray-600">Level</div>
            <div className="text-xl font-bold">{currentLevel}</div>
          </div>
        )}
        {(gameMode === "levelPlaying" || gameMode === "levelWon" || gameMode === "levelLost") && (
          <div className="bg-white border rounded p-3">
            <div className="text-sm text-gray-600">Your Tower</div>
            <div className="text-xl font-bold">{Math.floor(playerTowerHealth)}</div>
          </div>
        )}
        {(gameMode === "levelPlaying" || gameMode === "levelWon" || gameMode === "levelLost") && (
          <div className="bg-white border rounded p-3">
            <div className="text-sm text-gray-600">Enemy Tower</div>
            <div className="text-xl font-bold">{Math.floor(enemyTowerHealth)}</div>
          </div>
        )}
      </div>

      {/* Level Select Screen */}
      {gameMode === "levelSelect" && (
        <div className="bg-white border rounded p-6 mb-4">
          <h2 className="text-2xl font-semibold mb-6">Select Game Mode</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-3">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="border rounded px-3 py-2 w-full"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Levels</h3>
            <div className="grid grid-cols-10 gap-2 max-h-96 overflow-y-auto p-2 border rounded">
              {Array.from({ length: 500 }, (_, i) => i + 1).map((level) => (
                <button
                  key={level}
                  onClick={() => startLevel(level)}
                  disabled={level > maxLevelUnlocked}
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm transition ${
                    level > maxLevelUnlocked
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
                  title={`Level ${level}`}
                >
                  {level}
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-2">Max unlocked: Level {maxLevelUnlocked}</p>
          </div>
        </div>
      )}

      {/* Game Playing */}
      {gameMode === "levelPlaying" && (
        <div className="bg-white border rounded p-4 mb-4">
          <div className="flex justify-between items-center mb-4">
            <div className="font-semibold">
              Level {currentLevel} - Wave: {currentWave} | Enemies: {enemies.length}
              {isBossLevel && <span className="ml-2 text-yellow-600 font-bold">⭐ BOSS LEVEL</span>}
            </div>
            <div className="flex gap-2">
              <select
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="border rounded px-2 py-1"
              >
                <option value={0.5}>0.5x</option>
                <option value={1}>1x</option>
                <option value={2}>2x</option>
                <option value={5}>5x</option>
                <option value={10}>10x</option>
                <option value={20}>20x</option>
                <option value={50}>50x</option>
                <option value={100}>100x</option>
                <option value={200}>200x</option>
              </select>
              <button
                onClick={() => setAutoPlay(!autoPlay)}
                className={`px-3 py-1 rounded ${autoPlay ? "bg-green-500 text-white" : "bg-gray-200"}`}
              >
                Auto: {autoPlay ? "ON" : "OFF"}
              </button>
              <button
                onClick={() => setGameMode("levelSelect")}
                className="px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600"
              >
                Exit
              </button>
            </div>
          </div>
          
          <canvas
            ref={canvasRef}
            width={800}
            height={500}
            className="border rounded mx-auto block"
          />
        </div>
      )}

      {/* Troop Shop */}
      {(gameMode === "levelPlaying" || gameMode === "infinityPlaying") && (
        <div className="bg-white border rounded p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Troop Shop</h2>
            <button
              onClick={() => {
                if (troopSortMode === "cheapest") setTroopSortMode("expensive");
                else if (troopSortMode === "expensive") setTroopSortMode("recent");
                else setTroopSortMode("cheapest");
              }}
              className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded border"
            >
              {troopSortMode === "cheapest" && "Cheapest →"}
              {troopSortMode === "expensive" && "Expensive →"}
              {troopSortMode === "recent" && "Recent →"}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {troopTypes
              .sort((a, b) => {
                if (troopSortMode === "cheapest") return a.cost - b.cost;
                if (troopSortMode === "expensive") return b.cost - a.cost;
                if (troopSortMode === "recent") {
                  const timeA = troopUsageTimes[a.id] || 0;
                  const timeB = troopUsageTimes[b.id] || 0;
                  return timeB - timeA; // Most recent first
                }
                return 0;
              })
              .map((troop) => {
              const difficultyMultiplier = {
                easy: 0.5,
                medium: 1.0,
                hard: 1.5,
              }[difficulty] || 1.0;
              const levelCostMultiplier = Math.pow(1.02, Math.max(0, currentLevel - 1));
              const scaledCost = Math.floor(troop.cost * difficultyMultiplier * levelCostMultiplier);
              const displayScaledCost = Math.round(scaledCost); // Round for display
              
              return (
                <div
                  key={troop.id}
                  className={`border rounded p-3 cursor-pointer ${
                    selectedTroop === troop.id ? "border-blue-500 bg-blue-50" : ""
                  }`}
                  onClick={() => setSelectedTroop(troop.id)}
                >
                  <div className="w-8 h-8 mx-auto mb-2 flex items-center justify-center">
                    <div 
                      className="w-6 h-6"
                      style={{ 
                        backgroundColor: troop.color || "#4ECDC4",
                        borderRadius: troop.shape === "circle" ? "50%" : "4px",
                        clipPath: troop.shape === "triangle" ? "polygon(50% 0%, 0% 100%, 100% 100%)" : 
                                   troop.shape === "star" ? "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)" : "none"
                      }}
                    />
                  </div>
                  <div className="font-semibold text-sm">{troop.name}</div>
                  <div className="text-xs text-gray-600">
                    Damage: {troop.damage} | Cost: {scaledCost} GP
                  </div>
                  <div className="text-xs text-gray-600">
                    Speed: {troop.attackSpeed}/s
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      purchaseTroop(troop.id);
                    }}
                    className="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 disabled:bg-gray-400"
                    disabled={gamePoints < scaledCost}
                  >
                    Buy ({scaledCost})
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Level Won */}
      {gameMode === "levelWon" && (
        <div className="bg-white border rounded p-6 mb-4">
          <h2 className="text-2xl font-bold mb-4">Level {currentLevel} Complete!</h2>
          <div className="mb-4 p-4 bg-yellow-50 rounded border border-yellow-200">
            <p className="text-lg font-semibold text-yellow-800">
              🎉 You won {lastCoinsEarned > 0 ? lastCoinsEarned : Math.floor(30 + (currentLevel - 1) * 6)} Coins!
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Total Coins: {displayCoins.toLocaleString()}
            </p>
          </div>
          <p className="mb-4">Great job! You've unlocked the next level.</p>
          <div className="flex gap-2">
            <button
              onClick={() => startLevel(currentLevel + 1)}
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
            >
              Next Level
            </button>
            <button
              onClick={() => setGameMode("levelSelect")}
              className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
            >
              Back to Menu
            </button>
          </div>
        </div>
      )}

      {/* Level Lost */}
      {gameMode === "levelLost" && (
        <div className="bg-white border rounded p-6 mb-4">
          <h2 className="text-2xl font-bold mb-4">Level {currentLevel} Failed!</h2>
          <p className="mb-4">Your base was destroyed. Try again!</p>
          <div className="flex gap-2">
            <button
              onClick={() => startLevel(currentLevel)}
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
            >
              Retry
            </button>
            <button
              onClick={() => setGameMode("levelSelect")}
              className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
            >
              Back to Menu
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gray-50 border rounded p-4">
        <h3 className="font-semibold mb-2">How to Play</h3>
        <ul className="text-sm text-gray-600 list-disc list-inside">
          <li><strong>Levels:</strong> Progress through 500 levels, each getting harder. Every 5 levels has a boss!</li>
          <li><strong>Bosses:</strong> Bigger, stronger enemies appear at levels 5, 10, 15, 20... After level 20, they become normal troops.</li>
          <li>Use points to buy troops that auto-fight enemies</li>
          <li>Protect your base from waves of enemies</li>
          <li>Win games to gain coins (rewards diminish if you farm the same level)</li>
          <li>Use 100x/200x speed and auto-play for convenience</li>
        </ul>
      </div>

      {/* Congratulations Animation */}
      {showCongrats && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50">
          <div className="animate-bounce text-6xl font-bold text-yellow-400 drop-shadow-lg">
            {congratsMessage}
          </div>
        </div>
      )}
    </div>
  );
}
