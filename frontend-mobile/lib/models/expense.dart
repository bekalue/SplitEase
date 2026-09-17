import 'user.dart';

class ExpenseSplit {
  final String id;
  final String userId;
  final double amountOwed;
  final User? user;

  ExpenseSplit({
    required this.id,
    required this.userId,
    required this.amountOwed,
    this.user,
  });

  factory ExpenseSplit.fromJson(Map<String, dynamic> json) {
    return ExpenseSplit(
      id: json['id'] as String? ?? '',
      userId: json['userId'] as String? ?? '',
      amountOwed: (json['amountOwed'] as num?)?.toDouble() ?? 0.0,
      user: json['user'] != null ? User.fromJson(json['user']) : null,
    );
  }
}

class Expense {
  final String id;
  final String groupId;
  final String description;
  final double amount;
  final String paidById;
  final User? paidBy;
  final List<ExpenseSplit> splits;
  final DateTime createdAt;

  Expense({
    required this.id,
    required this.groupId,
    required this.description,
    required this.amount,
    required this.paidById,
    this.paidBy,
    required this.splits,
    required this.createdAt,
  });

  factory Expense.fromJson(Map<String, dynamic> json) {
    final rawSplits = json['splits'] as List<dynamic>? ?? [];
    return Expense(
      id: json['id'] as String,
      groupId: json['groupId'] as String,
      description: json['description'] as String,
      amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
      paidById: json['paidById'] as String,
      paidBy: json['paidBy'] != null ? User.fromJson(json['paidBy']) : null,
      splits: rawSplits.map((s) => ExpenseSplit.fromJson(s)).toList(),
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : DateTime.now(),
    );
  }
}
