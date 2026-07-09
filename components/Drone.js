import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

// Simple Drone with FSM (patrol -> chase -> search -> return)
export default function Drone({ id, start, patrolPoints = [], playerPos, onAlarm, cellSize = 24 }) {
  const [pos, setPos] = useState(start);
  const [state, setState] = useState('patrol');
  const patrolIndex = useRef(0);
  const lastKnown = useRef(null);

  useEffect(() => {
    let stopped = false;
    const tick = () => {
      if (stopped) return;
      if (state === 'patrol') {
        const target = patrolPoints[patrolIndex.current] || start;
        moveToward(target);
        // simple detection: if player in same row/col and within 4 cells -> detect
        if ((playerPos.x === pos.x && Math.abs(playerPos.y - pos.y) <= 4) || (playerPos.y === pos.y && Math.abs(playerPos.x - pos.x) <= 4)) {
          lastKnown.current = playerPos;
          setState('chase');
          onAlarm && onAlarm();
        }
      } else if (state === 'chase') {
        moveToward(playerPos);
        if (playerPos.x === pos.x && playerPos.y === pos.y) {
          // caught
          onAlarm && onAlarm('caught');
        }
        // if lost sight
        if (Math.abs(playerPos.x - pos.x) > 6 && Math.abs(playerPos.y - pos.y) > 6) {
          setState('search');
        }
      } else if (state === 'search') {
        if (lastKnown.current) moveToward(lastKnown.current);
        // after some time return
        setTimeout(() => setState('return'), 1200);
      } else if (state === 'return') {
        moveToward(start);
        if (pos.x === start.x && pos.y === start.y) {
          setState('patrol');
        }
      }
    };
    const idt = setInterval(tick, 400);
    return () => { stopped = true; clearInterval(idt); };

    function moveToward(target) {
      if (!target) return;
      const dx = Math.sign(target.x - pos.x);
      const dy = Math.sign(target.y - pos.y);
      // prefer horizontal then vertical
      const nx = pos.x + (dx !== 0 ? dx : 0);
      const ny = pos.y + (dx !== 0 ? 0 : (dy !== 0 ? dy : 0));
      setPos(p => ({ x: nx, y: ny }));
      if (state === 'patrol') {
        if (target.x === nx && target.y === ny) patrolIndex.current = (patrolIndex.current + 1) % Math.max(1, patrolPoints.length);
      }
    }
  }, [state, pos, playerPos]);

  return (
    <View style={[styles.container, { left: pos.x * cellSize, top: pos.y * cellSize, width: cellSize, height: cellSize }]}>
      <View style={styles.drone} />
      {/* vision cone */}
      <View style={[styles.vision, { width: cellSize * 4, height: cellSize * 2, left: cellSize }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute' },
  drone: {
    flex: 1,
    backgroundColor: '#ffd100',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#fff4b3',
    shadowColor: '#ffd100',
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
  vision: {
    position: 'absolute',
    backgroundColor: 'rgba(255,200,0,0.12)',
    transform: [{ skewX: '20deg' }],
  },
});
