import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ViewStyle } from 'react-native';

type Props = {
  title: string;
  onPress?: () => void;
  style?: ViewStyle;
};

export const NeonButton: React.FC<Props> = ({ title, onPress, style }) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={[styles.container, style]}>
      <View style={styles.glow} />
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(16,12,30,0.6)',
    borderColor: '#8b5cf6',
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 8,
  },
  text: {
    color: '#dbeafe',
    fontWeight: '700',
    fontSize: 18,
    letterSpacing: 1,
    textShadowColor: 'rgba(99,102,241,0.9)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
});

export default NeonButton;
