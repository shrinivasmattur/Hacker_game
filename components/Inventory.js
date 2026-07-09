import { StyleSheet, Text, View } from 'react-native';

export default function Inventory({ items }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inventory:</Text>
      <View style={styles.row}>
        <Text style={styles.item}>Key Cards: {items.keyCard || 0}</Text>
        <Text style={styles.item}>EMP: {items.emp || 0}</Text>
        <Text style={styles.item}>HP: {items.health || 0}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 48,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 8,
    borderRadius: 8,
    borderColor: '#7efcff',
    borderWidth: 1,
    zIndex: 999,
  },
  title: {
    color: '#baf7ff',
    fontWeight: '700',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  item: {
    color: '#e3ffff',
  },
});
