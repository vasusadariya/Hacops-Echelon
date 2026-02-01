import 'dart:io';

class ApiConfig {
  // Base URLs for different environments
  static String get baseUrl {
    if (Platform.isAndroid) {
      // Android Emulator maps 10.0.2.2 to host's localhost
      return 'http://10.0.2.2:3000';
    } else if (Platform.isIOS) {
      return 'http://localhost:3000';
    } else {
      return 'http://localhost:3000';
    }
  }

  // Python Backend URL (FastAPI)
  static String get aiBackendUrl {
    if (Platform.isAndroid) {
      return 'http://10.0.2.2:8000';
    } else if (Platform.isIOS) {
      return 'http://localhost:8000';
    } else {
      return 'http://localhost:8000';
    }
  }

  // API Endpoints
  static const String authLogin = '/api/auth/login';
  static const String authRegister = '/api/auth/register';
  static const String authMe = '/api/auth/me';
  static const String authForgotPassword = '/api/auth/forgot-password';
  static const String authResetPassword = '/api/auth/reset-password';
  
  static const String verificationSubmit = '/api/verification/submit';
  static const String verificationStatus = '/api/verification/status';
  
  static const String officerApplications = '/api/officer/applications';
  static const String officerStats = '/api/officer/stats';

  // AI Backend Endpoints
  static const String behavioralAnalyze = '/api/behavioral/analyze';
  static const String faceVerify = '/face/verify';
  static const String manipulationCheck = '/manipulation/check';
  static const String panVerify = '/pan/verify';
  static const String aadharVerify = '/aadhar/verify';

  // Timeout duration
  static const Duration timeout = Duration(seconds: 30);
}