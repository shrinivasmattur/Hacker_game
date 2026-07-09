import { StyleSheet, View } from 'react-native';

// Reusable Wall component. Position via grid coords (x,y) and cellSize.
export default function Wall({ x, y, cellSize = 24 }) {
  const left = x * cellSize;
  const top = y * cellSize;
  return (
    <View style={[styles.wall, { left, top, width: cellSize, height: cellSize }]} />
  );
}

const styles = StyleSheet.create({
  wall: {
    position: 'absolute',
    backgroundColor: '#0ff',
    // neon glow using shadow
    shadowColor: '#00fff6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#4ef7ff',
    borderRadius: 2,
  },
});
