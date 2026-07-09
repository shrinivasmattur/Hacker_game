import { StyleSheet, Text, TouchableOpacity } from 'react-native';

export default function Button({ onPress, label }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.btn} activeOpacity={0.7}>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    padding: 8,
    backgroundColor: '#0ff',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00f7ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    margin: 4,
  },
  label: {
    color: '#002',
    fontWeight: '700',
  },
});
