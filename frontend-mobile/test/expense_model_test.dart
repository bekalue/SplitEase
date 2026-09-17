import 'package:flutter_test/flutter_test.dart';
import 'package:splitease_mobile/models/expense.dart';

void main() {
  test('parses Prisma Decimal strings in expense responses', () {
    final expense = Expense.fromJson({
      'id': 'expense-1',
      'groupId': 'group-1',
      'description': 'Dinner',
      'amount': '12.50',
      'paidById': 'user-1',
      'splits': [
        {'id': 'split-1', 'userId': 'user-1', 'amountOwed': '6.25'},
      ],
      'createdAt': '2026-09-17T12:00:00.000Z',
    });

    expect(expense.amount, 12.5);
    expect(expense.splits.single.amountOwed, 6.25);
  });
}
