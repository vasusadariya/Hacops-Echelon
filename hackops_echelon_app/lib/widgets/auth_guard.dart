import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/verification_provider.dart';
import '../theme/app_theme.dart';

/// Guards routes that require authentication
class AuthGuard extends StatelessWidget {
  final Widget child;
  final bool requiresOfficer;

  const AuthGuard({
    super.key,
    required this.child,
    this.requiresOfficer = false,
  });

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    if (auth.isLoading) {
      return const _LoadingScreen();
    }

    if (!auth.isLoggedIn) {
      return _RedirectScreen(
        message: 'Please login to continue',
        onRedirect: () => Navigator.pushReplacementNamed(context, '/auth'),
      );
    }

    if (requiresOfficer && !auth.isOfficer) {
      return _RedirectScreen(
        message: 'Access denied. Officer role required.',
        onRedirect: () => Navigator.pushReplacementNamed(context, '/dashboard'),
      );
    }

    return child;
  }
}

/// Guards verification form - prevents access if verification in progress/approved
class VerificationFormGuard extends StatefulWidget {
  final Widget child;

  const VerificationFormGuard({super.key, required this.child});

  @override
  State<VerificationFormGuard> createState() => _VerificationFormGuardState();
}

class _VerificationFormGuardState extends State<VerificationFormGuard> {
  bool _hasChecked = false;
  bool _canAccess = false;
  String? _blockReason;

  @override
  void initState() {
    super.initState();
    _checkAccess();
  }

  Future<void> _checkAccess() async {
    final auth = context.read<AuthProvider>();
    final verification = context.read<VerificationProvider>();

    // Wait for auth to load
    if (auth.isLoading) {
      await Future.delayed(const Duration(milliseconds: 100));
      if (mounted) _checkAccess();
      return;
    }

    // Not logged in
    if (!auth.isLoggedIn) {
      if (mounted) {
        Navigator.pushReplacementNamed(context, '/auth');
      }
      return;
    }

    // Officers can't access verification form
    if (auth.isOfficer) {
      if (mounted) {
        Navigator.pushReplacementNamed(context, '/officer');
      }
      return;
    }

    // Fetch verification status if not already fetched
    if (!verification.hasFetched) {
      await verification.fetchStatus();
    }

    if (!mounted) return;

    // Check verification status
    if (verification.isApproved) {
      setState(() {
        _hasChecked = true;
        _canAccess = false;
        _blockReason = 'already_approved';
      });
    } else if (verification.isVerificationInProgress) {
      setState(() {
        _hasChecked = true;
        _canAccess = false;
        _blockReason = 'in_progress';
      });
    } else {
      // Can access (not started or rejected)
      setState(() {
        _hasChecked = true;
        _canAccess = true;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    // Still checking
    if (!_hasChecked) {
      return const _LoadingScreen(message: 'Checking verification status...');
    }

    // Blocked - show blocked screen
    if (!_canAccess) {
      return _BlockedScreen(
        reason: _blockReason ?? 'unknown',
        onViewStatus: () {
          Navigator.pushReplacementNamed(context, '/verification/status');
        },
        onGoBack: () {
          Navigator.pushReplacementNamed(context, '/dashboard');
        },
      );
    }

    // Can access
    return widget.child;
  }
}

/// Guards officer routes
class OfficerGuard extends StatelessWidget {
  final Widget child;

  const OfficerGuard({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    if (auth.isLoading) {
      return const _LoadingScreen();
    }

    if (!auth.isLoggedIn) {
      return _RedirectScreen(
        message: 'Please login to continue',
        onRedirect: () => Navigator.pushReplacementNamed(context, '/auth'),
      );
    }

    if (!auth.isOfficer) {
      return _RedirectScreen(
        message: 'Access denied. Officer privileges required.',
        onRedirect: () {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Access denied. Officer privileges required.'),
              backgroundColor: Colors.red,
            ),
          );
          Navigator.pushReplacementNamed(context, '/dashboard');
        },
      );
    }

    return child;
  }
}

// ============ Helper Screens ============

class _LoadingScreen extends StatelessWidget {
  final String? message;

  const _LoadingScreen({this.message});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const CircularProgressIndicator(),
            if (message != null) ...[
              const SizedBox(height: 16),
              Text(
                message!,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppTheme.mutedForeground,
                    ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _RedirectScreen extends StatefulWidget {
  final String message;
  final VoidCallback onRedirect;

  const _RedirectScreen({
    required this.message,
    required this.onRedirect,
  });

  @override
  State<_RedirectScreen> createState() => _RedirectScreenState();
}

class _RedirectScreenState extends State<_RedirectScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      widget.onRedirect();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const CircularProgressIndicator(),
            const SizedBox(height: 16),
            Text(
              widget.message,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppTheme.mutedForeground,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}

class _BlockedScreen extends StatelessWidget {
  final String reason;
  final VoidCallback onViewStatus;
  final VoidCallback onGoBack;

  const _BlockedScreen({
    required this.reason,
    required this.onViewStatus,
    required this.onGoBack,
  });

  @override
  Widget build(BuildContext context) {
    final isApproved = reason == 'already_approved';
    final isInProgress = reason == 'in_progress';

    IconData icon;
    Color color;
    String title;
    String message;

    if (isApproved) {
      icon = Icons.verified;
      color = AppTheme.success;
      title = 'Already Verified';
      message = 'Your identity has already been verified successfully. You cannot submit a new verification application.';
    } else if (isInProgress) {
      icon = Icons.hourglass_empty;
      color = AppTheme.warning;
      title = 'Verification In Progress';
      message = 'Your verification application is currently being processed. Please wait for the result before submitting a new application.';
    } else {
      icon = Icons.block;
      color = AppTheme.destructive;
      title = 'Access Denied';
      message = 'You cannot access this page at this time.';
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Verification'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: onGoBack,
        ),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, size: 64, color: color),
              ),
              const SizedBox(height: 24),
              Text(
                title,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: color,
                    ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              Text(
                message,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppTheme.mutedForeground,
                    ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: onViewStatus,
                  icon: const Icon(Icons.visibility),
                  label: const Text('View Verification Status'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: color,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: onGoBack,
                  icon: const Icon(Icons.home),
                  label: const Text('Go to Dashboard'),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}