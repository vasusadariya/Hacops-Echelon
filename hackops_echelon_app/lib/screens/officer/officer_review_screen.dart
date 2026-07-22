import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import '../../theme/app_theme.dart';
import '../../services/api_service.dart';

class OfficerReviewScreen extends StatefulWidget {
  final String applicationId;

  const OfficerReviewScreen({super.key, required this.applicationId});

  @override
  State<OfficerReviewScreen> createState() => _OfficerReviewScreenState();
}

class _OfficerReviewScreenState extends State<OfficerReviewScreen> {
  bool _isLoading = true;
  bool _isSubmitting = false;
  Map<String, dynamic>? _application;
  final _remarksController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchApplication();
  }

  @override
  void dispose() {
    _remarksController.dispose();
    super.dispose();
  }

  Future<void> _fetchApplication() async {
    setState(() => _isLoading = true);
    try {
      final result = await ApiService.getApplicationById(widget.applicationId);
      setState(() {
        _application = result['application'] ?? result;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _handleAction(String action) async {
    if (action == 'reject' && _remarksController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please provide rejection reason')),
      );
      return;
    }

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('${action == 'approve' ? 'Approve' : 'Reject'} Application'),
        content: Text('Are you sure you want to ${action} this application?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: action == 'approve' ? AppTheme.success : AppTheme.destructive,
            ),
            child: Text(action == 'approve' ? 'Approve' : 'Reject'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() => _isSubmitting = true);
    try {
      final result = await ApiService.reviewApplication(
        widget.applicationId,
        action,
        _remarksController.text,
      );

      if (result['success'] == true) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Application ${action}ed successfully'),
              backgroundColor: AppTheme.success,
            ),
          );
          Navigator.pop(context);
        }
      } else {
        throw Exception(result['error']);
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: AppTheme.destructive),
      );
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Review Application'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _fetchApplication),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _application == null
              ? const Center(child: Text('Application not found'))
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildApplicantCard(),
                      const SizedBox(height: 16),
                      _buildBehaviorAnalysisCard(),
                      const SizedBox(height: 16),
                      _buildAIVerificationCard(),
                      const SizedBox(height: 16),
                      _buildDocumentsCard(),
                      const SizedBox(height: 16),
                      _buildFaceCapturesCard(),
                      const SizedBox(height: 16),
                      _buildAddressCard(),
                      const SizedBox(height: 16),
                      if (_application!['status'] == 'under_officer_review')
                        _buildActionCard(),
                    ],
                  ),
                ),
    );
  }

  Widget _buildApplicantCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 30,
                  backgroundColor: AppTheme.primary.withOpacity(0.1),
                  child: Text(
                    (_application!['fullName'] ?? 'U')[0].toUpperCase(),
                    style: TextStyle(
                      color: AppTheme.primary,
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _application!['fullName'] ?? 'Unknown',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      Text(
                        'Gender: ${_application!['gender'] ?? '-'}',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                      Text(
                        'Mobile: ${_application!['mobileNumber'] ?? '-'}',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const Divider(height: 24),
            _DetailRow(
              label: 'Application ID',
              value: _application!['_id']?.toString().substring(_application!['_id'].toString().length - 8).toUpperCase() ?? '-',
              isCode: true,
            ),
            _DetailRow(
              label: 'Submitted',
              value: _formatDate(_application!['submittedAt']),
            ),
            _DetailRow(
              label: 'Status',
              value: _application!['status'] ?? '-',
              valueColor: _getStatusColor(_application!['status']),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBehaviorAnalysisCard() {
    final behavior = _application!['behaviorSummary'] ?? _application!['behaviorAnalysis'] ?? {};
    final trustScore = behavior['overallTrustScore'] ?? 50;
    final botLikelihood = behavior['botLikelihood'] ?? 50;
    final riskLevel = behavior['riskLevel'] ?? 'medium';
    final isHuman = behavior['isHuman'] ?? true;

    final riskColor = riskLevel == 'low' ? AppTheme.success
        : riskLevel == 'medium' ? Colors.orange
        : riskLevel == 'high' ? Colors.deepOrange
        : AppTheme.destructive;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.psychology, color: AppTheme.primary),
                const SizedBox(width: 8),
                Text('Behavioral Analysis', style: Theme.of(context).textTheme.titleMedium),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _ScoreCard(
                    label: 'Trust Score',
                    value: trustScore,
                    color: trustScore >= 60 ? AppTheme.success : trustScore >= 40 ? Colors.orange : AppTheme.destructive,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _ScoreCard(
                    label: 'Bot Likelihood',
                    value: botLikelihood,
                    color: botLikelihood <= 40 ? AppTheme.success : botLikelihood <= 60 ? Colors.orange : AppTheme.destructive,
                    isInverse: true,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: riskColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Column(
                      children: [
                        Icon(Icons.warning_amber, color: riskColor),
                        const SizedBox(height: 4),
                        Text(
                          riskLevel.toUpperCase(),
                          style: TextStyle(color: riskColor, fontWeight: FontWeight.bold),
                        ),
                        Text('Risk Level', style: Theme.of(context).textTheme.bodySmall),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: (isHuman ? AppTheme.success : AppTheme.destructive).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Column(
                      children: [
                        Icon(
                          isHuman ? Icons.person : Icons.smart_toy,
                          color: isHuman ? AppTheme.success : AppTheme.destructive,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          isHuman ? 'HUMAN' : 'BOT',
                          style: TextStyle(
                            color: isHuman ? AppTheme.success : AppTheme.destructive,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text('Detection', style: Theme.of(context).textTheme.bodySmall),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAIVerificationCard() {
    // aiVerificationResults is only the flat summary (overallScore/riskLevel/decision/...).
    // The nested per-check results (face/PAN/Aadhaar) live under verificationResults,
    // which is what GET /api/officer/applications/[id] actually returns them under.
    final aiResults = _application!['aiVerificationResults'] ?? {};
    final verificationResults = _application!['verificationResults'] ?? {};
    final faceVerification = verificationResults['faceVerification'] ?? {};
    final manipulationPan = verificationResults['manipulationDetection']?['panCard'] ?? {};
    final manipulationAadhaar = verificationResults['manipulationDetection']?['aadhaarCard'] ?? {};

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.memory, color: Colors.purple),
                const SizedBox(width: 8),
                Text('AI Verification Results', style: Theme.of(context).textTheme.titleMedium),
              ],
            ),
            const SizedBox(height: 16),
            _AIResultRow(
              title: 'Face Verification',
              result: faceVerification['result']?['decision'] ?? '-',
              isPass: faceVerification['result']?['decision'] == 'PASS',
            ),
            _AIResultRow(
              title: 'PAN Card Authenticity',
              result: manipulationPan['result']?['prediction'] ?? '-',
              isPass: manipulationPan['result']?['is_authentic'] == true,
            ),
            _AIResultRow(
              title: 'Aadhaar Authenticity',
              result: manipulationAadhaar['result']?['prediction'] ?? '-',
              isPass: manipulationAadhaar['result']?['is_authentic'] == true,
            ),
            if (aiResults['overallScore'] != null) ...[
              const Divider(),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Overall AI Score', style: Theme.of(context).textTheme.titleSmall),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: (aiResults['overallScore'] >= 70 ? AppTheme.success : Colors.orange).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '${aiResults['overallScore']}%',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: aiResults['overallScore'] >= 70 ? AppTheme.success : Colors.orange,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildDocumentsCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.description, color: AppTheme.primary),
                const SizedBox(width: 8),
                Text('Documents', style: Theme.of(context).textTheme.titleMedium),
              ],
            ),
            const SizedBox(height: 16),
            if (_application!['aadhaarCardImage']?['secureUrl'] != null)
              _DocumentImage(
                title: 'Aadhaar Card',
                imageUrl: _application!['aadhaarCardImage']['secureUrl'],
              ),
            const SizedBox(height: 12),
            if (_application!['panCardImage']?['secureUrl'] != null)
              _DocumentImage(
                title: 'PAN Card',
                imageUrl: _application!['panCardImage']['secureUrl'],
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildFaceCapturesCard() {
    final selfies = _application!['biometricSelfies'] ?? {};
    final angles = ['front', 'left', 'right', 'up'];

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.face, color: AppTheme.primary),
                const SizedBox(width: 8),
                Text('Face Captures', style: Theme.of(context).textTheme.titleMedium),
              ],
            ),
            const SizedBox(height: 16),
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 4,
              crossAxisSpacing: 8,
              mainAxisSpacing: 8,
              children: angles.map((angle) {
                final url = selfies[angle]?['secureUrl'];
                return Column(
                  children: [
                    Expanded(
                      child: Container(
                        decoration: BoxDecoration(
                          color: AppTheme.muted,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        clipBehavior: Clip.antiAlias,
                        child: url != null
                            ? CachedNetworkImage(
                                imageUrl: url,
                                fit: BoxFit.cover,
                                placeholder: (_, __) => const Center(child: CircularProgressIndicator(strokeWidth: 2)),
                                errorWidget: (_, __, ___) => const Icon(Icons.error),
                              )
                            : const Icon(Icons.image_not_supported),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(angle.toUpperCase(), style: const TextStyle(fontSize: 9)),
                  ],
                );
              }).toList(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAddressCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.location_on, color: AppTheme.primary),
                const SizedBox(width: 8),
                Text('Address', style: Theme.of(context).textTheme.titleMedium),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              '${_application!['addressLine1'] ?? ''}\n'
              '${_application!['addressLine2'] ?? ''}\n'
              '${_application!['city'] ?? ''}, ${_application!['taluka'] ?? ''}\n'
              '${_application!['district'] ?? ''}, ${_application!['state'] ?? ''}\n'
              'PIN: ${_application!['pincode'] ?? ''}',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionCard() {
    return Card(
      color: AppTheme.accent,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Officer Action', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 12),
            TextField(
              controller: _remarksController,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'Remarks (required for rejection)',
                hintText: 'Enter your remarks...',
                filled: true,
                fillColor: Colors.white,
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _isSubmitting ? null : () => _handleAction('reject'),
                    icon: const Icon(Icons.cancel, color: Colors.red),
                    label: const Text('Reject', style: TextStyle(color: Colors.red)),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Colors.red),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _isSubmitting ? null : () => _handleAction('approve'),
                    icon: _isSubmitting
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : const Icon(Icons.check_circle),
                    label: const Text('Approve'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.success,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(dynamic date) {
    if (date == null) return '-';
    try {
      return DateFormat('dd MMM yyyy, hh:mm a').format(DateTime.parse(date.toString()));
    } catch (e) {
      return date.toString();
    }
  }

  Color _getStatusColor(String? status) {
    switch (status) {
      case 'approved':
        return AppTheme.success;
      case 'rejected':
        return AppTheme.destructive;
      case 'under_officer_review':
        return Colors.orange;
      default:
        return AppTheme.mutedForeground;
    }
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;
  final bool isCode;

  const _DetailRow({
    required this.label,
    required this.value,
    this.valueColor,
    this.isCode = false,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: Theme.of(context).textTheme.bodySmall),
          Text(
            value,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: valueColor,
                  fontFamily: isCode ? 'monospace' : null,
                  fontWeight: valueColor != null ? FontWeight.bold : null,
                ),
          ),
        ],
      ),
    );
  }
}

class _ScoreCard extends StatelessWidget {
  final String label;
  final int value;
  final Color color;
  final bool isInverse;

  const _ScoreCard({
    required this.label,
    required this.value,
    required this.color,
    this.isInverse = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          Text(
            '$value%',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(height: 4),
          Text(label, style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 8),
          LinearProgressIndicator(
            value: value / 100,
            backgroundColor: color.withOpacity(0.2),
            valueColor: AlwaysStoppedAnimation(color),
          ),
        ],
      ),
    );
  }
}

class _AIResultRow extends StatelessWidget {
  final String title;
  final String result;
  final bool isPass;

  const _AIResultRow({
    required this.title,
    required this.result,
    required this.isPass,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(title, style: Theme.of(context).textTheme.bodyMedium),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: (isPass ? AppTheme.success : AppTheme.destructive).withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  isPass ? Icons.check_circle : Icons.cancel,
                  size: 14,
                  color: isPass ? AppTheme.success : AppTheme.destructive,
                ),
                const SizedBox(width: 4),
                Text(
                  result,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: isPass ? AppTheme.success : AppTheme.destructive,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _DocumentImage extends StatelessWidget {
  final String title;
  final String imageUrl;

  const _DocumentImage({required this.title, required this.imageUrl});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: Theme.of(context).textTheme.titleSmall),
        const SizedBox(height: 8),
        ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: CachedNetworkImage(
            imageUrl: imageUrl,
            height: 150,
            width: double.infinity,
            fit: BoxFit.cover,
            placeholder: (_, __) => Container(
              height: 150,
              color: AppTheme.muted,
              child: const Center(child: CircularProgressIndicator()),
            ),
            errorWidget: (_, __, ___) => Container(
              height: 150,
              color: AppTheme.muted,
              child: const Icon(Icons.broken_image, size: 48),
            ),
          ),
        ),
      ],
    );
  }
}