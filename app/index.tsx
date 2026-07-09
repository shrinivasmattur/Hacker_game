import NeonButton from '@/components/NeonButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  const router = useRouter();
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    const loadHighScore = async () => {
      try {
        const saved = await AsyncStorage.getItem('cyberescape-high-score');
        if (saved) {
          setHighScore(Number(saved));
        }
      } catch (error) {
        console.log('Failed to load high score', error);
      }
    };

    loadHighScore();
  }, []);

  const showHighScores = () => {
    Alert.alert('High Score', `Best score: ${highScore}`);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={styles.container}>
        <View style={styles.glowBlue} />
        <View style={styles.glowPurple} />

        <View style={styles.header}>
          <Text style={styles.title}>Cyber Escape</Text>
          <Text style={styles.subtitle}>The Hacker's Mission</Text>
        </View>

        <View style={styles.center}>
          {showHowToPlay ? (
            <View style={styles.howToPlayCard}>
              <Text style={styles.cardTitle}>How to Play</Text>
              <Text style={styles.cardText}>• Move with the on-screen arrows</Text>
              <Text style={styles.cardText}>• Collect the key; it is the item that unlocks the pink exit door</Text>
              <Text style={styles.cardText}>• Reach the pink exit door to finish the level</Text>
              <Text style={styles.cardText}>• Use the terminal code fast; it gives you 10 seconds before the alarm starts</Text>
              <Text style={styles.cardText}>• Wrong code or timeout makes the red drone more aggressive</Text>
              <View style={styles.inlineButtonRow}>
                <NeonButton title="Close" onPress={() => setShowHowToPlay(false)} style={{ marginTop: 10, width: 140 }} />
              </View>
            </View>
          ) : null}

          <NeonButton title="How to Play" onPress={() => setShowHowToPlay(true)} style={{ marginBottom: 14, width: 240 }} />
          <NeonButton title="Play" onPress={() => router.push('/game')} style={{ marginBottom: 14, width: 280 }} />
          <NeonButton title="Settings" onPress={() => Alert.alert('Settings', 'Settings screen is coming soon.')} style={{ marginBottom: 14, width: 240 }} />
          <NeonButton title="High Scores" onPress={showHighScores} style={{ marginBottom: 14, width: 240 }} />
          <NeonButton title="Exit" onPress={() => Alert.alert('Exit', 'Thanks for playing Cyber Escape!')} style={{ width: 160 }} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.build}>Best score: {highScore}</Text>
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
  howToPlayCard: {
    width: '100%',
    maxWidth: 320,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(18, 14, 36, 0.85)',
    borderWidth: 1,
    borderColor: '#60a5fa',
    marginBottom: 16,
  },
  cardTitle: {
    color: '#fef3c7',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  cardText: {
    color: '#dbeafe',
    fontSize: 13,
    marginBottom: 4,
    lineHeight: 18,
  },
  inlineButtonRow: {
    alignItems: 'center',
    width: '100%',
  },
  footer: { paddingBottom: 6 },
  build: { color: '#6b7280', fontSize: 12 },
});
