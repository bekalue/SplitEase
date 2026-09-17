import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../models/group.dart';
import '../providers/auth_provider.dart';
import '../providers/groups_provider.dart';

class GroupDetailScreen extends StatefulWidget {
  final String groupId;
  final String groupName;

  const GroupDetailScreen({
    super.key,
    required this.groupId,
    required this.groupName,
  });

  @override
  State<GroupDetailScreen> createState() => _GroupDetailScreenState();
}

class _GroupDetailScreenState extends State<GroupDetailScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<GroupsProvider>().loadGroupDetails(widget.groupId);
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _showAddMemberDialog() {
    final emailController = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1E293B),
        title: const Text('Add Member by Email', style: TextStyle(color: Colors.white)),
        content: TextField(
          controller: emailController,
          style: const TextStyle(color: Colors.white),
          autofocus: true,
          decoration: const InputDecoration(
            hintText: 'member@example.com',
            hintStyle: TextStyle(color: Color(0xFF64748B)),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: Color(0xFF94A3B8))),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF10B981),
              foregroundColor: Colors.white,
            ),
            onPressed: () async {
              final email = emailController.text.trim();
              if (email.isNotEmpty) {
                Navigator.pop(ctx);
                final ok = await context.read<GroupsProvider>().addMember(widget.groupId, email);
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(ok ? 'Member added successfully' : 'Could not add member'),
                      backgroundColor: ok ? const Color(0xFF10B981) : Colors.red,
                    ),
                  );
                }
              }
            },
            child: const Text('Add'),
          ),
        ],
      ),
    );
  }

  void _showAddExpenseDialog(Group group) {
    final descController = TextEditingController();
    final amountController = TextEditingController();
    final currentUserId = context.read<AuthProvider>().currentUser?.id ?? '';
    String selectedPayerId = currentUserId.isNotEmpty ? currentUserId : (group.members.isNotEmpty ? group.members.first.userId : '');
    final selectedUserIds = <String>{...group.members.map((m) => m.userId)};

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF1E293B),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) => Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom + 20,
            left: 20,
            right: 20,
            top: 20,
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Add Expense', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white)),
                    IconButton(icon: const Icon(Icons.close, color: Colors.grey), onPressed: () => Navigator.pop(ctx)),
                  ],
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: descController,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(
                    labelText: 'Description',
                    labelStyle: TextStyle(color: Color(0xFF94A3B8)),
                    hintText: 'e.g. Dinner, Groceries, Flight',
                    hintStyle: TextStyle(color: Color(0xFF64748B)),
                    prefixIcon: Icon(Icons.receipt_long, color: Color(0xFF10B981)),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: amountController,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(
                    labelText: 'Total Amount (USD)',
                    labelStyle: TextStyle(color: Color(0xFF94A3B8)),
                    hintText: '0.00',
                    hintStyle: TextStyle(color: Color(0xFF64748B)),
                    prefixIcon: Icon(Icons.attach_money, color: Color(0xFF10B981)),
                  ),
                ),
                const SizedBox(height: 16),
                const Text('Paid by:', style: TextStyle(color: Color(0xFF94A3B8), fontWeight: FontWeight.w600)),
                const SizedBox(height: 6),
                DropdownButtonFormField<String>(
                  initialValue: selectedPayerId.isNotEmpty ? selectedPayerId : null,
                  dropdownColor: const Color(0xFF0F172A),
                  style: const TextStyle(color: Colors.white),
                  items: group.members.map((m) {
                    final name = m.user?.name ?? 'Member';
                    final isMe = m.userId == currentUserId;
                    return DropdownMenuItem(
                      value: m.userId,
                      child: Text(isMe ? '$name (You)' : name),
                    );
                  }).toList(),
                  onChanged: (val) {
                    if (val != null) setModalState(() => selectedPayerId = val);
                  },
                ),
                const SizedBox(height: 16),
                const Text('Split equally between:', style: TextStyle(color: Color(0xFF94A3B8), fontWeight: FontWeight.w600)),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 8,
                  children: group.members.map((m) {
                    final isSelected = selectedUserIds.contains(m.userId);
                    return FilterChip(
                      label: Text(m.user?.name ?? 'User'),
                      selected: isSelected,
                      selectedColor: const Color(0xFF10B981),
                      labelStyle: TextStyle(color: isSelected ? Colors.white : const Color(0xFF94A3B8)),
                      backgroundColor: const Color(0xFF0F172A),
                      checkmarkColor: Colors.white,
                      onSelected: (selected) {
                        setModalState(() {
                          if (selected) {
                            selectedUserIds.add(m.userId);
                          } else {
                            if (selectedUserIds.length > 1) {
                              selectedUserIds.remove(m.userId);
                            }
                          }
                        });
                      },
                    );
                  }).toList(),
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF10B981),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: () async {
                    final desc = descController.text.trim();
                    final amount = double.tryParse(amountController.text) ?? 0.0;
                    if (desc.isEmpty || amount <= 0) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Please enter valid description and amount')),
                      );
                      return;
                    }
                    final groupsProv = context.read<GroupsProvider>();
                    Navigator.pop(ctx);
                    final ok = await groupsProv.addExpense(
                      groupId: widget.groupId,
                      description: desc,
                      amount: amount,
                      paidById: selectedPayerId,
                      splitAmongUserIds: selectedUserIds.toList(),
                    );
                    if (!mounted) return;
                    ScaffoldMessenger.of(this.context).showSnackBar(
                      SnackBar(
                        content: Text(ok ? 'Expense added!' : 'Failed to add expense'),
                        backgroundColor: ok ? const Color(0xFF10B981) : Colors.red,
                      ),
                    );
                  },
                  child: const Text('Save Expense', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showSettleDialog(String toUserId, String toName, double defaultAmount) {
    final amountController = TextEditingController(text: defaultAmount.toStringAsFixed(2));
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1E293B),
        title: Text('Settle Up with $toName', style: const TextStyle(color: Colors.white)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Confirm your payment to $toName:', style: const TextStyle(color: Color(0xFF94A3B8))),
            const SizedBox(height: 12),
            TextField(
              controller: amountController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
              decoration: const InputDecoration(
                prefixText: r'$ ',
                prefixStyle: TextStyle(color: Color(0xFF10B981), fontSize: 20),
                labelText: 'Payment Amount',
                labelStyle: TextStyle(color: Color(0xFF94A3B8)),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: Color(0xFF94A3B8))),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF10B981),
              foregroundColor: Colors.white,
            ),
            onPressed: () async {
              final amount = double.tryParse(amountController.text) ?? 0.0;
              if (amount > 0) {
                Navigator.pop(ctx);
                final ok = await context.read<GroupsProvider>().settleDebt(
                  groupId: widget.groupId,
                  toUserId: toUserId,
                  amount: amount,
                  description: 'Payment to $toName',
                );
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(ok ? 'Settlement recorded!' : 'Failed to record settlement'),
                      backgroundColor: ok ? const Color(0xFF10B981) : Colors.red,
                    ),
                  );
                }
              }
            },
            child: const Text('Record Payment'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final groupsProv = context.watch<GroupsProvider>();
    final group = groupsProv.currentGroup;
    final currencyFormat = NumberFormat.currency(symbol: '\$');

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        title: Text(widget.groupName, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        iconTheme: const IconThemeData(color: Colors.white),
        actions: [
          IconButton(
            icon: const Icon(Icons.person_add_alt_1),
            tooltip: 'Add Member',
            onPressed: _showAddMemberDialog,
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Refresh',
            onPressed: () => groupsProv.loadGroupDetails(widget.groupId),
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: const Color(0xFF10B981),
          labelColor: const Color(0xFF10B981),
          unselectedLabelColor: const Color(0xFF94A3B8),
          tabs: const [
            Tab(icon: Icon(Icons.receipt_long), text: 'Expenses'),
            Tab(icon: Icon(Icons.account_balance), text: 'Balances'),
            Tab(icon: Icon(Icons.people_outline), text: 'Members'),
          ],
        ),
      ),
      body: groupsProv.isDetailLoading && group == null
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF10B981)))
          : TabBarView(
              controller: _tabController,
              children: [
                // 1. Expenses Tab
                RefreshIndicator(
                  color: const Color(0xFF10B981),
                  onRefresh: () => groupsProv.loadGroupDetails(widget.groupId),
                  child: groupsProv.expenses.isEmpty
                      ? const Center(
                          child: Text(
                            'No expenses yet.\nTap + below to add your first bill!',
                            textAlign: TextAlign.center,
                            style: TextStyle(color: Color(0xFF94A3B8), fontSize: 16),
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: groupsProv.expenses.length,
                          itemBuilder: (ctx, i) {
                            final exp = groupsProv.expenses[i];
                            final dateStr = DateFormat('MMM d, yyyy').format(exp.createdAt);
                            final isSettlement = exp.description.toLowerCase().contains('settlement') || exp.description.toLowerCase().contains('payment');

                            return Card(
                              margin: const EdgeInsets.only(bottom: 12),
                              color: const Color(0xFF1E293B),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                                side: BorderSide(
                                  color: isSettlement ? const Color(0xFF10B981).withOpacity(0.5) : const Color(0xFF334155),
                                ),
                              ),
                              child: ListTile(
                                leading: CircleAvatar(
                                  backgroundColor: isSettlement ? const Color(0xFF10B981).withOpacity(0.2) : const Color(0xFF3B82F6).withOpacity(0.2),
                                  child: Icon(
                                    isSettlement ? Icons.check_circle : Icons.receipt,
                                    color: isSettlement ? const Color(0xFF10B981) : const Color(0xFF60A5FA),
                                  ),
                                ),
                                title: Text(
                                  exp.description,
                                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                                ),
                                subtitle: Text(
                                  'Paid by ${exp.paidBy?.name ?? "Someone"} â€¢ $dateStr',
                                  style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
                                ),
                                trailing: Text(
                                  currencyFormat.format(exp.amount),
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    color: isSettlement ? const Color(0xFF10B981) : Colors.white,
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                ),

                // 2. Balances Tab
                RefreshIndicator(
                  color: const Color(0xFF10B981),
                  onRefresh: () => groupsProv.loadGroupDetails(widget.groupId),
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      const Text(
                        'Net Balances',
                        style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      if (groupsProv.balances?.balances.isEmpty ?? true)
                        const Text('No balances available', style: TextStyle(color: Color(0xFF94A3B8)))
                      else
                        ...groupsProv.balances!.balances.map((b) {
                          final isPositive = b.netBalance > 0.005;
                          final isNegative = b.netBalance < -0.005;
                          final statusColor = isPositive ? const Color(0xFF10B981) : (isNegative ? const Color(0xFFF43F5E) : const Color(0xFF94A3B8));

                          return Card(
                            margin: const EdgeInsets.only(bottom: 8),
                            color: const Color(0xFF1E293B),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            child: ListTile(
                              leading: CircleAvatar(
                                backgroundColor: statusColor.withOpacity(0.15),
                                child: Text(
                                  b.name.isNotEmpty ? b.name[0].toUpperCase() : 'U',
                                  style: TextStyle(color: statusColor, fontWeight: FontWeight.bold),
                                ),
                              ),
                              title: Text(b.name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                              trailing: Text(
                                isPositive
                                    ? '+${currencyFormat.format(b.netBalance)}'
                                    : (isNegative ? currencyFormat.format(b.netBalance) : '\$0.00 (settled)'),
                                style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: statusColor),
                              ),
                            ),
                          );
                        }),
                      const SizedBox(height: 24),
                      const Text(
                        'Simplified Settlement Plan',
                        style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Minimum number of payments to settle everyone out:',
                        style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
                      ),
                      const SizedBox(height: 12),
                      if (groupsProv.balances?.settlements.isEmpty ?? true)
                        Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: const Color(0xFF1E293B),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFF10B981).withOpacity(0.4)),
                          ),
                          child: const Row(
                            children: [
                              Icon(Icons.verified_rounded, color: Color(0xFF10B981)),
                              SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  'All debts are completely settled up! ðŸŽ‰',
                                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
                                ),
                              ),
                            ],
                          ),
                        )
                      else
                        ...groupsProv.balances!.settlements.map((s) {
                          return Card(
                            margin: const EdgeInsets.only(bottom: 10),
                            color: const Color(0xFF1E293B),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                              side: const BorderSide(color: Color(0xFF334155)),
                            ),
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                              child: Row(
                                children: [
                                  const Icon(Icons.arrow_forward_rounded, color: Color(0xFFF59E0B)),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        RichText(
                                          text: TextSpan(
                                            style: const TextStyle(fontSize: 15, color: Colors.white),
                                            children: [
                                              TextSpan(text: s.fromName, style: const TextStyle(fontWeight: FontWeight.bold)),
                                              const TextSpan(text: ' pays '),
                                              TextSpan(text: s.toName, style: const TextStyle(fontWeight: FontWeight.bold)),
                                            ],
                                          ),
                                        ),
                                        Text(
                                          currencyFormat.format(s.amount),
                                          style: const TextStyle(
                                            color: Color(0xFF10B981),
                                            fontSize: 16,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  ElevatedButton(
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFF10B981),
                                      foregroundColor: Colors.white,
                                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                    ),
                                    onPressed: () => _showSettleDialog(s.toUserId, s.toName, s.amount),
                                    child: const Text('Settle', style: TextStyle(fontWeight: FontWeight.bold)),
                                  ),
                                ],
                              ),
                            ),
                          );
                        }),
                    ],
                  ),
                ),

                // 3. Members Tab
                RefreshIndicator(
                  color: const Color(0xFF10B981),
                  onRefresh: () => groupsProv.loadGroupDetails(widget.groupId),
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Members (${group?.members.length ?? 0})',
                            style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                          ),
                          TextButton.icon(
                            icon: const Icon(Icons.person_add, color: Color(0xFF10B981)),
                            label: const Text('Add Member', style: TextStyle(color: Color(0xFF10B981))),
                            onPressed: _showAddMemberDialog,
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      ...?group?.members.map(
                        (m) => Card(
                          margin: const EdgeInsets.only(bottom: 8),
                          color: const Color(0xFF1E293B),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          child: ListTile(
                            leading: CircleAvatar(
                              backgroundColor: const Color(0xFF334155),
                              child: Text(
                                m.user?.name.isNotEmpty == true ? m.user!.name[0].toUpperCase() : 'U',
                                style: const TextStyle(color: Colors.white),
                              ),
                            ),
                            title: Text(m.user?.name ?? 'Member', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                            subtitle: Text(m.user?.email ?? '', style: const TextStyle(color: Color(0xFF94A3B8))),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
      floatingActionButton: group != null
          ? FloatingActionButton.extended(
              backgroundColor: const Color(0xFF10B981),
              foregroundColor: Colors.white,
              icon: const Icon(Icons.add),
              label: const Text('Add Expense', style: TextStyle(fontWeight: FontWeight.bold)),
              onPressed: () => _showAddExpenseDialog(group),
            )
          : null,
    );
  }
}
