import 'dart:async';

/// Tracks user behavior for bot detection (simplified mobile version)
class BehaviorTracker {
  final Map<String, dynamic> _metrics = {};
  final List<int> _interactionTimestamps = [];
  final List<Map<String, dynamic>> _touchEvents = [];
  DateTime? _startTime;
  int _fieldFocusCount = 0;
  int _fieldBlurCount = 0;
  int _scrollCount = 0;

  void startTracking() {
    _startTime = DateTime.now();
    _metrics['sessionStartedAt'] = _startTime!.toIso8601String();
  }

  void trackFieldFocus(String fieldName) {
    _fieldFocusCount++;
    _interactionTimestamps.add(DateTime.now().millisecondsSinceEpoch);
    _metrics['lastFocusedField'] = fieldName;
  }

  void trackFieldBlur(String fieldName) {
    _fieldBlurCount++;
  }

  void trackTap(double x, double y) {
    _touchEvents.add({
      'type': 'tap',
      'x': x,
      'y': y,
      'timestamp': DateTime.now().millisecondsSinceEpoch,
    });
  }

  void trackScroll() {
    _scrollCount++;
  }

  void trackTextInput(String fieldName, String text) {
    // Track typing patterns
    _metrics['lastInputField'] = fieldName;
    _metrics['lastInputLength'] = text.length;
  }

  Map<String, dynamic> generateReport() {
    final endTime = DateTime.now();
    final duration = _startTime != null
        ? endTime.difference(_startTime!).inSeconds
        : 0;

    // Calculate interaction rate
    final interactionRate = duration > 0
        ? (_fieldFocusCount + _fieldBlurCount + _scrollCount) / duration
        : 0;

    // Analyze touch patterns
    final touchPatternScore = _analyzeTouchPatterns();

    // Calculate overall trust score
    final trustScore = _calculateTrustScore(
      duration: duration,
      interactionRate: interactionRate.toDouble(),
      touchPatternScore: touchPatternScore,
    );

    final botLikelihood = 100 - trustScore;

    return {
      'overallTrustScore': trustScore,
      'botLikelihood': botLikelihood,
      'riskLevel': _getRiskLevel(botLikelihood),
      'isHuman': botLikelihood < 50,
      'recommendation': _getRecommendation(botLikelihood),
      'rawMetrics': {
        'sessionDuration': duration,
        'fieldFocusCount': _fieldFocusCount,
        'fieldBlurCount': _fieldBlurCount,
        'scrollCount': _scrollCount,
        'touchEventCount': _touchEvents.length,
        'interactionRate': interactionRate,
        'touchPatternScore': touchPatternScore,
      },
      'analyzedAt': endTime.toIso8601String(),
      'source': 'mobile_app',
    };
  }

  double _analyzeTouchPatterns() {
    if (_touchEvents.length < 3) return 50.0;

    // Check for natural variation in touch positions
    final xPositions = _touchEvents.map((e) => e['x'] as double).toList();
    final yPositions = _touchEvents.map((e) => e['y'] as double).toList();

    final xVariance = _calculateVariance(xPositions);
    final yVariance = _calculateVariance(yPositions);

    // Natural human behavior has some variance
    if (xVariance < 1 && yVariance < 1) {
      return 20.0; // Too uniform, suspicious
    }

    // Check timing patterns
    final timestamps = _touchEvents.map((e) => e['timestamp'] as int).toList();
    final intervals = <int>[];
    for (int i = 1; i < timestamps.length; i++) {
      intervals.add(timestamps[i] - timestamps[i - 1]);
    }

    if (intervals.isNotEmpty) {
      final intervalVariance = _calculateVariance(intervals.map((e) => e.toDouble()).toList());
      if (intervalVariance < 10) {
        return 30.0; // Too regular timing, suspicious
      }
    }

    return 80.0; // Natural patterns
  }

  double _calculateVariance(List<double> values) {
    if (values.isEmpty) return 0;
    final mean = values.reduce((a, b) => a + b) / values.length;
    final squaredDiffs = values.map((v) => (v - mean) * (v - mean));
    return squaredDiffs.reduce((a, b) => a + b) / values.length;
  }

  int _calculateTrustScore({
    required int duration,
    required double interactionRate,
    required double touchPatternScore,
  }) {
    double score = 50.0;

    // Duration factor (too fast is suspicious)
    if (duration < 30) {
      score -= 20;
    } else if (duration > 60) {
      score += 10;
    }

    // Interaction rate factor
    if (interactionRate > 0.5 && interactionRate < 5) {
      score += 15;
    } else if (interactionRate > 10) {
      score -= 15; // Too many interactions, suspicious
    }

    // Touch pattern factor
    score += (touchPatternScore - 50) * 0.3;

    // Field interaction factor
    if (_fieldFocusCount > 0 && _fieldBlurCount > 0) {
      score += 10;
    }

    return score.clamp(0, 100).toInt();
  }

  String _getRiskLevel(int botLikelihood) {
    if (botLikelihood < 30) return 'low';
    if (botLikelihood < 50) return 'medium';
    if (botLikelihood < 70) return 'high';
    return 'critical';
  }

  String _getRecommendation(int botLikelihood) {
    if (botLikelihood < 30) return 'auto_approve';
    if (botLikelihood < 50) return 'standard_flow';
    if (botLikelihood < 70) return 'enhanced_review';
    return 'manual_review';
  }

  void reset() {
    _metrics.clear();
    _interactionTimestamps.clear();
    _touchEvents.clear();
    _startTime = null;
    _fieldFocusCount = 0;
    _fieldBlurCount = 0;
    _scrollCount = 0;
  }
}