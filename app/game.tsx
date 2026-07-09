import MovementControls from '@/components/MovementControls';
import PlayerController from '@/components/PlayerController';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  LayoutChangeEvent,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');

const PLAYER_SIZE = 44;
const MOVE_STEP = 40;
const ANIM_DURATION = 130;

const DRONE_SIZE = 40;
const DRONE_TICK_MS = 160; // AI update frequency (base)

type Rect = { x: number; y: number; w: number; h: number };

export default function GameScreen() {
  const playerRef = useRef<any>(null);
  const [layout, setLayout] = useState({ width: WINDOW_WIDTH, height: WINDOW_HEIGHT });
  const [score, setScore] = useState(0);
  const [keyCollected, setKeyCollected] = useState(false);
  const [showKeyMessage, setShowKeyMessage] = useState(false);
  const keyMsgTimerRef = useRef<number | null>(null);

  const [gameOver, setGameOver] = useState(false);
  const [levelComplete, setLevelComplete] = useState(false);

  // terminal state
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [terminalCode, setTerminalCode] = useState('');
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalTimer, setTerminalTimer] = useState(0);

  // alarm / difficulty
  const [alarmTriggered, setAlarmTriggered] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Collect the key, enter the code, then reach the exit door to win.');
  const [highScore, setHighScore] = useState(0);

  // player logical position cache (updated when player finishes moving)
  const playerPosRef = useRef({ x: 0, y: 0 });

  // Compute playable bounds
  const bounds = useRef({ minX: 0, maxX: WINDOW_WIDTH - PLAYER_SIZE, minY: 0, maxY: WINDOW_HEIGHT - PLAYER_SIZE });

  // Drone: animated value for rendering and state ref for logic
  const droneAnim = useRef(new Animated.ValueXY({ x: 80, y: 140 })).current;
  const droneStateRef = useRef({ mode: 'patrol' as 'patrol' | 'pursue' | 'return', dir: 1, patrolLeft: 80, patrolRight: 260, homeX: 80, homeY: 140 });

  // adjustable AI parameters via refs so they can change at runtime
  const detectRadiusRef = useRef(420);
  const loseRadiusRef = useRef(520);
  const pursueStepRef = useRef(24);
  const patrolSpeedRef = useRef(20);

  useEffect(() => {
    activateKeepAwakeAsync();

    const loadHighScore = async () => {
      try {
        const saved = await AsyncStorage.getItem('cyberescape-high-score');
        if (saved) {
          setHighScore(Number(saved));
        }
      } catch (error) {
        console.log('Failed to load high score', error);
      }
    };

    loadHighScore();

    return () => {
      deactivateKeepAwake();
    };
  }, []);

  useEffect(() => {
    if (keyCollected) {
      setExitOpen(true);
      setStatusMessage('The exit is now unlocked. Reach the exit door to win!');
      detectRadiusRef.current = 360;
      loseRadiusRef.current = 460;
      pursueStepRef.current = 20;
      patrolSpeedRef.current = 16;
      setTimeout(() => {
        checkExitReached(playerPosRef.current.x, playerPosRef.current.y);
      }, 0);
    }
  }, [keyCollected]);

  useEffect(() => {
    // Set initial player position at bottom center once layout known
    const startX = Math.max(0, (layout.width - PLAYER_SIZE) / 2);
    const startY = Math.max(0, layout.height - PLAYER_SIZE - 140); // leave room for controls
    playerPosRef.current = { x: startX, y: startY };

    // update bounds
    bounds.current = {
      minX: 0,
      maxX: Math.max(0, layout.width - PLAYER_SIZE),
      minY: 0,
      maxY: Math.max(0, layout.height - PLAYER_SIZE - 120),
    };

    // configure drone patrol region relative to layout
    const patrolY = Math.max(70, Math.floor(layout.height * 0.18));
    const left = Math.max(60, Math.floor(layout.width * 0.22));
    const right = Math.max(left + 140, Math.floor(layout.width * 0.72));

    droneStateRef.current = { mode: 'patrol', dir: 1, patrolLeft: left, patrolRight: right, homeX: left, homeY: patrolY };
    droneAnim.setValue({ x: left, y: patrolY });

    // initialize player controller to start position once mounted
    if (playerRef.current) {
      const p = playerRef.current.getPosition?.() || { x: 0, y: 0 };
      playerRef.current.moveBy?.(startX - p.x, startY - p.y);
    }
  }, [layout.width, layout.height]);

  // Level geometry (placed relative to gameArea top-left)
  function makeLevelGeometry(): { walls: Rect[]; key: Rect; exit: Rect; terminal: Rect } {
    const gw = layout.width;
    const gh = Math.max(0, layout.height - 120); // reserve room for controls/hud

    const walls: Rect[] = [
      { x: 0, y: 0, w: gw, h: 12 },
      { x: 0, y: gh - 12, w: gw, h: 12 },
      { x: 0, y: 0, w: 12, h: gh },
      { x: gw - 12, y: 0, w: 12, h: gh },
      { x: Math.floor(gw * 0.35), y: 80, w: 12, h: Math.floor(gh * 0.28) },
      { x: Math.floor(gw * 0.35), y: Math.floor(gh * 0.40) + 80, w: Math.floor(gw * 0.22), h: 12 },
      { x: Math.floor(gw * 0.7), y: Math.floor(gh * 0.25), w: 14, h: 120 },
    ];

    const key: Rect = { x: 28 + 40, y: 28 + 40, w: 28, h: 18 };
    const exit: Rect = { x: Math.max(24, gw - 140), y: 28, w: 72, h: 92 };
    // terminal sits near center-right
    const terminal: Rect = { x: Math.floor(gw * 0.57), y: Math.floor(gh * 0.65), w: 44, h: 44 };

    return { walls, key, exit, terminal };
  }

  function clamp(v: number, a: number, b: number) {
    return Math.max(a, Math.min(b, v));
  }

  function rectsIntersect(a: Rect, b: Rect) {
    return !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
  }

  function willCollide(targetX: number, targetY: number) {
    const { walls, exit } = makeLevelGeometry();
    const playerRect: Rect = { x: targetX, y: targetY, w: PLAYER_SIZE, h: PLAYER_SIZE };
    for (const w of walls) {
      if (rectsIntersect(playerRect, w)) return true;
    }
    if (!exitOpen && rectsIntersect(playerRect, exit)) return true;
    return false;
  }

  function checkKeyCollect(targetX: number, targetY: number) {
    if (keyCollected) return;
    const { key } = makeLevelGeometry();
    const playerRect: Rect = { x: targetX, y: targetY, w: PLAYER_SIZE, h: PLAYER_SIZE };
    if (rectsIntersect(playerRect, key)) {
      setKeyCollected(true);
      setScore((prev) => prev + 100);

      // show temporary message for 2 seconds
      setShowKeyMessage(true);
      if (keyMsgTimerRef.current) {
        clearTimeout(keyMsgTimerRef.current as any);
      }
      keyMsgTimerRef.current = setTimeout(() => {
        setShowKeyMessage(false);
        keyMsgTimerRef.current = null;
      }, 2000) as unknown as number;
    }
  }

  const saveHighScore = async (value: number) => {
    try {
      await AsyncStorage.setItem('cyberescape-high-score', String(value));
      setHighScore(value);
    } catch (error) {
      console.log('Failed to save high score', error);
    }
  };

  function checkExitReached(targetX: number, targetY: number) {
    if (levelComplete || gameOver) return;
    const { exit } = makeLevelGeometry();
    const playerRect: Rect = { x: targetX, y: targetY, w: PLAYER_SIZE, h: PLAYER_SIZE };
    const exitHitbox: Rect = { x: exit.x - 10, y: exit.y - 10, w: exit.w + 20, h: exit.h + 20 };
    if (keyCollected && exitOpen && rectsIntersect(playerRect, exitHitbox)) {
      const nextScore = score + 250;
      setLevelComplete(true);
      setScore(nextScore);
      saveHighScore(Math.max(highScore, nextScore));
    }
  }

  useEffect(() => {
    if (!levelComplete && !gameOver) {
      checkExitReached(playerPosRef.current.x, playerPosRef.current.y);
    }
  }, [score, keyCollected, exitOpen, levelComplete, gameOver]);

  function checkTerminalInteraction(targetX: number, targetY: number) {
    if (terminalOpen || gameOver) return;
    const { terminal } = makeLevelGeometry();
    const playerRect: Rect = { x: targetX, y: targetY, w: PLAYER_SIZE, h: PLAYER_SIZE };
    if (rectsIntersect(playerRect, terminal)) {
      // open terminal
      openTerminal();
    }
  }

  useEffect(() => {
    if (levelComplete || gameOver) return;
    checkExitReached(playerPosRef.current.x, playerPosRef.current.y);
  }, [keyCollected, exitOpen, levelComplete, gameOver, layout.width, layout.height]);

  function openTerminal() {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setTerminalCode(code);
    setTerminalInput('');
    setTerminalTimer(10);
    setTerminalOpen(true);
    // start countdown handled by effect below
  }

  useEffect(() => {
    if (!terminalOpen) return;
    let tick: any = null;
    tick = setInterval(() => {
      setTerminalTimer((t) => {
        if (t <= 1) {
          clearInterval(tick);
          // timeout -> alarm
          onTerminalTimeout();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(tick);
  }, [terminalOpen]);

  // cleanup key timer on unmount
  useEffect(() => {
    return () => {
      if (keyMsgTimerRef.current) {
        clearTimeout(keyMsgTimerRef.current as any);
        keyMsgTimerRef.current = null;
      }
    };
  }, []);

  function onTerminalTimeout() {
    setTerminalOpen(false);
    setTerminalInput('');
    setTerminalTimer(0);
  }

  function submitCode() {
    const isCorrect = terminalInput === terminalCode;
    setTerminalOpen(false);
    setTerminalInput('');
    setTerminalTimer(0);

    if (isCorrect) {
      setExitOpen(true);
      setStatusMessage('Code accepted! The exit is unlocked. Reach the exit door to win!');
      setScore((prev) => prev + 150);
      setTimeout(() => {
        checkExitReached(playerPosRef.current.x, playerPosRef.current.y);
      }, 0);
    } else {
      setStatusMessage('Wrong code. Try again or keep exploring.');
    }
  }

  function triggerAlarm() {
    setAlarmTriggered(true);
    // make drone more aggressive only slightly after alarms
    detectRadiusRef.current = Math.min(260, Math.floor(detectRadiusRef.current * 1.1));
    loseRadiusRef.current = Math.min(360, Math.floor(loseRadiusRef.current * 1.1));
    pursueStepRef.current = Math.min(44, Math.floor(pursueStepRef.current * 1.2));
    patrolSpeedRef.current = Math.min(34, Math.floor(patrolSpeedRef.current * 1.15));
  }

  function checkDroneCollision() {
    // read drone and player positions and test intersection
    droneAnim.stopAnimation((d: { x: number; y: number }) => {
      const playerRect: Rect = { x: playerPosRef.current.x, y: playerPosRef.current.y, w: PLAYER_SIZE, h: PLAYER_SIZE };
      const droneRect: Rect = { x: d.x, y: d.y, w: DRONE_SIZE, h: DRONE_SIZE };
      if (rectsIntersect(playerRect, droneRect)) {
        setGameOver(true);
      }
    });
  }

  // Handler that the PlayerController will call after completing a move
  function onPlayerMove(x: number, y: number) {
    playerPosRef.current = { x, y };
    checkKeyCollect(x, y);
    checkExitReached(x, y);
    checkTerminalInteraction(x, y);
    checkDroneCollision();
  }

  async function moveBy(dx: number, dy: number) {
    if (gameOver) return;
    // read current player logical position
    const cur = playerRef.current?.getPosition?.() ?? playerPosRef.current;
    const rawX = cur.x + dx;
    const rawY = cur.y + dy;

    const targetX = clamp(rawX, bounds.current.minX, bounds.current.maxX);
    const targetY = clamp(rawY, bounds.current.minY, bounds.current.maxY);

    // Collision detection against walls. If moving would intersect a wall, cancel move.
    if (willCollide(targetX, targetY)) {
      // Attempt sliding along one axis: try X-only then Y-only
      if (!willCollide(targetX, cur.y)) {
        const deltaX = targetX - cur.x;
        playerRef.current?.moveBy?.(deltaX, 0);
        return;
      } else if (!willCollide(cur.x, targetY)) {
        const deltaY = targetY - cur.y;
        playerRef.current?.moveBy?.(0, deltaY);
        return;
      }
      // otherwise do nothing (blocked)
      return;
    }

    // allowed: move by delta
    playerRef.current?.moveBy?.(targetX - cur.x, targetY - cur.y);
    setScore((prev) => prev + 1);
  }

  function onUp() {
    moveBy(0, -MOVE_STEP);
  }
  function onDown() {
    moveBy(0, MOVE_STEP);
  }
  function onLeft() {
    moveBy(-MOVE_STEP, 0);
  }
  function onRight() {
    moveBy(MOVE_STEP, 0);
  }

  function onLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    setLayout({ width, height });
  }

  const { walls, key, exit, terminal } = makeLevelGeometry();

  // Drone AI loop
  useEffect(() => {
    if (gameOver || terminalOpen) return;
    const interval = setInterval(() => {
      // read current drone pos and player pos
      droneAnim.stopAnimation((d: { x: number; y: number }) => {
        const ds = droneStateRef.current;
        const player = playerPosRef.current;

        // compute centers for distance
        const droneCenter = { x: d.x + DRONE_SIZE / 2, y: d.y + DRONE_SIZE / 2 };
        const playerCenter = { x: player.x + PLAYER_SIZE / 2, y: player.y + PLAYER_SIZE / 2 };
        const dx = playerCenter.x - droneCenter.x;
        const dy = playerCenter.y - droneCenter.y;
        const dist = Math.hypot(dx, dy);

        const DETECT_RADIUS = detectRadiusRef.current;
        const LOSE_RADIUS = loseRadiusRef.current;

        // State transitions
        if (ds.mode === 'patrol') {
          if (dist < DETECT_RADIUS) {
            ds.mode = 'pursue';
          }
        } else if (ds.mode === 'pursue') {
          if (dist > LOSE_RADIUS) {
            ds.mode = 'return';
          }
        } else if (ds.mode === 'return') {
          // if close enough to home, resume patrol
          const homeDist = Math.abs(d.x - ds.homeX) + Math.abs(d.y - ds.homeY);
          if (homeDist < 8) ds.mode = 'patrol';
        }

        // Decide target
        let target = { x: d.x, y: d.y };
        if (ds.mode === 'patrol') {
          // move horizontally between patrolLeft and patrolRight
          const speed = patrolSpeedRef.current; // pixels per tick
          let nextX = d.x + ds.dir * speed;
          if (nextX < ds.patrolLeft) {
            nextX = ds.patrolLeft;
            ds.dir = 1;
          } else if (nextX > ds.patrolRight) {
            nextX = ds.patrolRight;
            ds.dir = -1;
          }
          target.x = nextX;
          target.y = ds.homeY;
        } else if (ds.mode === 'pursue') {
          // move toward player (simple proportional step)
          const step = pursueStepRef.current; // pixels per tick
          const angle = Math.atan2(dy, dx);
          target.x = d.x + Math.cos(angle) * step;
          target.y = d.y + Math.sin(angle) * step;
        } else if (ds.mode === 'return') {
          // go back to homeX/homeY
          const step = pursueStepRef.current;
          const rx = ds.homeX - d.x;
          const ry = ds.homeY - d.y;
          const rdist = Math.hypot(rx, ry) || 1;
          target.x = d.x + (rx / rdist) * step;
          target.y = d.y + (ry / rdist) * step;
        }

        // clamp target to area
        const clampedX = clamp(target.x, 12, Math.max(12, layout.width - DRONE_SIZE - 12));
        const clampedY = clamp(target.y, 12, Math.max(12, layout.height - DRONE_SIZE - 160));

        Animated.timing(droneAnim, { toValue: { x: clampedX, y: clampedY }, duration: DRONE_TICK_MS - 20, useNativeDriver: true }).start(() => {
          // after moving check collision
          droneAnim.stopAnimation((nd: { x: number; y: number }) => {
            const playerRect: Rect = { x: playerPosRef.current.x, y: playerPosRef.current.y, w: PLAYER_SIZE, h: PLAYER_SIZE };
            const droneRect: Rect = { x: nd.x, y: nd.y, w: DRONE_SIZE, h: DRONE_SIZE };
            if (rectsIntersect(playerRect, droneRect)) {
              setGameOver(true);
            }
          });
        });
      });
    }, DRONE_TICK_MS);

    return () => clearInterval(interval);
  }, [layout.width, layout.height, gameOver, terminalOpen]);

  function restart() {
    // reset player
    const startX = Math.max(0, (layout.width - PLAYER_SIZE) / 2);
    const startY = Math.max(0, layout.height - PLAYER_SIZE - 140);
    const cur = playerRef.current?.getPosition?.() ?? { x: 0, y: 0 };
    playerRef.current?.moveBy?.(startX - cur.x, startY - cur.y);
    playerPosRef.current = { x: startX, y: startY };

    // reset score and key
    setScore(0);
    setKeyCollected(false);
    setShowKeyMessage(false);
    if (keyMsgTimerRef.current) {
      clearTimeout(keyMsgTimerRef.current as any);
      keyMsgTimerRef.current = null;
    }

    // reset terminal
    setTerminalOpen(false);
    setTerminalCode('');
    setTerminalInput('');
    setTerminalTimer(0);
    setAlarmTriggered(false);
    setExitOpen(false);
    setLevelComplete(false);
    setStatusMessage('Collect the key, enter the code, then reach the exit door to win.');
    detectRadiusRef.current = 420;
    loseRadiusRef.current = 520;
    pursueStepRef.current = 24;
    patrolSpeedRef.current = 20;

    // reset drone
    const ds = droneStateRef.current;
    ds.mode = 'patrol';
    ds.dir = 1;
    ds.homeX = ds.patrolLeft;
    ds.homeY = ds.homeY; // unchanged
    droneAnim.setValue({ x: ds.patrolLeft, y: ds.homeY });

    setGameOver(false);
  }

  return (
    <SafeAreaView style={styles.safe} onLayout={onLayout}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View style={styles.container}>
        <View style={styles.bgPurple} />
        <View style={styles.bgBlue} />

        <View style={styles.hud}>
          <Text style={styles.hudText}>Level 1</Text>
          <Text style={styles.hudText}>Score: {score}</Text>
        </View>

        <View style={styles.statusBar}>
          <Text style={styles.statusText}>{statusMessage}</Text>
        </View>

        {/* Game area (player rendered absolutely inside here) */}
        <View style={styles.gameArea} pointerEvents="box-none">
          {/* Render walls */}
          {walls.map((w, i) => (
            <View
              key={`w-${i}`}
              style={[
                styles.wall,
                {
                  left: w.x,
                  top: w.y,
                  width: w.w,
                  height: w.h,
                },
              ]}
            />
          ))}

          {/* Render exit door */}
          <View style={[styles.exit, { left: exit.x, top: exit.y, width: exit.w, height: exit.h }]}>
            <View style={[styles.exitInner, exitOpen ? styles.exitOpenInner : null]} />
          </View>

          {/* Render key if not collected */}
          {!keyCollected && (
            <View style={[styles.key, { left: key.x, top: key.y, width: key.w, height: key.h }]}>
              <View style={styles.keyStripe} />
            </View>
          )}

          {/* Render terminal */}
          <View style={[styles.terminal, { left: terminal.x, top: terminal.y, width: terminal.w, height: terminal.h }]} />

          {/* Render drone */}
          <Animated.View style={[styles.drone, { transform: droneAnim.getTranslateTransform() }]} />

          {/* Player (reusable controller component) */}
          <PlayerController
            ref={playerRef}
            size={PLAYER_SIZE}
            step={MOVE_STEP}
            bounds={bounds.current}
            onPositionChange={onPlayerMove}
          />

          {/* Key collected HUD (temporary message) */}
          {showKeyMessage && (
            <View style={styles.keyNotif} pointerEvents="none">
              <Text style={styles.keyNotifText}>Key Collected</Text>
            </View>
          )}

          {/* Terminal popup */}
          {terminalOpen && (
            <View style={styles.terminalPopup}>
              <Text style={styles.terminalTitle}>Hacking Terminal</Text>
              <Text style={styles.terminalCode}>Code: {terminalCode}</Text>
              <Text style={styles.terminalTimer}>Time: {terminalTimer}s</Text>
              <TextInput
                autoFocus
                style={styles.terminalInput}
                value={terminalInput}
                onChangeText={setTerminalInput}
                keyboardType="numeric"
                maxLength={4}
                placeholder="Enter 4-digit code"
                placeholderTextColor="#9aa6ff"
              />
              <View style={{ flexDirection: 'row', marginTop: 12 }}>
                <TouchableOpacity style={styles.terminalButton} onPress={submitCode}>
                  <Text style={styles.terminalButtonText}>Submit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.terminalButton, { marginLeft: 12 }]} onPress={() => { setTerminalOpen(false); setTerminalInput(''); }}>
                  <Text style={styles.terminalButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Alarm visual */}
          {alarmTriggered && (
            <View style={styles.alarmOverlay} pointerEvents="none">
              <Text style={styles.alarmText}>ALARM!</Text>
            </View>
          )}

          {/* Level complete overlay */}
          {levelComplete && (
            <View style={styles.gameOverOverlay}>
              <Text style={styles.gameOverText}>Level Cleared</Text>
              <Text style={styles.scoreText}>Score: {score}</Text>
              <TouchableOpacity style={styles.restartButton} onPress={restart}>
                <Text style={styles.restartText}>Restart</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Game Over overlay */}
          {gameOver && (
            <View style={styles.gameOverOverlay}>
              <Text style={styles.gameOverText}>Game Over</Text>
              <Text style={styles.scoreText}>Final Score: {score}</Text>
              <TouchableOpacity style={styles.restartButton} onPress={restart}>
                <Text style={styles.restartText}>Restart</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Movement controls bottom-left */}
        <View style={styles.controls} pointerEvents="box-none">
          <MovementControls onUp={onUp} onDown={onDown} onLeft={onLeft} onRight={onRight} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#06040a' },
  container: {
    flex: 1,
    backgroundColor: '#08060b',
    position: 'relative',
  },
  bgPurple: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    right: -80,
    top: -40,
    backgroundColor: '#1a0633',
    opacity: 0.95,
  },
  bgBlue: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: 180,
    left: -120,
    bottom: -80,
    backgroundColor: '#001830',
    opacity: 0.95,
  },
  hud: {
    paddingTop: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hudText: { color: '#c7f9ff', fontSize: 16, fontWeight: '700' },
  statusBar: {
    marginHorizontal: 16,
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(4, 20, 40, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.35)',
  },
  statusText: {
    color: '#e0f2fe',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  gameArea: {
    flex: 1,
    // make sure children can position absolutely within this area
    overflow: 'hidden',
  },
  controls: {
    position: 'absolute',
    bottom: 22,
    left: 18,
  },

  // neon wall style
  wall: {
    position: 'absolute',
    backgroundColor: 'rgba(20,255,200,0.07)',
    borderWidth: 2,
    borderColor: 'rgba(0,255,200,0.95)',
    shadowColor: '#00ffd1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.85,
    shadowRadius: 12,
  },

  exit: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#ff4dff',
    backgroundColor: 'rgba(255,77,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exitInner: {
    width: '70%',
    height: '80%',
    backgroundColor: '#ff4dff',
    opacity: 0.9,
  },
  exitOpenInner: {
    backgroundColor: '#64ffda',
    opacity: 0.95,
  },

  key: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,0,0.06)',
    borderWidth: 1,
    borderColor: '#fef08a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyStripe: {
    width: '80%',
    height: 6,
    backgroundColor: '#fef08a',
  },

  terminal: {
    position: 'absolute',
    backgroundColor: 'rgba(80,70,200,0.16)',
    borderWidth: 2,
    borderColor: '#9aa6ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  terminalPopup: {
    position: 'absolute',
    left: '10%',
    right: '10%',
    top: '30%',
    backgroundColor: '#07061a',
    borderWidth: 1,
    borderColor: '#7c3aed',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  terminalTitle: { color: '#cbd5ff', fontSize: 18, fontWeight: '800', marginBottom: 8 },
  terminalCode: { color: '#9fffb3', fontSize: 22, fontWeight: '900', marginBottom: 6 },
  terminalTimer: { color: '#bfe1ff', marginBottom: 10 },
  terminalInput: {
    width: '80%',
    height: 44,
    borderWidth: 1,
    borderColor: '#5eead4',
    color: '#e6f7ff',
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  terminalButton: {
    backgroundColor: '#121024',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#60a5fa',
  },
  terminalButtonText: { color: '#c7f9ff', fontWeight: '700' },

  keyNotif: {
    position: 'absolute',
    alignSelf: 'center',
    top: 40,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#60a5fa',
  },
  keyNotifText: { color: '#c7f9ff', fontWeight: '800' },

  alarmOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,0,60,0.12)',
  },
  alarmText: { color: '#ffdde6', fontSize: 44, fontWeight: '900', textShadowColor: '#ff4d4d', textShadowRadius: 6 },

  drone: {
    position: 'absolute',
    width: DRONE_SIZE,
    height: DRONE_SIZE,
    borderRadius: 8,
    backgroundColor: '#ff4d4d',
    borderWidth: 2,
    borderColor: '#ff9bd1',
    shadowColor: '#ff4dff',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
  },

  gameOverOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  gameOverText: {
    color: '#ffccd5',
    fontSize: 36,
    fontWeight: '900',
    marginBottom: 12,
    textShadowColor: '#ff4dff',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  restartButton: {
    backgroundColor: '#121024',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#60a5fa',
  },
  restartText: { color: '#c7f9ff', fontWeight: '700' },
});
