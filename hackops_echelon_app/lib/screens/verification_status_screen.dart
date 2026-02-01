import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../theme/app_theme.dart';
import '../providers/verification_provider.dart';

class VerificationStatusScreen extends StatefulWidget {
  const VerificationStatusScreen({super.key});

  @override
  State<VerificationStatusScreen> createState() => _VerificationStatusScreenState();
}

class _VerificationStatusScreenState extends State<VerificationStatusScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<VerificationProvider>().fetchStatus();
    });
  }

  @override
  Widget build(BuildContext context) {
    final verification = context.watch<VerificationProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Application Status'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => verification.fetchStatus(),
          ),
        ],
      ),
      body: verification.isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () => verification.fetchStatus(),
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    _buildStatusCard(verification.currentStatus, verification.status),
                    const SizedBox(height: 24),
                    _buildTimeline(verification.currentStatus),
                    if (verification.status != null) ...[
                      const SizedBox(height: 24),
                      _buildDetailsCard(verification.status!),
                    ],
                    if (verification.currentStatus == 'rejected') ...[
                      const SizedBox(height: 24),
                      _buildRejectionCard(verification.status),
                    ],
                    const SizedBox(height: 24),
                    _buildActionsCard(verification.currentStatus),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildStatusCard(String status, Map<String, dynamic>? data) {
    final config = _getStatusConfig(status);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [config['color'] as Color, (config['color'] as Color).withOpacity(0.7)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: (config['color'] as Color).withOpacity(0.3),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              shape: BoxShape.circle,
            ),
            child: Icon(config['icon'] as IconData, size: 48, color: Colors.white),
          ),
          const SizedBox(height: 16),
          Text(
            config['title'] as String,
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            config['subtitle'] as String,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.white.withOpacity(0.9),
                ),
            textAlign: TextAlign.center,
          ),
          if (data?['_id'] != null) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.2),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                'ID: ${(data!['_id'] as String).substring((data['_id'] as String).length - 8).toUpperCase()}',
                style: const TextStyle(color: Colors.white, fontFamily: 'monospace'),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildTimeline(String currentStatus) {
    final steps = [
      {'status': 'submitted', 'title': 'Submitted', 'icon': Icons.upload_file},
      {'status': 'under_automated_verification', 'title': 'AI Verification', 'icon': Icons.memory},
      {'status': 'under_officer_review', 'title': 'Officer Review', 'icon': Icons.person_search},
      {'status': 'approved', 'title': 'Completed', 'icon': Icons.verified},
    ];

    final currentIndex = _getStatusIndex(currentStatus);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Verification Progress', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 20),
            ...steps.asMap().entries.map((entry) {
              final index = entry.key;
              final step = entry.value;
              final isCompleted = index < currentIndex;
              final isActive = index == currentIndex;
              final isRejected = currentStatus == 'rejected' && isActive;

              return _TimelineItem(
                title: step['title'] as String,
                icon: step['icon'] as IconData,
                isCompleted: isCompleted,
                isActive: isActive,
                isRejected: isRejected,
                isLast: index == steps.length - 1,
              );
            }),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailsCard(Map<String, dynamic> data) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Application Details', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 16),
            _DetailRow(label: 'Full Name', value: data['fullName'] ?? '-'),
            _DetailRow(label: 'City', value: data['city'] ?? '-'),
            _DetailRow(label: 'State', value: data['state'] ?? '-'),
            if (data['submittedAt'] != null)
              _DetailRow(
                label: 'Submitted',
                value: _formatDate(data['submittedAt']),
              ),
            if (data['reviewedAt'] != null)
              _DetailRow(
                label: 'Reviewed',
                value: _formatDate(data['reviewedAt']),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildRejectionCard(Map<String, dynamic>? data) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.destructive.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.destructive.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.error_outline, color: AppTheme.destructive),
              const SizedBox(width: 8),
              Text(
                'Rejection Reason',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: AppTheme.destructive,
                    ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            data?['rejectionReason'] ?? 'No reason provided. Please contact support.',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ],
      ),
    );
  }

  Widget _buildActionsCard(String status) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            if (status == 'rejected' || status == 'not_started')
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () => Navigator.pushNamed(context, '/verification/form'),
                  icon: const Icon(Icons.refresh),
                  label: Text(status == 'rejected' ? 'Resubmit Application' : 'Start Verification'),
                ),
              ),
            if (status != 'not_started') ...[
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () => context.read<VerificationProvider>().fetchStatus(),
                  icon: const Icon(Icons.refresh),
                  label: const Text('Refresh Status'),
                ),
              ),
            ],
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () => Navigator.pushNamed(context, '/help'),
                icon: const Icon(Icons.help_outline),
                label: const Text('Get Help'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Map<String, dynamic> _getStatusConfig(String status) {
    switch (status) {
      case 'approved':
        return {
          'icon': Icons.check_circle,
          'title': 'Verification Approved',
          'subtitle': 'Your identity has been successfully verified',
          'color': AppTheme.success,
        };
      case 'rejected':
        return {
          'icon': Icons.cancel,
          'title': 'Verification Rejected',
          'subtitle': 'Please review the reason and resubmit',
          'color': AppTheme.destructive,
        };
      case 'submitted':
        return {
          'icon': Icons.hourglass_top,
          'title': 'Application Submitted',
          'subtitle': 'Your application is in queue for verification',
          'color': AppTheme.info,
        };
      case 'under_automated_verification':
        return {
          'icon': Icons.memory,
          'title': 'AI Verification',
          'subtitle': 'Automated checks are in progress',
          'color': AppTheme.warning,
        };
      case 'under_officer_review':
        return {
          'icon': Icons.person_search,
          'title': 'Officer Review',
          'subtitle': 'A verification officer is reviewing your application',
          'color': AppTheme.primary,
        };
      default:
        return {
          'icon': Icons.pending,
          'title': 'Not Started',
          'subtitle': 'Begin your verification process',
          'color': AppTheme.mutedForeground,
        };
    }
  }

  int _getStatusIndex(String status) {
    switch (status) {
      case 'submitted':
        return 0;
      case 'under_automated_verification':
        return 1;
      case 'under_officer_review':
        return 2;
      case 'approved':
        return 4;
      case 'rejected':
        return 2;
      default:
        return -1;
    }
  }

  String _formatDate(dynamic date) {
    if (date == null) return '-';
    try {
      final dateTime = DateTime.parse(date.toString());
      return DateFormat('dd MMM yyyy, hh:mm a').format(dateTime);
    } catch (e) {
      return date.toString();
    }
  }
}

class _TimelineItem extends StatelessWidget {
  final String title;
  final IconData icon;
  final bool isCompleted;
  final bool isActive;
  final bool isRejected;
  final bool isLast;

  const _TimelineItem({
    required this.title,
    required this.icon,
    required this.isCompleted,
    required this.isActive,
    required this.isRejected,
    required this.isLast,
  });

  @override
  Widget build(BuildContext context) {
    final color = isRejected
        ? AppTheme.destructive
        : isCompleted || isActive
            ? AppTheme.success
            : AppTheme.mutedForeground;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                shape: BoxShape.circle,
                border: Border.all(color: color, width: 2),
              ),
              child: Icon(
                isCompleted ? Icons.check : icon,
                size: 18,
                color: color,
              ),
            ),
            if (!isLast)
              Container(
                width: 2,
                height: 40,
                color: isCompleted ? AppTheme.success : AppTheme.border,
              ),
          ],
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(top: 6),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        color: isActive || isCompleted ? AppTheme.foreground : AppTheme.mutedForeground,
                        fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
                      ),
                ),
                if (isActive)
                  Text(
                    isRejected ? 'Rejected' : 'In Progress',
                    style: TextStyle(
                      fontSize: 12,
                      color: isRejected ? AppTheme.destructive : AppTheme.success,
                    ),
                  ),
                SizedBox(height: isLast ? 0 : 24),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;

  const _DetailRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: Theme.of(context).textTheme.bodySmall),
          Text(value, style: Theme.of(context).textTheme.bodyMedium),
        ],
      ),
    );
  }
}