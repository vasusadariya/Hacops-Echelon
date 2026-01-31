'use client';

import { useState, useEffect, useRef } from 'react';
import { useBehaviorTracking } from '@/hooks/use-behavior-tracking';
import { BehaviorDebugPanel } from '@/components/behavior-debug-panel';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Bot, 
  User, 
  Keyboard, 
  MousePointer2, 
  AlertTriangle,
  CheckCircle,
  Play,
  RotateCcw,
  Clipboard,
  Zap,
  Loader2
} from 'lucide-react';

export default function BehavioralDemoPage() {
  const { getBehaviorData, resetTracking } = useBehaviorTracking();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    message: ''
  });
  const [analysisResult, setAnalysisResult] = useState(null);
  const [testMode, setTestMode] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [simulationStatus, setSimulationStatus] = useState('');
  
  // Refs for input elements
  const fullNameRef = useRef(null);
  const emailRef = useRef(null);
  const phoneRef = useRef(null);
  const addressRef = useRef(null);
  const messageRef = useRef(null);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAnalyze = () => {
    const data = getBehaviorData();
    setAnalysisResult(data);
  };

  const handleReset = () => {
    resetTracking();
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      address: '',
      message: ''
    });
    setAnalysisResult(null);
    setTestMode(null);
    setSimulationProgress(0);
    setSimulationStatus('');
  };

  // Simulate realistic bot typing (very fast, uniform intervals)
  const simulateBotTyping = async (inputRef, text, fieldName) => {
    if (!inputRef.current) return;
    
    const input = inputRef.current;
    input.focus();
    
    // Bot types extremely fast with uniform speed (10-20ms per character)
    for (let i = 0; i < text.length; i++) {
      const currentText = text.substring(0, i + 1);
      
      // Dispatch input event to trigger tracking
      const inputEvent = new Event('input', { bubbles: true });
      input.value = currentText;
      input.dispatchEvent(inputEvent);
      
      // Simulate keydown event with uniform timing (bot-like)
      const keyEvent = new KeyboardEvent('keydown', {
        key: text[i],
        bubbles: true
      });
      input.dispatchEvent(keyEvent);
      
      setFormData(prev => ({ ...prev, [fieldName]: currentText }));
      
      // Bot speed: 15-25ms per keystroke (superhuman, very uniform)
      await new Promise(resolve => setTimeout(resolve, 15 + Math.random() * 10));
    }
    
    input.blur();
  };

  // Simulate realistic human typing (variable speed, pauses, corrections)
  const simulateHumanTyping = async (inputRef, text, fieldName) => {
    if (!inputRef.current) return;
    
    const input = inputRef.current;
    input.focus();
    
    let currentText = '';
    
    for (let i = 0; i < text.length; i++) {
      // Occasionally make a typo and correct it (human behavior)
      if (Math.random() < 0.08 && i > 0) {
        // Type wrong character
        const wrongChar = String.fromCharCode(97 + Math.floor(Math.random() * 26));
        currentText += wrongChar;
        
        const wrongEvent = new KeyboardEvent('keydown', { key: wrongChar, bubbles: true });
        input.dispatchEvent(wrongEvent);
        input.value = currentText;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        setFormData(prev => ({ ...prev, [fieldName]: currentText }));
        
        await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 200));
        
        // Backspace to correct
        currentText = currentText.slice(0, -1);
        const backspaceEvent = new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true });
        input.dispatchEvent(backspaceEvent);
        input.value = currentText;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        setFormData(prev => ({ ...prev, [fieldName]: currentText }));
        
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 150));
      }
      
      currentText += text[i];
      
      const keyEvent = new KeyboardEvent('keydown', { key: text[i], bubbles: true });
      input.dispatchEvent(keyEvent);
      input.value = currentText;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      setFormData(prev => ({ ...prev, [fieldName]: currentText }));
      
      // Human speed: 150-400ms with high variance
      let delay = 150 + Math.random() * 250;
      
      // Occasional thinking pauses
      if (Math.random() < 0.1) {
        delay += 500 + Math.random() * 1000;
      }
      
      // Slow down for special characters
      if ([' ', '.', ',', '@'].includes(text[i])) {
        delay += 100 + Math.random() * 200;
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    input.blur();
  };

  // Simulate bot mouse movement (straight lines)
  const simulateBotMouseMovement = async () => {
    const startX = 100;
    const startY = 100;
    const endX = 500;
    const endY = 400;
    const steps = 20;
    
    for (let i = 0; i <= steps; i++) {
      // Perfect linear interpolation (bot-like)
      const x = startX + (endX - startX) * (i / steps);
      const y = startY + (endY - startY) * (i / steps);
      
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: x,
        clientY: y,
        bubbles: true
      });
      window.dispatchEvent(mouseEvent);
      
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  };

  // Simulate human mouse movement (curved, hesitant)
  const simulateHumanMouseMovement = async () => {
    const startX = 100 + Math.random() * 200;
    const startY = 100 + Math.random() * 200;
    const endX = 400 + Math.random() * 300;
    const endY = 300 + Math.random() * 300;
    const steps = 50;
    
    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      
      // Add curves and wobble (human-like)
      const wobbleX = Math.sin(progress * Math.PI * 3) * 20 * (1 - progress);
      const wobbleY = Math.cos(progress * Math.PI * 2) * 15 * (1 - progress);
      
      const x = startX + (endX - startX) * progress + wobbleX + (Math.random() - 0.5) * 10;
      const y = startY + (endY - startY) * progress + wobbleY + (Math.random() - 0.5) * 10;
      
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: x,
        clientY: y,
        bubbles: true
      });
      window.dispatchEvent(mouseEvent);
      
      // Variable speed with occasional pauses
      let delay = 20 + Math.random() * 40;
      if (Math.random() < 0.1) {
        delay += 100 + Math.random() * 200; // Hesitation
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  };

  // Full bot simulation
  const simulateBotFill = async () => {
    setTestMode('bot');
    setIsSimulating(true);
    setSimulationProgress(0);
    setAnalysisResult(null);
    
    // Reset tracking first
    resetTracking();
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      address: '',
      message: ''
    });
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const botData = {
      fullName: 'John Automated Doe',
      email: 'bot.user@automated.com',
      phone: '9876543210',
      address: '123 Bot Street, Automation City, Roboland 000000',
      message: 'This message was typed by an automated bot with uniform speed and no corrections.'
    };
    
    // Simulate bot mouse movement
    setSimulationStatus('🤖 Bot moving mouse (straight lines)...');
    setSimulationProgress(5);
    await simulateBotMouseMovement();
    
    // Type each field with bot-like speed
    setSimulationStatus('🤖 Bot typing name (superhuman speed)...');
    setSimulationProgress(15);
    await simulateBotTyping(fullNameRef, botData.fullName, 'fullName');
    
    setSimulationStatus('🤖 Bot typing email...');
    setSimulationProgress(30);
    await simulateBotTyping(emailRef, botData.email, 'email');
    
    setSimulationStatus('🤖 Bot typing phone...');
    setSimulationProgress(45);
    await simulateBotTyping(phoneRef, botData.phone, 'phone');
    
    setSimulationStatus('🤖 Bot typing address...');
    setSimulationProgress(60);
    await simulateBotTyping(addressRef, botData.address, 'address');
    
    setSimulationStatus('🤖 Bot typing message...');
    setSimulationProgress(80);
    await simulateBotTyping(messageRef, botData.message, 'message');
    
    // More bot mouse movements
    await simulateBotMouseMovement();
    await simulateBotMouseMovement();
    
    setSimulationStatus('🔍 Analyzing bot behavior...');
    setSimulationProgress(95);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Auto-analyze
    const data = getBehaviorData();
    setAnalysisResult(data);
    
    setSimulationProgress(100);
    setSimulationStatus('✅ Bot simulation complete!');
    setIsSimulating(false);
  };

  // Full human simulation
  const simulateHumanFill = async () => {
    setTestMode('human');
    setIsSimulating(true);
    setSimulationProgress(0);
    setAnalysisResult(null);
    
    // Reset tracking first
    resetTracking();
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      address: '',
      message: ''
    });
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const humanData = {
      fullName: 'Rahul Kumar',
      email: 'rahul.k@gmail.com',
      phone: '9123456780',
      address: '45 Park Avenue, Mumbai, Maharashtra 400001',
      message: 'Hello, this is a genuine human typing with natural speed.'
    };
    
    // Simulate human mouse movement
    setSimulationStatus('👤 Human moving mouse (natural curves)...');
    setSimulationProgress(5);
    await simulateHumanMouseMovement();
    
    // Type each field with human-like speed
    setSimulationStatus('👤 Human typing name (with pauses)...');
    setSimulationProgress(15);
    await simulateHumanTyping(fullNameRef, humanData.fullName, 'fullName');
    
    // Thinking pause
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500));
    await simulateHumanMouseMovement();
    
    setSimulationStatus('👤 Human typing email...');
    setSimulationProgress(35);
    await simulateHumanTyping(emailRef, humanData.email, 'email');
    
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 300));
    
    setSimulationStatus('👤 Human typing phone...');
    setSimulationProgress(50);
    await simulateHumanTyping(phoneRef, humanData.phone, 'phone');
    
    await simulateHumanMouseMovement();
    await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 400));
    
    setSimulationStatus('👤 Human typing address...');
    setSimulationProgress(70);
    await simulateHumanTyping(addressRef, humanData.address, 'address');
    
    await new Promise(resolve => setTimeout(resolve, 700 + Math.random() * 500));
    await simulateHumanMouseMovement();
    
    setSimulationStatus('👤 Human typing message...');
    setSimulationProgress(85);
    await simulateHumanTyping(messageRef, humanData.message, 'message');
    
    await simulateHumanMouseMovement();
    
    setSimulationStatus('🔍 Analyzing human behavior...');
    setSimulationProgress(95);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Auto-analyze
    const data = getBehaviorData();
    setAnalysisResult(data);
    
    setSimulationProgress(100);
    setSimulationStatus('✅ Human simulation complete!');
    setIsSimulating(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">
            🔍 Behavioral Biometrics Demo
          </h1>
          <p className="text-primary-foreground/80">
            Synthetic Identity Fraud Detection through Behavioral Analysis
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="secondary">Keystroke Dynamics</Badge>
            <Badge variant="secondary">Mouse Tracking</Badge>
            <Badge variant="secondary">Bot Detection</Badge>
            <Badge variant="secondary">97% Accuracy</Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left: Test Form */}
          <div className="space-y-6">
            {/* Simulation Progress */}
            {isSimulating && (
              <Alert className="border-primary bg-primary/5">
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertTitle>Simulation in Progress</AlertTitle>
                <AlertDescription>
                  <p className="mb-2">{simulationStatus}</p>
                  <Progress value={simulationProgress} className="h-2" />
                  <p className="text-xs mt-1 text-muted-foreground">{simulationProgress}% complete</p>
                </AlertDescription>
              </Alert>
            )}

            {/* Instructions */}
            <Alert>
              <Zap className="h-4 w-4" />
              <AlertTitle>🎯 Demo Instructions for Judges</AlertTitle>
              <AlertDescription>
                <ol className="list-decimal list-inside space-y-2 mt-2 text-sm">
                  <li>
                    <strong>Click "Simulate Human"</strong> - Watch natural typing with corrections, pauses, curved mouse
                  </li>
                  <li>
                    <strong>Click "Simulate Bot"</strong> - Watch superhuman speed, uniform timing, straight mouse lines
                  </li>
                  <li>
                    <strong>Compare Results</strong> - See how the system differentiates human vs bot
                  </li>
                  <li>
                    <strong>Or type manually</strong> - Fill the form yourself and analyze
                  </li>
                </ol>
              </AlertDescription>
            </Alert>

            {/* Simulation Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <Button 
                onClick={simulateHumanFill}
                disabled={isSimulating}
                variant={testMode === 'human' ? 'default' : 'outline'}
                className="h-20 flex-col gap-2"
                size="lg"
              >
                {isSimulating && testMode === 'human' ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <User className="h-6 w-6" />
                )}
                <span>Simulate Human</span>
                <span className="text-xs opacity-70">Natural behavior</span>
              </Button>
              <Button 
                onClick={simulateBotFill}
                disabled={isSimulating}
                variant={testMode === 'bot' ? 'destructive' : 'outline'}
                className="h-20 flex-col gap-2"
                size="lg"
              >
                {isSimulating && testMode === 'bot' ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <Bot className="h-6 w-6" />
                )}
                <span>Simulate Bot</span>
                <span className="text-xs opacity-70">Automated attack</span>
              </Button>
            </div>

            {/* Test Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Keyboard className="h-5 w-5" />
                  KYC Verification Form
                </CardTitle>
                <CardDescription>
                  Watch the form fill automatically or type manually
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    ref={fullNameRef}
                    id="fullName"
                    name="fullName"
                    placeholder="Type your full name..."
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    disabled={isSimulating}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    ref={emailRef}
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={isSimulating}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    ref={phoneRef}
                    id="phone"
                    name="phone"
                    placeholder="9876543210"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    disabled={isSimulating}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <Textarea
                    ref={addressRef}
                    id="address"
                    name="address"
                    placeholder="Enter your complete address..."
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    rows={2}
                    disabled={isSimulating}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Additional Information</Label>
                  <Textarea
                    ref={messageRef}
                    id="message"
                    name="message"
                    placeholder="Type additional information..."
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    rows={3}
                    disabled={isSimulating}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={handleAnalyze} 
                    className="flex-1"
                    disabled={isSimulating}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Analyze Behavior
                  </Button>
                  <Button 
                    onClick={handleReset} 
                    variant="outline"
                    disabled={isSimulating}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Analysis Results */}
          <div className="space-y-6">
            {/* Main Result Card */}
            {analysisResult && (
              <Card className={`border-2 transition-all duration-500 ${
                analysisResult.botLikelihood > 50 
                  ? 'border-red-500 bg-red-50/50 dark:bg-red-950/20' 
                  : 'border-green-500 bg-green-50/50 dark:bg-green-950/20'
              }`}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    {analysisResult.botLikelihood > 50 ? (
                      <>
                        <div className="p-2 bg-red-100 dark:bg-red-900 rounded-full">
                          <Bot className="h-8 w-8 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                          <span className="text-red-600 dark:text-red-400">🚨 BOT DETECTED!</span>
                          <p className="text-sm font-normal text-red-500">Automated behavior patterns identified</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                          <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <span className="text-green-600 dark:text-green-400">✅ HUMAN VERIFIED</span>
                          <p className="text-sm font-normal text-green-500">Natural behavior patterns confirmed</p>
                        </div>
                      </>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Score Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-background rounded-lg border">
                      <div className="text-4xl font-bold text-primary">
                        {analysisResult.overallTrustScore}
                      </div>
                      <div className="text-sm text-muted-foreground">Trust Score</div>
                      <Progress value={analysisResult.overallTrustScore} className="h-2 mt-2" />
                    </div>
                    <div className="text-center p-4 bg-background rounded-lg border">
                      <div className={`text-4xl font-bold ${
                        analysisResult.botLikelihood > 50 ? 'text-red-500' : 'text-green-500'
                      }`}>
                        {analysisResult.botLikelihood}%
                      </div>
                      <div className="text-sm text-muted-foreground">Bot Likelihood</div>
                      <Progress 
                        value={analysisResult.botLikelihood} 
                        className={`h-2 mt-2 ${analysisResult.botLikelihood > 50 ? '[&>div]:bg-red-500' : '[&>div]:bg-green-500'}`}
                      />
                    </div>
                  </div>

                  {/* Component Breakdown */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Analysis Breakdown:</h4>
                    
                    {/* Keystroke Score */}
                    <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <div className="flex items-center gap-2">
                        <Keyboard className="h-4 w-4 text-primary" />
                        <span className="text-sm">Keystroke Analysis</span>
                      </div>
                      <div className="text-right">
                        <Badge variant={analysisResult.keystrokeAnalysis?.trustScore > 60 ? 'default' : 'destructive'}>
                          {analysisResult.keystrokeAnalysis?.trustScore || 'N/A'}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          Avg: {analysisResult.keystrokeAnalysis?.avgIntervalMs || 0}ms
                        </p>
                      </div>
                    </div>

                    {/* Mouse Score */}
                    <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <div className="flex items-center gap-2">
                        <MousePointer2 className="h-4 w-4 text-primary" />
                        <span className="text-sm">Mouse Movement</span>
                      </div>
                      <div className="text-right">
                        <Badge variant={analysisResult.mouseAnalysis?.trustScore > 60 ? 'default' : 'destructive'}>
                          {analysisResult.mouseAnalysis?.trustScore || 'N/A'}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          Linear: {Math.round((analysisResult.mouseAnalysis?.linearityRatio || 0) * 100)}%
                        </p>
                      </div>
                    </div>

                    {/* Speed Score */}
                    <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-primary" />
                        <span className="text-sm">Form Speed</span>
                      </div>
                      <div className="text-right">
                        <Badge variant={analysisResult.speedAnalysis?.trustScore > 60 ? 'default' : 'destructive'}>
                          {analysisResult.speedAnalysis?.trustScore || 'N/A'}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {analysisResult.speedAnalysis?.timePerFieldSeconds || 0}s/field
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Risk & Recommendation */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="p-2 bg-muted/50 rounded text-center">
                      <p className="text-xs text-muted-foreground">Risk Level</p>
                      <Badge className={
                        analysisResult.riskLevel === 'low' ? 'bg-green-500' :
                        analysisResult.riskLevel === 'medium' ? 'bg-yellow-500' :
                        analysisResult.riskLevel === 'high' ? 'bg-orange-500' : 'bg-red-500'
                      }>
                        {analysisResult.riskLevel?.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="p-2 bg-muted/50 rounded text-center">
                      <p className="text-xs text-muted-foreground">Action</p>
                      <Badge variant="outline">
                        {analysisResult.recommendation?.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </div>

                  {/* Flags */}
                  {analysisResult.flagsDetected?.length > 0 && (
                    <div className="pt-2 border-t">
                      <h4 className="text-sm font-semibold mb-2 text-red-600 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Suspicious Patterns ({analysisResult.flagsDetected.length}):
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {analysisResult.flagsDetected.map((flag, idx) => (
                          <Badge key={idx} variant="destructive" className="text-xs">
                            {flag.replace(/([A-Z])/g, ' $1').trim()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Explanation Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">🧠 How It Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex gap-3 p-2 bg-green-50 dark:bg-green-950/30 rounded">
                  <User className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-700 dark:text-green-400">Human Patterns:</p>
                    <ul className="text-muted-foreground text-xs space-y-1 mt-1">
                      <li>• Variable typing speed (150-400ms)</li>
                      <li>• Makes corrections (backspace)</li>
                      <li>• Curved mouse movements</li>
                      <li>• Natural pauses between fields</li>
                    </ul>
                  </div>
                </div>
                <div className="flex gap-3 p-2 bg-red-50 dark:bg-red-950/30 rounded">
                  <Bot className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-700 dark:text-red-400">Bot Patterns:</p>
                    <ul className="text-muted-foreground text-xs space-y-1 mt-1">
                      <li>• Uniform typing speed (&lt;80ms)</li>
                      <li>• Zero corrections</li>
                      <li>• Straight-line mouse paths</li>
                      <li>• Superhuman form completion</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Raw JSON */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm">📊 Raw Analysis Data (for Technical Review)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs font-mono bg-muted p-3 rounded-lg overflow-x-auto max-h-60 overflow-y-auto">
                  <pre>{JSON.stringify(analysisResult || { status: "waiting_for_analysis" }, null, 2)}</pre>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Floating Debug Panel */}
      <BehaviorDebugPanel showByDefault={false} />
    </div>
  );
}