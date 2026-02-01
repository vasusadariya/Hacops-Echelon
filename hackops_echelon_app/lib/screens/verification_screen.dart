import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../theme/app_theme.dart';
import '../providers/auth_provider.dart';
import '../providers/verification_provider.dart';

class VerificationScreen extends StatefulWidget {
  const VerificationScreen({super.key});

  @override
  State<VerificationScreen> createState() => _VerificationScreenState();
}

class _VerificationScreenState extends State<VerificationScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final auth = context.read<AuthProvider>();
      if (!auth.isLoggedIn) {
        Navigator.pushReplacementNamed(context, '/auth');
        return;
      }
      if (auth.isOfficer) {
        Navigator.pushReplacementNamed(context, '/officer');
        return;
      }
      context.read<VerificationProvider>().fetchStatus();
    });
  }

  void _navigateToForm() {
    final verification = context.read<VerificationProvider>();
    
    // Double-check before navigation
    if (verification.isApproved) {
      _showBlockedSnackbar('Your identity is already verified.');
      Navigator.pushNamed(context, '/verification/status');
      return;
    }
    
    if (verification.isVerificationInProgress) {
      _showBlockedSnackbar('Verification is already in progress.');
      Navigator.pushNamed(context, '/verification/status');
      return;
    }
    
    // Safe to navigate
    Navigator.pushNamed(context, '/verification/form');
  }

  void _showBlockedSnackbar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.info_outline, color: Colors.white),
            const SizedBox(width: 8),
            Expanded(child: Text(message)),
          ],
        ),
        backgroundColor: AppTheme.warning,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final verification = context.watch<VerificationProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Identity Verification'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => verification.fetchStatus(forceRefresh: true),
          ),
        ],
      ),
      body: verification.isLoading && !verification.hasFetched
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () => verification.fetchStatus(forceRefresh: true),
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    _buildStatusBanner(verification),
                    const SizedBox(height: 24),
                    _buildDocumentsSection(),
                    const SizedBox(height: 24),
                    _buildStepsSection(),
                    const SizedBox(height: 32),
                    _buildCTAButton(verification),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildStatusBanner(VerificationProvider verification) {
    IconData icon;
    String title;
    String subtitle;
    Color color;

    if (verification.isApproved) {
      icon = Icons.check_circle;
      title = 'Verification Complete';
      subtitle = 'Your identity has been verified successfully';
      color = AppTheme.success;
    } else if (verification.isVerificationInProgress) {
      icon = Icons.hourglass_empty;
      title = 'Verification In Progress';
      subtitle = _getProgressSubtitle(verification.currentStatus);
      color = AppTheme.warning;
    } else if (verification.isRejected) {
      icon = Icons.error;
      title = 'Verification Rejected';
      subtitle = 'Please review and resubmit your application';
      color = AppTheme.destructive;
    } else {
      icon = Icons.info;
      title = 'Verification Required';
      subtitle = 'Complete your identity verification to access all services';
      color = AppTheme.info;
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          Icon(icon, size: 48, color: color),
          const SizedBox(height: 12),
          Text(
            title,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
          ),
          const SizedBox(height: 4),
          Text(
            subtitle,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: color.withOpacity(0.8),
                ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  String _getProgressSubtitle(String status) {
    switch (status) {
      case 'submitted':
        return 'Your application is in queue for verification';
      case 'under_automated_verification':
        return 'AI verification in progress...';
      case 'under_officer_review':
        return 'An officer is reviewing your application';
      default:
        return 'Your application is being processed';
    }
  }

  Widget _buildDocumentsSection() {
    final documents = [
      {'icon': Icons.credit_card, 'title': 'Aadhaar Card', 'desc': 'Clear image (JPG/PNG, max 5MB)'},
      {'icon': Icons.badge, 'title': 'PAN Card', 'desc': 'Clear image (JPG/PNG, max 5MB)'},
      {'icon': Icons.person, 'title': 'Personal Info', 'desc': 'Name, address, mobile number'},
      {'icon': Icons.camera_alt, 'title': 'Live Selfie', 'desc': 'Real-time face verification'},
    ];

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Required Documents',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 16),
            ...documents.asMap().entries.map((entry) {
              final doc = entry.value;
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Row(
                  children: [
                    Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: AppTheme.accent,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Center(
                        child: Text(
                          '${entry.key + 1}',
                          style: TextStyle(
                            color: AppTheme.primary,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            doc['title'] as String,
                            style: Theme.of(context).textTheme.titleSmall,
                          ),
                          Text(
                            doc['desc'] as String,
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            }),
          ],
        ),
      ),
    );
  }

  Widget _buildStepsSection() {
    final steps = [
      'Fill the verification form with accurate details',
      'Upload clear images of your documents',
      'Complete face verification (4 angles)',
      'Submit and wait for review',
    ];

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Verification Steps',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 16),
            ...steps.map((step) {
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Icons.check_circle, size: 20, color: AppTheme.success),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        step,
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ),
                  ],
                ),
              );
            }),
          ],
        ),
      ),
    );
  }

  Widget _buildCTAButton(VerificationProvider verification) {
    // Approved - Show certificate button
    if (verification.isApproved) {
      return Column(
        children: [
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () => Navigator.pushNamed(context, '/verification/status'),
              icon: const Icon(Icons.verified),
              label: const Text('View Verification Certificate'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.success,
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
            ),
          ),
        ],
      );
    }

    // In Progress - Show track button (NO start verification option)
    if (verification.isVerificationInProgress) {
      return Column(
        children: [
          // Info box
          Container(
            padding: const EdgeInsets.all(12),
            margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(
              color: AppTheme.warning.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: AppTheme.warning.withOpacity(0.3)),
            ),
            child: Row(
              children: [
                Icon(Icons.info_outline, color: AppTheme.warning, size: 20),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'You cannot submit a new application while verification is in progress.',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppTheme.warning,
                        ),
                  ),
                ),
              ],
            ),
          ),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () => Navigator.pushNamed(context, '/verification/status'),
              icon: const Icon(Icons.track_changes),
              label: const Text('Track Application'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.warning,
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
            ),
          ),
        ],
      );
    }

    // Rejected or Not Started - Show start/resubmit button
    return Column(
      children: [
        SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: _navigateToForm, // Use the safe navigation method
            icon: const Icon(Icons.arrow_forward),
            label: Text(
              verification.isRejected ? 'Resubmit Application' : 'Start Verification',
            ),
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
            ),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Estimated time: 5-10 minutes',
          style: Theme.of(context).textTheme.bodySmall,
        ),
      ],
    );
  }
}