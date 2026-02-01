import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import VerificationResults from '@/models/result';

// Backend API URL
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function POST(request) {
  try {
    const { verificationId } = await request.json();

    if (!verificationId) {
      return NextResponse.json({ error: 'Verification ID required' }, { status: 400 });
    }

    // Connect to database
    await connectDB();
    const db = mongoose.connection.db;

    // Fetch verification document
    const verification = await db.collection('verifications').findOne({
      _id: new mongoose.Types.ObjectId(verificationId)
    });

    if (!verification) {
      return NextResponse.json({ error: 'Verification not found' }, { status: 404 });
    }

    console.log('🚀 Starting ML processing for verification:', verificationId);

    // ============ UPDATE STATUS TO UNDER_AUTOMATED_VERIFICATION ============
    await db.collection('verifications').updateOne(
      { _id: new mongoose.Types.ObjectId(verificationId) },
      {
        $set: {
          status: 'under_automated_verification',
          updatedAt: new Date()
        },
        $push: {
          statusHistory: {
            status: 'under_automated_verification',
            changedAt: new Date(),
            remarks: 'AI verification processing started'
          }
        }
      }
    );

    const startTime = Date.now();
    const timings = {};
    const errors = [];

    // Initialize verification results document
    const verificationResult = new VerificationResults({
      userId: verification.userId,
      verificationId: new mongoose.Types.ObjectId(verificationId),
      sessionId: `session_${verificationId}_${Date.now()}`,
      status: 'processing',
      startedAt: new Date()
    });

    await verificationResult.save();
    console.log('✅ Verification result document created:', verificationResult._id);

    // ============ 1. AADHAAR OCR ============
    console.log('📄 Processing Aadhaar OCR...');
    const aadhaarStartTime = Date.now();
    try {
      const aadhaarResponse = await fetch(`${BACKEND_URL}/aadhar/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: verification.aadhaarCardImage.secureUrl
        })
      });

      if (aadhaarResponse.ok) {
        const aadhaarData = await aadhaarResponse.json();
        console.log('✅ Aadhaar OCR completed:', aadhaarData);
        
        // Parse extracted fields - handle both named keys and numeric keys
        const extractedFields = aadhaarData.result?.extracted_fields || aadhaarData.extracted_fields || {};
        const fieldsArray = Object.values(extractedFields);
        
        // Try to map numeric keys to fields or use named keys
        const aadhaarNumber = extractedFields.AADHAR_NO || extractedFields['0'] || fieldsArray[0] || '';
        const dob = extractedFields.DOB || extractedFields['1'] || fieldsArray[1] || '';
        const genderRaw = extractedFields.GENDER || extractedFields['2'] || fieldsArray[2] || '';
        const name = extractedFields.NAME || extractedFields['3'] || fieldsArray[3] || '';
        const address = extractedFields.ADDRESS || extractedFields['4'] || fieldsArray[4] || '';
        
        // Validate gender enum or set to null
        const validGenders = ['MALE', 'FEMALE', 'OTHER'];
        const genderUpper = genderRaw?.toString().toUpperCase().trim();
        const gender = validGenders.includes(genderUpper) ? genderUpper : null;
        
        verificationResult.aadhaarCardOCR = {
          biometric_type: 'aadhar_card',
          model: 'roboflow/aadhar-card-entity-detection',
          timestamp: new Date(),
          result: {
            detected: aadhaarData.detected || aadhaarData.result?.detected || false,
            extracted_fields: extractedFields,
            raw_predictions: aadhaarData.predictions || aadhaarData.result?.raw_predictions || []
          },
          imageUrl: verification.aadhaarCardImage.secureUrl,
          verified: aadhaarData.detected || aadhaarData.result?.detected || false,
          extractedData: {
            aadhaarNumber: aadhaarNumber,
            name: name,
            gender: gender,
            dateOfBirth: dob,
            address: address
          }
        };
        
        timings.aadhaarOCR = Date.now() - aadhaarStartTime;
      } else {
        const errorData = await aadhaarResponse.json();
        throw new Error(errorData.detail || 'Aadhaar OCR failed');
      }
    } catch (error) {
      console.error('❌ Aadhaar OCR error:', error);
      errors.push({
        stage: 'aadhaar_ocr',
        message: error.message,
        code: 'AADHAAR_OCR_FAILED'
      });
      timings.aadhaarOCR = Date.now() - aadhaarStartTime;
    }

    // ============ 2. PAN CARD OCR ============
    console.log('📄 Processing PAN Card OCR...');
    const panStartTime = Date.now();
    try {
      const panResponse = await fetch(`${BACKEND_URL}/pan/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: verification.panCardImage.secureUrl
        })
      });

      if (panResponse.ok) {
        const panData = await panResponse.json();
        console.log('✅ PAN Card OCR completed:', panData);
        
        // Extract data from nested result or root level
        const resultData = panData.result || panData;
        const detected = resultData.detected !== undefined ? resultData.detected : false;
        const boxes = resultData.boxes || [];
        const textData = resultData.text_data || [];
        
        verificationResult.panCardOCR = {
          biometric_type: panData.biometric_type || 'pan_card',
          model: panData.model || 'foduucom/pan-card-detection',
          timestamp: panData.timestamp ? new Date(panData.timestamp) : new Date(),
          result: {
            detected: detected,
            boxes: boxes,
            text_data: textData
          },
          imageUrl: verification.panCardImage.secureUrl,
          verified: detected,
          extractedData: {
            panNumber: panData.extracted_data?.pan_number || '',
            name: panData.extracted_data?.name || '',
            dateOfBirth: panData.extracted_data?.date_of_birth || '',
            fatherName: panData.extracted_data?.father_name || ''
          }
        };
        
        timings.panOCR = Date.now() - panStartTime;
      } else {
        const errorData = await panResponse.json();
        throw new Error(errorData.detail || 'PAN OCR failed');
      }
    } catch (error) {
      console.error('❌ PAN OCR error:', error);
      errors.push({
        stage: 'pan_ocr',
        message: error.message,
        code: 'PAN_OCR_FAILED'
      });
      timings.panOCR = Date.now() - panStartTime;
    }

    // ============ 3. FACE BIOMETRICS ============
    console.log('👤 Processing Face Biometrics...');
    const faceStartTime = Date.now();
    try {
      // Extract face capture URLs
      const faceUrls = [];
      if (verification.biometricSelfies) {
        const angles = ['front', 'left', 'right', 'up'];
        for (const angle of angles) {
          if (verification.biometricSelfies[angle]?.secureUrl) {
            faceUrls.push(verification.biometricSelfies[angle].secureUrl);
          }
        }
      }

      if (faceUrls.length > 0) {
        const faceResponse = await fetch(`${BACKEND_URL}/face/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            frame_urls: faceUrls
          })
        });

        if (faceResponse.ok) {
          const faceData = await faceResponse.json();
          console.log('✅ Face Biometrics completed:', faceData);
          
          // Extract data from nested result or root level
          const resultData = faceData.result || faceData;
          const numFrames = resultData.num_frames !== undefined ? resultData.num_frames : 0;
          const fakeProbability = resultData.fake_probability !== undefined ? resultData.fake_probability : 0;
          const realProbability = resultData.real_probability !== undefined ? resultData.real_probability : 0;
          const decision = resultData.decision || 'REVIEW';
          
          verificationResult.faceVerification = {
            biometric_type: faceData.biometric_type || 'face',
            model: faceData.model || 'prithivMLmods/deepfake-detector-model-v1',
            timestamp: faceData.timestamp ? new Date(faceData.timestamp) : new Date(),
            result: {
              num_frames: numFrames,
              fake_probability: fakeProbability,
              real_probability: realProbability,
              decision: decision
            },
            faceImageUrls: faceUrls,
            verified: decision === 'PASS'
          };
          
          timings.faceVerification = Date.now() - faceStartTime;
        } else {
          const errorData = await faceResponse.json();
          throw new Error(errorData.detail || 'Face verification failed');
        }
      } else {
        console.log('⚠️ No face captures found, skipping face biometrics');
      }
    } catch (error) {
      console.error('❌ Face Biometrics error:', error);
      errors.push({
        stage: 'face_biometrics',
        message: error.message,
        code: 'FACE_BIOMETRICS_FAILED'
      });
      timings.faceVerification = Date.now() - faceStartTime;
    }

    // ============ 4. MANIPULATION DETECTION - AADHAAR ============
    console.log('🔍 Processing Aadhaar Manipulation Detection...');
    const aadhaarManipStartTime = Date.now();
    try {
      const aadhaarManipResponse = await fetch(`${BACKEND_URL}/manipulation/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: verification.aadhaarCardImage.secureUrl
        })
      });

      if (aadhaarManipResponse.ok) {
        const aadhaarManipData = await aadhaarManipResponse.json();
        console.log('✅ Aadhaar Manipulation Detection completed:', aadhaarManipData);
        
        if (!verificationResult.manipulationDetection) {
          verificationResult.manipulationDetection = {};
        }
        
        // Extract data from nested result or root level
        const resultData = aadhaarManipData.result || aadhaarManipData;
        const isAuthentic = resultData.is_authentic !== undefined ? resultData.is_authentic : false;
        const confidence = resultData.confidence !== undefined ? resultData.confidence : 0;
        const rawOutput = resultData.raw_output !== undefined ? resultData.raw_output : 0;
        const decision = resultData.decision || (isAuthentic ? 'PASS' : 'FAIL');
        
        verificationResult.manipulationDetection.aadhaarCard = {
          check_type: aadhaarManipData.check_type || 'image_manipulation',
          method: aadhaarManipData.method || 'ELA + CNN',
          timestamp: aadhaarManipData.timestamp ? new Date(aadhaarManipData.timestamp) : new Date(),
          result: {
            prediction: resultData.prediction || 'Authentic',
            is_authentic: isAuthentic,
            confidence: confidence,
            raw_output: rawOutput,
            decision: decision
          },
          imageUrl: verification.aadhaarCardImage.secureUrl,
          verified: isAuthentic
        };
      } else {
        const errorData = await aadhaarManipResponse.json();
        throw new Error(errorData.detail || 'Aadhaar manipulation check failed');
      }
    } catch (error) {
      console.error('❌ Aadhaar Manipulation Detection error:', error);
      errors.push({
        stage: 'aadhaar_manipulation',
        message: error.message,
        code: 'AADHAAR_MANIPULATION_FAILED'
      });
    }

    // ============ 5. MANIPULATION DETECTION - PAN ============
    console.log('🔍 Processing PAN Manipulation Detection...');
    const panManipStartTime = Date.now();
    try {
      const panManipResponse = await fetch(`${BACKEND_URL}/manipulation/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: verification.panCardImage.secureUrl
        })
      });

      if (panManipResponse.ok) {
        const panManipData = await panManipResponse.json();
        console.log('✅ PAN Manipulation Detection completed:', panManipData);
        
        if (!verificationResult.manipulationDetection) {
          verificationResult.manipulationDetection = {};
        }
        
        // Extract data from nested result or root level
        const resultData = panManipData.result || panManipData;
        const isAuthentic = resultData.is_authentic !== undefined ? resultData.is_authentic : false;
        const confidence = resultData.confidence !== undefined ? resultData.confidence : 0;
        const rawOutput = resultData.raw_output !== undefined ? resultData.raw_output : 0;
        const decision = resultData.decision || (isAuthentic ? 'PASS' : 'FAIL');
        
        verificationResult.manipulationDetection.panCard = {
          check_type: panManipData.check_type || 'image_manipulation',
          method: panManipData.method || 'ELA + CNN',
          timestamp: panManipData.timestamp ? new Date(panManipData.timestamp) : new Date(),
          result: {
            prediction: resultData.prediction || 'Authentic',
            is_authentic: isAuthentic,
            confidence: confidence,
            raw_output: rawOutput,
            decision: decision
          },
          imageUrl: verification.panCardImage.secureUrl,
          verified: isAuthentic
        };
        
        const manipCheckTime = Date.now() - aadhaarManipStartTime;
        timings.manipulationCheck = manipCheckTime;
      } else {
        const errorData = await panManipResponse.json();
        throw new Error(errorData.detail || 'PAN manipulation check failed');
      }
    } catch (error) {
      console.error('❌ PAN Manipulation Detection error:', error);
      errors.push({
        stage: 'pan_manipulation',
        message: error.message,
        code: 'PAN_MANIPULATION_FAILED'
      });
    }

    // ============ FINALIZE RESULTS ============
    const totalTime = Date.now() - startTime;
    
    verificationResult.processingTime = {
      total: totalTime,
      faceVerification: timings.faceVerification || 0,
      panOCR: timings.panOCR || 0,
      aadhaarOCR: timings.aadhaarOCR || 0,
      manipulationCheck: timings.manipulationCheck || 0
    };

    // Add any errors
    if (errors.length > 0) {
      verificationResult.errors = errors;
      verificationResult.status = 'partial';
    } else {
      verificationResult.status = 'completed';
    }

    // Calculate overall assessment (this now includes verificationStatus and isHighRisk)
    verificationResult.calculateOverallAssessment();
    verificationResult.completedAt = new Date();

    await verificationResult.save();

    console.log('✅ ML Processing completed in', totalTime, 'ms');
    console.log('📊 Overall Assessment:', verificationResult.overallAssessment);

    // ============ GET THE PROPER VERIFICATION STATUS FROM THE MODEL ============
    const newVerificationStatus = verificationResult.getVerificationStatus();
    const isHighRisk = verificationResult.checkIsHighRisk();
    const aiScore = verificationResult.overallAssessment?.totalScore || 0;
    const aiRiskLevel = verificationResult.overallAssessment?.riskLevel || 'MEDIUM';

    console.log(`📋 Setting verification status to: ${newVerificationStatus} (High Risk: ${isHighRisk})`);

    // Update verification document with results reference and proper status
    await db.collection('verifications').updateOne(
      { _id: new mongoose.Types.ObjectId(verificationId) },
      {
        $set: {
          mlResultsId: verificationResult._id,
          mlProcessingCompleted: true,
          status: newVerificationStatus, // Now properly set to 'under_officer_review'
          isHighRisk: isHighRisk,
          aiVerificationResults: {
            overallScore: aiScore,
            riskLevel: aiRiskLevel,
            decision: verificationResult.overallAssessment?.finalDecision || 'PENDING',
            passedChecks: verificationResult.overallAssessment?.passedChecks || 0,
            failedChecks: verificationResult.overallAssessment?.failedChecks || 0,
            reviewRequiredChecks: verificationResult.overallAssessment?.reviewRequiredChecks || 0,
            issues: verificationResult.overallAssessment?.issues || [],
            recommendations: verificationResult.overallAssessment?.recommendations || [],
            completedAt: new Date()
          },
          updatedAt: new Date()
        },
        $push: {
          statusHistory: {
            status: newVerificationStatus,
            changedAt: new Date(),
            remarks: `AI verification completed. Score: ${aiScore}/100, Risk: ${aiRiskLevel}${isHighRisk ? ' ⚠️ HIGH RISK' : ''}`
          }
        }
      }
    );

    // Update user verification status
    await db.collection('users').updateOne(
      { _id: verification.userId },
      {
        $set: {
          verificationStatus: newVerificationStatus,
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json({
      success: true,
      verificationId,
      resultId: verificationResult._id.toString(),
      status: verificationResult.status,
      newVerificationStatus: newVerificationStatus,
      isHighRisk: isHighRisk,
      overallAssessment: verificationResult.overallAssessment,
      processingTime: totalTime
    });

  } catch (error) {
    console.error('AI processing error:', error);
    return NextResponse.json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}