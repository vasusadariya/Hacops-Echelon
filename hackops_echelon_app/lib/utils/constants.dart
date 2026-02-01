class AppConstants {
  // App Info
  static const String appName = 'KYC Verify';
  static const String appTagline = 'National Identity Verification Portal';
  static const String appVersion = '1.0.0';
  static const String governmentText = 'Government of India';
  static const String ministryText = 'Ministry of Electronics & IT';

  // Verification Status
  static const String statusDraft = 'draft';
  static const String statusSubmitted = 'submitted';
  static const String statusUnderAIVerification = 'under_automated_verification';
  static const String statusUnderOfficerReview = 'under_officer_review';
  static const String statusApproved = 'approved';
  static const String statusRejected = 'rejected';

  // Risk Levels
  static const String riskLow = 'low';
  static const String riskMedium = 'medium';
  static const String riskHigh = 'high';
  static const String riskCritical = 'critical';

  // User Roles
  static const String roleUser = 'user';
  static const String roleOfficer = 'officer';
  static const String roleAdmin = 'admin';

  // File Constraints
  static const int maxFileSizeMB = 5;
  static const int maxFileSizeBytes = 5 * 1024 * 1024;
  static const List<String> allowedImageFormats = ['jpg', 'jpeg', 'png'];

  // Face Capture Angles
  static const List<String> faceAngles = ['front', 'left', 'right', 'up'];
  static const Map<String, String> faceAngleLabels = {
    'front': 'Look Straight',
    'left': 'Turn Left',
    'right': 'Turn Right',
    'up': 'Look Up',
  };

  // Contact Info
  static const String helplineNumber = '1800-XXX-XXXX';
  static const String supportEmail = 'support@nivp.gov.in';
  static const String workingHours = 'Mon-Sat, 9:00 AM - 6:00 PM';

  // Status Display Config - FIXED return type
  static Map<String, dynamic> getStatusConfig(String status) {
    switch (status) {
      case statusApproved:
        return {
          'label': 'Approved',
          'color': 0xFF10B981,
          'icon': 'check_circle',
        };
      case statusRejected:
        return {
          'label': 'Rejected',
          'color': 0xFFDC2626,
          'icon': 'cancel',
        };
      case statusUnderOfficerReview:
        return {
          'label': 'Under Review',
          'color': 0xFFF97316,
          'icon': 'person_search',
        };
      case statusUnderAIVerification:
        return {
          'label': 'AI Processing',
          'color': 0xFF8B5CF6,
          'icon': 'memory',
        };
      case statusSubmitted:
        return {
          'label': 'Submitted',
          'color': 0xFF3B82F6,
          'icon': 'hourglass_top',
        };
      default:
        return {
          'label': 'Pending',
          'color': 0xFF6B7280,
          'icon': 'pending',
        };
    }
  }
}