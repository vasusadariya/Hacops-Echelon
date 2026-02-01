import mongoose from 'mongoose';

// Delete existing model if it exists (fixes hot reload issues in Next.js)
if (mongoose.connection.models['VerificationResults']) {
  delete mongoose.connection.models['VerificationResults'];
}
if (mongoose.models.VerificationResults) {
  delete mongoose.models.VerificationResults;
}

// Face Biometrics Result Schema
const faceVerificationSchema = {
  biometric_type: { type: String, default: 'face' },
  model: { type: String, default: 'prithivMLmods/deepfake-detector-model-v1' },
  timestamp: { type: Date },
  result: {
    num_frames: { type: Number, min: 0 },
    fake_probability: { type: Number, min: 0, max: 1 },
    real_probability: { type: Number, min: 0, max: 1 },
    decision: { type: String, enum: ['PASS', 'REVIEW', 'SUSPECT'] }
  },
  faceImageUrls: [{ type: String }],
  verified: { type: Boolean, default: false }
};

// Image Manipulation Detection Schema
const manipulationDetectionSchema = {
  check_type: { type: String, default: 'image_manipulation' },
  method: { type: String, default: 'ELA + CNN' },
  timestamp: { type: Date, default: Date.now },
  result: {
    prediction: { type: String, enum: ['Forged', 'Authentic'] },
    is_authentic: { type: Boolean },
    confidence: { type: Number, min: 0, max: 1 },
    raw_output: { type: Number, min: 0, max: 1 },
    decision: { type: String, enum: ['PASS', 'FAIL'] }
  },
  imageUrl: { type: String },
  verified: { type: Boolean, default: false }
};

// PAN Card OCR Result Schema
const panCardOCRSchema = {
  biometric_type: { type: String, default: 'pan_card' },
  model: { type: String, default: 'foduucom/pan-card-detection' },
  timestamp: { type: Date },
  result: {
    detected: { type: Boolean },
    boxes: [{
      x1: { type: Number },
      y1: { type: Number },
      x2: { type: Number },
      y2: { type: Number }
    }],
    text_data: [{
      box_id: { type: Number },
      coordinates: {
        x1: { type: Number },
        y1: { type: Number },
        x2: { type: Number },
        y2: { type: Number }
      },
      text: { type: String },
      confidence_scores: [{ type: Number }]
    }]
  },
  imageUrl: { type: String },
  verified: { type: Boolean, default: false },
  extractedData: {
    panNumber: { type: String, uppercase: true },
    name: { type: String },
    dateOfBirth: { type: String },
    fatherName: { type: String }
  }
};

// Aadhaar Card OCR Result Schema
const aadhaarCardOCRSchema = {
  biometric_type: { type: String, default: 'aadhar_card' },
  model: { type: String, default: 'roboflow/aadhar-card-entity-detection' },
  timestamp: { type: Date },
  result: {
    detected: { type: Boolean },
    extracted_fields: {
      type: Map,
      of: String
    },
    raw_predictions: [mongoose.Schema.Types.Mixed]
  },
  imageUrl: { type: String },
  verified: { type: Boolean, default: false },
  extractedData: {
    aadhaarNumber: { type: String },
    name: { type: String },
    gender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER', null], default: null },
    dateOfBirth: { type: String },
    address: { type: String }
  }
};

// Overall Assessment Schema
const overallAssessmentSchema = {
  totalScore: { type: Number, min: 0, max: 100 },
  passedChecks: { type: Number, default: 0 },
  failedChecks: { type: Number, default: 0 },
  reviewRequiredChecks: { type: Number, default: 0 },
  finalDecision: { 
    type: String, 
    enum: ['APPROVED', 'REJECTED', 'REVIEW_REQUIRED', 'PENDING'],
    default: 'PENDING'
  },
  riskLevel: { 
    type: String, 
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM'
  },
  confidence: { type: Number, min: 0, max: 1 },
  summary: { type: String },
  issues: [{ type: String }],
  recommendations: [{ type: String }],
  // NEW: Mapped verification status for the Verification model
  verificationStatus: {
    type: String,
    enum: ['draft', 'submitted', 'under_automated_verification', 'under_officer_review', 'approved', 'rejected'],
    default: 'under_officer_review'
  },
  // NEW: Flag for high risk applications
  isHighRisk: { type: Boolean, default: false }
};

// Main Verification Results Schema
const verificationResultsSchema = new mongoose.Schema({
  // References
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  verificationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Verification'
  },

  // Session Information
  sessionId: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  ipAddress: { type: String },
  userAgent: { type: String },

  // ML Model Results
  faceVerification: faceVerificationSchema,
  panCardOCR: panCardOCRSchema,
  aadhaarCardOCR: aadhaarCardOCRSchema,
  
  // Manipulation Detection for Both Documents
  manipulationDetection: {
    panCard: manipulationDetectionSchema,
    aadhaarCard: manipulationDetectionSchema
  },

  // Overall Assessment
  overallAssessment: overallAssessmentSchema,

  // Processing Information
  processingTime: {
    total: { type: Number }, // in milliseconds
    faceVerification: { type: Number },
    panOCR: { type: Number },
    aadhaarOCR: { type: Number },
    manipulationCheck: { type: Number }
  },

  // Status
  status: {
    type: String,
    enum: ['processing', 'completed', 'failed', 'partial'],
    default: 'processing',
    index: true
  },
  
  // Error Information (if any)
  errors: [{
    stage: { type: String },
    message: { type: String },
    code: { type: String },
    timestamp: { type: Date, default: Date.now }
  }],

  // Audit Trail
  processedBy: {
    type: String,
    default: 'automated_system'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: { type: Date },
  reviewNotes: { type: String },

  // Timestamps
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  suppressReservedKeysWarning: true
});

// Indexes for better query performance
verificationResultsSchema.index({ userId: 1, createdAt: -1 });
verificationResultsSchema.index({ verificationId: 1 });
verificationResultsSchema.index({ 'overallAssessment.finalDecision': 1 });
verificationResultsSchema.index({ 'overallAssessment.verificationStatus': 1 });
verificationResultsSchema.index({ 'overallAssessment.isHighRisk': 1 });
verificationResultsSchema.index({ status: 1, createdAt: -1 });

// Virtual for getting report URL
verificationResultsSchema.virtual('reportUrl').get(function() {
  return `/api/reports/${this._id}`;
});

// HIGH RISK THRESHOLD - applications with score below this are flagged as high risk
const HIGH_RISK_SCORE_THRESHOLD = 40;

// Method to calculate overall assessment
verificationResultsSchema.methods.calculateOverallAssessment = function() {
  let passedChecks = 0;
  let failedChecks = 0;
  let reviewRequiredChecks = 0;
  let totalScore = 0;
  const issues = [];
  const recommendations = [];

  // Face Verification Check
  if (this.faceVerification?.result) {
    const faceDecision = this.faceVerification.result.decision;
    if (faceDecision === 'PASS') {
      passedChecks++;
      totalScore += 25;
    } else if (faceDecision === 'REVIEW') {
      reviewRequiredChecks++;
      totalScore += 15;
      issues.push('Face verification requires manual review');
      recommendations.push('Review face biometric images manually');
    } else {
      failedChecks++;
      issues.push('Face verification failed - potential deepfake detected');
      recommendations.push('Request fresh face capture in controlled environment');
    }
  }

  // PAN Card Manipulation Check
  if (this.manipulationDetection?.panCard?.result) {
    const panDecision = this.manipulationDetection.panCard.result.decision;
    if (panDecision === 'PASS') {
      passedChecks++;
      totalScore += 20;
    } else {
      failedChecks++;
      issues.push('PAN card appears to be manipulated');
      recommendations.push('Request original PAN card document');
    }
  }

  // Aadhaar Card Manipulation Check
  if (this.manipulationDetection?.aadhaarCard?.result) {
    const aadhaarDecision = this.manipulationDetection.aadhaarCard.result.decision;
    if (aadhaarDecision === 'PASS') {
      passedChecks++;
      totalScore += 20;
    } else {
      failedChecks++;
      issues.push('Aadhaar card appears to be manipulated');
      recommendations.push('Request original Aadhaar card document');
    }
  }

  // PAN OCR Check
  if (this.panCardOCR?.result?.detected) {
    passedChecks++;
    totalScore += 15;
  } else {
    failedChecks++;
    issues.push('PAN card details could not be extracted');
    recommendations.push('Provide clearer image of PAN card');
  }

  // Aadhaar OCR Check
  if (this.aadhaarCardOCR?.result?.detected) {
    passedChecks++;
    totalScore += 20;
  } else {
    failedChecks++;
    issues.push('Aadhaar card details could not be extracted');
    recommendations.push('Provide clearer image of Aadhaar card');
  }

  // ============ DETERMINE RISK LEVEL ============
  let riskLevel = 'MEDIUM';
  if (failedChecks === 0 && reviewRequiredChecks === 0) {
    riskLevel = 'LOW';
  } else if (failedChecks >= 2) {
    riskLevel = 'CRITICAL';
  } else if (failedChecks === 1) {
    riskLevel = 'HIGH';
  } else if (reviewRequiredChecks > 0) {
    riskLevel = 'MEDIUM';
  }

  // ============ DETERMINE IF HIGH RISK ============
  // High risk if: score below threshold OR critical/high risk level
  const isHighRisk = totalScore < HIGH_RISK_SCORE_THRESHOLD || 
                     riskLevel === 'CRITICAL' || 
                     riskLevel === 'HIGH';

  // ============ DETERMINE FINAL DECISION (AI recommendation) ============
  // This is the AI's recommendation, NOT the final verification status
  let finalDecision = 'PENDING';
  // AI can suggest but officer makes final decision
  // Keep all as PENDING to require officer review

  // ============ MAP TO VERIFICATION STATUS ============
  // After AI processing, ALL applications go to under_officer_review
  // Officers will see high-risk ones flagged separately
  const verificationStatus = 'under_officer_review';

  const confidence = totalScore / 100;

  this.overallAssessment = {
    totalScore,
    passedChecks,
    failedChecks,
    reviewRequiredChecks,
    finalDecision,
    riskLevel,
    confidence,
    summary: `Verification analysis completed with ${passedChecks}/${passedChecks + failedChecks + reviewRequiredChecks} checks passed. ${isHighRisk ? '⚠️ HIGH RISK - Requires careful review.' : 'Awaiting officer review.'}`,
    issues,
    recommendations,
    // NEW: These fields help with status management
    verificationStatus,
    isHighRisk
  };

  return this.overallAssessment;
};

// NEW: Method to get the proper verification status to set
verificationResultsSchema.methods.getVerificationStatus = function() {
  // After AI processing completes, application goes to officer review
  return this.overallAssessment?.verificationStatus || 'under_officer_review';
};

// NEW: Method to check if application is high risk
verificationResultsSchema.methods.checkIsHighRisk = function() {
  return this.overallAssessment?.isHighRisk || false;
};

// Method to mark as completed
verificationResultsSchema.methods.markCompleted = function() {
  this.status = 'completed';
  this.completedAt = new Date();
  this.calculateOverallAssessment();
  return this.save();
};

// Method to add error
verificationResultsSchema.methods.addError = function(stage, message, code) {
  this.errors.push({
    stage,
    message,
    code,
    timestamp: new Date()
  });
  this.status = 'failed';
  return this.save();
};

// Create and export model
const VerificationResults = mongoose.model('VerificationResults', verificationResultsSchema);

export default VerificationResults;