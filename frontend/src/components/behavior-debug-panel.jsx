'use client';

import { useState, useEffect } from 'react';
import { useBehaviorTracking } from '@/hooks/use-behavior-tracking';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  MousePointer2, 
  Keyboard, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Bot,
  User,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';

export function BehaviorDebugPanel({ showByDefault = false }) {
  const { getBehaviorData, resetTracking } = useBehaviorTracking();
  const [behaviorData, setBehaviorData] = useState(null);
  const [isVisible, setIsVisible] = useState(showByDefault);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Update behavior data periodically
  useEffect(() => {
    if (!isVisible) return;
    
    const updateData = () => {
      const data = getBehaviorData();
      setBehaviorData(data);
    };

    updateData(); // Initial update
    
    if (autoRefresh) {
      const interval = setInterval(updateData, 1000); // Update every second
      return () => clearInterval(interval);
    }
  }, [getBehaviorData, isVisible, autoRefresh]);

  const handleReset = () => {
    resetTracking();
    setBehaviorData(null);
    setTimeout(() => setBehaviorData(getBehaviorData()), 100);
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-orange-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskBadgeVariant = (level) => {
    switch (level) {
      case 'low': return 'default';
      case 'medium': return 'secondary';
      case 'high': return 'destructive';
      case 'critical': return 'destructive';
      default: return 'outline';
    }
  };

  if (!isVisible) {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 bg-primary hover:bg-primary/90 shadow-lg"
        size="sm"
      >
        <Eye className="h-4 w-4 mr-2" />
        Show Behavior Analysis
      </Button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[80vh] overflow-y-auto">
      <Card className="border-2 border-primary/50 shadow-2xl bg-background/95 backdrop-blur">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary animate-pulse" />
              Behavioral Analysis
            </CardTitle>
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => setIsVisible(false)}
              >
                <EyeOff className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription className="text-xs">
            Real-time fraud detection metrics
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {behaviorData ? (
            <>
              {/* Overall Score */}
              <div className="p-3 rounded-lg bg-muted/50 border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Trust Score</span>
                  <Badge variant={behaviorData.overallTrustScore >= 70 ? 'default' : 'destructive'}>
                    {behaviorData.overallTrustScore}/100
                  </Badge>
                </div>
                <Progress value={behaviorData.overallTrustScore} className="h-2" />
              </div>

              {/* Bot Likelihood */}
              <div className="p-3 rounded-lg bg-muted/50 border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium flex items-center gap-2">
                    {behaviorData.botLikelihood > 50 ? (
                      <Bot className="h-4 w-4 text-red-500" />
                    ) : (
                      <User className="h-4 w-4 text-green-500" />
                    )}
                    Bot Likelihood
                  </span>
                  <Badge variant={behaviorData.botLikelihood < 30 ? 'default' : 'destructive'}>
                    {behaviorData.botLikelihood}%
                  </Badge>
                </div>
                <Progress 
                  value={behaviorData.botLikelihood} 
                  className="h-2"
                />
              </div>

              {/* Risk Level */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                <span className="text-sm font-medium">Risk Level</span>
                <Badge className={getRiskColor(behaviorData.riskLevel)}>
                  {behaviorData.riskLevel?.toUpperCase()}
                </Badge>
              </div>

              {/* Recommendation */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                <span className="text-sm font-medium">Recommendation</span>
                <Badge variant="outline" className="text-xs">
                  {behaviorData.recommendation?.replace(/_/g, ' ')}
                </Badge>
              </div>

              {/* Component Scores */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Component Scores
                </h4>
                
                {/* Keystroke Analysis */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded bg-muted/30 border">
                    <div className="flex items-center gap-1 mb-1">
                      <Keyboard className="h-3 w-3" />
                      <span className="font-medium">Typing</span>
                    </div>
                    <div className="text-muted-foreground">
                      Score: {behaviorData.keystrokeAnalysis?.trustScore || 'N/A'}
                    </div>
                    <div className="text-muted-foreground">
                      Avg: {behaviorData.keystrokeAnalysis?.avgIntervalMs || 0}ms
                    </div>
                    <div className="text-muted-foreground">
                      Keys: {behaviorData.keystrokeAnalysis?.totalKeystrokes || 0}
                    </div>
                  </div>

                  {/* Mouse Analysis */}
                  <div className="p-2 rounded bg-muted/30 border">
                    <div className="flex items-center gap-1 mb-1">
                      <MousePointer2 className="h-3 w-3" />
                      <span className="font-medium">Mouse</span>
                    </div>
                    <div className="text-muted-foreground">
                      Score: {behaviorData.mouseAnalysis?.trustScore || 'N/A'}
                    </div>
                    <div className="text-muted-foreground">
                      Linear: {Math.round((behaviorData.mouseAnalysis?.linearityRatio || 0) * 100)}%
                    </div>
                    <div className="text-muted-foreground">
                      Moves: {behaviorData.mouseAnalysis?.totalMovements || 0}
                    </div>
                  </div>

                  {/* Paste Analysis */}
                  <div className="p-2 rounded bg-muted/30 border">
                    <div className="flex items-center gap-1 mb-1">
                      <AlertTriangle className="h-3 w-3" />
                      <span className="font-medium">Paste</span>
                    </div>
                    <div className="text-muted-foreground">
                      Score: {behaviorData.pasteAnalysis?.trustScore || 'N/A'}
                    </div>
                    <div className="text-muted-foreground">
                      Pasted: {behaviorData.pasteAnalysis?.pastePercentage || 0}%
                    </div>
                  </div>

                  {/* Speed Analysis */}
                  <div className="p-2 rounded bg-muted/30 border">
                    <div className="flex items-center gap-1 mb-1">
                      <Clock className="h-3 w-3" />
                      <span className="font-medium">Speed</span>
                    </div>
                    <div className="text-muted-foreground">
                      Score: {behaviorData.speedAnalysis?.trustScore || 'N/A'}
                    </div>
                    <div className="text-muted-foreground">
                      Time: {behaviorData.speedAnalysis?.totalTimeSeconds || 0}s
                    </div>
                  </div>
                </div>
              </div>

              {/* Flags Detected */}
              {behaviorData.flagsDetected?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    Flags Detected ({behaviorData.flagsDetected.length})
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {behaviorData.flagsDetected.map((flag, idx) => (
                      <Badge key={idx} variant="destructive" className="text-xs">
                        {flag.replace(/([A-Z])/g, ' $1').trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Raw Metrics */}
              <div className="text-xs text-muted-foreground border-t pt-2 mt-2">
                <div className="grid grid-cols-2 gap-1">
                  <span>Session: {Math.round((behaviorData.rawMetrics?.sessionDurationMs || 0) / 1000)}s</span>
                  <span>Fields: {behaviorData.rawMetrics?.totalFields || 0}</span>
                </div>
              </div>

              {/* Reset Button */}
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={handleReset}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset Tracking
              </Button>
            </>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 animate-pulse" />
              <p className="text-sm">Collecting behavior data...</p>
              <p className="text-xs">Start typing or moving mouse</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}