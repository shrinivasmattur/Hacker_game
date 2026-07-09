import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

export default function Door({ x, y, cellSize = 24, open = false }) {
  const anim = useRef(new Animated.Value(open ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: open ? 1 : 0, duration: 400, useNativeDriver: true }).start();
  }, [open]);

  const left = x * cellSize;
  const top = y * cellSize;

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -cellSize] });

  return (
    <Animated.View style={[styles.door, { left, top, width: cellSize, height: cellSize, transform: [{ translateY }] }]}>
      <View style={styles.labelWrap}>
        <Text style={styles.label}>{open ? 'OPEN' : 'LOCKED'}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  door: {
    position: 'absolute',
    backgroundColor: '#00b3ff',
    borderColor: '#bffcff',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00e3ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 12,
  },
  labelWrap: { padding: 2, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 2 },
  label: { color: '#001', fontWeight: '700' },
});
