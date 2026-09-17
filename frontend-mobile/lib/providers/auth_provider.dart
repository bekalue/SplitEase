import 'package:flutter/material.dart';
import '../models/user.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  final ApiService apiService;
  User? _currentUser;
  bool _isLoading = false;
  String? _errorMessage;

  AuthProvider({required this.apiService}) {
    checkSavedAuth();
  }

  User? get currentUser => _currentUser;
  bool get isAuthenticated => _currentUser != null;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> checkSavedAuth() async {
    _isLoading = true;
    notifyListeners();
    try {
      final token = await apiService.getAccessToken();
      if (token != null) {
        _currentUser = await apiService.getSavedUser();
      }
    } catch (_) {
      _currentUser = null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    try {
      final result = await apiService.login(email: email, password: password);
      _currentUser = result['user'] as User;
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> register(String email, String password, String name) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    try {
      final result = await apiService.register(email: email, password: password, name: name);
      _currentUser = result['user'] as User;
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await apiService.clearAuth();
    _currentUser = null;
    notifyListeners();
  }
}
