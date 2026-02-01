import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../widgets/app_drawer.dart';

class HelpScreen extends StatefulWidget {
  const HelpScreen({super.key});

  @override
  State<HelpScreen> createState() => _HelpScreenState();
}

class _HelpScreenState extends State<HelpScreen> {
  final _searchController = TextEditingController();
  String _searchQuery = '';

  final List<_FAQCategory> _categories = [
    _FAQCategory(
      id: 'general',
      title: 'General Questions',
      icon: Icons.help_outline,
      color: Colors.blue,
      faqs: [
        _FAQ('What is the National Identity Verification Portal?',
            'An official Government of India initiative providing secure digital identity verification services to citizens through a paperless online process.'),
        _FAQ('Who can use this service?',
            'Any Indian citizen with valid Aadhaar and PAN cards, aged 18 or above, with camera access for biometric verification.'),
        _FAQ('Is this service free?',
            'Yes, completely free for all citizens with no hidden charges.'),
        _FAQ('How long does verification take?',
            'Most applications are processed within 24-48 hours.'),
      ],
    ),
    _FAQCategory(
      id: 'documents',
      title: 'Document Requirements',
      icon: Icons.description,
      color: Colors.purple,
      faqs: [
        _FAQ('What documents are needed?',
            'Aadhaar Card and PAN Card - both clearly visible front side images.'),
        _FAQ('What image format is accepted?',
            'JPG or PNG format, maximum 5MB each. Images must be clear and readable.'),
        _FAQ('Can I use scanned copies?',
            'Yes, scanned copies or smartphone photos are acceptable if clear.'),
        _FAQ('What if my document is rejected?',
            'You\'ll receive a notification with the reason. Resubmit with a clearer image.'),
      ],
    ),
    _FAQCategory(
      id: 'biometric',
      title: 'Biometric Verification',
      icon: Icons.face,
      color: Colors.green,
      faqs: [
        _FAQ('What is face verification?',
            'Captures your face from 4 angles (front, left, right, up) to confirm identity and physical presence.'),
        _FAQ('Why 4 angles?',
            'Multi-angle capture provides more accurate verification and prevents fraud.'),
        _FAQ('Camera not working?',
            'Use a different device with a functional camera (smartphone or laptop).'),
        _FAQ('Tips for face capture?',
            'Good lighting, remove glasses, look directly at camera, neutral expression, full face visible.'),
      ],
    ),
    _FAQCategory(
      id: 'account',
      title: 'Account & Login',
      icon: Icons.person,
      color: Colors.orange,
      faqs: [
        _FAQ('How to create an account?',
            'Click Login/Register, select Register tab, enter name, email, and password.'),
        _FAQ('Forgot password?',
            'Click Forgot Password on login page and follow email instructions.'),
        _FAQ('Can I change my email?',
            'Contact support with valid identification for email change requests.'),
        _FAQ('Is my data secure?',
            'Yes, encrypted and stored following government data protection guidelines.'),
      ],
    ),
    _FAQCategory(
      id: 'status',
      title: 'Application Status',
      icon: Icons.track_changes,
      color: Colors.teal,
      faqs: [
        _FAQ('How to check status?',
            'Login and go to Dashboard > View Status or Application Status page.'),
        _FAQ('What do statuses mean?',
            'Submitted=received, Under Verification=AI checks, Under Review=human review, Approved/Rejected=final decision.'),
        _FAQ('Pending too long?',
            'If pending over 3 business days, contact support with your application ID.'),
        _FAQ('Can I withdraw application?',
            'Submitted applications cannot be withdrawn. Wait for decision, then resubmit if needed.'),
      ],
    ),
    _FAQCategory(
      id: 'security',
      title: 'Privacy & Security',
      icon: Icons.security,
      color: Colors.red,
      faqs: [
        _FAQ('How is data protected?',
            'Encrypted in transit and at rest, following IT Act 2000 and DPDP Act 2023.'),
        _FAQ('Who can access my data?',
            'Only authorized government officers. Access is logged and audited.'),
        _FAQ('How long is data stored?',
            'Per government retention policies - verification validity plus mandatory retention period.'),
        _FAQ('Can I request data deletion?',
            'Submit request through support channel, handled per DPDP Act.'),
      ],
    ),
  ];

  List<_FAQCategory> get _filteredCategories {
    if (_searchQuery.isEmpty) return _categories;
    
    return _categories.map((category) {
      final filteredFaqs = category.faqs.where((faq) {
        return faq.question.toLowerCase().contains(_searchQuery.toLowerCase()) ||
               faq.answer.toLowerCase().contains(_searchQuery.toLowerCase());
      }).toList();
      return _FAQCategory(
        id: category.id,
        title: category.title,
        icon: category.icon,
        color: category.color,
        faqs: filteredFaqs,
      );
    }).where((c) => c.faqs.isNotEmpty).toList();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Help Centre')),
      drawer: const AppDrawer(),
      body: Column(
        children: [
          // Header & Search
          Container(
            padding: const EdgeInsets.all(20),
            color: AppTheme.muted,
            child: Column(
              children: [
                Icon(Icons.help_outline, size: 40, color: AppTheme.primary),
                const SizedBox(height: 12),
                Text(
                  'How can we help you?',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'Search for help...',
                    prefixIcon: const Icon(Icons.search),
                    suffixIcon: _searchQuery.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear),
                            onPressed: () {
                              _searchController.clear();
                              setState(() => _searchQuery = '');
                            },
                          )
                        : null,
                    filled: true,
                    fillColor: Colors.white,
                  ),
                  onChanged: (v) => setState(() => _searchQuery = v),
                ),
                if (_searchQuery.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text(
                      '${_filteredCategories.fold<int>(0, (sum, c) => sum + c.faqs.length)} results found',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ),
              ],
            ),
          ),

          // FAQ List
          Expanded(
            child: _filteredCategories.isEmpty
                ? _buildNoResults()
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _filteredCategories.length + 2, // +2 for guidelines and contact
                    itemBuilder: (context, index) {
                      if (index < _filteredCategories.length) {
                        return _buildCategoryCard(_filteredCategories[index]);
                      } else if (index == _filteredCategories.length) {
                        return _buildGuidelinesCard();
                      } else {
                        return _buildContactCard();
                      }
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildNoResults() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.search_off, size: 64, color: AppTheme.mutedForeground),
          const SizedBox(height: 16),
          Text('No results found', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          Text('Try different keywords', style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 16),
          OutlinedButton(
            onPressed: () {
              _searchController.clear();
              setState(() => _searchQuery = '');
            },
            child: const Text('Clear Search'),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryCard(_FAQCategory category) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          leading: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: category.color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(category.icon, color: category.color, size: 20),
          ),
          title: Text(category.title, style: Theme.of(context).textTheme.titleSmall),
          trailing: Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: AppTheme.muted,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              '${category.faqs.length}',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ),
          children: category.faqs.map((faq) => _FAQTile(faq: faq)).toList(),
        ),
      ),
    );
  }

  Widget _buildGuidelinesCard() {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      color: AppTheme.accent,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.info_outline, color: AppTheme.primary),
                const SizedBox(width: 8),
                Text('Important Guidelines', style: Theme.of(context).textTheme.titleSmall),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text("Do's", style: TextStyle(color: AppTheme.success, fontWeight: FontWeight.bold, fontSize: 12)),
                      const SizedBox(height: 8),
                      ...['Use valid documents', 'Good lighting for photos', 'Accurate information', 'Save application ID'].map(
                        (t) => _GuidelineItem(text: t, isPositive: true),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text("Don'ts", style: TextStyle(color: AppTheme.destructive, fontWeight: FontWeight.bold, fontSize: 12)),
                      const SizedBox(height: 8),
                      ...['Blurry documents', 'Expired documents', 'Share credentials', 'False information'].map(
                        (t) => _GuidelineItem(text: t, isPositive: false),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContactCard() {
    return Card(
      margin: const EdgeInsets.only(bottom: 20),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Text('Contact Us', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _ContactChip(
                    icon: Icons.phone,
                    label: 'Helpline',
                    value: '1800-XXX-XXXX',
                    color: Colors.green,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _ContactChip(
                    icon: Icons.email,
                    label: 'Email',
                    value: 'support@nivp.gov.in',
                    color: Colors.blue,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Icon(Icons.access_time, size: 16, color: AppTheme.mutedForeground),
                const SizedBox(width: 8),
                Text(
                  'Mon-Sat, 9:00 AM - 6:00 PM',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _FAQCategory {
  final String id;
  final String title;
  final IconData icon;
  final Color color;
  final List<_FAQ> faqs;

  _FAQCategory({
    required this.id,
    required this.title,
    required this.icon,
    required this.color,
    required this.faqs,
  });
}

class _FAQ {
  final String question;
  final String answer;

  _FAQ(this.question, this.answer);
}

class _FAQTile extends StatelessWidget {
  final _FAQ faq;

  const _FAQTile({required this.faq});

  @override
  Widget build(BuildContext context) {
    return ExpansionTile(
      title: Text(faq.question, style: Theme.of(context).textTheme.bodyMedium),
      tilePadding: const EdgeInsets.symmetric(horizontal: 16),
      childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      children: [
        Text(faq.answer, style: Theme.of(context).textTheme.bodySmall),
      ],
    );
  }
}

class _GuidelineItem extends StatelessWidget {
  final String text;
  final bool isPositive;

  const _GuidelineItem({required this.text, required this.isPositive});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        children: [
          Icon(
            isPositive ? Icons.check_circle : Icons.cancel,
            size: 14,
            color: isPositive ? AppTheme.success : AppTheme.destructive,
          ),
          const SizedBox(width: 6),
          Expanded(
            child: Text(text, style: Theme.of(context).textTheme.bodySmall),
          ),
        ],
      ),
    );
  }
}

class _ContactChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _ContactChip({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 4),
          Text(label, style: Theme.of(context).textTheme.bodySmall),
          Text(
            value,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(fontWeight: FontWeight.bold),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}