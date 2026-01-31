import mongoose from 'mongoose';

// IMPORTANT: Delete existing model if it exists (fixes hot reload issues)
if (mongoose.connection.models['BehavioralAnalysis']) {
  delete mongoose.connection.models['BehavioralAnalysis'];
}
if (mongoose.models.BehavioralAnalysis) {
  delete mongoose.models.BehavioralAnalysis;
}

// ============ KEYSTROKE ANALYSIS SCHEMA ============
const keystrokeAnalysisSchema = new mongoose.Schema({
  totalKeystrokes: { type: Number, default: 0 },
  avgIntervalMs: { type: Number, default: 0 },
  typingVariance: { type: Number, default: 0 },
  stdDeviation: { type: Number, default: 0 },
  correctionRate: { type: Number, default: 0 },
  corrections: { type: Number, default: 0 },
  trustScore: { type: Number, default: 50, min: 0, max: 100 },
  flags: {
    botLikeUniformity: { type: Boolean, default: false },
    superhumanSpeed: { type: Boolean, default: false },
    minimalCorrections: { type: Boolean, default: false },
    naturalTyping: { type: Boolean, default: false }
  },
  insufficient_data: { type: Boolean, default: false }
}, { _id: false });

// ============ MOUSE ANALYSIS SCHEMA ============
const mouseAnalysisSchema = new mongoose.Schema({
  totalMovements: { type: Number, default: 0 },
  linearSegments: { type: Number, default: 0 },
  linearityRatio: { type: Number, default: 0 },
  pathEfficiency: { type: Number, default: 0 },
  totalDistance: { type: Number, default: 0 },
  trustScore: { type: Number, default: 50, min: 0, max: 100 },
  flags: {
    botLikeMovement: { type: Boolean, default: false },
    tooLinear: { type: Boolean, default: false },
    tooEfficient: { type: Boolean, default: false }
  },
  insufficient_data: { type: Boolean, default: false }
}, { _id: false });

// ============ PASTE ANALYSIS SCHEMA ============
const pasteAnalysisSchema = new mongoose.Schema({
  totalFields: { type: Number, default: 0 },
  pastedFields: { type: Number, default: 0 },
  pastePercentage: { type: Number, default: 0 },
  criticalFieldsPasted: { type: Number, default: 0 },
  trustScore: { type: Number, default: 50, min: 0, max: 100 },
  flags: {
    excessivePasting: { type: Boolean, default: false },
    criticalFieldPaste: { type: Boolean, default: false }
  },
  insufficient_data: { type: Boolean, default: false }
}, { _id: false });

// ============ SPEED ANALYSIS SCHEMA ============
const speedAnalysisSchema = new mongoose.Schema({
  totalTimeSeconds: { type: Number, default: 0 },
  timePerFieldSeconds: { type: Number, default: 0 },
  fieldCount: { type: Number, default: 0 },
  pauseCount: { type: Number, default: 0 },
  trustScore: { type: Number, default: 50, min: 0, max: 100 },
  flags: {
    unnaturallyFast: { type: Boolean, default: false },
    unusuallySlow: { type: Boolean, default: false },
    naturalPace: { type: Boolean, default: false }
  },
  insufficient_data: { type: Boolean, default: false }
}, { _id: false });

// ============ RAW METRICS SCHEMA ============
const rawMetricsSchema = new mongoose.Schema({
  totalKeystrokes: { type: Number, default: 0 },
  totalMouseMovements: { type: Number, default: 0 },
  totalFields: { type: Number, default: 0 },
  sessionDurationMs: { type: Number, default: 0 }
}, { _id: false });

// ============ COMPONENT SCORES SCHEMA ============
const componentScoresSchema = new mongoose.Schema({
  typing: { type: Number, default: 50, min: 0, max: 100 },
  mouse: { type: Number, default: 50, min: 0, max: 100 },
  paste: { type: Number, default: 50, min: 0, max: 100 },
  speed: { type: Number, default: 50, min: 0, max: 100 }
}, { _id: false });

// ============ MAIN BEHAVIORAL ANALYSIS SCHEMA ============
const behavioralAnalysisSchema = new mongoose.Schema({
  // References
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  verificationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Verification',
    required: true,
    index: true
  },

  // ============ OVERALL SCORES ============
  overallTrustScore: { 
    type: Number, 
    default: 50, 
    min: 0, 
    max: 100,
    index: true
  },
  botLikelihood: { 
    type: Number, 
    default: 50, 
    min: 0, 
    max: 100,
    index: true
  },
  riskLevel: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
    index: true
  },
  recommendation: {
    type: String,
    enum: ['auto_approve', 'standard_flow', 'enhanced_verification', 'manual_review', 'reject'],
    default: 'standard_flow'
  },
  isHuman: { 
    type: Boolean, 
    default: true 
  },
  confidence: { 
    type: Number, 
    default: 0.5, 
    min: 0, 
    max: 1 
  },

  // ============ FLAGS ============
  flagsDetected: [{ type: String }],
  flagCount: { type: Number, default: 0 },

  // ============ COMPONENT SCORES ============
  componentScores: componentScoresSchema,

  // ============ DETAILED ANALYSIS ============
  keystrokeAnalysis: keystrokeAnalysisSchema,
  mouseAnalysis: mouseAnalysisSchema,
  pasteAnalysis: pasteAnalysisSchema,
  speedAnalysis: speedAnalysisSchema,

  // ============ RAW METRICS ============
  rawMetrics: rawMetricsSchema,

  // ============ SESSION INFO ============
  sessionInfo: {
    userAgent: { type: String },
    screenResolution: { type: String },
    timezone: { type: String },
    language: { type: String },
    platform: { type: String }
  },

  // ============ TIMESTAMPS ============
  analyzedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// ============ INDEXES ============
behavioralAnalysisSchema.index({ userId: 1, verificationId: 1 });
behavioralAnalysisSchema.index({ botLikelihood: -1 });
behavioralAnalysisSchema.index({ riskLevel: 1 });
behavioralAnalysisSchema.index({ createdAt: -1 });
behavioralAnalysisSchema.index({ 'flagsDetected': 1 });

// ============ STATIC METHODS ============

// Find by verification ID
behavioralAnalysisSchema.statics.findByVerificationId = function(verificationId) {
  return this.findOne({ verificationId });
};

// Find all suspicious (high bot likelihood)
behavioralAnalysisSchema.statics.findSuspicious = function(threshold = 50) {
  return this.find({ botLikelihood: { $gte: threshold } })
    .sort({ botLikelihood: -1 });
};

// Find by risk level
behavioralAnalysisSchema.statics.findByRiskLevel = function(riskLevel) {
  return this.find({ riskLevel }).sort({ createdAt: -1 });
};

// Get statistics
behavioralAnalysisSchema.statics.getStatistics = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalAnalyses: { $sum: 1 },
        avgTrustScore: { $avg: '$overallTrustScore' },
        avgBotLikelihood: { $avg: '$botLikelihood' },
        humansDetected: { 
          $sum: { $cond: ['$isHuman', 1, 0] } 
        },
        botsDetected: { 
          $sum: { $cond: ['$isHuman', 0, 1] } 
        },
        lowRisk: { 
          $sum: { $cond: [{ $eq: ['$riskLevel', 'low'] }, 1, 0] } 
        },
        mediumRisk: { 
          $sum: { $cond: [{ $eq: ['$riskLevel', 'medium'] }, 1, 0] } 
        },
        highRisk: { 
          $sum: { $cond: [{ $eq: ['$riskLevel', 'high'] }, 1, 0] } 
        },
        criticalRisk: { 
          $sum: { $cond: [{ $eq: ['$riskLevel', 'critical'] }, 1, 0] } 
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalAnalyses: 0,
    avgTrustScore: 0,
    avgBotLikelihood: 0,
    humansDetected: 0,
    botsDetected: 0,
    lowRisk: 0,
    mediumRisk: 0,
    highRisk: 0,
    criticalRisk: 0
  };
};

// ============ INSTANCE METHODS ============

// Check if bot
behavioralAnalysisSchema.methods.isBot = function() {
  return this.botLikelihood > 50;
};

// Get risk summary
behavioralAnalysisSchema.methods.getRiskSummary = function() {
  return {
    trustScore: this.overallTrustScore,
    botLikelihood: this.botLikelihood,
    riskLevel: this.riskLevel,
    recommendation: this.recommendation,
    isHuman: this.isHuman,
    flagCount: this.flagCount,
    flags: this.flagsDetected
  };
};

// Create and export model
const BehavioralAnalysis = mongoose.model('BehavioralAnalysis', behavioralAnalysisSchema);

export default BehavioralAnalysis;