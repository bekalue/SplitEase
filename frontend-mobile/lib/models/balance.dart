double _parseAmount(dynamic value) {
  if (value is num) return value.toDouble();
  return double.tryParse(value?.toString() ?? '') ?? 0.0;
}

class MemberBalance {
  final String userId;
  final String name;
  final double netBalance;

  MemberBalance({
    required this.userId,
    required this.name,
    required this.netBalance,
  });

  factory MemberBalance.fromJson(Map<String, dynamic> json) {
    return MemberBalance(
      userId: json['userId'] as String,
      name: json['name'] as String,
      netBalance: _parseAmount(json['netBalance']),
    );
  }
}

class Settlement {
  final String fromUserId;
  final String fromName;
  final String toUserId;
  final String toName;
  final double amount;

  Settlement({
    required this.fromUserId,
    required this.fromName,
    required this.toUserId,
    required this.toName,
    required this.amount,
  });

  factory Settlement.fromJson(Map<String, dynamic> json) {
    return Settlement(
      fromUserId: json['fromUserId'] as String,
      fromName: json['fromName'] as String,
      toUserId: json['toUserId'] as String,
      toName: json['toName'] as String,
      amount: _parseAmount(json['amount']),
    );
  }
}

class BalancesResponse {
  final List<MemberBalance> balances;
  final List<Settlement> settlements;

  BalancesResponse({
    required this.balances,
    required this.settlements,
  });

  factory BalancesResponse.fromJson(Map<String, dynamic> json) {
    final rawBalances = json['balances'] as List<dynamic>? ?? [];
    final rawSettlements = json['settlements'] as List<dynamic>? ?? [];

    return BalancesResponse(
      balances: rawBalances.map((b) => MemberBalance.fromJson(b)).toList(),
      settlements: rawSettlements.map((s) => Settlement.fromJson(s)).toList(),
    );
  }

}
