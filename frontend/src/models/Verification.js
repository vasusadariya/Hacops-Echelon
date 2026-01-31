import mongoose from 'mongoose';

// IMPORTANT: Delete existing model if it exists (fixes hot reload issues)
if (mongoose.connection.models['Verification']) {
  delete mongoose.connection.models['Verification'];
}
if (mongoose.models.Verification) {
  delete mongoose.models.Verification;
}

const VerificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fullName: {
    type: String,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  documentIdNumber: {
    type: String,
    required: true
  },
  aadhaarCardImage: {
    publicId: String,
    secureUrl: String,
    url: String,
    format: String,
    width: Number,
    height: Number,
    bytes: Number,
    originalFilename: String,
    createdAt: Date
  },
  panCardImage: {
    publicId: String,
    secureUrl: String,
    url: String,
    format: String,
    width: Number,
    height: Number,
    bytes: Number,
    originalFilename: String,
    createdAt: Date
  },
  biometricSelfie: {
    publicId: String,
    secureUrl: String,
    url: String,
    format: String,
    width: Number,
    height: Number,
    bytes: Number,
    originalFilename: String,
    createdAt: Date,
    capturedAt: Date,
    faceDetected: Boolean,
    faceConfidence: Number
  },
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
    required: true
  },
  taluka: {
    type: String,
    required: true
  },
  district: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  pincode: {
    type: String,
    required: true
  },
  mobileNumber: {
    type: String,
    required: true
  },
  behaviorAnalysis: {
    typingSpeed: Number,
    mouseMovements: Number,
    totalTimeSpent: Number,
    suspiciousActivity: Boolean,
    riskScore: Number
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'under_automated_verification', 'under_officer_review', 'approved', 'rejected'],
    default: 'draft'
  },
  statusHistory: [{
    status: String,
    changedAt: Date,
    changedBy: mongoose.Schema.Types.ObjectId,
    remarks: String
  }],
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  rejectionReason: String,
  submittedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// NO MIDDLEWARE - just the schema

const Verification = mongoose.model('Verification', VerificationSchema);

export default Verification;