'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Advanced Behavioral Biometrics Tracking Hook
 * Tracks: Keystroke dynamics, mouse movements, paste behavior, form timing
 * Used for bot detection and synthetic identity fraud prevention
 */
export function useBehaviorTracking() {
  // Keystroke tracking
  const keystrokesRef = useRef([]);
  const fieldEventsRef = useRef({});
  
  // Mouse tracking
  const mouseEventsRef = useRef([]);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  
  // Timing
  const formStartTimeRef = useRef(Date.now());
  const lastKeystrokeTimeRef = useRef(Date.now());
  
  // Counters
  const pauseCountRef = useRef(0);
  const totalFieldsRef = useRef(0);
  const correctionsRef = useRef(0);
  
  // Current field tracking
  const currentFieldRef = useRef(null);
  const fieldStartTimeRef = useRef({});

  // Track individual keystrokes with timing
  const handleKeyDown = useCallback((e) => {
    const now = Date.now();
    const timeSinceLastKeystroke = now - lastKeystrokeTimeRef.current;
    
    // Count pauses (gaps > 2 seconds)
    if (timeSinceLastKeystroke > 2000 && keystrokesRef.current.length > 0) {
      pauseCountRef.current += 1;
    }
    
    // Track corrections
    if (e.key === 'Backspace' || e.key === 'Delete') {
      correctionsRef.current += 1;
    }
    
    // Record keystroke data
    keystrokesRef.current.push({
      key: e.key,
      timestamp: now,
      event: 'keydown',
      timeSinceLast: timeSinceLastKeystroke,
      field: currentFieldRef.current
    });
    
    lastKeystrokeTimeRef.current = now;
    
    // Limit array size to prevent memory issues
    if (keystrokesRef.current.length > 1000) {
      keystrokesRef.current = keystrokesRef.current.slice(-500);
    }
  }, []);

  // Track mouse movements with coordinates
  const handleMouseMove = useCallback((e) => {
    const now = Date.now();
    const newPos = { x: e.clientX, y: e.clientY };
    
    // Only record if moved significantly (>5px) to reduce noise
    const dx = Math.abs(newPos.x - lastMousePosRef.current.x);
    const dy = Math.abs(newPos.y - lastMousePosRef.current.y);
    
    if (dx > 5 || dy > 5) {
      mouseEventsRef.current.push({
        x: newPos.x,
        y: newPos.y,
        timestamp: now,
        dx: newPos.x - lastMousePosRef.current.x,
        dy: newPos.y - lastMousePosRef.current.y
      });
      
      lastMousePosRef.current = newPos;
      
      // Limit array size
      if (mouseEventsRef.current.length > 500) {
        mouseEventsRef.current = mouseEventsRef.current.slice(-250);
      }
    }
  }, []);

  // Track paste events
  const handlePaste = useCallback((e) => {
    const fieldName = e.target?.name || e.target?.id || 'unknown';
    
    if (!fieldEventsRef.current[fieldName]) {
      fieldEventsRef.current[fieldName] = { typed: false, pasted: false, pasteCount: 0 };
    }
    
    fieldEventsRef.current[fieldName].pasted = true;
    fieldEventsRef.current[fieldName].pasteCount += 1;
  }, []);

  // Track field focus (to know which field user is typing in)
  const handleFocus = useCallback((e) => {
    const fieldName = e.target?.name || e.target?.id || 'unknown';
    currentFieldRef.current = fieldName;
    fieldStartTimeRef.current[fieldName] = Date.now();
    totalFieldsRef.current += 1;
    
    if (!fieldEventsRef.current[fieldName]) {
      fieldEventsRef.current[fieldName] = { typed: false, pasted: false, pasteCount: 0 };
    }
  }, []);

  // Track field blur (field completed)
  const handleBlur = useCallback((e) => {
    const fieldName = e.target?.name || e.target?.id || 'unknown';
    
    if (fieldEventsRef.current[fieldName] && fieldStartTimeRef.current[fieldName]) {
      fieldEventsRef.current[fieldName].timeSpentMs = Date.now() - fieldStartTimeRef.current[fieldName];
    }
    
    // Check if field was typed (has keystrokes for this field)
    const fieldKeystrokes = keystrokesRef.current.filter(k => k.field === fieldName);
    if (fieldKeystrokes.length > 0) {
      if (fieldEventsRef.current[fieldName]) {
        fieldEventsRef.current[fieldName].typed = true;
        fieldEventsRef.current[fieldName].keystrokeCount = fieldKeystrokes.length;
      }
    }
    
    currentFieldRef.current = null;
  }, []);

  // Track typing in input fields
  const handleInput = useCallback((e) => {
    const fieldName = e.target?.name || e.target?.id || 'unknown';
    if (fieldEventsRef.current[fieldName]) {
      fieldEventsRef.current[fieldName].typed = true;
    }
  }, []);

  // Calculate keystroke dynamics metrics
  const analyzeKeystrokeDynamics = useCallback(() => {
    const keystrokes = keystrokesRef.current;
    
    if (keystrokes.length < 10) {
      return { insufficient_data: true, trustScore: 50 };
    }
    
    // Calculate inter-keystroke intervals
    const intervals = [];
    for (let i = 1; i < keystrokes.length; i++) {
      const interval = keystrokes[i].timestamp - keystrokes[i - 1].timestamp;
      if (interval > 0 && interval < 5000) { // Filter outliers
        intervals.push(interval);
      }
    }
    
    if (intervals.length < 5) {
      return { insufficient_data: true, trustScore: 50 };
    }
    
    // Calculate statistics
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, val) => sum + Math.pow(val - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    const cv = avgInterval > 0 ? stdDev / avgInterval : 0; // Coefficient of variation
    
    // Bot detection flags
    const isUniform = cv < 0.1; // Very consistent typing = bot
    const isSuperhuman = avgInterval < 80; // < 80ms per keystroke = bot
    const isNatural = avgInterval > 100 && avgInterval < 600 && cv > 0.15;
    
    // Correction rate
    const correctionRate = keystrokes.length > 0 ? correctionsRef.current / keystrokes.length : 0;
    const noCorrections = correctionRate < 0.02; // Less than 2% corrections is suspicious
    
    // Calculate trust score
    let trustScore = 100;
    if (isUniform) trustScore -= 30;
    if (isSuperhuman) trustScore -= 40;
    if (noCorrections) trustScore -= 20;
    if (isNatural) trustScore += 10;
    
    return {
      totalKeystrokes: keystrokes.length,
      avgIntervalMs: Math.round(avgInterval),
      typingVariance: Math.round(cv * 1000) / 1000,
      stdDeviation: Math.round(stdDev),
      correctionRate: Math.round(correctionRate * 1000) / 1000,
      corrections: correctionsRef.current,
      trustScore: Math.max(0, Math.min(100, trustScore)),
      flags: {
        botLikeUniformity: isUniform,
        superhumanSpeed: isSuperhuman,
        minimalCorrections: noCorrections,
        naturalTyping: isNatural
      }
    };
  }, []);

  // Analyze mouse movement patterns
  const analyzeMouseMovements = useCallback(() => {
    const movements = mouseEventsRef.current;
    
    if (movements.length < 20) {
      return { insufficient_data: true, trustScore: 50 };
    }
    
    // Calculate linearity (bot detection)
    let linearSegments = 0;
    let totalDistance = 0;
    let straightLineDistance = 0;
    
    for (let i = 1; i < movements.length; i++) {
      const dx = movements[i].x - movements[i - 1].x;
      const dy = movements[i].y - movements[i - 1].y;
      const segmentDistance = Math.sqrt(dx * dx + dy * dy);
      totalDistance += segmentDistance;
      
      // Check for linear (horizontal/vertical) movements
      if (Math.abs(dx) < 3 || Math.abs(dy) < 3) {
        linearSegments += 1;
      }
    }
    
    // Direct distance from first to last point
    if (movements.length > 1) {
      const startX = movements[0].x;
      const startY = movements[0].y;
      const endX = movements[movements.length - 1].x;
      const endY = movements[movements.length - 1].y;
      straightLineDistance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
    }
    
    const linearityRatio = movements.length > 1 ? linearSegments / (movements.length - 1) : 0;
    const pathEfficiency = totalDistance > 0 ? straightLineDistance / totalDistance : 0;
    
    // Bot-like behavior: very linear movements
    const isBotLike = linearityRatio > 0.7 || pathEfficiency > 0.9;
    
    let trustScore = 100;
    if (linearityRatio > 0.7) trustScore -= 30;
    if (linearityRatio > 0.85) trustScore -= 40;
    if (pathEfficiency > 0.9) trustScore -= 20;
    
    return {
      totalMovements: movements.length,
      linearSegments,
      linearityRatio: Math.round(linearityRatio * 1000) / 1000,
      pathEfficiency: Math.round(pathEfficiency * 1000) / 1000,
      totalDistance: Math.round(totalDistance),
      trustScore: Math.max(0, Math.min(100, trustScore)),
      flags: {
        botLikeMovement: isBotLike,
        tooLinear: linearityRatio > 0.7,
        tooEfficient: pathEfficiency > 0.9
      }
    };
  }, []);

  // Analyze paste behavior
  const analyzePasteBehavior = useCallback(() => {
    const fieldEvents = fieldEventsRef.current;
    const totalFields = Object.keys(fieldEvents).length;
    
    if (totalFields === 0) {
      return { insufficient_data: true, trustScore: 50 };
    }
    
    const pastedFields = Object.values(fieldEvents).filter(f => f.pasted).length;
    const pastePercentage = (pastedFields / totalFields) * 100;
    
    // Critical fields that shouldn't be pasted
    const criticalFields = ['fullName', 'full_name', 'name', 'fatherName', 'motherName', 'dateOfBirth', 'dob'];
    const criticalPasted = Object.entries(fieldEvents)
      .filter(([field, data]) => criticalFields.some(cf => field.toLowerCase().includes(cf.toLowerCase())) && data.pasted)
      .length;
    
    let trustScore = 100;
    if (pastePercentage > 50) trustScore -= 20;
    if (pastePercentage > 70) trustScore -= 30;
    if (criticalPasted > 0) trustScore -= 25;
    
    return {
      totalFields,
      pastedFields,
      pastePercentage: Math.round(pastePercentage),
      criticalFieldsPasted: criticalPasted,
      trustScore: Math.max(0, Math.min(100, trustScore)),
      flags: {
        excessivePasting: pastePercentage > 50,
        criticalFieldPaste: criticalPasted > 0
      }
    };
  }, []);

  // Analyze form filling speed
  const analyzeFormSpeed = useCallback(() => {
    const formStartTime = formStartTimeRef.current;
    const formEndTime = Date.now();
    const totalTimeMs = formEndTime - formStartTime;
    const totalTimeSeconds = totalTimeMs / 1000;
    const fieldCount = Math.max(totalFieldsRef.current, 1);
    const timePerFieldSeconds = totalTimeSeconds / fieldCount;
    
    // Normal human: 5-20 seconds per field
    const isTooFast = timePerFieldSeconds < 3;
    const isTooSlow = timePerFieldSeconds > 60;
    const isNatural = timePerFieldSeconds >= 5 && timePerFieldSeconds <= 25;
    
    let trustScore = 100;
    if (isTooFast) trustScore -= 35;
    if (isTooSlow) trustScore -= 15;
    if (isNatural) trustScore += 5;
    
    return {
      totalTimeSeconds: Math.round(totalTimeSeconds),
      timePerFieldSeconds: Math.round(timePerFieldSeconds * 10) / 10,
      fieldCount,
      pauseCount: pauseCountRef.current,
      trustScore: Math.max(0, Math.min(100, trustScore)),
      flags: {
        unnaturallyFast: isTooFast,
        unusuallySlow: isTooSlow,
        naturalPace: isNatural
      }
    };
  }, []);

  // Get comprehensive behavior data
  const getBehaviorData = useCallback(() => {
    const keystrokeAnalysis = analyzeKeystrokeDynamics();
    const mouseAnalysis = analyzeMouseMovements();
    const pasteAnalysis = analyzePasteBehavior();
    const speedAnalysis = analyzeFormSpeed();
    
    // Calculate overall trust score (weighted average)
    const weights = {
      typing: 0.35,
      paste: 0.25,
      mouse: 0.20,
      speed: 0.20
    };
    
    const overallScore = 
      (keystrokeAnalysis.trustScore || 70) * weights.typing +
      (pasteAnalysis.trustScore || 70) * weights.paste +
      (mouseAnalysis.trustScore || 70) * weights.mouse +
      (speedAnalysis.trustScore || 70) * weights.speed;
    
    const botLikelihood = Math.max(0, 100 - overallScore);
    
    // Collect all flags
    const allFlags = [];
    [keystrokeAnalysis, mouseAnalysis, pasteAnalysis, speedAnalysis].forEach(analysis => {
      if (analysis.flags) {
        Object.entries(analysis.flags).forEach(([flag, value]) => {
          if (value === true) allFlags.push(flag);
        });
      }
    });
    
    // Determine risk level and recommendation
    let riskLevel = 'low';
    let recommendation = 'auto_approve';
    
    if (botLikelihood > 50) {
      riskLevel = 'high';
      recommendation = 'manual_review';
    } else if (botLikelihood > 25) {
      riskLevel = 'medium';
      recommendation = 'standard_flow';
    }
    
    return {
      // Summary
      overallTrustScore: Math.round(overallScore),
      botLikelihood: Math.round(botLikelihood),
      riskLevel,
      recommendation,
      flagsDetected: allFlags,
      
      // Detailed analysis
      keystrokeAnalysis,
      mouseAnalysis,
      pasteAnalysis,
      speedAnalysis,
      
      // Raw metrics (for debugging)
      rawMetrics: {
        totalKeystrokes: keystrokesRef.current.length,
        totalMouseMovements: mouseEventsRef.current.length,
        totalFields: totalFieldsRef.current,
        sessionDurationMs: Date.now() - formStartTimeRef.current
      },
      
      // Timestamp
      analyzedAt: new Date().toISOString()
    };
  }, [analyzeKeystrokeDynamics, analyzeMouseMovements, analyzePasteBehavior, analyzeFormSpeed]);

  // Reset all tracking data
  const resetTracking = useCallback(() => {
    keystrokesRef.current = [];
    mouseEventsRef.current = [];
    fieldEventsRef.current = {};
    formStartTimeRef.current = Date.now();
    lastKeystrokeTimeRef.current = Date.now();
    pauseCountRef.current = 0;
    totalFieldsRef.current = 0;
    correctionsRef.current = 0;
    currentFieldRef.current = null;
    fieldStartTimeRef.current = {};
  }, []);

  // Set up event listeners
  useEffect(() => {
    // Global listeners
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('paste', handlePaste);
    
    // Form field listeners (using event delegation)
    const handleFocusIn = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        handleFocus(e);
      }
    };
    
    const handleFocusOut = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        handleBlur(e);
      }
    };
    
    const handleInputEvent = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        handleInput(e);
      }
    };
    
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    document.addEventListener('input', handleInputEvent);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
      document.removeEventListener('input', handleInputEvent);
    };
  }, [handleMouseMove, handleKeyDown, handlePaste, handleFocus, handleBlur, handleInput]);

  return { 
    getBehaviorData, 
    resetTracking,
    // Expose individual analyzers for debugging
    analyzeKeystrokeDynamics,
    analyzeMouseMovements,
    analyzePasteBehavior,
    analyzeFormSpeed
  };
}