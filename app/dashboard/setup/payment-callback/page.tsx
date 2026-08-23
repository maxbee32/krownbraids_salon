"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";

function PaymentCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Verifying your payment...');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        console.log("=== Payment Callback Page Loaded ===");
        console.log("🔍 Full URL:", window.location.href);
        console.log("🔍 Search params:", window.location.search);
        
        const token = localStorage.getItem('adminToken');
        
        // Get all parameters from URL
        let checkoutId = searchParams.get('checkoutId');
        const statusParam = searchParams.get('status');
        const salonIdParam = searchParams.get('salonId');
        const planIdParam = searchParams.get('planId');
        const sessionId = searchParams.get('sessionId');
        
        console.log('🔍 Payment callback params:', { 
          checkoutId, 
          sessionId,
          statusParam, 
          salonIdParam, 
          planIdParam,
          allParams: Object.fromEntries(searchParams.entries())
        });

        // If no checkoutId in URL, try to get it from localStorage
        if (!checkoutId) {
          checkoutId = localStorage.getItem('checkoutId');
          console.log('🔍 Using checkoutId from localStorage:', checkoutId);
        }

        // If still no checkoutId, try to use sessionId
        if (!checkoutId && sessionId) {
          checkoutId = sessionId;
          console.log('🔍 Using sessionId as checkoutId:', checkoutId);
        }

        // Handle cancellation
        if (statusParam === 'cancel' || statusParam === 'CANCELLED') {
          setStatus('error');
          setMessage('Payment was cancelled. You can try again.');
          setTimeout(() => {
            router.push('/dashboard/setup');
          }, 3000);
          return;
        }

        if (!checkoutId) {
          setStatus('error');
          setMessage('No payment ID found. Please contact support.');
          setTimeout(() => {
            router.push('/dashboard/setup');
          }, 3000);
          return;
        }

        console.log(`🔍 Verifying payment for checkout: ${checkoutId}`);

        // Call the payment verify API
        const response = await fetch(`/api/auth/payment/verify/${checkoutId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await response.json();
        console.log('📥 Payment verification response:', data);

        // 🔥 FIX: Check if payment was successful
        // The response might have a 'paid' field or the status might be in the response
        const isPaid = data.success === true || 
                       data.paid === true ||
                       data.status === 'SUCCESS' || 
                       data.status === 'PAID' || 
                       data.status === 'success' || 
                       data.status === 'PAYMENT_RECEIVED' ||
                       data.status === 'COMPLETED';

        console.log(`🔍 Is payment paid? ${isPaid}`);

        if (isPaid) {
          setStatus('success');
          setMessage('Payment successful! Redirecting to review...');
          
          // Update onboarding progress to REVIEW step (step 3)
          const salonId = salonIdParam || localStorage.getItem('setupSalonId');
          const planId = planIdParam || localStorage.getItem('setupSelectedPlanId');
          
          console.log(`🔍 Updating onboarding - Salon: ${salonId}, Plan: ${planId}`);
          
          try {
            const onboardingResponse = await fetch('/api/auth/business/salons/onboarding', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                currentStep: 3,
                step: 'REVIEW',
                completed: false,
                salonId: salonId,
                selectedPlanId: planId,
              }),
            });
            
            const onboardingData = await onboardingResponse.json();
            console.log('📥 Onboarding update response:', onboardingData);
            
            if (onboardingResponse.ok) {
              console.log('✅ Onboarding updated to REVIEW step');
            } else {
              console.warn('⚠️ Failed to update onboarding:', onboardingData);
            }
          } catch (error) {
            console.warn('Failed to update onboarding:', error);
          }

          // Update localStorage
          localStorage.setItem('setupStep', '3');
          localStorage.setItem('paymentStatus', 'success');
          localStorage.removeItem('checkoutId'); // Clean up
          
          // 🔥 Redirect to review page after short delay
          setTimeout(() => {
            console.log('🔀 Redirecting to /dashboard/setup');
            router.push('/dashboard/setup');
          }, 2000);
          
        } else {
          // Payment was not successful
          setStatus('error');
          setMessage(`Payment status: ${data.status || 'Unknown'}. Please contact support.`);
          setTimeout(() => {
            router.push('/dashboard/setup');
          }, 3000);
        }
        
      } catch (error) {
        console.error('❌ Payment verification error:', error);
        setStatus('error');
        setMessage('Error verifying payment. Please contact support.');
        setTimeout(() => {
          router.push('/dashboard/setup');
        }, 3000);
      }
    };

    verifyPayment();
  }, [searchParams, router]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <div className="absolute inset-0 w-full h-full">
        <div className="relative w-full h-full">
          <Image
            src="/assets/styke-12.webp"
            alt="Background"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 border border-white/10 max-w-md w-full text-center">
          
          {status === 'processing' && (
            <>
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-purple-500/30 border-t-purple-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Processing Payment</h2>
              <p className="text-white/50 text-sm">{message}</p>
              <div className="mt-4 text-white/20 text-xs">
                Please wait while we verify your payment...
              </div>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Payment Successful! 🎉</h2>
              <p className="text-white/50 text-sm mb-6">{message}</p>
              <div className="animate-pulse text-white/30 text-sm">
                Redirecting to review...
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Payment Failed</h2>
              <p className="text-white/50 text-sm mb-6">{message}</p>
              <button
                onClick={() => router.push('/dashboard/setup')}
                className="w-full bg-white/20 py-3 rounded-lg text-white font-medium hover:bg-white/30 transition-all"
              >
                Return to Setup
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PaymentCallback() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-black text-white">Loading...</div>}>
      <PaymentCallbackContent />
    </Suspense>
  );
}