import 'package:flutter/material.dart';
import '../models/group.dart';
import '../models/expense.dart';
import '../models/balance.dart';
import '../services/api_service.dart';

class GroupsProvider extends ChangeNotifier {
  final ApiService apiService;
  List<Group> _groups = [];
  bool _isLoading = false;
  String? _error;

  // Cache for selected group detail
  Group? _currentGroup;
  List<Expense> _expenses = [];
  BalancesResponse? _balances;
  bool _isDetailLoading = false;

  GroupsProvider({required this.apiService});

  List<Group> get groups => _groups;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Group? get currentGroup => _currentGroup;
  List<Expense> get expenses => _expenses;
  BalancesResponse? get balances => _balances;
  bool get isDetailLoading => _isDetailLoading;

  Future<void> fetchGroups() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      _groups = await apiService.getGroups();
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<Group?> createGroup(String name) async {
    try {
      final newGroup = await apiService.createGroup(name);
      _groups.insert(0, newGroup);
      notifyListeners();
      return newGroup;
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
      return null;
    }
  }

  Future<void> loadGroupDetails(String groupId) async {
    _isDetailLoading = true;
    notifyListeners();
    try {
      final results = await Future.wait([
        apiService.getGroup(groupId),
        apiService.getExpenses(groupId),
        apiService.getBalances(groupId),
      ]);
      _currentGroup = results[0] as Group;
      _expenses = results[1] as List<Expense>;
      _balances = results[2] as BalancesResponse;
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
    } finally {
      _isDetailLoading = false;
      notifyListeners();
    }
  }

  Future<bool> addMember(String groupId, String email) async {
    try {
      await apiService.addMember(groupId, email);
      await loadGroupDetails(groupId);
      return true;
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
      return false;
    }
  }

  Future<bool> addExpense({
    required String groupId,
    required String description,
    required double amount,
    required String paidById,
    List<String>? splitAmongUserIds,
    List<Map<String, dynamic>>? splits,
  }) async {
    try {
      await apiService.createExpense(
        groupId: groupId,
        description: description,
        amount: amount,
        paidById: paidById,
        splitAmongUserIds: splitAmongUserIds,
        splits: splits,
      );
      await loadGroupDetails(groupId);
      return true;
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
      return false;
    }
  }

  Future<bool> settleDebt({
    required String groupId,
    required String toUserId,
    required double amount,
    String? description,
  }) async {
    try {
      await apiService.settleDebt(
        groupId: groupId,
        toUserId: toUserId,
        amount: amount,
        description: description,
      );
      await loadGroupDetails(groupId);
      return true;
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
      return false;
    }
  }
}
