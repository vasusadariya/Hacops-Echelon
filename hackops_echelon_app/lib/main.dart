import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'theme/app_theme.dart';
import 'providers/auth_provider.dart';
import 'providers/verification_provider.dart';
import 'widgets/auth_guard.dart';
import 'screens/home_screen.dart';
import 'screens/auth_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/verification_screen.dart';
import 'screens/verification_form_screen.dart';
import 'screens/verification_status_screen.dart';
import 'screens/services_screen.dart';
import 'screens/help_screen.dart';
import 'screens/about_screen.dart';
import 'screens/team_screen.dart';
import 'screens/mission_screen.dart';
import 'screens/officer/officer_dashboard_screen.dart';
import 'screens/officer/officer_pending_screen.dart';
import 'screens/officer/officer_review_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
    ),
  );

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => VerificationProvider()),
      ],
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'KYC Verify',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      initialRoute: '/',
      onGenerateRoute: (settings) {
        final uri = Uri.parse(settings.name ?? '');

        // Handle officer review with ID
        if (uri.pathSegments.length == 3 &&
            uri.pathSegments[0] == 'officer' &&
            uri.pathSegments[1] == 'review') {
          final applicationId = uri.pathSegments[2];
          return MaterialPageRoute(
            builder: (context) => OfficerGuard(
              child: OfficerReviewScreen(applicationId: applicationId),
            ),
            settings: settings,
          );
        }

        return null;
      },
      routes: {
        // Public routes
        '/': (context) => const HomeScreen(),
        '/auth': (context) => const AuthScreen(),
        '/services': (context) => const ServicesScreen(),
        '/help': (context) => const HelpScreen(),
        '/about': (context) => const AboutScreen(),
        '/team': (context) => const TeamScreen(),
        '/mission': (context) => const MissionScreen(),

        // Protected user routes
        '/dashboard': (context) => const AuthGuard(
              child: DashboardScreen(),
            ),
        '/verification': (context) => const AuthGuard(
              child: VerificationScreen(),
            ),
        '/verification/form': (context) => const AuthGuard(
              child: VerificationFormGuard(
                child: VerificationFormScreen(),
              ),
            ),
        '/verification/status': (context) => const AuthGuard(
              child: VerificationStatusScreen(),
            ),

        // Protected officer routes
        '/officer': (context) => const OfficerGuard(
              child: OfficerDashboardScreen(),
            ),
        '/officer/pending': (context) => const OfficerGuard(
              child: OfficerPendingScreen(),
            ),
      },
    );
  }
}