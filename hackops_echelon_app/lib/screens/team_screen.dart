import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../theme/app_theme.dart';
import '../widgets/app_drawer.dart';

class TeamScreen extends StatelessWidget {
  const TeamScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final team = [
      _TeamMember(
        name: 'Devang Vala',
        role: 'Team Lead',
        imageUrl: 'https://res.cloudinary.com/dsh447lvk/image/upload/v1769908653/IMG_20260201_063947869.jpg_bzgart.jpg',
      ),
      _TeamMember(
        name: 'Vasu Sadariya',
        role: 'Developer',
        imageUrl: 'https://res.cloudinary.com/dsh447lvk/image/upload/v1769908653/IMG_20260201_063947869.jpg_bzgart.jpg',
      ),
      _TeamMember(
        name: 'Aryan Sawant',
        role: 'Developer',
        imageUrl: 'https://res.cloudinary.com/dsh447lvk/image/upload/v1769908653/IMG_20260201_063947869.jpg_bzgart.jpg',
      ),
      _TeamMember(
        name: 'Jeet Tandel',
        role: 'Developer',
        imageUrl: 'https://res.cloudinary.com/dsh447lvk/image/upload/v1769908653/IMG_20260201_063947869.jpg_bzgart.jpg',
      ),
    ];

    return Scaffold(
      appBar: AppBar(title: const Text('Our Team')),
      drawer: const AppDrawer(),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppTheme.primary.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.people, size: 32, color: AppTheme.primary),
            ),
            const SizedBox(height: 16),
            Text(
              'Our Team',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              'Meet the dedicated team behind this portal',
              style: Theme.of(context).textTheme.bodySmall,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 0.85,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
              ),
              itemCount: team.length,
              itemBuilder: (context, index) => _TeamCard(member: team[index]),
            ),
            const SizedBox(height: 32),
            Card(
              color: AppTheme.muted,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Text(
                  'We are a team of passionate developers committed to building secure, accessible digital solutions for citizens of India under the Digital India initiative.',
                  style: Theme.of(context).textTheme.bodySmall,
                  textAlign: TextAlign.center,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TeamMember {
  final String name;
  final String role;
  final String imageUrl;

  _TeamMember({required this.name, required this.role, required this.imageUrl});

  String get initials {
    final parts = name.split(' ');
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
}

class _TeamCard extends StatelessWidget {
  final _TeamMember member;

  const _TeamCard({required this.member});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: AppTheme.primary.withOpacity(0.3), width: 3),
              ),
              child: ClipOval(
                child: CachedNetworkImage(
                  imageUrl: member.imageUrl,
                  fit: BoxFit.cover,
                  placeholder: (context, url) => _buildPlaceholder(),
                  errorWidget: (context, url, error) => _buildPlaceholder(),
                ),
              ),
            ),
            const SizedBox(height: 12),
            Text(
              member.name,
              style: Theme.of(context).textTheme.titleSmall,
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 4),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: AppTheme.muted,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.border),
              ),
              child: Text(
                member.role,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(fontSize: 11),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPlaceholder() {
    return Container(
      color: AppTheme.primary,
      child: Center(
        child: Text(
          member.initials,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }
}