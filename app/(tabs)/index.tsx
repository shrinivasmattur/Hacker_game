import NeonButton from '@/components/NeonButton';
import { useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={styles.container}>
        {/* Decorative neon blobs */}
        <View style={styles.glowBlue} />
        <View style={styles.glowPurple} />

        <View style={styles.header}>
          <Text style={styles.title}>Cyber Escape</Text>
          <Text style={styles.subtitle}>The Hacker's Mission</Text>
        </View>

        <View style={styles.center}>
          <NeonButton title="Play" onPress={() => router.push('/game')} style={{ marginBottom: 14, width: 280 }} />
          <NeonButton title="Settings" onPress={() => router.push('/settings')} style={{ marginBottom: 14, width: 240 }} />
          <NeonButton title="High Scores" onPress={() => router.push('/highscores')} style={{ marginBottom: 14, width: 240 }} />
          <NeonButton title="Exit" onPress={() => { /* No-op for Expo; could show confirm modal */ }} style={{ width: 160 }} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.build}>v1 • Neon build</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#06040a' },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 48,
    paddingBottom: 32,
    paddingHorizontal: 20,
    backgroundColor: '#04030a',
  },
  glowBlue: {
    position: 'absolute',
    width: 420,
    height: 420,
    backgroundColor: '#002034',
    left: -80,
    top: -100,
    borderRadius: 210,
    opacity: 0.9,
    shadowColor: '#00e5ff',
    shadowRadius: 60,
  },
  glowPurple: {
    position: 'absolute',
    width: 360,
    height: 360,
    backgroundColor: '#1a0633',
    right: -60,
    top: 40,
    borderRadius: 180,
    opacity: 0.9,
    shadowColor: '#8b5cf6',
    shadowRadius: 60,
  },
  header: { alignItems: 'center' },
  title: {
    fontSize: 52,
    color: '#a78bfa',
    fontWeight: '900',
    textShadowColor: 'rgba(99,102,241,0.9)',
    textShadowOffset: { width: 0, height: 8 },
    textShadowRadius: 28,
  },
  subtitle: {
    marginTop: 8,
    color: '#93c5fd',
    fontSize: 16,
    letterSpacing: 1.6,
  },
  center: {
    alignItems: 'center',
    width: '100%',
  },
  footer: { paddingBottom: 6 },
  build: { color: '#6b7280', fontSize: 12 },
});
