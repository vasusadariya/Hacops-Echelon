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

export default function VerificationFormPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, token } = useAuth();
  const { executeRecaptcha } = useGoogleReCaptcha();
  const { getBehaviorData, resetTracking } = useBehaviorTracking();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [verifyingCaptcha, setVerifyingCaptcha] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    gender: '',
    documentIdNumber: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    taluka: '',
    district: '',
    state: '',
    pincode: '',
    mobileNumber: ''
  });

  // File state
  const [aadhaarCard, setAadhaarCard] = useState(null);
  const [panCard, setPanCard] = useState(null);
  const [aadhaarPreview, setAadhaarPreview] = useState('');
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
      case 'documentIdNumber':
        processedValue = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 16);
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

    if (file.size > 2 * 1024 * 1024) {
      setFieldErrors(prev => ({ ...prev, [type]: 'File size must be less than 2MB' }));
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

  // Handle multi-angle face capture complete
  const handleFaceCaptureComplete = (captures) => {
    console.log('Face captures complete:', Object.keys(captures));
    setFaceCaptures(captures);
    setFieldErrors(prev => ({ ...prev, faceCaptures: '' }));
  };

  const handleFaceCaptureRemove = () => {
    setFaceCaptures(null);
  };

  // Verify reCAPTCHA
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

    if (!formData.fullName.trim() || formData.fullName.length < 3) {
      errors.fullName = 'Full name must be at least 3 characters';
    }
    if (!formData.gender) {
      errors.gender = 'Please select your gender';
    }
    if (!formData.documentIdNumber || formData.documentIdNumber.length < 8) {
      errors.documentIdNumber = 'Document ID must be at least 8 characters';
    }
    if (!formData.addressLine1 || formData.addressLine1.length < 10) {
      errors.addressLine1 = 'Address must be at least 10 characters';
    }
    if (!formData.city) errors.city = 'City is required';
    if (!formData.taluka) errors.taluka = 'Taluka is required';
    if (!formData.district) errors.district = 'District is required';
    if (!formData.state) errors.state = 'State is required';
    if (!/^[0-9]{6}$/.test(formData.pincode)) {
      errors.pincode = 'Pincode must be exactly 6 digits';
    }
    if (!/^[0-9]{10}$/.test(formData.mobileNumber)) {
      errors.mobileNumber = 'Mobile number must be exactly 10 digits';
    }
    if (!aadhaarCard) errors.aadhaarCard = 'Aadhaar card image is required';
    if (!panCard) errors.panCard = 'PAN card image is required';
    
    // Check all face captures
    if (!faceCaptures || !faceCaptures.front || !faceCaptures.left || !faceCaptures.right || !faceCaptures.up) {
      errors.faceCaptures = 'All 4 face photos are required (front, left, right, up)';
    }
    
    if (!captchaVerified) errors.captcha = 'Please verify the captcha';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    const currentToken = getCurrentToken();
    if (!currentToken) {
      setSubmitError('You are not logged in. Please login and try again.');
      router.push('/auth?redirect=/verification/form');
      return;
    }

    if (!validateForm()) {
      setSubmitError('Please fix the errors above before submitting');
      return;
    }

    setIsSubmitting(true);

    try {
      let recaptchaToken = '';
      if (executeRecaptcha) {
        recaptchaToken = await executeRecaptcha('verification_submit');
      }
      
      const behaviorData = getBehaviorData();
      const submitData = new FormData();
      
      // Add form fields
      Object.keys(formData).forEach(key => {
        submitData.append(key, formData[key]);
      });

      // Add document files
      submitData.append('aadhaarCard', aadhaarCard);
      submitData.append('panCard', panCard);
      
      // Add all 4 face captures as JSON
      submitData.append('faceCaptures', JSON.stringify(faceCaptures));
      
      // Add individual captures for backward compatibility
      submitData.append('selfieFront', faceCaptures.front);
      submitData.append('selfieLeft', faceCaptures.left);
      submitData.append('selfieRight', faceCaptures.right);
      submitData.append('selfieUp', faceCaptures.up);
      
      submitData.append('recaptchaToken', recaptchaToken);
      submitData.append('behaviorData', JSON.stringify(behaviorData));

      const response = await fetch('/api/verification/submit', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${currentToken}` },
        body: submitData
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          router.push('/auth?redirect=/verification/form');
          return;
        }
        throw new Error(data.error || data.errors?.join(', ') || 'Submission failed');
      }

      router.push('/verification/status?success=true');
    } catch (error) {
      setSubmitError(error.message || 'An error occurred during submission');
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

          {submitError && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Section 1: Personal Information */}
            <Card className="border-border">
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
                    className={fieldErrors.fullName ? 'border-destructive' : ''}
                  />
                  {fieldErrors.fullName && <p className="text-sm text-destructive">{fieldErrors.fullName}</p>}
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
                  {fieldErrors.gender && <p className="text-sm text-destructive">{fieldErrors.gender}</p>}
                </div>
              </CardContent>
            </Card>

            {/* Section 2: Identity Documents */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-primary" />
                  Identity Documents
                </CardTitle>
                <CardDescription>Upload clear images of your identity documents</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="documentIdNumber">Document ID Number <span className="text-destructive">*</span></Label>
                  <Input
                    id="documentIdNumber"
                    placeholder="Enter Aadhaar or PAN number"
                    value={formData.documentIdNumber}
                    onChange={(e) => handleInputChange('documentIdNumber', e.target.value)}
                    className={fieldErrors.documentIdNumber ? 'border-destructive' : ''}
                  />
                  {fieldErrors.documentIdNumber && <p className="text-sm text-destructive">{fieldErrors.documentIdNumber}</p>}
                </div>

                {/* Aadhaar Upload */}
                <div className="space-y-2">
                  <Label>Aadhaar Card <span className="text-destructive">*</span></Label>
                  {aadhaarPreview ? (
                    <div className="relative inline-block">
                      <img src={aadhaarPreview} alt="Aadhaar" className="max-w-xs h-auto rounded-lg border" />
                      <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6" onClick={() => removeFile('aadhaarCard')}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <Label htmlFor="aadhaarUpload" className="cursor-pointer">
                        <span className="text-primary hover:underline">Click to upload</span>
                      </Label>
                      <Input id="aadhaarUpload" type="file" accept=".jpg,.jpeg,.png" className="hidden" onChange={(e) => handleFileChange('aadhaarCard', e.target.files[0])} />
                    </div>
                  )}
                  {fieldErrors.aadhaarCard && <p className="text-sm text-destructive">{fieldErrors.aadhaarCard}</p>}
                </div>

                {/* PAN Upload */}
                <div className="space-y-2">
                  <Label>PAN Card <span className="text-destructive">*</span></Label>
                  {panPreview ? (
                    <div className="relative inline-block">
                      <img src={panPreview} alt="PAN" className="max-w-xs h-auto rounded-lg border" />
                      <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6" onClick={() => removeFile('panCard')}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <Label htmlFor="panUpload" className="cursor-pointer">
                        <span className="text-primary hover:underline">Click to upload</span>
                      </Label>
                      <Input id="panUpload" type="file" accept=".jpg,.jpeg,.png" className="hidden" onChange={(e) => handleFileChange('panCard', e.target.files[0])} />
                    </div>
                  )}
                  {fieldErrors.panCard && <p className="text-sm text-destructive">{fieldErrors.panCard}</p>}
                </div>
              </CardContent>
            </Card>

            {/* Section 3: Address */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5 text-primary" />
                  Address Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="addressLine1">Address Line 1 <span className="text-destructive">*</span></Label>
                  <Input id="addressLine1" placeholder="House/Flat No., Street" value={formData.addressLine1} onChange={(e) => handleInputChange('addressLine1', e.target.value)} className={fieldErrors.addressLine1 ? 'border-destructive' : ''} />
                  {fieldErrors.addressLine1 && <p className="text-sm text-destructive">{fieldErrors.addressLine1}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addressLine2">Address Line 2</Label>
                  <Input id="addressLine2" placeholder="Landmark (Optional)" value={formData.addressLine2} onChange={(e) => handleInputChange('addressLine2', e.target.value)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>City <span className="text-destructive">*</span></Label>
                    <Input value={formData.city} onChange={(e) => handleInputChange('city', e.target.value)} className={fieldErrors.city ? 'border-destructive' : ''} />
                    {fieldErrors.city && <p className="text-sm text-destructive">{fieldErrors.city}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Taluka <span className="text-destructive">*</span></Label>
                    <Input value={formData.taluka} onChange={(e) => handleInputChange('taluka', e.target.value)} className={fieldErrors.taluka ? 'border-destructive' : ''} />
                    {fieldErrors.taluka && <p className="text-sm text-destructive">{fieldErrors.taluka}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>District <span className="text-destructive">*</span></Label>
                    <Input value={formData.district} onChange={(e) => handleInputChange('district', e.target.value)} className={fieldErrors.district ? 'border-destructive' : ''} />
                    {fieldErrors.district && <p className="text-sm text-destructive">{fieldErrors.district}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>State <span className="text-destructive">*</span></Label>
                    <Select value={formData.state} onValueChange={(value) => handleInputChange('state', value)}>
                      <SelectTrigger className={fieldErrors.state ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {indianStates.map((state) => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldErrors.state && <p className="text-sm text-destructive">{fieldErrors.state}</p>}
                  </div>
                </div>
                <div className="space-y-2 max-w-xs">
                  <Label>Pincode <span className="text-destructive">*</span></Label>
                  <Input value={formData.pincode} onChange={(e) => handleInputChange('pincode', e.target.value)} maxLength={6} className={fieldErrors.pincode ? 'border-destructive' : ''} />
                  {fieldErrors.pincode && <p className="text-sm text-destructive">{fieldErrors.pincode}</p>}
                </div>
              </CardContent>
            </Card>

            {/* Section 4: Contact */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Phone className="h-5 w-5 text-primary" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-w-xs">
                  <Label>Mobile Number <span className="text-destructive">*</span></Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 bg-muted border border-r-0 rounded-l-md text-sm">+91</span>
                    <Input value={formData.mobileNumber} onChange={(e) => handleInputChange('mobileNumber', e.target.value)} maxLength={10} className={`rounded-l-none ${fieldErrors.mobileNumber ? 'border-destructive' : ''}`} />
                  </div>
                  {fieldErrors.mobileNumber && <p className="text-sm text-destructive">{fieldErrors.mobileNumber}</p>}
                </div>
              </CardContent>
            </Card>

            {/* Section 5: Multi-Angle Face Capture */}
            <Card className="border-border">
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
                  This helps prevent fraud and ensures accurate matching.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MultiAngleFaceCapture
                  onCaptureComplete={handleFaceCaptureComplete}
                  onRemove={handleFaceCaptureRemove}
                  initialCaptures={faceCaptures}
                />
                {fieldErrors.faceCaptures && (
                  <p className="text-sm text-destructive mt-2">{fieldErrors.faceCaptures}</p>
                )}
              </CardContent>
            </Card>

            {/* Section 6: Security */}
            <Card className="border-border">
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
                    <AlertDescription className="text-green-600">Security verification completed</AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Click to verify you are human</p>
                    <Button type="button" variant="outline" onClick={handleVerifyCaptcha} disabled={verifyingCaptcha}>
                      {verifyingCaptcha ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Verifying...</> : <><Shield className="h-4 w-4 mr-2" />Verify</>}
                    </Button>
                    {fieldErrors.captcha && <p className="text-sm text-destructive">{fieldErrors.captcha}</p>}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex flex-col items-center gap-4 pt-4">
              <Button 
                type="submit" 
                size="lg" 
                className="w-full max-w-md bg-primary hover:bg-primary/90" 
                disabled={!captchaVerified || isSubmitting || !allFacesCaptured}
              >
                {isSubmitting ? (
                  <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Submitting...</>
                ) : (
                  <><CheckCircle className="h-5 w-5 mr-2" />Submit for Verification</>
                )}
              </Button>
              {(!captchaVerified || !allFacesCaptured) && (
                <p className="text-sm text-muted-foreground text-center">
                  {!allFacesCaptured ? 'Please capture all 4 face photos' : 'Complete security verification to submit'}
                </p>
              )}
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}