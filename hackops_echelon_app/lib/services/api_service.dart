import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';

class ApiService {
  static String get baseUrl => ApiConfig.baseUrl;
  static String get aiBackendUrl => ApiConfig.aiBackendUrl;

  // Token Management
  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token');
  }

  static Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', token);
  }

  static Future<void> clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
  }

  static Map<String, String> _headers({String? token, bool isMultipart = false}) {
    final headers = <String, String>{};
    if (!isMultipart) {
      headers['Content-Type'] = 'application/json';
    }
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  // ==================== AUTH ====================

  static Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl${ApiConfig.authLogin}'),
        headers: _headers(),
        body: jsonEncode({'email': email, 'password': password}),
      ).timeout(ApiConfig.timeout);

      final data = jsonDecode(response.body);
      if (response.statusCode == 200 && data['token'] != null) {
        await saveToken(data['token']);
        data['success'] = true;
      }
      return data;
    } catch (e) {
      return {'success': false, 'error': 'Network error: $e'};
    }
  }

  static Future<Map<String, dynamic>> register(String name, String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl${ApiConfig.authRegister}'),
        headers: _headers(),
        body: jsonEncode({'name': name, 'email': email, 'password': password}),
      ).timeout(ApiConfig.timeout);

      final data = jsonDecode(response.body);
      if (response.statusCode == 200 || response.statusCode == 201) {
        data['success'] = true;
      }
      return data;
    } catch (e) {
      return {'success': false, 'error': 'Network error: $e'};
    }
  }

  static Future<Map<String, dynamic>?> getCurrentUser() async {
    try {
      final token = await getToken();
      if (token == null) return null;

      final response = await http.get(
        Uri.parse('$baseUrl${ApiConfig.authMe}'),
        headers: _headers(token: token),
      ).timeout(ApiConfig.timeout);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['user'];
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  static Future<Map<String, dynamic>> forgotPassword(String email) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl${ApiConfig.authForgotPassword}'),
        headers: _headers(),
        body: jsonEncode({'email': email}),
      ).timeout(ApiConfig.timeout);

      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'error': 'Network error: $e'};
    }
  }

  // ==================== VERIFICATION ====================

  static Future<Map<String, dynamic>> submitVerification({
    required Map<String, String> formData,
    required File aadhaarCard,
    required File panCard,
    required Map<String, String> faceCaptures,
    Map<String, dynamic>? behaviorData,
  }) async {
    try {
      final token = await getToken();
      if (token == null) {
        return {'success': false, 'error': 'Not authenticated'};
      }

      var request = http.MultipartRequest(
        'POST',
        Uri.parse('$baseUrl${ApiConfig.verificationSubmit}'),
      );

      request.headers.addAll(_headers(token: token, isMultipart: true));
      request.headers['Authorization'] = 'Bearer $token';

      // Add form fields
      formData.forEach((key, value) {
        request.fields[key] = value;
      });

      // Add files
      request.files.add(await http.MultipartFile.fromPath(
        'aadhaarCard',
        aadhaarCard.path,
      ));
      request.files.add(await http.MultipartFile.fromPath(
        'panCard',
        panCard.path,
      ));

      // Add face captures as JSON
      request.fields['faceCaptures'] = jsonEncode(faceCaptures);

      // Add behavior data
      if (behaviorData != null) {
        request.fields['behaviorData'] = jsonEncode(behaviorData);
      }

      final streamedResponse = await request.send().timeout(const Duration(minutes: 2));
      final response = await http.Response.fromStream(streamedResponse);

      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'error': 'Network error: $e'};
    }
  }

  static Future<Map<String, dynamic>> getVerificationStatus() async {
    try {
      final token = await getToken();
      if (token == null) {
        return {'success': false, 'error': 'Not authenticated'};
      }

      final response = await http.get(
        Uri.parse('$baseUrl${ApiConfig.verificationStatus}'),
        headers: _headers(token: token),
      ).timeout(ApiConfig.timeout);

      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'error': 'Network error: $e'};
    }
  }

  // ==================== OFFICER ====================

  static Future<Map<String, dynamic>> getOfficerStats() async {
    try {
      final token = await getToken();
      if (token == null) {
        return {'success': false, 'error': 'Not authenticated'};
      }

      final response = await http.get(
        Uri.parse('$baseUrl${ApiConfig.officerStats}'),
        headers: _headers(token: token),
      ).timeout(ApiConfig.timeout);

      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'error': 'Network error: $e'};
    }
  }

  static Future<Map<String, dynamic>> getOfficerApplications({
    String? status,
    int limit = 10,
    String sort = 'newest',
  }) async {
    try {
      final token = await getToken();
      if (token == null) {
        return {'success': false, 'error': 'Not authenticated'};
      }

      final queryParams = <String, String>{
        'limit': limit.toString(),
        'sort': sort,
      };
      if (status != null) {
        queryParams['status'] = status;
      }

      final uri = Uri.parse('$baseUrl${ApiConfig.officerApplications}')
          .replace(queryParameters: queryParams);

      final response = await http.get(
        uri,
        headers: _headers(token: token),
      ).timeout(ApiConfig.timeout);

      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'error': 'Network error: $e'};
    }
  }

  static Future<Map<String, dynamic>> getApplicationById(String id) async {
    try {
      final token = await getToken();
      if (token == null) {
        return {'success': false, 'error': 'Not authenticated'};
      }

      final response = await http.get(
        Uri.parse('$baseUrl${ApiConfig.officerApplications}/$id'),
        headers: _headers(token: token),
      ).timeout(ApiConfig.timeout);

      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'error': 'Network error: $e'};
    }
  }

  static Future<Map<String, dynamic>> reviewApplication(
    String id,
    String action,
    String? remarks,
  ) async {
    try {
      final token = await getToken();
      if (token == null) {
        return {'success': false, 'error': 'Not authenticated'};
      }

      final response = await http.post(
        Uri.parse('$baseUrl${ApiConfig.officerApplications}/$id/action'),
        headers: _headers(token: token),
        body: jsonEncode({
          'action': action,
          'remarks': remarks ?? '',
        }),
      ).timeout(ApiConfig.timeout);

      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'error': 'Network error: $e'};
    }
  }
}