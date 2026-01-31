import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class AppFooter extends StatelessWidget {
  const AppFooter({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.card,
        border: Border(top: BorderSide(color: AppTheme.border)),
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          LayoutBuilder(
            builder: (context, constraints) {
              final isWide = constraints.maxWidth > 600;
              if (isWide) {
                return Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(child: _buildAboutSection(context)),
                    Expanded(child: _buildServicesSection(context)),
                    Expanded(child: _buildLinksSection(context)),
                    Expanded(child: _buildContactSection(context)),
                  ],
                );
              }
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildAboutSection(context),
                  const SizedBox(height: 24),
                  _buildServicesSection(context),
                  const SizedBox(height: 24),
                  _buildLinksSection(context),
                  const SizedBox(height: 24),
                  _buildContactSection(context),
                ],
              );
            },
          ),
          const SizedBox(height: 24),
          const Divider(),
          const SizedBox(height: 24),
          _buildBottomStrip(context),
        ],
      ),
    );
  }

  Widget _buildAboutSection(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'About KYC Verify',
          style: Theme.of(context).textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w600,
              ),
        ),
        const SizedBox(height: 12),
        ...[
          'About Us',
          'Mission & Vision',
          'Our Team',
          'Careers',
        ].map((item) => _FooterLink(text: item)),
      ],
    );
  }

  Widget _buildServicesSection(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Services',
          style: Theme.of(context).textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w600,
              ),
        ),
        const SizedBox(height: 12),
        ...[
          'Document Verification',
          'Biometric Verification',
          'Identity Validation',
          'KYC Compliance',
        ].map((item) => _FooterLink(text: item)),
      ],
    );
  }

  Widget _buildLinksSection(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Useful Links',
          style: Theme.of(context).textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w600,
              ),
        ),
        const SizedBox(height: 12),
        ...[
          'FAQ',
          'Privacy Policy',
          'Terms & Conditions',
          'Contact Support',
        ].map((item) => _FooterLink(text: item)),
      ],
    );
  }

  Widget _buildContactSection(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Contact Us',
          style: Theme.of(context).textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w600,
              ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Icon(Icons.phone, size: 16, color: AppTheme.primary),
            const SizedBox(width: 8),
            Text(
              '1800-258-1800',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Icon(Icons.email_outlined, size: 16, color: AppTheme.primary),
            const SizedBox(width: 8),
            Text(
              'support@kycverify.gov.in',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ),
        const SizedBox(height: 12),
        Text(
          'Ministry of Identity Verification\nGovernment of India',
          style: Theme.of(context).textTheme.bodySmall,
        ),
      ],
    );
  }

  Widget _buildBottomStrip(BuildContext context) {
    return Column(
      children: [
        Text(
          '© 2026 KYC Verify. All rights reserved.',
          style: Theme.of(context).textTheme.bodySmall,
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 4),
        Text(
          'Government of India | Ministry of Identity Verification',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                fontSize: 10,
              ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }
}

class _FooterLink extends StatefulWidget {
  final String text;

  const _FooterLink({required this.text});

  @override
  State<_FooterLink> createState() => _FooterLinkState();
}

class _FooterLinkState extends State<_FooterLink> {
  bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      child: GestureDetector(
        onTap: () {},
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 4),
          child: Text(
            widget.text,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: _isHovered
                      ? AppTheme.foreground
                      : AppTheme.mutedForeground,
                ),
          ),
        ),
      ),
    );
  }
}