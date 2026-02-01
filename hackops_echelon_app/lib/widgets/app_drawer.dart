import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../theme/app_theme.dart';
import '../providers/auth_provider.dart';
import '../providers/verification_provider.dart';

class AppDrawer extends StatelessWidget {
  const AppDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final verification = context.watch<VerificationProvider>();
    final isLoggedIn = auth.isLoggedIn;
    final isOfficer = auth.isOfficer;
    
    // Can start verification only if not in progress and not approved
    final canStartVerification = verification.canStartVerification;

    return Drawer(
      child: SafeArea(
        child: Column(
          children: [
            // Header
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [AppTheme.primary, AppTheme.destructive],
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Text('🏛️', style: TextStyle(fontSize: 24)),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'KYC Verify',
                              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Text(
                              'Government of India',
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: Colors.white70,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  if (isLoggedIn) ...[
                    const SizedBox(height: 16),
                    Text(
                      auth.userName,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: Colors.white,
                      ),
                    ),
                    Text(
                      auth.userEmail,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.white70,
                      ),
                    ),
                    const SizedBox(height: 8),
                    // Show verification badge
                    _buildVerificationBadge(context, verification),
                  ],
                ],
              ),
            ),

            // Menu Items
            Expanded(
              child: ListView(
                padding: EdgeInsets.zero,
                children: [
                  _DrawerItem(
                    icon: Icons.home_outlined,
                    title: 'Home',
                    onTap: () => _navigate(context, '/'),
                  ),
                  
                  if (!isLoggedIn) ...[
                    _DrawerItem(
                      icon: Icons.login,
                      title: 'Login / Register',
                      onTap: () => _navigate(context, '/auth'),
                    ),
                  ],

                  if (isLoggedIn && !isOfficer) ...[
                    _DrawerItem(
                      icon: Icons.dashboard_outlined,
                      title: 'Dashboard',
                      onTap: () => _navigate(context, '/dashboard'),
                    ),
                    _DrawerItem(
                      icon: Icons.verified_user_outlined,
                      title: 'Verification',
                      onTap: () => _navigate(context, '/verification'),
                    ),
                    // Only show "Start Verification" if allowed
                    if (canStartVerification)
                      _DrawerItem(
                        icon: Icons.add_circle_outline,
                        title: verification.isRejected ? 'Resubmit Verification' : 'Start Verification',
                        onTap: () => _navigateToForm(context, verification),
                      ),
                    _DrawerItem(
                      icon: Icons.track_changes,
                      title: 'Check Status',
                      onTap: () => _navigate(context, '/verification/status'),
                    ),
                  ],

                  if (isOfficer) ...[
                    _DrawerItem(
                      icon: Icons.admin_panel_settings_outlined,
                      title: 'Officer Dashboard',
                      onTap: () => _navigate(context, '/officer'),
                    ),
                    _DrawerItem(
                      icon: Icons.pending_actions,
                      title: 'Pending Applications',
                      onTap: () => _navigate(context, '/officer/pending'),
                    ),
                  ],

                  const Divider(),

                  _DrawerItem(
                    icon: Icons.info_outline,
                    title: 'About Services',
                    onTap: () => _navigate(context, '/services'),
                  ),
                  _DrawerItem(
                    icon: Icons.help_outline,
                    title: 'Help',
                    onTap: () => _navigate(context, '/help'),
                  ),
                  _DrawerItem(
                    icon: Icons.business,
                    title: 'About Us',
                    onTap: () => _navigate(context, '/about'),
                  ),
                  _DrawerItem(
                    icon: Icons.people_outline,
                    title: 'Our Team',
                    onTap: () => _navigate(context, '/team'),
                  ),

                  if (isLoggedIn) ...[
                    const Divider(),
                    _DrawerItem(
                      icon: Icons.logout,
                      title: 'Logout',
                      iconColor: AppTheme.destructive,
                      onTap: () async {
                        await auth.logout();
                        verification.reset();
                        if (context.mounted) {
                          Navigator.of(context).pushNamedAndRemoveUntil('/', (route) => false);
                        }
                      },
                    ),
                  ],
                ],
              ),
            ),

            // Footer
            Container(
              padding: const EdgeInsets.all(16),
              child: Text(
                '© 2026 Government of India',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildVerificationBadge(BuildContext context, VerificationProvider verification) {
    String text;
    Color color;
    IconData icon;

    if (verification.isApproved) {
      text = 'Verified';
      color = AppTheme.success;
      icon = Icons.verified;
    } else if (verification.isVerificationInProgress) {
      text = 'In Progress';
      color = Colors.amber;
      icon = Icons.hourglass_empty;
    } else if (verification.isRejected) {
      text = 'Rejected';
      color = AppTheme.destructive;
      icon = Icons.error_outline;
    } else {
      text = 'Unverified';
      color = Colors.white70;
      icon = Icons.pending;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.2),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 4),
          Text(
            text,
            style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  void _navigate(BuildContext context, String route) {
    Navigator.pop(context);
    if (ModalRoute.of(context)?.settings.name != route) {
      Navigator.pushNamed(context, route);
    }
  }

  void _navigateToForm(BuildContext context, VerificationProvider verification) {
    Navigator.pop(context);
    
    // Double check before navigation
    if (verification.isApproved) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Your identity is already verified.'),
          backgroundColor: AppTheme.success,
        ),
      );
      Navigator.pushNamed(context, '/verification/status');
      return;
    }
    
    if (verification.isVerificationInProgress) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Verification is already in progress.'),
          backgroundColor: AppTheme.warning,
        ),
      );
      Navigator.pushNamed(context, '/verification/status');
      return;
    }
    
    Navigator.pushNamed(context, '/verification/form');
  }
}

class _DrawerItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final VoidCallback onTap;
  final Color? iconColor;

  const _DrawerItem({
    required this.icon,
    required this.title,
    required this.onTap,
    this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: iconColor ?? AppTheme.mutedForeground),
      title: Text(title),
      onTap: onTap,
      dense: true,
    );
  }
}