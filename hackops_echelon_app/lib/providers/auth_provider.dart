import 'package:flutter/foundation.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  Map<String, dynamic>? _user;
  bool _isLoading = true;
  String? _error;

  Map<String, dynamic>? get user => _user;
  bool get isLoading => _isLoading;
  bool get isLoggedIn => _user != null;
  bool get isOfficer => _user?['role'] == 'officer';
  bool get isAdmin => _user?['role'] == 'admin';
  bool get isVerified => _user?['isVerified'] == true;
  String? get error => _error;
  String get userName => _user?['name'] ?? 'User';
  String get userEmail => _user?['email'] ?? '';
  String get userRole => _user?['role'] ?? 'user';
  String? get userId => _user?['_id'] ?? _user?['id'];

  AuthProvider() {
    _loadUser();
  }

  Future<void> _loadUser() async {
    _isLoading = true;
    notifyListeners();

    try {
      _user = await ApiService.getCurrentUser();
    } catch (e) {
      _user = null;
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await ApiService.login(email, password);
      if (result['success'] == true || result['token'] != null) {
        _user = result['user'];
        _isLoading = false;
        notifyListeners();
        return {
          'success': true,
          'user': _user,
          'redirectPath': _user?['role'] == 'officer' ? '/officer' : '/dashboard',
        };
      } else {
        _error = result['error'] ?? 'Login failed';
        _isLoading = false;
        notifyListeners();
        return {'success': false, 'error': _error};
      }
    } catch (e) {
      _error = 'Network error. Please try again.';
      _isLoading = false;
      notifyListeners();
      return {'success': false, 'error': _error};
    }
  }

  Future<Map<String, dynamic>> register(String name, String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await ApiService.register(name, email, password);
      _isLoading = false;

      if (result['success'] == true) {
        notifyListeners();
        return {'success': true};
      } else {
        _error = result['error'] ?? 'Registration failed';
        notifyListeners();
        return {'success': false, 'error': _error};
      }
    } catch (e) {
      _error = 'Network error. Please try again.';
      _isLoading = false;
      notifyListeners();
      return {'success': false, 'error': _error};
    }
  }

  Future<void> logout() async {
    await ApiService.clearToken();
    _user = null;
    _error = null;
    notifyListeners();
  }

  Future<void> refreshUser() async {
    try {
      _user = await ApiService.getCurrentUser();
      notifyListeners();
    } catch (e) {
      // Silent fail
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}