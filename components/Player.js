import { StyleSheet, View } from 'react-native';

export default function Player({ x, y, cellSize = 24 }) {
  return (
    <View style={[styles.player, { left: x * cellSize, top: y * cellSize, width: cellSize, height: cellSize }]} />
  );
}

const styles = StyleSheet.create({
  player: {
    position: 'absolute',
    backgroundColor: '#ff5cdb',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#ff9fe6',
    shadowColor: '#ff5cdb',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    shadowOpacity: 0.9,
  },
});
