import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../widgets/app_drawer.dart';

class ServicesScreen extends StatelessWidget {
  const ServicesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Our Services')),
      drawer: const AppDrawer(),
      body: SingleChildScrollView(
        child: Column(
          children: [
            _buildHeader(context),
            _buildMissionSection(context),
            _buildServicesGrid(context),
            _buildTrustSection(context),
            _buildProcessSection(context),
            _buildBenefitsSection(context),
            _buildCTASection(context),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      color: AppTheme.muted,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppTheme.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(Icons.business, size: 32, color: AppTheme.primary),
          ),
          const SizedBox(height: 16),
          Text(
            'Know Our Services',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            'A secure, transparent, and citizen-friendly platform for identity verification',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppTheme.mutedForeground),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildMissionSection(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Card(
        color: AppTheme.accent,
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(Icons.balance, color: AppTheme.primary, size: 28),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Our Commitment', style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 8),
                    Text(
                      'The National Identity Verification Portal is committed to providing secure, efficient, and accessible identity verification services to all citizens of India.',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildServicesGrid(BuildContext context) {
    final services = [
      {
        'icon': Icons.description,
        'title': 'Document Verification',
        'color': Colors.blue,
        'items': ['Aadhaar validation', 'PAN verification', 'Tampering detection'],
      },
      {
        'icon': Icons.fingerprint,
        'title': 'Biometric Verification',
        'color': Colors.purple,
        'items': ['4-angle face capture', 'Liveness detection', 'Deepfake prevention'],
      },
      {
        'icon': Icons.shield,
        'title': 'Fraud Prevention',
        'color': Colors.red,
        'items': ['Behavioral analysis', 'Bot detection', 'Synthetic ID detection'],
      },
      {
        'icon': Icons.verified_user,
        'title': 'Officer Review',
        'color': Colors.orange,
        'items': ['Manual review', 'Cross-verification', 'Fair process'],
      },
    ];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        children: [
          Text('Verification Services', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 16),
          ...services.map((service) => _ServiceCard(
                icon: service['icon'] as IconData,
                title: service['title'] as String,
                color: service['color'] as Color,
                items: service['items'] as List<String>,
              )),
        ],
      ),
    );
  }

  Widget _buildTrustSection(BuildContext context) {
    final trustItems = [
      {'icon': Icons.lock, 'title': 'Data Protection', 'desc': 'Government-grade encryption', 'color': Colors.green},
      {'icon': Icons.visibility, 'title': 'Transparency', 'desc': 'Real-time tracking', 'color': Colors.blue},
      {'icon': Icons.verified, 'title': 'Certified', 'desc': 'Govt. of India initiative', 'color': Colors.purple},
    ];

    return Container(
      padding: const EdgeInsets.all(20),
      margin: const EdgeInsets.symmetric(vertical: 20),
      color: AppTheme.muted,
      child: Column(
        children: [
          Text('Trust & Security', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 16),
          Row(
            children: trustItems.map((item) {
              return Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: _TrustCard(
                    icon: item['icon'] as IconData,
                    title: item['title'] as String,
                    description: item['desc'] as String,
                    color: item['color'] as Color,
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildProcessSection(BuildContext context) {
    final steps = [
      {'num': '1', 'title': 'Register & Login', 'desc': 'Create your account'},
      {'num': '2', 'title': 'Submit Documents', 'desc': 'Upload Aadhaar & PAN'},
      {'num': '3', 'title': 'Face Capture', 'desc': 'Biometric verification'},
      {'num': '4', 'title': 'AI Verification', 'desc': 'Automated checks'},
      {'num': '✓', 'title': 'Get Verified', 'desc': 'Officer approval'},
    ];

    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          Text('Verification Process', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 20),
          ...steps.asMap().entries.map((entry) {
            final step = entry.value;
            final isLast = entry.key == steps.length - 1;
            return _ProcessStep(
              number: step['num'] as String,
              title: step['title'] as String,
              description: step['desc'] as String,
              isLast: isLast,
            );
          }),
        ],
      ),
    );
  }

  Widget _buildBenefitsSection(BuildContext context) {
    final benefits = [
      {'icon': Icons.schedule, 'title': 'Quick Processing', 'desc': '24-48 hours'},
      {'icon': Icons.security, 'title': 'Secure Platform', 'desc': 'Govt-grade security'},
      {'icon': Icons.people, 'title': 'Accessible', 'desc': 'Multiple languages'},
      {'icon': Icons.description, 'title': 'Paperless', 'desc': 'Fully digital'},
    ];

    return Container(
      padding: const EdgeInsets.all(20),
      margin: const EdgeInsets.only(bottom: 20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppTheme.primary.withOpacity(0.05), AppTheme.destructive.withOpacity(0.05)],
        ),
      ),
      child: Column(
        children: [
          Text('Why Use This Service?', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 16),
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 2,
            childAspectRatio: 2,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            children: benefits.map((b) {
              return _BenefitChip(
                icon: b['icon'] as IconData,
                title: b['title'] as String,
                description: b['desc'] as String,
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildCTASection(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              Icon(Icons.help_outline, size: 40, color: AppTheme.primary),
              const SizedBox(height: 12),
              Text('Need Assistance?', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              Text(
                'Our support team is available to help.',
                style: Theme.of(context).textTheme.bodySmall,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pushNamed(context, '/help'),
                      child: const Text('Get Help'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () => Navigator.pushNamed(context, '/verification'),
                      child: const Text('Start Now'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ServiceCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final Color color;
  final List<String> items;

  const _ServiceCard({
    required this.icon,
    required this.title,
    required this.color,
    required this.items,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: Theme.of(context).textTheme.titleSmall),
                  const SizedBox(height: 8),
                  ...items.map((item) => Padding(
                        padding: const EdgeInsets.only(bottom: 4),
                        child: Row(
                          children: [
                            Icon(Icons.check_circle, size: 14, color: AppTheme.success),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(item, style: Theme.of(context).textTheme.bodySmall),
                            ),
                          ],
                        ),
                      )),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TrustCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;
  final Color color;

  const _TrustCard({
    required this.icon,
    required this.title,
    required this.description,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(height: 8),
            Text(
              title,
              style: Theme.of(context).textTheme.labelSmall?.copyWith(fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
            Text(
              description,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(fontSize: 10),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class _ProcessStep extends StatelessWidget {
  final String number;
  final String title;
  final String description;
  final bool isLast;

  const _ProcessStep({
    required this.number,
    required this.title,
    required this.description,
    this.isLast = false,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: number == '✓' ? AppTheme.success : AppTheme.primary,
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(
                  number,
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                ),
              ),
            ),
            if (!isLast) Container(width: 2, height: 30, color: AppTheme.border),
          ],
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: Theme.of(context).textTheme.titleSmall),
                Text(description, style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _BenefitChip extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;

  const _BenefitChip({
    required this.icon,
    required this.title,
    required this.description,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            Icon(icon, color: AppTheme.primary, size: 24),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: Theme.of(context).textTheme.labelSmall?.copyWith(fontWeight: FontWeight.bold)),
                  Text(description, style: Theme.of(context).textTheme.bodySmall?.copyWith(fontSize: 10)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}