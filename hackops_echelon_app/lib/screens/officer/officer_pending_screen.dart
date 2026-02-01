import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../theme/app_theme.dart';
import '../../services/api_service.dart';

class OfficerPendingScreen extends StatefulWidget {
  const OfficerPendingScreen({super.key});

  @override
  State<OfficerPendingScreen> createState() => _OfficerPendingScreenState();
}

class _OfficerPendingScreenState extends State<OfficerPendingScreen> {
  bool _isLoading = true;
  List<dynamic> _applications = [];
  String _filter = 'under_officer_review';

  @override
  void initState() {
    super.initState();
    _fetchApplications();
  }

  Future<void> _fetchApplications() async {
    setState(() => _isLoading = true);
    try {
      final result = await ApiService.getOfficerApplications(
        status: _filter == 'all' ? null : _filter,
        limit: 50,
      );
      setState(() {
        _applications = result['applications'] ?? [];
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Applications'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _fetchApplications),
        ],
      ),
      body: Column(
        children: [
          // Filter Chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                _FilterChip(
                  label: 'Pending Review',
                  isSelected: _filter == 'under_officer_review',
                  onTap: () {
                    setState(() => _filter = 'under_officer_review');
                    _fetchApplications();
                  },
                ),
                _FilterChip(
                  label: 'AI Processing',
                  isSelected: _filter == 'under_automated_verification',
                  onTap: () {
                    setState(() => _filter = 'under_automated_verification');
                    _fetchApplications();
                  },
                ),
                _FilterChip(
                  label: 'Approved',
                  isSelected: _filter == 'approved',
                  onTap: () {
                    setState(() => _filter = 'approved');
                    _fetchApplications();
                  },
                ),
                _FilterChip(
                  label: 'Rejected',
                  isSelected: _filter == 'rejected',
                  onTap: () {
                    setState(() => _filter = 'rejected');
                    _fetchApplications();
                  },
                ),
                _FilterChip(
                  label: 'All',
                  isSelected: _filter == 'all',
                  onTap: () {
                    setState(() => _filter = 'all');
                    _fetchApplications();
                  },
                ),
              ],
            ),
          ),
          
          // Applications List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _applications.isEmpty
                    ? _buildEmptyState()
                    : RefreshIndicator(
                        onRefresh: _fetchApplications,
                        child: ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          itemCount: _applications.length,
                          itemBuilder: (context, index) {
                            return _ApplicationListItem(
                              application: _applications[index],
                              onTap: () => Navigator.pushNamed(
                                context,
                                '/officer/review/${_applications[index]['_id']}',
                              ),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.inbox, size: 64, color: AppTheme.mutedForeground),
          const SizedBox(height: 16),
          Text('No applications found', style: Theme.of(context).textTheme.titleMedium),
          Text('Try changing the filter', style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _FilterChip({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        label: Text(label),
        selected: isSelected,
        onSelected: (_) => onTap(),
        selectedColor: AppTheme.primary.withOpacity(0.2),
        checkmarkColor: AppTheme.primary,
      ),
    );
  }
}

class _ApplicationListItem extends StatelessWidget {
  final Map<String, dynamic> application;
  final VoidCallback onTap;

  const _ApplicationListItem({required this.application, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final status = application['status'] ?? 'unknown';
    final riskScore = application['behaviorAnalysis']?['riskScore'] ?? 
                      application['behaviorSummary']?['botLikelihood'] ?? 0;
    
    final statusConfig = _getStatusConfig(status);
    final riskColor = riskScore >= 70 ? Colors.red : riskScore >= 40 ? Colors.orange : Colors.green;

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  CircleAvatar(
                    backgroundColor: AppTheme.primary.withOpacity(0.1),
                    child: Text(
                      (application['fullName'] ?? 'U')[0].toUpperCase(),
                      style: TextStyle(color: AppTheme.primary, fontWeight: FontWeight.bold),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          application['fullName'] ?? 'Unknown',
                          style: Theme.of(context).textTheme.titleSmall,
                        ),
                        Text(
                          'ID: ${(application['_id'] ?? '').toString().substring(application['_id'].toString().length - 6).toUpperCase()}',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(fontFamily: 'monospace'),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: statusConfig['color'].withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      statusConfig['label'],
                      style: TextStyle(
                        color: statusConfig['color'],
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  _InfoChip(
                    icon: Icons.location_on,
                    label: '${application['city'] ?? ''}, ${application['state'] ?? ''}',
                  ),
                  const SizedBox(width: 12),
                  _InfoChip(
                    icon: Icons.warning_amber,
                    label: 'Risk: $riskScore',
                    color: riskColor,
                  ),
                  const Spacer(),
                  if (application['submittedAt'] != null)
                    Text(
                      _formatDate(application['submittedAt']),
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Map<String, dynamic> _getStatusConfig(String status) {
    switch (status) {
      case 'approved':
        return {'label': 'Approved', 'color': AppTheme.success};
      case 'rejected':
        return {'label': 'Rejected', 'color': AppTheme.destructive};
      case 'under_officer_review':
        return {'label': 'Pending', 'color': Colors.orange};
      case 'under_automated_verification':
        return {'label': 'AI Check', 'color': Colors.purple};
      case 'submitted':
        return {'label': 'Submitted', 'color': Colors.blue};
      default:
        return {'label': status, 'color': AppTheme.mutedForeground};
    }
  }

  String _formatDate(dynamic date) {
    try {
      final dateTime = DateTime.parse(date.toString());
      return DateFormat('dd MMM').format(dateTime);
    } catch (e) {
      return '';
    }
  }
}

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color? color;

  const _InfoChip({required this.icon, required this.label, this.color});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: color ?? AppTheme.mutedForeground),
        const SizedBox(width: 4),
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: color,
                fontWeight: color != null ? FontWeight.bold : null,
              ),
        ),
      ],
    );
  }
}