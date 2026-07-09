import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  onUp: () => void;
  onDown: () => void;
  onLeft: () => void;
  onRight: () => void;
};

export const MovementControls: React.FC<Props> = ({ onUp, onDown, onLeft, onRight }) => {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const actionRef = useRef<(() => void) | null>(null);

  const stopRepeat = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    actionRef.current = null;
  };

  const startRepeat = (action: () => void) => {
    stopRepeat();
    actionRef.current = action;
    action();
    intervalRef.current = setInterval(() => {
      actionRef.current?.();
    }, 70);
  };

  useEffect(() => {
    return () => stopRepeat();
  }, []);

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.row}>
        <View style={styles.spacer} />
        <TouchableOpacity
          onPressIn={() => startRepeat(onUp)}
          onPressOut={stopRepeat}
          style={[styles.button, styles.primary]}
        >
          <Text style={styles.label}>⬆</Text>
        </TouchableOpacity>
        <View style={styles.spacer} />
      </View>

      <View style={[styles.row, { marginTop: 10 }]}>
        <TouchableOpacity
          onPressIn={() => startRepeat(onLeft)}
          onPressOut={stopRepeat}
          style={[styles.button, styles.primary]}
        >
          <Text style={styles.label}>⬅</Text>
        </TouchableOpacity>

        <View style={styles.spacerBig} />

        <TouchableOpacity
          onPressIn={() => startRepeat(onRight)}
          onPressOut={stopRepeat}
          style={[styles.button, styles.primary]}
        >
          <Text style={styles.label}>➡</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.row, { marginTop: 10 }]}> 
        <View style={styles.spacer} />
        <TouchableOpacity
          onPressIn={() => startRepeat(onDown)}
          onPressOut={stopRepeat}
          style={[styles.button, styles.primary]}
        >
          <Text style={styles.label}>⬇</Text>
        </TouchableOpacity>
        <View style={styles.spacer} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 190,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  spacer: { width: 24 },
  spacerBig: { width: 48 },
  button: {
    width: 56,
    height: 56,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(18,14,36,0.7)',
    borderWidth: 1,
    borderColor: '#60a5fa',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 6,
  },
  primary: {},
  label: {
    color: '#dbeafe',
    fontSize: 18,
    fontWeight: '700',
    textShadowColor: 'rgba(99,102,241,0.9)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
});

export default MovementControls;
