import 'dart:convert';
import 'dart:io' show Platform;
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user.dart';
import '../models/group.dart';
import '../models/expense.dart';
import '../models/balance.dart';

class ApiService {
  static String get defaultBaseUrl {
    if (kIsWeb) return 'http://localhost:4000';
    try {
      if (Platform.isAndroid) return 'http://10.0.2.2:4000';
    } catch (_) {}
    return 'http://localhost:4000';
  }

  String baseUrl = defaultBaseUrl;

  Future<String?> getAccessToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('access_token');
  }

  Future<String?> getRefreshToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('refresh_token');
  }

  Future<void> saveTokens({required String accessToken, required String refreshToken}) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('access_token', accessToken);
    await prefs.setString('refresh_token', refreshToken);
  }

  Future<void> saveUser(User user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('user_id', user.id);
    await prefs.setString('user_email', user.email);
    await prefs.setString('user_name', user.name);
  }

  Future<User?> getSavedUser() async {
    final prefs = await SharedPreferences.getInstance();
    final id = prefs.getString('user_id');
    final email = prefs.getString('user_email');
    final name = prefs.getString('user_name');
    if (id != null && email != null && name != null) {
      return User(id: id, email: email, name: name);
    }
    return null;
  }

  Future<void> clearAuth() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('access_token');
    await prefs.remove('refresh_token');
    await prefs.remove('user_id');
    await prefs.remove('user_email');
    await prefs.remove('user_name');
  }

  Future<Map<String, String>> _headers() async {
    final token = await getAccessToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  // --- Auth ---

  Future<Map<String, dynamic>> register({
    required String email,
    required String password,
    required String name,
  }) async {
    final res = await http.post(
      Uri.parse('$baseUrl/auth/register'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password, 'name': name}),
    );
    final data = jsonDecode(res.body);
    if (res.statusCode >= 400) {
      throw Exception(data['message'] ?? 'Registration failed');
    }
    final user = User.fromJson(data['user']);
    await saveTokens(
      accessToken: data['accessToken'],
      refreshToken: data['refreshToken'],
    );
    await saveUser(user);
    return {'user': user};
  }

  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    final res = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );
    final data = jsonDecode(res.body);
    if (res.statusCode >= 400) {
      throw Exception(data['message'] ?? 'Login failed');
    }
    final user = User.fromJson(data['user']);
    await saveTokens(
      accessToken: data['accessToken'],
      refreshToken: data['refreshToken'],
    );
    await saveUser(user);
    return {'user': user};
  }

  // --- Groups ---

  Future<List<Group>> getGroups() async {
    final res = await http.get(
      Uri.parse('$baseUrl/groups'),
      headers: await _headers(),
    );
    if (res.statusCode >= 400) {
      throw Exception('Failed to load groups');
    }
    final List<dynamic> list = jsonDecode(res.body);
    return list.map((g) => Group.fromJson(g)).toList();
  }

  Future<Group> getGroup(String groupId) async {
    final res = await http.get(
      Uri.parse('$baseUrl/groups/$groupId'),
      headers: await _headers(),
    );
    if (res.statusCode >= 400) {
      throw Exception('Failed to load group details');
    }
    return Group.fromJson(jsonDecode(res.body));
  }

  Future<Group> createGroup(String name) async {
    final res = await http.post(
      Uri.parse('$baseUrl/groups'),
      headers: await _headers(),
      body: jsonEncode({'name': name}),
    );
    final data = jsonDecode(res.body);
    if (res.statusCode >= 400) {
      throw Exception(data['message'] ?? 'Failed to create group');
    }
    return Group.fromJson(data);
  }

  Future<void> addMember(String groupId, String email) async {
    final res = await http.post(
      Uri.parse('$baseUrl/groups/$groupId/members'),
      headers: await _headers(),
      body: jsonEncode({'email': email}),
    );
    final data = jsonDecode(res.body);
    if (res.statusCode >= 400) {
      throw Exception(data['message'] ?? 'Failed to add member');
    }
  }

  // --- Expenses ---

  Future<List<Expense>> getExpenses(String groupId) async {
    final res = await http.get(
      Uri.parse('$baseUrl/groups/$groupId/expenses'),
      headers: await _headers(),
    );
    if (res.statusCode >= 400) {
      throw Exception('Failed to load expenses');
    }
    final List<dynamic> list = jsonDecode(res.body);
    return list.map((e) => Expense.fromJson(e)).toList();
  }

  Future<Expense> createExpense({
    required String groupId,
    required String description,
    required double amount,
    required String paidById,
    List<String>? splitAmongUserIds,
    List<Map<String, dynamic>>? splits,
  }) async {
    final body = <String, dynamic>{
      'description': description,
      'amount': amount,
      'paidById': paidById,
    };
    if (splits != null && splits.isNotEmpty) {
      body['splits'] = splits;
    } else if (splitAmongUserIds != null) {
      body['splitAmongUserIds'] = splitAmongUserIds;
    }

    final res = await http.post(
      Uri.parse('$baseUrl/groups/$groupId/expenses'),
      headers: await _headers(),
      body: jsonEncode(body),
    );
    final data = jsonDecode(res.body);
    if (res.statusCode >= 400) {
      throw Exception(data['message'] ?? 'Failed to add expense');
    }
    return Expense.fromJson(data);
  }

  // --- Balances & Settlement ---

  Future<BalancesResponse> getBalances(String groupId) async {
    final res = await http.get(
      Uri.parse('$baseUrl/groups/$groupId/balances'),
      headers: await _headers(),
    );
    if (res.statusCode >= 400) {
      throw Exception('Failed to load balances');
    }
    return BalancesResponse.fromJson(jsonDecode(res.body));
  }

  Future<void> settleDebt({
    required String groupId,
    required String toUserId,
    required double amount,
    String? description,
  }) async {
    final res = await http.post(
      Uri.parse('$baseUrl/groups/$groupId/settle'),
      headers: await _headers(),
      body: jsonEncode({
        'toUserId': toUserId,
        'amount': amount,
        if (description != null) 'description': description,
      }),
    );
    final data = jsonDecode(res.body);
    if (res.statusCode >= 400) {
      throw Exception(data['message'] ?? 'Failed to record settlement');
    }
  }
}
