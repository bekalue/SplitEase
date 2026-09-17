import 'user.dart';

class GroupMember {
  final String id;
  final String userId;
  final String groupId;
  final User? user;

  GroupMember({
    required this.id,
    required this.userId,
    required this.groupId,
    this.user,
  });

  factory GroupMember.fromJson(Map<String, dynamic> json) {
    return GroupMember(
      id: json['id'] as String? ?? '',
      userId: json['userId'] as String? ?? '',
      groupId: json['groupId'] as String? ?? '',
      user: json['user'] != null ? User.fromJson(json['user']) : null,
    );
  }
}

class Group {
  final String id;
  final String name;
  final DateTime createdAt;
  final List<GroupMember> members;

  Group({
    required this.id,
    required this.name,
    required this.createdAt,
    required this.members,
  });

  factory Group.fromJson(Map<String, dynamic> json) {
    final rawMembers = json['members'] as List<dynamic>? ?? [];
    return Group(
      id: json['id'] as String,
      name: json['name'] as String,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : DateTime.now(),
      members: rawMembers.map((m) => GroupMember.fromJson(m)).toList(),
    );
  }
}
