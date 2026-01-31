import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class QuickLinks extends StatelessWidget {
  const QuickLinks({super.key});

  @override
  Widget build(BuildContext context) {
    final links = [
      _QuickLinkItem(
        icon: Icons.public,
        title: 'Apply for Identity Verification',
        description: 'Start your identity verification process',
      ),
      _QuickLinkItem(
        icon: Icons.calendar_today,
        title: 'Check Application Status',
        description: 'Track the progress of your application',
      ),
      _QuickLinkItem(
        icon: Icons.location_on_outlined,
        title: 'Track Verification Process',
        description: 'View verification stage and updates',
      ),
      _QuickLinkItem(
        icon: Icons.chat_bubble_outline,
        title: 'Register Feedback / Grievance',
        description: 'Submit feedback or register a grievance',
      ),
      _QuickLinkItem(
        icon: Icons.bolt,
        title: 'Know About Services',
        description: 'View available verification services',
      ),
    ];

    return Container(
      decoration: BoxDecoration(
        color: AppTheme.background,
        border: Border(
          top: BorderSide(color: AppTheme.primary, width: 4),
        ),
      ),
      transform: Matrix4.translationValues(0, -32, 0),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Text(
              'Quick Links',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: 32),
            LayoutBuilder(
              builder: (context, constraints) {
                final crossAxisCount = constraints.maxWidth > 900
                    ? 5
                    : constraints.maxWidth > 600
                        ? 3
                        : 2;
                return GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: crossAxisCount,
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 16,
                    childAspectRatio: 1,
                  ),
                  itemCount: links.length,
                  itemBuilder: (context, index) => _QuickLinkCard(
                    item: links[index],
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _QuickLinkItem {
  final IconData icon;
  final String title;
  final String description;

  _QuickLinkItem({
    required this.icon,
    required this.title,
    required this.description,
  });
}

class _QuickLinkCard extends StatefulWidget {
  final _QuickLinkItem item;

  const _QuickLinkCard({required this.item});

  @override
  State<_QuickLinkCard> createState() => _QuickLinkCardState();
}

class _QuickLinkCardState extends State<_QuickLinkCard> {
  bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      child: GestureDetector(
        onTap: () {},
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: _isHovered ? AppTheme.accent : AppTheme.card,
            borderRadius: BorderRadius.circular(6),
            border: Border.all(color: AppTheme.border),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
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
              const SizedBox(height: 12),
              Text(
                widget.item.title,
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 8),
              Text(
                widget.item.description,
                style: Theme.of(context).textTheme.bodySmall,
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }
}