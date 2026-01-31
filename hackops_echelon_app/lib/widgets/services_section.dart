import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class ServicesSection extends StatelessWidget {
  const ServicesSection({super.key});

  @override
  Widget build(BuildContext context) {
    final services = [
      _ServiceItem(
        icon: Icons.description_outlined,
        title: 'Document Verification',
        description:
            'Verification of submitted documents through structured checks and cross-reference mechanisms.',
      ),
      _ServiceItem(
        icon: Icons.fingerprint,
        title: 'Biometric Verification',
        description:
            'Identity verification using facial, voice, or fingerprint-based signals where applicable.',
      ),
      _ServiceItem(
        icon: Icons.bar_chart,
        title: 'Application Consistency Review',
        description:
            'Review of application data to identify inconsistencies or unusual patterns.',
      ),
      _ServiceItem(
        icon: Icons.bolt,
        title: 'Fraud Risk Assessment',
        description:
            'Detection of high-risk identity submissions through layered verification safeguards.',
      ),
    ];

    return Container(
      padding: const EdgeInsets.all(24),
      color: AppTheme.accent.withOpacity(0.3),
      child: Column(
        children: [
          Text(
            'Know About Our Services',
            style: Theme.of(context).textTheme.headlineMedium,
          ),
          const SizedBox(height: 8),
          Text(
            'A comprehensive identity verification framework designed to support secure and compliant KYC processes.',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppTheme.mutedForeground,
                ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 32),
          LayoutBuilder(
            builder: (context, constraints) {
              final crossAxisCount = constraints.maxWidth > 900
                  ? 4
                  : constraints.maxWidth > 600
                      ? 2
                      : 1;
              return GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: crossAxisCount,
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                  childAspectRatio: crossAxisCount == 1 ? 2.5 : 1,
                ),
                itemCount: services.length,
                itemBuilder: (context, index) => _ServiceCard(
                  item: services[index],
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}

class _ServiceItem {
  final IconData icon;
  final String title;
  final String description;

  _ServiceItem({
    required this.icon,
    required this.title,
    required this.description,
  });
}

class _ServiceCard extends StatefulWidget {
  final _ServiceItem item;

  const _ServiceCard({required this.item});

  @override
  State<_ServiceCard> createState() => _ServiceCardState();
}

class _ServiceCardState extends State<_ServiceCard> {
  bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: _isHovered ? AppTheme.accent : AppTheme.card,
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: AppTheme.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppTheme.accent,
                borderRadius: BorderRadius.circular(6),
              ),
              child: Icon(
                widget.item.icon,
                color: AppTheme.primary,
                size: 24,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              widget.item.title,
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              widget.item.description,
              style: Theme.of(context).textTheme.bodySmall,
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}