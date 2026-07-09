import { StyleSheet, Text, View } from 'react-native';

export default function HUD({ score, level, lives }) {
  return (
    <View style={styles.hud}>
      <Text style={styles.hudText}>Score: {score}</Text>
      <Text style={styles.hudText}>Level: {level}</Text>
      <Text style={styles.hudText}>Lives: {lives}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hud: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    height: 34,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 8,
    borderColor: '#00ffd5',
    borderWidth: 1,
  },
  hudText: {
    color: '#c6fff7',
    fontWeight: '600',
  },
});
