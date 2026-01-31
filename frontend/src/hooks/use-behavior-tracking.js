'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export function useBehaviorTracking() {
  const [behaviorData, setBehaviorData] = useState({
    typingSpeed: 0,
    mouseMovements: 0,
    totalTimeSpent: 0,
    pauseCount: 0,
    keystrokes: 0
  });

  const startTimeRef = useRef(Date.now());
  const lastKeystrokeRef = useRef(Date.now());
  const keystrokeCountRef = useRef(0);
  const mouseMovementCountRef = useRef(0);
  const pauseCountRef = useRef(0);

  // Track mouse movements
  const handleMouseMove = useCallback(() => {
    mouseMovementCountRef.current += 1;
  }, []);

  // Track keystrokes and typing speed
  const handleKeyDown = useCallback(() => {
    const now = Date.now();
    const timeSinceLastKeystroke = now - lastKeystrokeRef.current;
    
    // Count pauses (gaps > 1 second between keystrokes)
    if (timeSinceLastKeystroke > 1000) {
      pauseCountRef.current += 1;
    }
    
    keystrokeCountRef.current += 1;
    lastKeystrokeRef.current = now;
  }, []);

  // Calculate final behavior data
  const getBehaviorData = useCallback(() => {
    const totalTimeSpent = (Date.now() - startTimeRef.current) / 1000; // in seconds
    const typingSpeed = totalTimeSpent > 0 
      ? Math.round((keystrokeCountRef.current / totalTimeSpent) * 60) 
      : 0; // characters per minute

    return {
      typingSpeed,
      mouseMovements: mouseMovementCountRef.current,
      totalTimeSpent: Math.round(totalTimeSpent),
      pauseCount: pauseCountRef.current,
      keystrokes: keystrokeCountRef.current
    };
  }, []);

  // Reset tracking
  const resetTracking = useCallback(() => {
    startTimeRef.current = Date.now();
    lastKeystrokeRef.current = Date.now();
    keystrokeCountRef.current = 0;
    mouseMovementCountRef.current = 0;
    pauseCountRef.current = 0;
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleMouseMove, handleKeyDown]);

  // Update behavior data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setBehaviorData(getBehaviorData());
    }, 5000);

    return () => clearInterval(interval);
  }, [getBehaviorData]);

  return { behaviorData, getBehaviorData, resetTracking };
}