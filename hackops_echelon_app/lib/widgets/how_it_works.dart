import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class HowItWorks extends StatelessWidget {
  const HowItWorks({super.key});

  @override
  Widget build(BuildContext context) {
    final steps = [
      _StepItem(
        number: '1',
        title: 'Submit Your Documents',
        description:
            'Upload your identity documents and required verification details through the secure portal.',
      ),
      _StepItem(
        number: '2',
        title: 'Automated Verification',
        description:
            'The system performs document checks and identity validation using official verification mechanisms.',
      ),
      _StepItem(
        number: '3',
        title: 'Application Review',
        description:
            'Consistency and application data are reviewed across submitted information and records.',
      ),
      _StepItem(
        number: '4',
        title: 'Verification Complete',
        description:
            'Receive your verification status along with applicable compliance information.',
      ),
    ];

    return Container(
      padding: const EdgeInsets.all(24),
      color: AppTheme.background,
      child: Column(
        children: [
          Text(
            'How Verification Works',
            style: Theme.of(context).textTheme.headlineMedium,
          ),
          const SizedBox(height: 32),
          LayoutBuilder(
            builder: (context, constraints) {
              final isWide = constraints.maxWidth > 700;
              if (isWide) {
                return Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: steps
                      .expand((step) => [
                            Expanded(child: _StepCard(step: step)),
                            if (step != steps.last)
                              Padding(
                                padding: const EdgeInsets.only(top: 20),
                                child: Icon(
                                  Icons.arrow_forward,
                                  color: AppTheme.mutedForeground,
                                ),
                              ),
                          ])
                      .toList(),
                );
              }
              return Column(
                children: steps
                    .map((step) => Padding(
                          padding: const EdgeInsets.only(bottom: 16),
                          child: _StepCard(step: step, horizontal: true),
                        ))
                    .toList(),
              );
            },
          ),
          const SizedBox(height: 32),
          _buildSecuritySection(context),
        ],
      ),
    );
  }

  Widget _buildSecuritySection(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppTheme.accent.withOpacity(0.4),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Security & Privacy',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
          ),
          const SizedBox(height: 16),
          LayoutBuilder(
            builder: (context, constraints) {
              final isWide = constraints.maxWidth > 600;
              final items = [
                _SecurityItem(
                  icon: '🔒',
                  title: 'Data Protection',
                  description:
                      'All information is protected using secure transmission and storage practices.',
                ),
                _SecurityItem(
                  icon: '🛡️',
                  title: 'Secure Systems',
                  description:
                      'Multi-layer safeguards are in place to prevent misuse and unauthorized access.',
                ),
                _SecurityItem(
                  icon: '📋',
                  title: 'Regulatory Compliance',
                  description:
                      'Processes are aligned with applicable KYC and data-handling guidelines.',
                ),
              ];

              if (isWide) {
                return Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: items
                      .map((item) => Expanded(
                            child: Padding(
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 8),
                              child: _SecurityCard(item: item),
                            ),
                          ))
                      .toList(),
                );
              }
              return Column(
                children: items
                    .map((item) => Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: _SecurityCard(item: item),
                        ))
                    .toList(),
              );
            },
          ),
        ],
      ),
    );
  }
}

class _StepItem {
  final String number;
  final String title;
  final String description;

  _StepItem({
    required this.number,
    required this.title,
    required this.description,
  });
}

class _StepCard extends StatelessWidget {
  final _StepItem step;
  final bool horizontal;

  const _StepCard({required this.step, this.horizontal = false});

  @override
  Widget build(BuildContext context) {
    final numberWidget = Container(
      width: 48,
      height: 48,
      decoration: BoxDecoration(
        color: AppTheme.primary,
        shape: BoxShape.circle,
      ),
      child: Center(
        child: Text(
          step.number,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w600,
            fontSize: 18,
          ),
        ),
      ),
    );

    final content = Column(
      crossAxisAlignment:
          horizontal ? CrossAxisAlignment.start : CrossAxisAlignment.center,
      children: [
        Text(
          step.title,
          style: Theme.of(context).textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w600,
              ),
          textAlign: horizontal ? TextAlign.start : TextAlign.center,
        ),
        const SizedBox(height: 8),
        Text(
          step.description,
          style: Theme.of(context).textTheme.bodySmall,
          textAlign: horizontal ? TextAlign.start : TextAlign.center,
        ),
      ],
    );

    if (horizontal) {
      return Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          numberWidget,
          const SizedBox(width: 16),
          Expanded(child: content),
        ],
      );
    }

    return Column(
      children: [
        numberWidget,
        const SizedBox(height: 16),
        content,
      ],
    );
  }
}

class _SecurityItem {
  final String icon;
  final String title;
  final String description;

  _SecurityItem({
    required this.icon,
    required this.title,
    required this.description,
  });
}

class _SecurityCard extends StatelessWidget {
  final _SecurityItem item;

  const _SecurityCard({required this.item});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(item.icon, style: const TextStyle(fontSize: 16)),
            const SizedBox(width: 8),
            Text(
              item.title,
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Text(
          item.description,
          style: Theme.of(context).textTheme.bodySmall,
        ),
      ],
    );
  }
}