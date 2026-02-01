import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../theme/app_theme.dart';
import '../providers/auth_provider.dart';
import '../providers/verification_provider.dart';
import '../widgets/app_drawer.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final auth = context.read<AuthProvider>();
      if (auth.isOfficer) {
        Navigator.pushReplacementNamed(context, '/officer');
        return;
      }
      context.read<VerificationProvider>().fetchStatus();
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final verification = context.watch<VerificationProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              auth.refreshUser();
              verification.fetchStatus(forceRefresh: true);
            },
          ),
        ],
      ),
      drawer: const AppDrawer(),
      body: RefreshIndicator(
        onRefresh: () async {
          await auth.refreshUser();
          await verification.fetchStatus(forceRefresh: true);
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildWelcomeCard(auth),
              const SizedBox(height: 16),
              _buildVerificationStatusCard(verification),
              const SizedBox(height: 24),
              Text(
                'Quick Actions',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 12),
              _buildActionCards(verification),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildWelcomeCard(AuthProvider auth) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Row(
          children: [
            CircleAvatar(
              radius: 30,
              backgroundColor: AppTheme.primary,
              child: Text(
                auth.userName.isNotEmpty ? auth.userName[0].toUpperCase() : 'U',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Welcome, ${auth.userName}',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    auth.userEmail,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
            ),
            IconButton(
              icon: const Icon(Icons.logout, color: AppTheme.destructive),
              onPressed: () => _showLogoutDialog(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildVerificationStatusCard(VerificationProvider verification) {
    final status = verification.currentStatus;
    String statusText;
    Color statusColor;
    IconData statusIcon;

    if (verification.isApproved) {
      statusText = 'Verified';
      statusColor = AppTheme.success;
      statusIcon = Icons.verified;
    } else if (verification.isVerificationInProgress) {
      statusText = 'In Progress';
      statusColor = AppTheme.warning;
      statusIcon = Icons.hourglass_empty;
    } else if (verification.isRejected) {
      statusText = 'Rejected';
      statusColor = AppTheme.destructive;
      statusIcon = Icons.error;
    } else {
      statusText = 'Not Started';
      statusColor = AppTheme.mutedForeground;
      statusIcon = Icons.pending;
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: statusColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(statusIcon, color: statusColor, size: 32),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Verification Status',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    statusText,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: statusColor,
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                ],
              ),
            ),
            TextButton(
              onPressed: () => Navigator.pushNamed(context, '/verification/status'),
              child: const Text('Details'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionCards(VerificationProvider verification) {
    return Column(
      children: [
        // Verification Action - Dynamic based on status
        _buildVerificationActionCard(verification),
        const SizedBox(height: 12),

        // Status Card
        _ActionCard(
          icon: Icons.track_changes,
          title: 'Application Status',
          subtitle: 'Track your verification progress',
          buttonText: 'Check Status',
          onPressed: () => Navigator.pushNamed(context, '/verification/status'),
        ),
        const SizedBox(height: 12),

        // Help Card
        _ActionCard(
          icon: Icons.help_outline,
          title: 'Need Help?',
          subtitle: 'Get support or browse FAQs',
          buttonText: 'Get Help',
          onPressed: () => Navigator.pushNamed(context, '/help'),
        ),
      ],
    );
  }

  Widget _buildVerificationActionCard(VerificationProvider verification) {
    if (verification.isApproved) {
      return _ActionCard(
        icon: Icons.verified,
        iconColor: AppTheme.success,
        title: 'Identity Verified',
        subtitle: 'Your verification is complete',
        buttonText: 'View Certificate',
        buttonColor: AppTheme.success,
        onPressed: () => Navigator.pushNamed(context, '/verification/status'),
      );
    }

    if (verification.isVerificationInProgress) {
      return _ActionCard(
        icon: Icons.hourglass_empty,
        iconColor: AppTheme.warning,
        title: 'Verification In Progress',
        subtitle: 'Please wait while we verify your documents',
        buttonText: 'Track Progress',
        buttonColor: AppTheme.warning,
        onPressed: () => Navigator.pushNamed(context, '/verification/status'),
      );
    }

    if (verification.isRejected) {
      return _ActionCard(
        icon: Icons.refresh,
        iconColor: AppTheme.destructive,
        title: 'Verification Rejected',
        subtitle: 'Please review and resubmit your application',
        buttonText: 'Resubmit',
        buttonColor: AppTheme.primary,
        onPressed: () => Navigator.pushNamed(context, '/verification/form'),
      );
    }

    return _ActionCard(
      icon: Icons.verified_user,
      title: 'Identity Verification',
      subtitle: 'Complete your verification to access all services',
      buttonText: 'Start Verification',
      onPressed: () => Navigator.pushNamed(context, '/verification/form'),
    );
  }

  void _showLogoutDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              await context.read<AuthProvider>().logout();
              context.read<VerificationProvider>().reset();
              if (mounted) {
                Navigator.pushNamedAndRemoveUntil(context, '/', (route) => false);
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.destructive),
            child: const Text('Logout'),
          ),
        ],
      ),
    );
  }
}

class _ActionCard extends StatelessWidget {
  final IconData icon;
  final Color? iconColor;
  final String title;
  final String subtitle;
  final String buttonText;
  final Color? buttonColor;
  final VoidCallback onPressed;

  const _ActionCard({
    required this.icon,
    this.iconColor,
    required this.title,
    required this.subtitle,
    required this.buttonText,
    this.buttonColor,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: (iconColor ?? AppTheme.primary).withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: iconColor ?? AppTheme.primary),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: Theme.of(context).textTheme.bodySmall,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            ElevatedButton(
              onPressed: onPressed,
              style: ElevatedButton.styleFrom(
                backgroundColor: buttonColor ?? AppTheme.primary,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              ),
              child: Text(buttonText, style: const TextStyle(fontSize: 12)),
            ),
          ],
        ),
      ),
    );
  }
}