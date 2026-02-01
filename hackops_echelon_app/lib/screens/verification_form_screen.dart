import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../theme/app_theme.dart';
import '../providers/auth_provider.dart';
import '../providers/verification_provider.dart';
import '../utils/indian_states.dart';

class VerificationFormScreen extends StatefulWidget {
  const VerificationFormScreen({super.key});

  @override
  State<VerificationFormScreen> createState() => _VerificationFormScreenState();
}

class _VerificationFormScreenState extends State<VerificationFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _pageController = PageController();
  int _currentStep = 0;
  bool _isSubmitting = false;

  // Form Controllers
  final _fullNameController = TextEditingController();
  final _addressLine1Controller = TextEditingController();
  final _addressLine2Controller = TextEditingController();
  final _cityController = TextEditingController();
  final _talukaController = TextEditingController();
  final _districtController = TextEditingController();
  final _pincodeController = TextEditingController();
  final _mobileController = TextEditingController();

  String? _selectedGender;
  String? _selectedState;

  // Files
  File? _aadhaarCard;
  File? _panCard;
  Map<String, File> _faceCaptures = {};

  final _picker = ImagePicker();

  @override
  void dispose() {
    _pageController.dispose();
    _fullNameController.dispose();
    _addressLine1Controller.dispose();
    _addressLine2Controller.dispose();
    _cityController.dispose();
    _talukaController.dispose();
    _districtController.dispose();
    _pincodeController.dispose();
    _mobileController.dispose();
    super.dispose();
  }

  Future<void> _pickImage(String type) async {
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      builder: (context) => SafeArea(
        child: Wrap(
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt),
              title: const Text('Camera'),
              onTap: () => Navigator.pop(context, ImageSource.camera),
            ),
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: const Text('Gallery'),
              onTap: () => Navigator.pop(context, ImageSource.gallery),
            ),
          ],
        ),
      ),
    );

    if (source == null) return;

    try {
      final pickedFile = await _picker.pickImage(
        source: source,
        maxWidth: 1920,
        maxHeight: 1080,
        imageQuality: 85,
      );

      if (pickedFile != null) {
        setState(() {
          if (type == 'aadhaar') {
            _aadhaarCard = File(pickedFile.path);
          } else if (type == 'pan') {
            _panCard = File(pickedFile.path);
          } else if (type.startsWith('face_')) {
            _faceCaptures[type.replaceFirst('face_', '')] = File(pickedFile.path);
          }
        });
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to pick image: $e')),
      );
    }
  }

  Future<void> _captureFace(String angle) async {
    try {
      final pickedFile = await _picker.pickImage(
        source: ImageSource.camera,
        preferredCameraDevice: CameraDevice.front,
        maxWidth: 1080,
        maxHeight: 1080,
        imageQuality: 90,
      );

      if (pickedFile != null) {
        setState(() {
          _faceCaptures[angle] = File(pickedFile.path);
        });
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to capture: $e')),
      );
    }
  }

  bool _validateCurrentStep() {
    switch (_currentStep) {
      case 0: // Personal Info
        return _fullNameController.text.length >= 3 && _selectedGender != null;
      case 1: // Documents
        return _aadhaarCard != null && _panCard != null;
      case 2: // Address
        return _addressLine1Controller.text.length >= 10 &&
            _cityController.text.isNotEmpty &&
            _talukaController.text.isNotEmpty &&
            _districtController.text.isNotEmpty &&
            _selectedState != null &&
            _pincodeController.text.length == 6;
      case 3: // Contact
        return _mobileController.text.length == 10;
      case 4: // Face Capture
        return _faceCaptures.length == 4;
      default:
        return true;
    }
  }

  void _nextStep() {
    if (!_validateCurrentStep()) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please complete all required fields')),
      );
      return;
    }

    if (_currentStep < 4) {
      setState(() => _currentStep++);
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    } else {
      _submitForm();
    }
  }

  void _prevStep() {
    if (_currentStep > 0) {
      setState(() => _currentStep--);
      _pageController.previousPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  Future<void> _submitForm() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);

    try {
      final formData = {
        'fullName': _fullNameController.text.trim(),
        'gender': _selectedGender!,
        'addressLine1': _addressLine1Controller.text.trim(),
        'addressLine2': _addressLine2Controller.text.trim(),
        'city': _cityController.text.trim(),
        'taluka': _talukaController.text.trim(),
        'district': _districtController.text.trim(),
        'state': _selectedState!,
        'pincode': _pincodeController.text.trim(),
        'mobileNumber': _mobileController.text.trim(),
      };

      // Convert face captures to base64 for API
      final faceBase64 = <String, String>{};
      for (var entry in _faceCaptures.entries) {
        final bytes = await entry.value.readAsBytes();
        faceBase64[entry.key] = 'data:image/jpeg;base64,${base64Encode(bytes)}';
      }

      final result = await context.read<VerificationProvider>().submitVerification(
        formData: formData,
        aadhaarCard: _aadhaarCard!,
        panCard: _panCard!,
        faceCaptures: faceBase64,
        behaviorData: {'source': 'mobile_app'},
      );

      if (!mounted) return;

      if (result['success'] == true) {
        Navigator.pushReplacementNamed(context, '/verification/status');
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['error'] ?? 'Submission failed'),
            backgroundColor: AppTheme.destructive,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: $e'),
          backgroundColor: AppTheme.destructive,
        ),
      );
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Verification Form'),
      ),
      body: Form(
        key: _formKey,
        child: Column(
          children: [
            // Progress Indicator
            _buildProgressIndicator(),

            // Form Pages
            Expanded(
              child: PageView(
                controller: _pageController,
                physics: const NeverScrollableScrollPhysics(),
                children: [
                  _buildPersonalInfoStep(),
                  _buildDocumentsStep(),
                  _buildAddressStep(),
                  _buildContactStep(),
                  _buildFaceCaptureStep(),
                ],
              ),
            ),

            // Navigation Buttons
            _buildNavigationButtons(),
          ],
        ),
      ),
    );
  }

  Widget _buildProgressIndicator() {
    final steps = ['Personal', 'Documents', 'Address', 'Contact', 'Face'];
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
      child: Row(
        children: steps.asMap().entries.map((entry) {
          final index = entry.key;
          final isActive = index <= _currentStep;
          final isCompleted = index < _currentStep;

          return Expanded(
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    children: [
                      Container(
                        width: 28,
                        height: 28,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: isActive ? AppTheme.primary : AppTheme.muted,
                        ),
                        child: Center(
                          child: isCompleted
                              ? const Icon(Icons.check, size: 16, color: Colors.white)
                              : Text(
                                  '${index + 1}',
                                  style: TextStyle(
                                    color: isActive ? Colors.white : AppTheme.mutedForeground,
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        entry.value,
                        style: TextStyle(
                          fontSize: 10,
                          color: isActive ? AppTheme.foreground : AppTheme.mutedForeground,
                        ),
                      ),
                    ],
                  ),
                ),
                if (index < steps.length - 1)
                  Expanded(
                    child: Container(
                      height: 2,
                      color: index < _currentStep ? AppTheme.primary : AppTheme.border,
                    ),
                  ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildPersonalInfoStep() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionTitle('Personal Information', Icons.person),
          const SizedBox(height: 20),
          TextFormField(
            controller: _fullNameController,
            decoration: const InputDecoration(
              labelText: 'Full Name *',
              prefixIcon: Icon(Icons.person_outline),
            ),
            validator: (v) => v!.length < 3 ? 'Enter valid name' : null,
          ),
          const SizedBox(height: 16),
          Text('Gender *', style: Theme.of(context).textTheme.titleSmall),
          const SizedBox(height: 8),
          Row(
            children: ['male', 'female', 'other'].map((g) {
              return Expanded(
                child: RadioListTile<String>(
                  title: Text(g[0].toUpperCase() + g.substring(1), style: const TextStyle(fontSize: 14)),
                  value: g,
                  groupValue: _selectedGender,
                  onChanged: (v) => setState(() => _selectedGender = v),
                  contentPadding: EdgeInsets.zero,
                  dense: true,
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildDocumentsStep() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionTitle('Identity Documents', Icons.description),
          const SizedBox(height: 20),
          _buildDocumentPicker(
            title: 'Aadhaar Card *',
            file: _aadhaarCard,
            onPick: () => _pickImage('aadhaar'),
            onRemove: () => setState(() => _aadhaarCard = null),
          ),
          const SizedBox(height: 20),
          _buildDocumentPicker(
            title: 'PAN Card *',
            file: _panCard,
            onPick: () => _pickImage('pan'),
            onRemove: () => setState(() => _panCard = null),
          ),
        ],
      ),
    );
  }

  Widget _buildAddressStep() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionTitle('Address Information', Icons.location_on),
          const SizedBox(height: 20),
          TextFormField(
            controller: _addressLine1Controller,
            decoration: const InputDecoration(
              labelText: 'Address Line 1 *',
              hintText: 'House/Flat No., Building, Street',
            ),
            validator: (v) => v!.length < 10 ? 'Enter complete address' : null,
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _addressLine2Controller,
            decoration: const InputDecoration(
              labelText: 'Address Line 2',
              hintText: 'Landmark, Area',
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: TextFormField(
                  controller: _cityController,
                  decoration: const InputDecoration(labelText: 'City *'),
                  validator: (v) => v!.isEmpty ? 'Required' : null,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: TextFormField(
                  controller: _talukaController,
                  decoration: const InputDecoration(labelText: 'Taluka *'),
                  validator: (v) => v!.isEmpty ? 'Required' : null,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: TextFormField(
                  controller: _districtController,
                  decoration: const InputDecoration(labelText: 'District *'),
                  validator: (v) => v!.isEmpty ? 'Required' : null,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: _selectedState,
                  decoration: const InputDecoration(labelText: 'State *'),
                  items: indianStates.map((s) => DropdownMenuItem(value: s, child: Text(s, style: const TextStyle(fontSize: 14)))).toList(),
                  onChanged: (v) => setState(() => _selectedState = v),
                  validator: (v) => v == null ? 'Required' : null,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _pincodeController,
            decoration: const InputDecoration(labelText: 'Pincode *'),
            keyboardType: TextInputType.number,
            maxLength: 6,
            validator: (v) => v!.length != 6 ? 'Enter 6-digit pincode' : null,
          ),
        ],
      ),
    );
  }

  Widget _buildContactStep() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionTitle('Contact Information', Icons.phone),
          const SizedBox(height: 20),
          TextFormField(
            controller: _mobileController,
            decoration: const InputDecoration(
              labelText: 'Mobile Number *',
              prefixText: '+91 ',
              prefixIcon: Icon(Icons.phone),
            ),
            keyboardType: TextInputType.phone,
            maxLength: 10,
            validator: (v) => v!.length != 10 ? 'Enter 10-digit number' : null,
          ),
        ],
      ),
    );
  }

  Widget _buildFaceCaptureStep() {
    final angles = ['front', 'left', 'right', 'up'];
    final labels = ['Look Straight', 'Turn Left', 'Turn Right', 'Look Up'];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionTitle('Face Verification', Icons.face),
          const SizedBox(height: 8),
          Text(
            'Capture your face from 4 different angles',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: 20),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 0.85,
            ),
            itemCount: angles.length,
            itemBuilder: (context, index) {
              final angle = angles[index];
              final label = labels[index];
              final file = _faceCaptures[angle];

              return _FaceCaptureCard(
                label: label,
                file: file,
                onCapture: () => _captureFace(angle),
                onRemove: () => setState(() => _faceCaptures.remove(angle)),
              );
            },
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppTheme.info.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                Icon(Icons.info_outline, color: AppTheme.info, size: 20),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Ensure good lighting and remove glasses for better verification',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppTheme.info),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, color: AppTheme.primary),
        const SizedBox(width: 8),
        Text(title, style: Theme.of(context).textTheme.titleLarge),
      ],
    );
  }

  Widget _buildDocumentPicker({
    required String title,
    required File? file,
    required VoidCallback onPick,
    required VoidCallback onRemove,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: Theme.of(context).textTheme.titleSmall),
        const SizedBox(height: 8),
        if (file != null)
          Stack(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Image.file(
                  file,
                  height: 150,
                  width: double.infinity,
                  fit: BoxFit.cover,
                ),
              ),
              Positioned(
                top: 8,
                right: 8,
                child: IconButton(
                  icon: const Icon(Icons.close, color: Colors.white),
                  style: IconButton.styleFrom(backgroundColor: AppTheme.destructive),
                  onPressed: onRemove,
                ),
              ),
              Positioned(
                bottom: 8,
                left: 8,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.success,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.check, size: 14, color: Colors.white),
                      SizedBox(width: 4),
                      Text('Uploaded', style: TextStyle(color: Colors.white, fontSize: 12)),
                    ],
                  ),
                ),
              ),
            ],
          )
        else
          InkWell(
            onTap: onPick,
            borderRadius: BorderRadius.circular(8),
            child: Container(
              height: 150,
              width: double.infinity,
              decoration: BoxDecoration(
                border: Border.all(color: AppTheme.border, style: BorderStyle.solid),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.cloud_upload_outlined, size: 40, color: AppTheme.mutedForeground),
                  const SizedBox(height: 8),
                  Text('Tap to upload', style: Theme.of(context).textTheme.bodyMedium),
                  Text('JPG, PNG (max 5MB)', style: Theme.of(context).textTheme.bodySmall),
                ],
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildNavigationButtons() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.card,
        border: Border(top: BorderSide(color: AppTheme.border)),
      ),
      child: SafeArea(
        child: Row(
          children: [
            if (_currentStep > 0)
              Expanded(
                child: OutlinedButton(
                  onPressed: _prevStep,
                  child: const Text('Back'),
                ),
              ),
            if (_currentStep > 0) const SizedBox(width: 12),
            Expanded(
              flex: 2,
              child: ElevatedButton(
                onPressed: _isSubmitting ? null : _nextStep,
                child: _isSubmitting
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : Text(_currentStep < 4 ? 'Next' : 'Submit'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FaceCaptureCard extends StatelessWidget {
  final String label;
  final File? file;
  final VoidCallback onCapture;
  final VoidCallback onRemove;

  const _FaceCaptureCard({
    required this.label,
    required this.file,
    required this.onCapture,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: file != null
          ? Stack(
              fit: StackFit.expand,
              children: [
                Image.file(file!, fit: BoxFit.cover),
                Positioned(
                  top: 4,
                  right: 4,
                  child: IconButton(
                    icon: const Icon(Icons.close, size: 18),
                    style: IconButton.styleFrom(
                      backgroundColor: AppTheme.destructive,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.all(4),
                    ),
                    onPressed: onRemove,
                  ),
                ),
                Positioned(
                  bottom: 0,
                  left: 0,
                  right: 0,
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    color: AppTheme.success,
                    child: Text(
                      label,
                      style: const TextStyle(color: Colors.white, fontSize: 12),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
              ],
            )
          : InkWell(
              onTap: onCapture,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppTheme.accent,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(Icons.camera_alt, color: AppTheme.primary, size: 28),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    label,
                    style: Theme.of(context).textTheme.titleSmall,
                    textAlign: TextAlign.center,
                  ),
                  Text(
                    'Tap to capture',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
            ),
    );
  }
}