// app/verify/page.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
  EnvelopeIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  XMarkIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";

export default function VerifyPage() {
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const verifyEmail = localStorage.getItem('verifyEmail');
    if (verifyEmail) {
      setEmail(verifyEmail);
    } else {
      const userData = localStorage.getItem('adminData');
      if (userData) {
        try {
          const data = JSON.parse(userData);
          setEmail(data.email || '');
        } catch (e) {
          console.error('Failed to parse user data');
        }
      }
    }

    intervalRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 3) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) {
        (nextInput as HTMLInputElement).focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) {
        (prevInput as HTMLInputElement).focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    const digits = pastedData.replace(/\D/g, '').slice(0, 4);
    
    if (digits.length === 4) {
      const newOtp = digits.split('');
      setOtp(newOtp);
      const lastInput = document.getElementById('otp-3');
      if (lastInput) {
        (lastInput as HTMLInputElement).focus();
      }
    }
  };

  const getToken = () => {
    return localStorage.getItem('adminToken');
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length < 4) {
      setError("Please enter the complete 4-digit verification code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = getToken();
      
      if (!token) {
        setError("Authentication token not found. Please register again.");
        setLoading(false);
        return;
      }

      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          otp: otpCode,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        // Clear verification email from localStorage
        localStorage.removeItem('verifyEmail');
        // Clear any auth tokens since user needs to login after verification
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
        
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        if (data.requiresNewToken) {
          setError("Your verification session has expired. Please request a new code.");
        } else {
          setError(data.message || 'Invalid verification code. Please try again.');
        }
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError("");
    setResendSuccess(false);

    try {
      const token = getToken();
      
      if (!token) {
        setError("Authentication token not found. Please register again.");
        setResendLoading(false);
        return;
      }

      const response = await fetch('/api/auth/verify', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setResendSuccess(true);
        setTimer(60);
        setCanResend(false);
        setOtp(["", "", "", ""]);
        setError("");
        
        const firstInput = document.getElementById('otp-0');
        if (firstInput) {
          (firstInput as HTMLInputElement).focus();
        }
        
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        
        intervalRef.current = setInterval(() => {
          setTimer((prev) => {
            if (prev <= 1) {
              setCanResend(true);
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
              }
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        setTimeout(() => {
          setResendSuccess(false);
        }, 3000);
      } else {
        if (data.requiresNewToken) {
          setError("Your session has expired. Please register again.");
          setTimeout(() => {
            router.push('/signup');
          }, 2000);
        } else {
          setError(data.message || 'Failed to resend verification code. Please try again.');
        }
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
      <div className="absolute inset-0 w-full h-full">
        <div className="relative w-full h-full">
          <Image
            src="/assets/styke-12.webp"
            alt="Background"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60" />
          <div className="absolute inset-0 bg-[url('/assets/noise.png')] opacity-10 mix-blend-overlay" />
        </div>
      </div>

      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="relative backdrop-blur-2xl bg-white/5 rounded-3xl border border-white/10 shadow-2xl shadow-black/30 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
          
          <div className="p-8 md:p-10">
            <div className="flex items-center justify-center gap-3 mb-6">
              
              <span className="text-2xl font-bold text-white tracking-tight">
                KROWN<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">BRAIDS</span>
              </span>
            </div>

            {success ? (
              <div className="text-center py-4">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center animate-scale-in">
                  <CheckCircleIcon className="w-12 h-12 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Email Verified!</h2>
                <p className="text-white/60 text-sm">
                  Your account has been successfully verified.
                  <br />
                  Please login to continue.
                  <br />
                  <span className="text-white/40 text-xs">Redirecting to login...</span>
                </p>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="flex justify-center mb-3">
                    <div className="p-3 rounded-full bg-cyan-500/10">
                      <EnvelopeIcon className="w-8 h-8 text-cyan-400" />
                    </div>
                  </div>
                  <h1 className="text-2xl font-bold text-white mb-2">Verify Your Email</h1>
                  <p className="text-white/40 text-sm">
                    We&apos;ve sent a verification code to
                    <br />
                    <span className="text-white/60 font-medium">{email || 'your email'}</span>
                  </p>
                </div>

                {error && (
                  <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2 animate-shake">
                    <XMarkIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {resendSuccess && (
                  <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 flex items-start gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <p className="text-green-400 text-sm">New verification code sent successfully!</p>
                  </div>
                )}

                <div className="mb-6">
                  <label className="block text-white/40 text-xs font-medium mb-3 text-center tracking-wide">
                    ENTER VERIFICATION CODE
                  </label>
                  <div className="flex justify-center gap-3">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={handlePaste}
                        className="w-14 h-16 text-center bg-white/5 border border-white/10 rounded-xl text-white text-2xl font-bold focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 transition-all hover:border-white/20"
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>
                  <p className="text-white/20 text-xs text-center mt-2">
                    Enter the 4-digit code sent to your email
                  </p>
                </div>

                <button
                  onClick={handleVerify}
                  disabled={loading}
                  className="relative w-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl py-3.5 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 group overflow-hidden mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify Email</span>
                        <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>

                <div className="text-center">
                  <p className="text-white/40 text-sm">
                    Didn&apos;t receive the code?{" "}
                    {canResend ? (
                      <button
                        onClick={handleResend}
                        disabled={resendLoading}
                        className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium inline-flex items-center gap-1 disabled:opacity-50"
                      >
                        {resendLoading ? (
                          <>
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Sending...
                          </>
                        ) : (
                          <>
                            <ArrowPathIcon className="h-4 w-4" />
                            Resend Code
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="text-white/30">
                        Resend in {timer}s
                      </span>
                    )}
                  </p>
                </div>
              </>
            )}

            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-cyan-500/10 rounded-full blur-2xl" />
          </div>
        </div>

        <p className="text-center text-white/20 text-xs mt-6 tracking-widest uppercase">
          Secure Verification • 256-bit Encryption
        </p>
      </div>

      <style jsx>{`
        @keyframes scale-in {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        .animate-scale-in {
          animation: scale-in 0.5s ease-out;
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}