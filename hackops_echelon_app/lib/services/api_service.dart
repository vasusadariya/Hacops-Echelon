import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  // For Android Emulator: use 10.0.2.2 (maps to host's localhost)
  // For iOS Simulator: use localhost or 127.0.0.1
  // For Physical Device: use your computer's local IP address (e.g., 192.168.1.100)
  
  static String get baseUrl {
    if (Platform.isAndroid) {
      return 'http://10.0.2.2:3000'; // Android Emulator
    } else if (Platform.isIOS) {
      return 'http://localhost:3000'; // iOS Simulator
    } else {
      return 'http://localhost:3000'; // Web/Desktop
    }
  }
  
  static Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token');
  }

  static Future<void> _saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', token);
  }

  static Future<void> clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
  }

  static Map<String, String> _headers({String? token}) {
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  // Auth: Login
  static Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/auth/login'),
        headers: _headers(),
        body: jsonEncode({'email': email, 'password': password}),
      ).timeout(const Duration(seconds: 10));

      final data = jsonDecode(response.body);
      if (response.statusCode == 200 && data['success'] == true) {
        await _saveToken(data['token']);
      }
      return data;
    } catch (e) {
      print('Login error: $e');
      rethrow;
    }
  }

  // Auth: Register
  static Future<Map<String, dynamic>> register(String name, String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/auth/register'),
        headers: _headers(),
        body: jsonEncode({'name': name, 'email': email, 'password': password}),
      ).timeout(const Duration(seconds: 10));

      return jsonDecode(response.body);
    } catch (e) {
      print('Register error: $e');
      rethrow;
    }
  }

  // Auth: Get Current User
  static Future<Map<String, dynamic>?> getCurrentUser() async {
    try {
      final token = await _getToken();
      if (token == null) return null;

      final response = await http.get(
        Uri.parse('$baseUrl/api/auth/me'),
        headers: _headers(token: token),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          return data['user'];
        }
      }
      return null;
    } catch (e) {
      print('Get current user error: $e');
      return null;
    }
  }

  // Auth: Forgot Password
  static Future<Map<String, dynamic>> forgotPassword(String email) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/auth/forgot-password'),
        headers: _headers(),
        body: jsonEncode({'email': email}),
      ).timeout(const Duration(seconds: 10));

      return jsonDecode(response.body);
    } catch (e) {
      print('Forgot password error: $e');
      rethrow;
    }
  }

  // Auth: Reset Password
  static Future<Map<String, dynamic>> resetPassword(String token, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/auth/reset-password'),
        headers: _headers(),
        body: jsonEncode({'token': token, 'password': password}),
      ).timeout(const Duration(seconds: 10));

      return jsonDecode(response.body);
    } catch (e) {
      print('Reset password error: $e');
      rethrow;
    }
  }

  // Check if user is logged in
  static Future<bool> isLoggedIn() async {
    final token = await _getToken();
    return token != null;
  }
}