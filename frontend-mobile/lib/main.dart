import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'services/api_service.dart';
import 'providers/auth_provider.dart';
import 'providers/groups_provider.dart';
import 'screens/login_screen.dart';
import 'screens/groups_list_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  final apiService = ApiService();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider(apiService: apiService)),
        ChangeNotifierProvider(create: (_) => GroupsProvider(apiService: apiService)),
      ],
      child: const SplitEaseApp(),
    ),
  );
}

class SplitEaseApp extends StatelessWidget {
  const SplitEaseApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SplitEase',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0F172A),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF10B981),
          secondary: Color(0xFF059669),
          surface: Color(0xFF1E293B),
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF1E293B),
          foregroundColor: Colors.white,
          elevation: 0,
        ),
      ),
      home: Consumer<AuthProvider>(
        builder: (context, auth, _) {
          if (auth.isLoading && auth.currentUser == null) {
            return const Scaffold(
              body: Center(child: CircularProgressIndicator(color: Color(0xFF10B981))),
            );
          }
          if (auth.isAuthenticated) {
            return const GroupsListScreen();
          }
          return const LoginScreen();
        },
      ),
    );
  }
}
