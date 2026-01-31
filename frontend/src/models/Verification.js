import mongoose from 'mongoose';

// Delete existing model if it exists (fixes hot reload issues in Next.js)
if (mongoose.connection.models['Verification']) {
  delete mongoose.connection.models['Verification'];
}
if (mongoose.models.Verification) {
  delete mongoose.models.Verification;
}

// Face image schema (for each angle)
const faceImageSchema = {
  publicId: { type: String },
  secureUrl: { type: String },
  url: { type: String },
  format: { type: String },
  width: { type: Number },
  height: { type: Number },
  bytes: { type: Number },
  capturedAt: { type: Date }
};

// Document image schema (for Aadhaar/PAN)
const documentImageSchema = {
  publicId: { type: String },
  secureUrl: { type: String },
  url: { type: String },
  format: { type: String },
  width: { type: Number },
  height: { type: Number },
  bytes: { type: Number },
  originalFilename: { type: String },
  createdAt: { type: Date, default: Date.now }
};

// Behavior analysis schema
const behaviorAnalysisSchema = {
  typingSpeed: { type: Number, default: 0 },
  mouseMovements: { type: Number, default: 0 },
  totalTimeSpent: { type: Number, default: 0 },
  suspiciousActivity: { type: Boolean, default: false },
  riskScore: { type: Number, default: 0 }
};

// Status history schema
const statusHistorySchema = {
  status: { type: String },
  changedAt: { type: Date, default: Date.now },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  remarks: { type: String }
};

// Main Verification Schema
const verificationSchema = new mongoose.Schema({
  // User Reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Personal Information
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },

  // Identity Documents
  documentIdNumber: {
    type: String,
    required: true,
    uppercase: true
  },

  // Document Images (Aadhaar & PAN)
  aadhaarCardImage: documentImageSchema,
  panCardImage: documentImageSchema,

  // Multi-Angle Biometric Selfies (4 angles: front, left, right, up)
  biometricSelfies: {
    front: faceImageSchema,
    left: faceImageSchema,
    right: faceImageSchema,
    up: faceImageSchema,
    capturedAt: { type: Date }
  },

  // Primary selfie for backward compatibility and quick access
  biometricSelfie: {
    publicId: { type: String },
    secureUrl: { type: String },
    url: { type: String },
    format: { type: String },
    width: { type: Number },
    height: { type: Number },
    bytes: { type: Number },
    originalFilename: { type: String },
    createdAt: { type: Date },
    capturedAt: { type: Date },
    faceDetected: { type: Boolean },
    faceConfidence: { type: Number }
  },

  // Address Information
  addressLine1: {
    type: String,
    required: true
  },
  addressLine2: {
    type: String,
    default: ''
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  taluka: {
    type: String,
    required: true,
    trim: true
  },
  district: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: String,
    required: true,
    trim: true
  },
  pincode: {
    type: String,
    required: true
  },

  // Contact Information
  mobileNumber: {
    type: String,
    required: true
  },

  // Behavior Analysis Data
  behaviorAnalysis: behaviorAnalysisSchema,

  // AI Model Verification Results
  aiVerificationResults: {
    // Face Biometrics Verification
    faceVerification: {
      model: { type: String },
      timestamp: { type: Date },
      result: {
        num_frames: { type: Number },
        fake_probability: { type: Number },
        real_probability: { type: Number },
        decision: { type: String, enum: ['PASS', 'REVIEW', 'SUSPECT'] }
      },
      faceImageUrls: [String],
      verified: { type: Boolean, default: false }
    },

    // PAN Card OCR Verification
    panCardOCR: {
      model: { type: String },
      timestamp: { type: Date },
      result: {
        detected: { type: Boolean },
        boxes: [mongoose.Schema.Types.Mixed],
        text_data: [mongoose.Schema.Types.Mixed]
      },
      imageUrl: { type: String },
      verified: { type: Boolean, default: false }
    },

    // Image Manipulation Detection
    manipulationDetection: {
      panCard: {
        model: { type: String },
        timestamp: { type: Date },
        result: {
          prediction: { type: String, enum: ['Forged', 'Authentic'] },
          is_authentic: { type: Boolean },
          confidence: { type: Number },
          raw_output: { type: Number },
          decision: { type: String, enum: ['PASS', 'FAIL'] }
        },
        imageUrl: { type: String },
        verified: { type: Boolean, default: false }
      },
      aadhaarCard: {
        model: { type: String },
        timestamp: { type: Date },
        result: {
          prediction: { type: String, enum: ['Forged', 'Authentic'] },
          is_authentic: { type: Boolean },
          confidence: { type: Number },
          raw_output: { type: Number },
          decision: { type: String, enum: ['PASS', 'FAIL'] }
        },
        imageUrl: { type: String },
        verified: { type: Boolean, default: false }
      }
    },

    // Overall AI Verification Summary
    overallScore: { type: Number, min: 0, max: 100 },
    aiDecision: { type: String, enum: ['PASS', 'REVIEW', 'REJECT'] },
    verifiedAt: { type: Date }
  },

  // Verification Status
  status: {
    type: String,
    enum: ['draft', 'submitted', 'under_automated_verification', 'under_officer_review', 'approved', 'rejected'],
    default: 'draft',
    index: true
  },

  // Status History
  statusHistory: [statusHistorySchema],

  // Review Information
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: { type: Date },
  rejectionReason: { type: String },

  // Timestamps
  submittedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes for better query performance
verificationSchema.index({ userId: 1, status: 1 });
verificationSchema.index({ createdAt: -1 });
verificationSchema.index({ submittedAt: -1 });

// Create and export model
const Verification = mongoose.model('Verification', verificationSchema);

export default Verification;