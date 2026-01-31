import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../theme/app_theme.dart';
import '../providers/auth_provider.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.user;

    if (authProvider.isLoading) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    if (user == null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        Navigator.pushNamedAndRemoveUntil(context, '/auth', (route) => false);
      });
      return const SizedBox.shrink();
    }

    return Scaffold(
      backgroundColor: AppTheme.muted.withOpacity(0.3),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'User Dashboard',
                        style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'National Identity Verification Portal',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                  OutlinedButton.icon(
                    onPressed: () {
                      authProvider.logout();
                      Navigator.pushNamedAndRemoveUntil(
                          context, '/', (route) => false);
                    },
                    icon: const Icon(Icons.logout, size: 18),
                    label: const Text('LOGOUT'),
                  ),
                ],
              ),
              const SizedBox(height: 32),

              // Profile Card
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: AppTheme.card,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppTheme.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.person_outline,
                            color: AppTheme.primary, size: 24),
                        const SizedBox(width: 12),
                        Text(
                          'Profile Information',
                          style:
                              Theme.of(context).textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.w600,
                                  ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Registered account details',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    const SizedBox(height: 24),
                    LayoutBuilder(
                      builder: (context, constraints) {
                        final isWide = constraints.maxWidth > 500;
                        return Wrap(
                          spacing: 32,
                          runSpacing: 24,
                          children: [
                            _ProfileField(
                              label: 'Full Name',
                              value: user['name'] ?? '',
                              width: isWide ? (constraints.maxWidth - 32) / 2 : constraints.maxWidth,
                            ),
                            _ProfileField(
                              label: 'Email Address',
                              value: user['email'] ?? '',
                              width: isWide ? (constraints.maxWidth - 32) / 2 : constraints.maxWidth,
                            ),
                            _ProfileField(
                              label: 'User Role',
                              value: (user['role'] ?? 'user').toString().toUpperCase(),
                              width: isWide ? (constraints.maxWidth - 32) / 2 : constraints.maxWidth,
                            ),
                            _ProfileField(
                              label: 'Member Since',
                              value: _formatDate(user['createdAt']),
                              width: isWide ? (constraints.maxWidth - 32) / 2 : constraints.maxWidth,
                            ),
                          ],
                        );
                      },
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Quick Actions
              Text(
                'Quick Actions',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const SizedBox(height: 16),
              LayoutBuilder(
                builder: (context, constraints) {
                  final crossAxisCount = constraints.maxWidth > 600 ? 3 : 2;
                  return GridView.count(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisCount: crossAxisCount,
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 16,
                    childAspectRatio: 1.5,
                    children: [
                      _ActionCard(
                        icon: Icons.description_outlined,
                        title: 'Start Verification',
                        color: AppTheme.primary,
                        onTap: () {},
                      ),
                      _ActionCard(
                        icon: Icons.history,
                        title: 'View History',
                        color: AppTheme.secondary,
                        onTap: () {},
                      ),
                      _ActionCard(
                        icon: Icons.settings_outlined,
                        title: 'Settings',
                        color: AppTheme.mutedForeground,
                        onTap: () {},
                      ),
                    ],
                  );
                },
              ),

              const Spacer(),

              // Back to Home
              Center(
                child: TextButton.icon(
                  onPressed: () => Navigator.pushNamed(context, '/'),
                  icon: const Icon(Icons.home_outlined),
                  label: const Text('Back to Home'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatDate(dynamic date) {
    if (date == null) return 'N/A';
    try {
      final dateTime = DateTime.parse(date.toString());
      return '${_monthName(dateTime.month)} ${dateTime.day}, ${dateTime.year}';
    } catch (e) {
      return 'N/A';
    }
  }

  String _monthName(int month) {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];
  }
}

class _ProfileField extends StatelessWidget {
  final String label;
  final String value;
  final double width;

  const _ProfileField({
    required this.label,
    required this.value,
    required this.width,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: width,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  fontWeight: FontWeight.w500,
                ),
          ),
        ],
      ),
    );
  }
}

class _ActionCard extends StatefulWidget {
  final IconData icon;
  final String title;
  final Color color;
  final VoidCallback onTap;

  const _ActionCard({
    required this.icon,
    required this.title,
    required this.color,
    required this.onTap,
  });

  @override
  State<_ActionCard> createState() => _ActionCardState();
}

class _ActionCardState extends State<_ActionCard> {
  bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      child: GestureDetector(
        onTap: widget.onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: _isHovered ? AppTheme.accent : AppTheme.card,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: AppTheme.border),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: widget.color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(widget.icon, color: widget.color),
              ),
              const SizedBox(height: 12),
              Text(
                widget.title,
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}