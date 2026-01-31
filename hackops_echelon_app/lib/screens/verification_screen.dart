import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../widgets/custom_app_bar.dart';

class VerificationScreen extends StatefulWidget {
  const VerificationScreen({super.key});

  @override
  State<VerificationScreen> createState() => _VerificationScreenState();
}

class _VerificationScreenState extends State<VerificationScreen> {
  int _currentStep = 0;
  final _formKey = GlobalKey<FormState>();

  // Form controllers
  final _fullNameController = TextEditingController();
  final _aadharController = TextEditingController();
  final _panController = TextEditingController();
  final _addressController = TextEditingController();
  final _phoneController = TextEditingController();

  @override
  void dispose() {
    _fullNameController.dispose();
    _aadharController.dispose();
    _panController.dispose();
    _addressController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const CustomAppBar(showBackButton: true),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Center(
          child: Container(
            constraints: const BoxConstraints(maxWidth: 800),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Identity Verification',
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
                const SizedBox(height: 8),
                Text(
                  'Complete the verification process by providing the required information.',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppTheme.mutedForeground,
                      ),
                ),
                const SizedBox(height: 32),
                _buildStepper(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStepper() {
    return Stepper(
      currentStep: _currentStep,
      onStepContinue: () {
        if (_currentStep < 3) {
          setState(() => _currentStep++);
        } else {
          _submitVerification();
        }
      },
      onStepCancel: () {
        if (_currentStep > 0) {
          setState(() => _currentStep--);
        }
      },
      controlsBuilder: (context, details) {
        return Padding(
          padding: const EdgeInsets.only(top: 24),
          child: Row(
            children: [
              ElevatedButton(
                onPressed: details.onStepContinue,
                child: Text(_currentStep == 3 ? 'SUBMIT' : 'CONTINUE'),
              ),
              if (_currentStep > 0) ...[
                const SizedBox(width: 12),
                OutlinedButton(
                  onPressed: details.onStepCancel,
                  child: const Text('BACK'),
                ),
              ],
            ],
          ),
        );
      },
      steps: [
        Step(
          title: const Text('Personal Details'),
          subtitle: const Text('Basic information'),
          isActive: _currentStep >= 0,
          state: _currentStep > 0 ? StepState.complete : StepState.indexed,
          content: _buildPersonalDetailsForm(),
        ),
        Step(
          title: const Text('Document Upload'),
          subtitle: const Text('Identity documents'),
          isActive: _currentStep >= 1,
          state: _currentStep > 1 ? StepState.complete : StepState.indexed,
          content: _buildDocumentUploadForm(),
        ),
        Step(
          title: const Text('Biometric Verification'),
          subtitle: const Text('Face recognition'),
          isActive: _currentStep >= 2,
          state: _currentStep > 2 ? StepState.complete : StepState.indexed,
          content: _buildBiometricForm(),
        ),
        Step(
          title: const Text('Review & Submit'),
          subtitle: const Text('Confirm details'),
          isActive: _currentStep >= 3,
          state: StepState.indexed,
          content: _buildReviewForm(),
        ),
      ],
    );
  }

  Widget _buildPersonalDetailsForm() {
    return Form(
      key: _formKey,
      child: Column(
        children: [
          _buildFormField(
            controller: _fullNameController,
            label: 'Full Name (as per Aadhaar)',
            hint: 'Enter your full name',
            icon: Icons.person_outline,
          ),
          const SizedBox(height: 16),
          _buildFormField(
            controller: _aadharController,
            label: 'Aadhaar Number',
            hint: 'XXXX XXXX XXXX',
            icon: Icons.credit_card,
            keyboardType: TextInputType.number,
          ),
          const SizedBox(height: 16),
          _buildFormField(
            controller: _panController,
            label: 'PAN Number',
            hint: 'ABCDE1234F',
            icon: Icons.badge_outlined,
          ),
          const SizedBox(height: 16),
          _buildFormField(
            controller: _phoneController,
            label: 'Mobile Number',
            hint: '+91 XXXXX XXXXX',
            icon: Icons.phone_outlined,
            keyboardType: TextInputType.phone,
          ),
          const SizedBox(height: 16),
          _buildFormField(
            controller: _addressController,
            label: 'Address',
            hint: 'Enter your complete address',
            icon: Icons.location_on_outlined,
            maxLines: 3,
          ),
        ],
      ),
    );
  }

  Widget _buildDocumentUploadForm() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Please upload clear images of the following documents:',
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        const SizedBox(height: 24),
        _DocumentUploadCard(
          title: 'Aadhaar Card',
          subtitle: 'Front and back side',
          icon: Icons.credit_card,
        ),
        const SizedBox(height: 16),
        _DocumentUploadCard(
          title: 'PAN Card',
          subtitle: 'Front side only',
          icon: Icons.badge_outlined,
        ),
        const SizedBox(height: 16),
        _DocumentUploadCard(
          title: 'Passport Photo',
          subtitle: 'Recent photograph',
          icon: Icons.photo_camera_outlined,
        ),
      ],
    );
  }

  Widget _buildBiometricForm() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Complete biometric verification by taking a live photo:',
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        const SizedBox(height: 24),
        Container(
          width: double.infinity,
          height: 300,
          decoration: BoxDecoration(
            color: AppTheme.muted,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: AppTheme.border),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: AppTheme.accent,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.face,
                  size: 64,
                  color: AppTheme.primary,
                ),
              ),
              const SizedBox(height: 24),
              Text(
                'Position your face within the frame',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: () {},
                icon: const Icon(Icons.camera_alt),
                label: const Text('CAPTURE PHOTO'),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppTheme.accent.withOpacity(0.5),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: AppTheme.secondary.withOpacity(0.3)),
          ),
          child: Row(
            children: [
              Icon(Icons.info_outline, color: AppTheme.secondary),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'Ensure good lighting and remove any accessories covering your face.',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildReviewForm() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Please review your information before submitting:',
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        const SizedBox(height: 24),
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: AppTheme.card,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: AppTheme.border),
          ),
          child: Column(
            children: [
              _ReviewItem(label: 'Full Name', value: _fullNameController.text.isEmpty ? 'Not provided' : _fullNameController.text),
              _ReviewItem(label: 'Aadhaar Number', value: _aadharController.text.isEmpty ? 'Not provided' : _aadharController.text),
              _ReviewItem(label: 'PAN Number', value: _panController.text.isEmpty ? 'Not provided' : _panController.text),
              _ReviewItem(label: 'Mobile Number', value: _phoneController.text.isEmpty ? 'Not provided' : _phoneController.text),
              _ReviewItem(label: 'Address', value: _addressController.text.isEmpty ? 'Not provided' : _addressController.text),
              _ReviewItem(label: 'Documents', value: 'Uploaded'),
              _ReviewItem(label: 'Biometric', value: 'Captured', isLast: true),
            ],
          ),
        ),
        const SizedBox(height: 24),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppTheme.primary.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: AppTheme.primary.withOpacity(0.3)),
          ),
          child: Row(
            children: [
              Checkbox(
                value: true,
                onChanged: (value) {},
                activeColor: AppTheme.primary,
              ),
              Expanded(
                child: Text(
                  'I confirm that all the information provided is accurate and complete.',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildFormField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required IconData icon,
    TextInputType keyboardType = TextInputType.text,
    int maxLines = 1,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.w500,
              ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          maxLines: maxLines,
          decoration: InputDecoration(
            hintText: hint,
            prefixIcon: Icon(icon, size: 20),
          ),
        ),
      ],
    );
  }

  void _submitVerification() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        title: Row(
          children: [
            Icon(Icons.check_circle, color: AppTheme.secondary),
            const SizedBox(width: 12),
            const Text('Verification Submitted'),
          ],
        ),
        content: const Text(
          'Your verification request has been submitted successfully. You will receive a confirmation within 2-3 business days.',
        ),
        actions: [
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.pop(context);
            },
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }
}

class _DocumentUploadCard extends StatefulWidget {
  final String title;
  final String subtitle;
  final IconData icon;

  const _DocumentUploadCard({
    required this.title,
    required this.subtitle,
    required this.icon,
  });

  @override
  State<_DocumentUploadCard> createState() => _DocumentUploadCardState();
}

class _DocumentUploadCardState extends State<_DocumentUploadCard> {
  bool _isUploaded = false;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _isUploaded ? AppTheme.accent : AppTheme.card,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: _isUploaded ? AppTheme.secondary : AppTheme.border,
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: _isUploaded
                  ? AppTheme.secondary.withOpacity(0.1)
                  : AppTheme.muted,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              _isUploaded ? Icons.check : widget.icon,
              color: _isUploaded ? AppTheme.secondary : AppTheme.mutedForeground,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.title,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                ),
                Text(
                  widget.subtitle,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
          OutlinedButton(
            onPressed: () => setState(() => _isUploaded = !_isUploaded),
            child: Text(_isUploaded ? 'CHANGE' : 'UPLOAD'),
          ),
        ],
      ),
    );
  }
}

class _ReviewItem extends StatelessWidget {
  final String label;
  final String value;
  final bool isLast;

  const _ReviewItem({
    required this.label,
    required this.value,
    this.isLast = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        border: isLast
            ? null
            : Border(bottom: BorderSide(color: AppTheme.border)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall,
          ),
          Flexible(
            child: Text(
              value,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
              textAlign: TextAlign.end,
            ),
          ),
        ],
      ),
    );
  }
}