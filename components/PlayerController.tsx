import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet } from 'react-native';
import Player from './Player';

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');

type Bounds = { minX: number; maxX: number; minY: number; maxY: number };

type Props = {
  size?: number;
  step?: number; // grid step in pixels used by convenience methods
  speed?: number; // pixels per second for fixed movement speed
  initialX?: number;
  initialY?: number;
  bounds?: Bounds; // optional - if omitted component will clamp to window minus size
  onPositionChange?: (x: number, y: number) => void;
  baseTint?: string;
  movingTint?: string;
};

export type PlayerHandle = {
  moveBy: (dx: number, dy: number) => void;
  moveUp: () => void;
  moveDown: () => void;
  moveLeft: () => void;
  moveRight: () => void;
  getPosition: () => { x: number; y: number };
};

const PlayerController = forwardRef<PlayerHandle, Props>(
  (
    {
      size = 44,
      step = 40,
      speed = 320, // px / sec
      initialX,
      initialY,
      bounds,
      onPositionChange,
      baseTint,
      movingTint,
    },
    ref
  ) => {
    const defaultBounds: Bounds = {
      minX: 0,
      maxX: Math.max(0, WINDOW_WIDTH - size),
      minY: 0,
      maxY: Math.max(0, WINDOW_HEIGHT - size - 120), // leave space for UI by default
    };

    const clampBounds = bounds ?? defaultBounds;

    const anim = useRef(new Animated.ValueXY({ x: initialX ?? clampBounds.minX, y: initialY ?? clampBounds.maxY })).current;
    const posRef = useRef({ x: initialX ?? clampBounds.minX, y: initialY ?? clampBounds.maxY });
    const animatingRef = useRef(false);
    const [isMoving, setIsMoving] = useState(false);

    function clamp(v: number, a: number, b: number) {
      return Math.max(a, Math.min(b, v));
    }

    // stop any running animation and get current position before starting a new one
    function stopAndGetCurrent(): Promise<{ x: number; y: number }> {
      return new Promise((resolve) => {
        anim.stopAnimation((current: { x: number; y: number }) => {
          // ensure internal value matches current render value
          anim.setValue(current);
          resolve(current);
        });
      });
    }

    async function moveTo(targetX: number, targetY: number) {
      // clamp target inside bounds
      const tx = clamp(targetX, clampBounds.minX, clampBounds.maxX);
      const ty = clamp(targetY, clampBounds.minY, clampBounds.maxY);

      // prevent diagonal movement: if both axes change, choose the dominant axis
      const dx = tx - posRef.current.x;
      const dy = ty - posRef.current.y;
      let finalTx = tx;
      let finalTy = ty;
      if (dx !== 0 && dy !== 0) {
        if (Math.abs(dx) >= Math.abs(dy)) {
          finalTy = posRef.current.y; // cancel y
        } else {
          finalTx = posRef.current.x; // cancel x
        }
      }

      // compute distance and duration based on speed
      const dist = Math.hypot(finalTx - posRef.current.x, finalTy - posRef.current.y);
      if (dist === 0) return;

      const minDuration = 80;
      const duration = Math.max(minDuration, (dist / Math.max(1, speed)) * 1000);

      animatingRef.current = true;
      setIsMoving(true);

      const current = await stopAndGetCurrent();
      // update posRef immediately so subsequent calls compute from intended target
      posRef.current = { x: finalTx, y: finalTy };

      return new Promise<void>((resolve) => {
        Animated.timing(anim, {
          toValue: { x: finalTx, y: finalTy },
          duration,
          useNativeDriver: true,
        }).start(() => {
          animatingRef.current = false;
          setIsMoving(false);
          onPositionChange?.(finalTx, finalTy);
          resolve();
        });
      });
    }

    function moveBy(dx: number, dy: number) {
      // Prefer single-axis moves to avoid diagonal glitches from multiple inputs
      if (dx !== 0 && dy !== 0) {
        if (Math.abs(dx) >= Math.abs(dy)) {
          dy = 0;
        } else {
          dx = 0;
        }
      }
      const nextX = posRef.current.x + dx;
      const nextY = posRef.current.y + dy;
      moveTo(nextX, nextY);
    }

    useImperativeHandle(
      ref,
      () => ({
        moveBy,
        moveUp: () => moveBy(0, -step),
        moveDown: () => moveBy(0, step),
        moveLeft: () => moveBy(-step, 0),
        moveRight: () => moveBy(step, 0),
        getPosition: () => ({ ...posRef.current }),
      }),
      [step, clampBounds.minX, clampBounds.maxX, clampBounds.minY, clampBounds.maxY, speed]
    );

    const animatedStyle = {
      transform: anim.getTranslateTransform(),
      position: 'absolute' as const,
      width: size,
      height: size,
    };

    return <Player animatedStyle={animatedStyle} size={size} isMoving={isMoving} baseTint={baseTint} movingTint={movingTint} />;
  }
);

const styles = StyleSheet.create({
  body: {
    backgroundColor: 'rgba(18,14,36,0.9)',
    borderWidth: 2,
    borderColor: '#6ee7b7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
  },
});

export default PlayerController;
