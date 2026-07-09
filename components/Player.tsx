import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';

type Props = {
  animatedStyle?: any; // position transform from parent
  size?: number;
  isMoving?: boolean;
  baseTint?: string;
  movingTint?: string;
};

export const Player: React.FC<Props> = ({
  animatedStyle,
  size = 64,
  isMoving = false,
  baseTint = '#6ee7b7',
  movingTint = '#fbbf24',
}) => {
  // bob animation for movement (small up/down loop)
  const bob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    if (isMoving) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(bob, { toValue: 1, duration: 240, useNativeDriver: true }),
          Animated.timing(bob, { toValue: 0, duration: 240, useNativeDriver: true }),
        ])
      );
      loop.start();
    } else {
      bob.stopAnimation();
      Animated.timing(bob, { toValue: 0, duration: 120, useNativeDriver: true }).start();
    }
    return () => {
      loop?.stop();
    };
  }, [isMoving, bob]);

  const translateY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });
  const scale = bob.interpolate({ inputRange: [0, 1], outputRange: [1, 1.02] });
  const mergedTransform = [
    ...(Array.isArray(animatedStyle?.transform) ? animatedStyle.transform : []),
    { translateY },
    { scale },
  ];

  const movingStyle: ViewStyle = isMoving
    ? { borderColor: movingTint, shadowColor: movingTint }
    : { borderColor: baseTint, shadowColor: '#7c3aed' };

  return (
    <Animated.View
      style={[
        animatedStyle,
        { width: size, height: size, transform: mergedTransform },
      ]}
    >
      <View style={[styles.player, { borderRadius: size * 0.12 }, movingStyle]}>
        <View style={[styles.head, { top: size * 0.08, width: size * 0.56, height: size * 0.2 }]} />
        <View style={[styles.eyeRow, { top: size * 0.42 }]}>
          <View style={styles.eye} />
          <View style={styles.eye} />
        </View>
        <View style={[styles.chin, { bottom: size * 0.06, width: size * 0.5, height: size * 0.12 }]} />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  player: {
    flex: 1,
    backgroundColor: 'rgba(18,14,36,0.9)',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
  },
  head: {
    position: 'absolute',
    backgroundColor: 'rgba(99,102,241,0.18)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#a78bfa',
  },
  eyeRow: {
    position: 'absolute',
    flexDirection: 'row',
    width: '70%',
    justifyContent: 'space-between',
  },
  eye: {
    width: 10,
    height: 10,
    borderRadius: 6,
    backgroundColor: '#60a5fa',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  chin: {
    position: 'absolute',
    borderRadius: 4,
    backgroundColor: 'rgba(139,92,246,0.16)',
    borderWidth: 1,
    borderColor: '#8b5cf6',
  },
});

export default Player;
