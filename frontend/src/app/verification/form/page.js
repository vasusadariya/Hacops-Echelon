'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { useAuth } from '@/lib/auth-context';
import { useBehaviorTracking } from '@/hooks/use-behavior-tracking';
import Navbar from '@/components/navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { indianStates } from '@/lib/indian-states';
import { 
  User, 
  FileText, 
  MapPin, 
  Phone, 
  Camera, 
  Shield, 
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { MultiAngleFaceCapture } from '@/components/multi-angle-face-capture.jsx';
import { Footer } from '@/components/footer';
import { BehaviorDebugPanel } from '@/components/behavior-debug-panel';

export default function VerificationFormPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, token } = useAuth();
  const { executeRecaptcha } = useGoogleReCaptcha();
  const { getBehaviorData, resetTracking } = useBehaviorTracking();
  
  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [verifyingCaptcha, setVerifyingCaptcha] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');

  // Form data state
  const [formData, setFormData] = useState({
    fullName: '',
    gender: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    taluka: '',
    district: '',
    state: '',
    pincode: '',
    mobileNumber: ''
  });

  // File state - Aadhaar Card
  const [aadhaarCard, setAadhaarCard] = useState(null);
  const [aadhaarPreview, setAadhaarPreview] = useState('');
  
  // File state - PAN Card
  const [panCard, setPanCard] = useState(null);
  const [panPreview, setPanPreview] = useState('');
  
  // Multi-angle selfie captures
  const [faceCaptures, setFaceCaptures] = useState(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth?redirect=/verification/form');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    resetTracking();
  }, [resetTracking]);

  const getCurrentToken = () => {
    if (token) return token;
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  const handleInputChange = (field, value) => {
    let processedValue = value;

    switch (field) {
      case 'fullName':
        processedValue = value.replace(/[^a-zA-Z\s]/g, '').slice(0, 60);
        break;
      case 'city':
      case 'taluka':
      case 'district':
        processedValue = value.replace(/[^a-zA-Z\s]/g, '');
        break;
      case 'pincode':
        processedValue = value.replace(/[^0-9]/g, '').slice(0, 6);
        break;
      case 'mobileNumber':
        processedValue = value.replace(/[^0-9]/g, '').slice(0, 10);
        break;
    }

    setFormData(prev => ({ ...prev, [field]: processedValue }));
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileChange = (type, file) => {
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setFieldErrors(prev => ({ ...prev, [type]: 'Only JPG and PNG files are allowed' }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFieldErrors(prev => ({ ...prev, [type]: 'File size must be less than 5MB' }));
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    if (type === 'aadhaarCard') {
      setAadhaarCard(file);
      setAadhaarPreview(previewUrl);
    } else if (type === 'panCard') {
      setPanCard(file);
      setPanPreview(previewUrl);
    }

    setFieldErrors(prev => ({ ...prev, [type]: '' }));
  };

  const removeFile = (type) => {
    if (type === 'aadhaarCard') {
      setAadhaarCard(null);
      setAadhaarPreview('');
    } else if (type === 'panCard') {
      setPanCard(null);
      setPanPreview('');
    }
  };

  const handleFaceCaptureComplete = (captures) => {
    console.log('Face captures complete:', Object.keys(captures));
    setFaceCaptures(captures);
    setFieldErrors(prev => ({ ...prev, faceCaptures: '' }));
  };

  const handleFaceCaptureRemove = () => {
    setFaceCaptures(null);
  };

  const handleVerifyCaptcha = async () => {
    if (!executeRecaptcha) {
      setSubmitError('reCAPTCHA not loaded. Please refresh the page.');
      return;
    }

    setVerifyingCaptcha(true);
    try {
      const recaptchaToken = await executeRecaptcha('verification_form');
      if (recaptchaToken) {
        setCaptchaVerified(true);
        setFieldErrors(prev => ({ ...prev, captcha: '' }));
      }
    } catch (error) {
      setFieldErrors(prev => ({ ...prev, captcha: 'reCAPTCHA verification failed.' }));
    } finally {
      setVerifyingCaptcha(false);
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!formData.fullName || formData.fullName.trim().length < 3) {
      errors.fullName = 'Full name must be at least 3 characters';
    }

    if (!formData.gender) {
      errors.gender = 'Please select your gender';
    }

    if (!formData.addressLine1 || formData.addressLine1.length < 10) {
      errors.addressLine1 = 'Address must be at least 10 characters';
    }

    if (!formData.city || formData.city.trim() === '') {
      errors.city = 'City is required';
    }

    if (!formData.taluka || formData.taluka.trim() === '') {
      errors.taluka = 'Taluka is required';
    }

    if (!formData.district || formData.district.trim() === '') {
      errors.district = 'District is required';
    }

    if (!formData.state) {
      errors.state = 'State is required';
    }

    if (!/^[0-9]{6}$/.test(formData.pincode)) {
      errors.pincode = 'Pincode must be exactly 6 digits';
    }

    if (!/^[0-9]{10}$/.test(formData.mobileNumber)) {
      errors.mobileNumber = 'Mobile number must be exactly 10 digits';
    }

    if (!aadhaarCard) {
      errors.aadhaarCard = 'Aadhaar card image is required';
    }

    if (!panCard) {
      errors.panCard = 'PAN card image is required';
    }

    if (!faceCaptures || !faceCaptures.front || !faceCaptures.left || !faceCaptures.right || !faceCaptures.up) {
      errors.faceCaptures = 'All 4 face photos are required (front, left, right, up)';
    }
    
    if (!captchaVerified) {
      errors.captcha = 'Please verify the captcha';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit form - Send everything to API for processing
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setFieldErrors({});
    
    console.log('Form submit triggered');

    const currentToken = getCurrentToken();
    if (!currentToken) {
      setSubmitError('You are not logged in. Please login and try again.');
      router.push('/auth?redirect=/verification/form');
      return;
    }

    if (!validateForm()) {
      setSubmitError('Please fix the errors in the form.');
      return;
    }

    console.log('Form validation passed, starting submission...');
    setIsSubmitting(true);
    setSubmitStatus('Preparing your application...');

    try {
      let recaptchaToken = '';
      if (executeRecaptcha) {
        recaptchaToken = await executeRecaptcha('verification_submit');
      }
      
      const behaviorData = getBehaviorData();
      
      // Create FormData and send everything to our API
      const submitData = new FormData();
      
      // Add form fields
      Object.keys(formData).forEach(key => {
        submitData.append(key, formData[key]);
      });

      // Add document files
      submitData.append('aadhaarCard', aadhaarCard);
      submitData.append('panCard', panCard);
      
      // Add face captures as JSON (base64)
      submitData.append('faceCaptures', JSON.stringify(faceCaptures));
      
      submitData.append('recaptchaToken', recaptchaToken);
      submitData.append('behaviorData', JSON.stringify(behaviorData));

      setSubmitStatus('Uploading documents and verifying...');

      const response = await fetch('/api/verification/submit', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${currentToken}` },
        body: submitData
      });

      const data = await response.json();
      console.log('Submit response:', data);

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          router.push('/auth?redirect=/verification/form');
          return;
        }
        throw new Error(data.error || data.errors?.join(', ') || 'Submission failed');
      }

      setSubmitStatus('Success! Redirecting...');
      router.push('/verification/status?success=true');
      
    } catch (error) {
      console.error('Submit error:', error);
      setSubmitError(error.message || 'An error occurred during submission');
      setSubmitStatus('');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const allFacesCaptured = faceCaptures && faceCaptures.front && faceCaptures.left && faceCaptures.right && faceCaptures.up;
  const errorCount = Object.keys(fieldErrors).length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <Badge variant="outline" className="mb-4">
              <Shield className="h-3 w-3 mr-1" />
              Secure Form
            </Badge>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Identity Verification Form
            </h1>
            <p className="text-muted-foreground">
              Please fill in all required details accurately
            </p>
          </div>

          {/* Error Summary */}
          {(submitError || errorCount > 0) && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-semibold">{submitError || `Please fix ${errorCount} error(s) below:`}</p>
                {errorCount > 0 && (
                  <ul className="mt-2 list-disc list-inside text-sm">
                    {Object.entries(fieldErrors).map(([field, error]) => (
                      <li key={field}>
                        <strong className="capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}:</strong> {error}
                      </li>
                    ))}
                  </ul>
                )}
              </AlertDescription>
            </Alert>
          )}
          
          {/* Submit Status */}
          {submitStatus && !submitError && (
            <Alert className="mb-6 border-blue-500 bg-blue-50">
              <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
              <AlertDescription className="text-blue-600">{submitStatus}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Section 1: Personal Information */}
            <Card className={`border ${fieldErrors.fullName || fieldErrors.gender ? 'border-destructive' : 'border-border'}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5 text-primary" />
                  Personal Information
                </CardTitle>
                <CardDescription>Enter your personal details as per official documents</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name <span className="text-destructive">*</span></Label>
                  <Input
                    id="fullName"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    className={fieldErrors.fullName ? 'border-destructive ring-1 ring-destructive' : ''}
                  />
                  {fieldErrors.fullName && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {fieldErrors.fullName}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Gender <span className="text-destructive">*</span></Label>
                  <RadioGroup
                    value={formData.gender}
                    onValueChange={(value) => handleInputChange('gender', value)}
                    className="flex flex-wrap gap-4"
                  >
                    {['male', 'female', 'other'].map(g => (
                      <div key={g} className="flex items-center space-x-2">
                        <RadioGroupItem value={g} id={g} />
                        <Label htmlFor={g} className="font-normal cursor-pointer capitalize">{g}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                  {fieldErrors.gender && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {fieldErrors.gender}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Section 2: Identity Documents */}
            <Card className={`border ${fieldErrors.aadhaarCard || fieldErrors.panCard ? 'border-destructive' : 'border-border'}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-primary" />
                  Identity Documents
                </CardTitle>
                <CardDescription>Upload clear images of your identity documents</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Aadhaar Card Upload */}
                <div className="space-y-2">
                  <Label>Aadhaar Card Image <span className="text-destructive">*</span></Label>
                  {aadhaarPreview ? (
                    <div className="relative inline-block">
                      <img src={aadhaarPreview} alt="Aadhaar Card" className="max-w-xs h-auto rounded-lg border" />
                      <Button 
                        type="button" 
                        variant="destructive" 
                        size="icon" 
                        className="absolute -top-2 -right-2 h-6 w-6" 
                        onClick={() => removeFile('aadhaarCard')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Badge className="absolute bottom-2 left-2 bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" /> Uploaded
                      </Badge>
                    </div>
                  ) : (
                    <div className={`border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors ${fieldErrors.aadhaarCard ? 'border-destructive bg-destructive/5' : ''}`}>
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <Label htmlFor="aadhaarUpload" className="cursor-pointer block">
                        <span className="text-primary hover:underline font-medium">Click to upload Aadhaar Card</span>
                        <p className="text-xs text-muted-foreground mt-1">JPG, PNG (Max 5MB)</p>
                      </Label>
                      <Input 
                        id="aadhaarUpload" 
                        type="file" 
                        accept=".jpg,.jpeg,.png" 
                        className="hidden" 
                        onChange={(e) => handleFileChange('aadhaarCard', e.target.files?.[0])} 
                      />
                    </div>
                  )}
                  {fieldErrors.aadhaarCard && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {fieldErrors.aadhaarCard}
                    </p>
                  )}
                </div>

                {/* PAN Card Upload */}
                <div className="space-y-2">
                  <Label>PAN Card Image <span className="text-destructive">*</span></Label>
                  {panPreview ? (
                    <div className="relative inline-block">
                      <img src={panPreview} alt="PAN Card" className="max-w-xs h-auto rounded-lg border" />
                      <Button 
                        type="button" 
                        variant="destructive" 
                        size="icon" 
                        className="absolute -top-2 -right-2 h-6 w-6" 
                        onClick={() => removeFile('panCard')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Badge className="absolute bottom-2 left-2 bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" /> Uploaded
                      </Badge>
                    </div>
                  ) : (
                    <div className={`border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors ${fieldErrors.panCard ? 'border-destructive bg-destructive/5' : ''}`}>
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <Label htmlFor="panUpload" className="cursor-pointer block">
                        <span className="text-primary hover:underline font-medium">Click to upload PAN Card</span>
                        <p className="text-xs text-muted-foreground mt-1">JPG, PNG (Max 5MB)</p>
                      </Label>
                      <Input 
                        id="panUpload" 
                        type="file" 
                        accept=".jpg,.jpeg,.png" 
                        className="hidden" 
                        onChange={(e) => handleFileChange('panCard', e.target.files?.[0])} 
                      />
                    </div>
                  )}
                  {fieldErrors.panCard && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {fieldErrors.panCard}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Section 3: Address */}
            <Card className={`border ${fieldErrors.addressLine1 || fieldErrors.city || fieldErrors.state || fieldErrors.pincode ? 'border-destructive' : 'border-border'}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5 text-primary" />
                  Address Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="addressLine1">Address Line 1 <span className="text-destructive">*</span></Label>
                  <Input 
                    id="addressLine1" 
                    placeholder="House/Flat No., Building, Street" 
                    value={formData.addressLine1} 
                    onChange={(e) => handleInputChange('addressLine1', e.target.value)} 
                    className={fieldErrors.addressLine1 ? 'border-destructive ring-1 ring-destructive' : ''} 
                  />
                  {fieldErrors.addressLine1 && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {fieldErrors.addressLine1}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                  <Input 
                    id="addressLine2" 
                    placeholder="Landmark, Area" 
                    value={formData.addressLine2} 
                    onChange={(e) => handleInputChange('addressLine2', e.target.value)} 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City <span className="text-destructive">*</span></Label>
                    <Input 
                      id="city"
                      placeholder="Enter city"
                      value={formData.city} 
                      onChange={(e) => handleInputChange('city', e.target.value)} 
                      className={fieldErrors.city ? 'border-destructive ring-1 ring-destructive' : ''} 
                    />
                    {fieldErrors.city && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {fieldErrors.city}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taluka">Taluka <span className="text-destructive">*</span></Label>
                    <Input 
                      id="taluka"
                      placeholder="Enter taluka"
                      value={formData.taluka} 
                      onChange={(e) => handleInputChange('taluka', e.target.value)} 
                      className={fieldErrors.taluka ? 'border-destructive ring-1 ring-destructive' : ''} 
                    />
                    {fieldErrors.taluka && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {fieldErrors.taluka}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="district">District <span className="text-destructive">*</span></Label>
                    <Input 
                      id="district"
                      placeholder="Enter district"
                      value={formData.district} 
                      onChange={(e) => handleInputChange('district', e.target.value)} 
                      className={fieldErrors.district ? 'border-destructive ring-1 ring-destructive' : ''} 
                    />
                    {fieldErrors.district && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {fieldErrors.district}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State <span className="text-destructive">*</span></Label>
                    <Select value={formData.state} onValueChange={(value) => handleInputChange('state', value)}>
                      <SelectTrigger id="state" className={fieldErrors.state ? 'border-destructive ring-1 ring-destructive' : ''}>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {indianStates.map((state) => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldErrors.state && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {fieldErrors.state}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2 max-w-xs">
                  <Label htmlFor="pincode">Pincode <span className="text-destructive">*</span></Label>
                  <Input 
                    id="pincode"
                    placeholder="6 digit pincode"
                    value={formData.pincode} 
                    onChange={(e) => handleInputChange('pincode', e.target.value)} 
                    maxLength={6} 
                    className={fieldErrors.pincode ? 'border-destructive ring-1 ring-destructive' : ''} 
                  />
                  {fieldErrors.pincode && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {fieldErrors.pincode}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Section 4: Contact */}
            <Card className={`border ${fieldErrors.mobileNumber ? 'border-destructive' : 'border-border'}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Phone className="h-5 w-5 text-primary" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-w-xs">
                  <Label htmlFor="mobileNumber">Mobile Number <span className="text-destructive">*</span></Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 bg-muted border border-r-0 rounded-l-md text-sm">+91</span>
                    <Input 
                      id="mobileNumber"
                      placeholder="10 digit number"
                      value={formData.mobileNumber} 
                      onChange={(e) => handleInputChange('mobileNumber', e.target.value)} 
                      maxLength={10} 
                      className={`rounded-l-none ${fieldErrors.mobileNumber ? 'border-destructive ring-1 ring-destructive' : ''}`} 
                    />
                  </div>
                  {fieldErrors.mobileNumber && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {fieldErrors.mobileNumber}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Section 5: Face Capture */}
            <Card className={`border ${fieldErrors.faceCaptures ? 'border-destructive' : 'border-border'}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Camera className="h-5 w-5 text-primary" />
                  Biometric Face Verification
                  {allFacesCaptured && (
                    <Badge className="ml-2 bg-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Complete
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Capture 4 photos of your face from different angles for secure identity verification.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MultiAngleFaceCapture
                  onCaptureComplete={handleFaceCaptureComplete}
                  onRemove={handleFaceCaptureRemove}
                  initialCaptures={faceCaptures}
                />
                {fieldErrors.faceCaptures && (
                  <p className="text-sm text-destructive mt-3 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {fieldErrors.faceCaptures}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Section 6: Security */}
            <Card className={`border ${fieldErrors.captcha ? 'border-destructive' : 'border-border'}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5 text-primary" />
                  Security Verification
                </CardTitle>
              </CardHeader>
              <CardContent>
                {captchaVerified ? (
                  <Alert className="border-green-500 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-600 font-medium">
                      Security verification completed!
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Click below to verify you are human</p>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleVerifyCaptcha} 
                      disabled={verifyingCaptcha}
                      className={fieldErrors.captcha ? 'border-destructive' : ''}
                    >
                      {verifyingCaptcha ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Verifying...</>
                      ) : (
                        <><Shield className="h-4 w-4 mr-2" />Click to Verify</>
                      )}
                    </Button>
                    {fieldErrors.captcha && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {fieldErrors.captcha}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Form Status Summary */}
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                  <div className={`flex items-center gap-2 ${formData.fullName && formData.gender ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {formData.fullName && formData.gender ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    Personal
                  </div>
                  <div className={`flex items-center gap-2 ${aadhaarCard && panCard ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {aadhaarCard && panCard ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    Documents
                  </div>
                  <div className={`flex items-center gap-2 ${formData.addressLine1 && formData.state && formData.pincode ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {formData.addressLine1 && formData.state && formData.pincode ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    Address
                  </div>
                  <div className={`flex items-center gap-2 ${allFacesCaptured ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {allFacesCaptured ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    Face
                  </div>
                  <div className={`flex items-center gap-2 ${captchaVerified ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {captchaVerified ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    Security
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex flex-col items-center gap-4 pt-4">
              <Button 
                type="submit" 
                size="lg" 
                className="w-full max-w-md bg-primary hover:bg-primary/90" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Submitting...</>
                ) : (
                  <><CheckCircle className="h-5 w-5 mr-2" />Submit for Verification</>
                )}
              </Button>
              
              {(!captchaVerified || !allFacesCaptured) && (
                <p className="text-sm text-amber-600 text-center bg-amber-50 px-4 py-2 rounded-lg">
                  ⚠️ {!allFacesCaptured && !captchaVerified 
                    ? 'Complete face capture and security verification' 
                    : !allFacesCaptured 
                      ? 'Capture all 4 face photos' 
                      : 'Complete security verification'}
                </p>
              )}
            </div>
          </form>
        </div>
      </main>

      <Footer />
      <BehaviorDebugPanel showByDefault={false} />
    </div>
  );
}