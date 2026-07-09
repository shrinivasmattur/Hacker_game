import { useEffect, useRef, useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Button from '../components/Button';
import Door from '../components/Door';
import Drone from '../components/Drone';
import HUD from '../components/HUD';
import Inventory from '../components/Inventory';
import Player from '../components/Player';
import Wall from '../components/Wall';

const GRID = 15;
const CELL = 28; // cell size in px

export default function GameScreen() {
  const [player, setPlayer] = useState({ x: Math.floor(GRID/2), y: GRID - 1 }); // start at bottom center
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [alarm, setAlarm] = useState(false);
  const [inventory, setInventory] = useState({ keyCard: 0, emp: 0, health: 0 });
  const [doorOpen, setDoorOpen] = useState(false);
  const [hackModal, setHackModal] = useState({ open: false, password: '', timeLeft: 0 });

  // Build walls - at least 15 walls for Level 1 (reusable Wall component will render them)
  const walls = useRef([
    { x: 5, y: 14 }, { x: 6, y: 14 }, { x: 7, y: 12 }, { x: 2, y: 10 }, { x: 3, y: 10 },
    { x: 4, y: 10 }, { x: 8, y: 9 }, { x: 9, y: 9 }, { x: 10, y: 9 }, { x: 0, y: 7 },
    { x: 1, y: 7 }, { x: 2, y: 7 }, { x: 12, y: 6 }, { x: 12, y: 7 }, { x: 12, y: 8 },
    { x: 7, y: 5 }, { x: 8, y: 5 }, { x: 9, y: 5 }
  ]).current;

  // Items: keycard, emp, health at certain positions
  const items = useRef([
    { type: 'keyCard', x: 13, y: 0 },
    { type: 'emp', x: 0, y: 0 },
    { type: 'health', x: 7, y: 13 }
  ]).current;

  // door and terminal positions
  const doorPos = useRef({ x: 14, y: 7 }).current;
  const terminalPos = useRef({ x: 6, y: 6 }).current;

  // drones
  const [drones, setDrones] = useState([
    { id: 'd1', start: { x: 3, y: 3 }, patrol: [{ x: 3, y: 3 }, { x: 6, y: 3 }, { x: 6, y: 6 }] },
    { id: 'd2', start: { x: 10, y: 11 }, patrol: [{ x: 10, y: 11 }, { x: 12, y: 11 }, { x: 12, y: 9 }] },
  ]);

  useEffect(() => {
    if (alarm) {
      // simple alarm timer
      const t = setTimeout(() => setAlarm(false), 6000);
      return () => clearTimeout(t);
    }
  }, [alarm]);

  function isBlocked(x,y){
    // bounds
    if (x < 0 || y < 0 || x >= GRID || y >= GRID) return true;
    // wall
    if (walls.some(w => w.x === x && w.y === y)) return true;
    // door closed
    if (!doorOpen && doorPos.x === x && doorPos.y === y) return true;
    return false;
  }

  function move(dx, dy){
    const nx = player.x + dx;
    const ny = player.y + dy;
    if (isBlocked(nx, ny)) return; // collision detection: cannot walk through walls or closed door
    setPlayer({ x: nx, y: ny });
    // check collect
    for(let i=0;i<items.length;i++){
      const it = items[i];
      if (it && it.x === nx && it.y === ny){
        // collect
        const newInv = { ...inventory };
        newInv[it.type === 'keyCard' ? 'keyCard' : (it.type === 'emp' ? 'emp' : 'health')] += 1;
        setInventory(newInv);
        setScore(s => s + 25);
        items.splice(i,1);
        break;
      }
    }
    // terminal
    if (terminalPos.x === nx && terminalPos.y === ny) openHacking();
    // door
    if (doorPos.x === nx && doorPos.y === ny && doorOpen) {
      // exit reached
      setScore(s => s + 100);
      setLevel(l => l + 1);
      // simple reset
      resetLevel();
    }
  }

  function resetLevel(){
    setPlayer({ x: Math.floor(GRID/2), y: GRID - 1 });
    setDoorOpen(false);
    // (could repopulate items/walls per level)
  }

  function useItem(type){
    const have = inventory[type];
    if (!have) return;
    const newInv = { ...inventory, [type]: inventory[type] - 1 };
    setInventory(newInv);
    if (type === 'emp') {
      // stun drones (simple): move them back to start
      setDrones(drs => drs.map(d => ({ ...d, start: d.start })));
      setScore(s => s + 20);
    }
    if (type === 'health') {
      setLives(l => Math.min(5, l + 1));
    }
    if (type === 'keyCard') {
      setDoorOpen(true);
    }
  }

  function openHacking(){
    const pass = Math.random().toString(36).substring(2, 8).toUpperCase();
    setHackModal({ open: true, password: pass, timeLeft: 10 });
    // start countdown
    const t = setInterval(() => {
      setHackModal(h => {
        if (!h.open) { clearInterval(t); return h; }
        if (h.timeLeft <= 1) { clearInterval(t); setHackModal(s => ({ ...s, open: false })); setAlarm(true); return { ...h, timeLeft: 0 }; }
        return { ...h, timeLeft: h.timeLeft - 1 };
      });
    }, 1000);
  }

  function onHackAttempt(input){
    if (input === hackModal.password) {
      // success: unlock door (open next area)
      setDoorOpen(true);
      setScore(s => s + 50);
      setHackModal({ open: false, password: '', timeLeft: 0 });
    } else {
      setHackModal({ open: false, password: '', timeLeft: 0 });
      setAlarm(true);
    }
  }

  function onDroneAlarm(ev){
    if (ev === 'caught'){
      // game over
      Alert.alert('Caught', 'A drone caught you! Game Over');
      setLives(l => l - 1);
      resetLevel();
    } else {
      setAlarm(true);
    }
  }

  // rendering grid area
  const areaStyle = { width: GRID * CELL, height: GRID * CELL, backgroundColor: '#07101a', borderColor: '#00303a', borderWidth: 2 };

  return (
    <View style={styles.screen}>
      <HUD score={score} level={level} lives={lives} />
      <Inventory items={inventory} />

      <View style={[styles.areaWrap]}>
        <View style={[areaStyle, styles.grid]}>
          {/* walls */}
          {walls.map((w,i) => <Wall key={`w${i}`} x={w.x} y={w.y} cellSize={CELL} />)}

          {/* items */}
          {items.map((it, idx) => (
            <View key={'it'+idx} style={[styles.item, { left: it.x * CELL, top: it.y * CELL, width: CELL, height: CELL }]}>
              <Text style={{ color: '#001', fontWeight: '700' }}>{it.type === 'keyCard' ? 'K' : (it.type === 'emp' ? 'E' : 'H')}</Text>
            </View>
          ))}

          {/* door */}
          <Door x={doorPos.x} y={doorPos.y} cellSize={CELL} open={doorOpen} />

          {/* terminal */}
          <View style={[styles.terminal, { left: terminalPos.x * CELL, top: terminalPos.y * CELL, width: CELL, height: CELL }]}>
            <Text style={{ color: '#002', fontWeight: '700' }}>!</Text>
          </View>

          {/* player */}
          <Player x={player.x} y={player.y} cellSize={CELL} />

          {/* drones */}
          {drones.map(d => (
            <Drone key={d.id} id={d.id} start={d.start} patrolPoints={d.patrol} playerPos={player} onAlarm={onDroneAlarm} cellSize={CELL} />
          ))}

        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <View style={{ flexDirection: 'row' }}>
          <Button label={'Up'} onPress={() => move(0, -1)} />
        </View>
        <View style={{ flexDirection: 'row' }}>
          <Button label={'Left'} onPress={() => move(-1, 0)} />
          <Button label={'Down'} onPress={() => move(0, 1)} />
          <Button label={'Right'} onPress={() => move(1, 0)} />
        </View>
        <View style={{ flexDirection: 'row' }}>
          <Button label={'Use Key'} onPress={() => useItem('keyCard')} />
          <Button label={'Use EMP'} onPress={() => useItem('emp')} />
          <Button label={'Use HP'} onPress={() => useItem('health')} />
        </View>
      </View>

      {/* Hacking modal */}
      <Modal visible={hackModal.open} transparent animationType="fade">
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <Text style={{ color: '#aefcff', marginBottom: 8 }}>CYBER HACK</Text>
            <Text style={{ color: '#dff' }}>Type password: {hackModal.password}</Text>
            <Text style={{ color: '#dff' }}>Time left: {hackModal.timeLeft}s</Text>
            <HackInput onSubmit={onHackAttempt} />
          </View>
        </View>
      </Modal>

      {/* Alarm indicator */}
      {alarm && <View style={styles.alarm}><Text style={styles.alarmText}>ALARM</Text></View>}

    </View>
  );
}

function HackInput({ onSubmit }){
  const [v,setV] = useState('');
  return (
    <View style={{ marginTop: 12 }}>
      <TextInput placeholder="PASSWORD" value={v} onChangeText={setV} style={{ backgroundColor: '#001', color: '#fff', padding: 8, borderRadius: 6, marginBottom: 8 }} />
      <TouchableOpacity onPress={() => { onSubmit(v.toUpperCase()); setV(''); }} style={{ backgroundColor: '#0ff', padding: 8, borderRadius: 6, alignItems: 'center' }}>
        <Text style={{ fontWeight: '700' }}>SUBMIT</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#001219', alignItems: 'center', paddingTop: 6 },
  areaWrap: { marginTop: 120 },
  grid: { position: 'relative', overflow: 'hidden' },
  controls: { position: 'absolute', bottom: 24, left: 12, right: 12, alignItems: 'center', justifyContent: 'center' },
  item: { position: 'absolute', alignItems: 'center', justifyContent: 'center', backgroundColor: '#7effc8', borderRadius: 3, borderWidth: 1, borderColor: '#cfffeb' },
  terminal: { position: 'absolute', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffb3ff', borderRadius: 2, borderWidth: 1, borderColor: '#ffd3ff' },
  modalWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalCard: { width: 300, padding: 16, backgroundColor: '#041018', borderRadius: 8, borderWidth: 1, borderColor: '#00f7ff' },
  alarm: { position: 'absolute', top: 150, backgroundColor: 'rgba(255,0,0,0.85)', padding: 8, borderRadius: 8 },
  alarmText: { color: '#fff', fontWeight: '900' },
});
