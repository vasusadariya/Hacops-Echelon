import 'dart:io';
import 'package:flutter/foundation.dart';
import '../services/api_service.dart';

class VerificationProvider extends ChangeNotifier {
  Map<String, dynamic>? _verificationStatus;
  bool _isLoading = false;
  bool _hasFetched = false;
  String? _error;

  Map<String, dynamic>? get status => _verificationStatus;
  bool get isLoading => _isLoading;
  bool get hasFetched => _hasFetched;
  String? get error => _error;
  
  String get currentStatus => _verificationStatus?['status'] ?? 'not_started';
  
  // Status checks
  bool get hasNotStarted => currentStatus == 'not_started';
  bool get isSubmitted => currentStatus == 'submitted';
  bool get isUnderAIVerification => currentStatus == 'under_automated_verification';
  bool get isUnderOfficerReview => currentStatus == 'under_officer_review';
  bool get isApproved => currentStatus == 'approved';
  bool get isRejected => currentStatus == 'rejected';
  
  // Can user start/restart verification?
  bool get canStartVerification => hasNotStarted || isRejected;
  
  // Is verification in progress?
  bool get isVerificationInProgress => 
      isSubmitted || isUnderAIVerification || isUnderOfficerReview;
  
  // Is verification complete (either approved or rejected)?
  bool get isVerificationComplete => isApproved || isRejected;

  Future<void> fetchStatus({bool forceRefresh = false}) async {
    if (_isLoading) return;
    if (_hasFetched && !forceRefresh) return;

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await ApiService.getVerificationStatus();
      // GET /api/verification/status returns the status object flat at the root
      // (hasVerification, status, statusInfo, ...) — it never wraps it in a
      // `success`/`verification` key. Only ApiService's own error paths
      // (auth/network failures) have no `status` key at all.
      if (result['status'] != null) {
        _verificationStatus = result;
      } else {
        _verificationStatus = {'status': 'not_started'};
      }
      _hasFetched = true;
    } catch (e) {
      _error = 'Failed to fetch status';
      _verificationStatus = {'status': 'not_started'};
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<Map<String, dynamic>> submitVerification({
    required Map<String, String> formData,
    required File aadhaarCard,
    required File panCard,
    required Map<String, String> faceCaptures,
    Map<String, dynamic>? behaviorData,
  }) async {
    // Prevent submission if verification already in progress
    if (isVerificationInProgress) {
      return {
        'success': false,
        'error': 'Verification already in progress. Please wait for the result.'
      };
    }

    // Prevent submission if already approved
    if (isApproved) {
      return {
        'success': false,
        'error': 'Your identity is already verified.'
      };
    }

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await ApiService.submitVerification(
        formData: formData,
        aadhaarCard: aadhaarCard,
        panCard: panCard,
        faceCaptures: faceCaptures,
        behaviorData: behaviorData,
      );

      _isLoading = false;

      if (result['success'] == true) {
        // Refresh status after submission
        await fetchStatus(forceRefresh: true);
        notifyListeners();
        return {'success': true, 'verificationId': result['verificationId']};
      } else {
        _error = result['error'] ?? 'Submission failed';
        notifyListeners();
        return {'success': false, 'error': _error};
      }
    } catch (e) {
      _error = 'Network error: $e';
      _isLoading = false;
      notifyListeners();
      return {'success': false, 'error': _error};
    }
  }

  void reset() {
    _verificationStatus = null;
    _hasFetched = false;
    _isLoading = false;
    _error = null;
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}