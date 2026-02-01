import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../widgets/app_drawer.dart';

class MissionScreen extends StatelessWidget {
  const MissionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Mission & Vision')),
      drawer: const AppDrawer(),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppTheme.primary.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.flag, size: 32, color: AppTheme.primary),
            ),
            const SizedBox(height: 16),
            Text(
              'Mission & Vision',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              'Our guiding principles for a Digital India',
              style: Theme.of(context).textTheme.bodySmall,
            ),
            const SizedBox(height: 24),

            // Mission Card
            _MissionCard(
              icon: Icons.track_changes,
              title: 'Our Mission',
              description: 'To provide secure, efficient, and accessible identity verification services to every citizen of India, ensuring fraud prevention while maintaining the highest standards of data privacy and user experience.',
              color: Colors.blue,
            ),
            const SizedBox(height: 16),

            // Vision Card
            _MissionCard(
              icon: Icons.visibility,
              title: 'Our Vision',
              description: 'A digitally empowered India where every citizen can securely verify their identity online, eliminating fraud and enabling seamless access to government and private services.',
              color: Colors.purple,
            ),
            const SizedBox(height: 24),

            // Core Values
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Core Values', style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 16),
                    _ValueItem(
                      icon: Icons.security,
                      title: 'Security First',
                      description: 'Protecting citizen data with highest standards',
                    ),
                    _ValueItem(
                      icon: Icons.accessibility,
                      title: 'Accessibility',
                      description: 'Services available to all, regardless of location',
                    ),
                    _ValueItem(
                      icon: Icons.visibility,
                      title: 'Transparency',
                      description: 'Clear processes with trackable status',
                    ),
                    _ValueItem(
                      icon: Icons.speed,
                      title: 'Efficiency',
                      description: 'Fast processing with minimal paperwork',
                      isLast: true,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MissionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;
  final Color color;

  const _MissionCard({
    required this.icon,
    required this.title,
    required this.description,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(icon, color: color, size: 24),
                ),
                const SizedBox(width: 12),
                Text(title, style: Theme.of(context).textTheme.titleMedium),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              description,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppTheme.mutedForeground,
                    height: 1.5,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ValueItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;
  final bool isLast;

  const _ValueItem({
    required this.icon,
    required this.title,
    required this.description,
    this.isLast = false,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: isLast ? 0 : 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.check_circle, size: 20, color: AppTheme.success),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: Theme.of(context).textTheme.titleSmall),
                Text(description, style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
        ],
      ),
    );
  }
}