class VerificationModel {
  final String id;
  final String? userId;
  final String fullName;
  final String gender;
  final String addressLine1;
  final String? addressLine2;
  final String city;
  final String taluka;
  final String district;
  final String state;
  final String pincode;
  final String mobileNumber;
  final String status;
  final DocumentImage? aadhaarCardImage;
  final DocumentImage? panCardImage;
  final BiometricSelfies? biometricSelfies;
  final BehaviorSummary? behaviorSummary;
  final AIVerificationResults? aiVerificationResults;
  final String? rejectionReason;
  final DateTime? submittedAt;
  final DateTime? reviewedAt;
  final DateTime? createdAt;

  VerificationModel({
    required this.id,
    this.userId,
    required this.fullName,
    required this.gender,
    required this.addressLine1,
    this.addressLine2,
    required this.city,
    required this.taluka,
    required this.district,
    required this.state,
    required this.pincode,
    required this.mobileNumber,
    required this.status,
    this.aadhaarCardImage,
    this.panCardImage,
    this.biometricSelfies,
    this.behaviorSummary,
    this.aiVerificationResults,
    this.rejectionReason,
    this.submittedAt,
    this.reviewedAt,
    this.createdAt,
  });

  factory VerificationModel.fromJson(Map<String, dynamic> json) {
    return VerificationModel(
      id: json['_id'] ?? json['id'] ?? '',
      userId: json['userId'],
      fullName: json['fullName'] ?? '',
      gender: json['gender'] ?? '',
      addressLine1: json['addressLine1'] ?? '',
      addressLine2: json['addressLine2'],
      city: json['city'] ?? '',
      taluka: json['taluka'] ?? '',
      district: json['district'] ?? '',
      state: json['state'] ?? '',
      pincode: json['pincode'] ?? '',
      mobileNumber: json['mobileNumber'] ?? '',
      status: json['status'] ?? 'draft',
      aadhaarCardImage: json['aadhaarCardImage'] != null
          ? DocumentImage.fromJson(json['aadhaarCardImage'])
          : null,
      panCardImage: json['panCardImage'] != null
          ? DocumentImage.fromJson(json['panCardImage'])
          : null,
      biometricSelfies: json['biometricSelfies'] != null
          ? BiometricSelfies.fromJson(json['biometricSelfies'])
          : null,
      behaviorSummary: json['behaviorSummary'] != null
          ? BehaviorSummary.fromJson(json['behaviorSummary'])
          : null,
      aiVerificationResults: json['aiVerificationResults'] != null
          ? AIVerificationResults.fromJson(json['aiVerificationResults'])
          : null,
      rejectionReason: json['rejectionReason'],
      submittedAt: json['submittedAt'] != null ? DateTime.tryParse(json['submittedAt']) : null,
      reviewedAt: json['reviewedAt'] != null ? DateTime.tryParse(json['reviewedAt']) : null,
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt']) : null,
    );
  }

  String get shortId => id.length > 8 ? id.substring(id.length - 8).toUpperCase() : id.toUpperCase();
  
  bool get isApproved => status == 'approved';
  bool get isRejected => status == 'rejected';
  bool get isPending => status == 'under_officer_review' || status == 'under_automated_verification';
}

class DocumentImage {
  final String? publicId;
  final String? secureUrl;
  final String? url;
  final String? format;
  final int? width;
  final int? height;

  DocumentImage({
    this.publicId,
    this.secureUrl,
    this.url,
    this.format,
    this.width,
    this.height,
  });

  factory DocumentImage.fromJson(Map<String, dynamic> json) {
    return DocumentImage(
      publicId: json['publicId'],
      secureUrl: json['secureUrl'],
      url: json['url'],
      format: json['format'],
      width: json['width'],
      height: json['height'],
    );
  }
}

class BiometricSelfies {
  final FaceImage? front;
  final FaceImage? left;
  final FaceImage? right;
  final FaceImage? up;

  BiometricSelfies({this.front, this.left, this.right, this.up});

  factory BiometricSelfies.fromJson(Map<String, dynamic> json) {
    return BiometricSelfies(
      front: json['front'] != null ? FaceImage.fromJson(json['front']) : null,
      left: json['left'] != null ? FaceImage.fromJson(json['left']) : null,
      right: json['right'] != null ? FaceImage.fromJson(json['right']) : null,
      up: json['up'] != null ? FaceImage.fromJson(json['up']) : null,
    );
  }

  List<FaceImage?> get all => [front, left, right, up];
  int get capturedCount => all.where((f) => f?.secureUrl != null).length;
}

class FaceImage {
  final String? publicId;
  final String? secureUrl;
  final DateTime? capturedAt;

  FaceImage({this.publicId, this.secureUrl, this.capturedAt});

  factory FaceImage.fromJson(Map<String, dynamic> json) {
    return FaceImage(
      publicId: json['publicId'],
      secureUrl: json['secureUrl'],
      capturedAt: json['capturedAt'] != null ? DateTime.tryParse(json['capturedAt']) : null,
    );
  }
}

class BehaviorSummary {
  final int overallTrustScore;
  final int botLikelihood;
  final String riskLevel;
  final bool isHuman;
  final String recommendation;

  BehaviorSummary({
    this.overallTrustScore = 50,
    this.botLikelihood = 50,
    this.riskLevel = 'medium',
    this.isHuman = true,
    this.recommendation = 'standard_flow',
  });

  factory BehaviorSummary.fromJson(Map<String, dynamic> json) {
    return BehaviorSummary(
      overallTrustScore: json['overallTrustScore'] ?? 50,
      botLikelihood: json['botLikelihood'] ?? 50,
      riskLevel: json['riskLevel'] ?? 'medium',
      isHuman: json['isHuman'] ?? true,
      recommendation: json['recommendation'] ?? 'standard_flow',
    );
  }

  bool get isHighRisk => riskLevel == 'high' || riskLevel == 'critical';
  bool get isLowRisk => riskLevel == 'low';
}

class AIVerificationResults {
  final FaceVerificationResult? faceVerification;
  final ManipulationResult? panManipulation;
  final ManipulationResult? aadhaarManipulation;
  final int? overallScore;
  final String? aiDecision;

  AIVerificationResults({
    this.faceVerification,
    this.panManipulation,
    this.aadhaarManipulation,
    this.overallScore,
    this.aiDecision,
  });

  factory AIVerificationResults.fromJson(Map<String, dynamic> json) {
    return AIVerificationResults(
      faceVerification: json['faceVerification'] != null
          ? FaceVerificationResult.fromJson(json['faceVerification'])
          : null,
      panManipulation: json['manipulationDetection']?['panCard'] != null
          ? ManipulationResult.fromJson(json['manipulationDetection']['panCard'])
          : null,
      aadhaarManipulation: json['manipulationDetection']?['aadhaarCard'] != null
          ? ManipulationResult.fromJson(json['manipulationDetection']['aadhaarCard'])
          : null,
      overallScore: json['overallScore'],
      aiDecision: json['aiDecision'],
    );
  }
}

class FaceVerificationResult {
  final String? model;
  final String? decision;
  final double? fakeProbability;
  final double? realProbability;
  final bool verified;

  FaceVerificationResult({
    this.model,
    this.decision,
    this.fakeProbability,
    this.realProbability,
    this.verified = false,
  });

  factory FaceVerificationResult.fromJson(Map<String, dynamic> json) {
    return FaceVerificationResult(
      model: json['model'],
      decision: json['result']?['decision'],
      fakeProbability: json['result']?['fake_probability']?.toDouble(),
      realProbability: json['result']?['real_probability']?.toDouble(),
      verified: json['verified'] ?? false,
    );
  }

  bool get isPass => decision == 'PASS';
}

class ManipulationResult {
  final String? prediction;
  final bool isAuthentic;
  final double? confidence;
  final String? decision;

  ManipulationResult({
    this.prediction,
    this.isAuthentic = false,
    this.confidence,
    this.decision,
  });

  factory ManipulationResult.fromJson(Map<String, dynamic> json) {
    return ManipulationResult(
      prediction: json['result']?['prediction'],
      isAuthentic: json['result']?['is_authentic'] ?? false,
      confidence: json['result']?['confidence']?.toDouble(),
      decision: json['result']?['decision'],
    );
  }
}