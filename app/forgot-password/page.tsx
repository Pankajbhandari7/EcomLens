"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, KeyRound, ArrowRight, Loader2, Phone } from "lucide-react";

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  const router = useRouter();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const isEmail = identifier.includes('@');
      const payload = isEmail ? { email: identifier, purpose: "forgot-password" } : { mobileNumber: identifier, purpose: "forgot-password" };
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to send OTP");
      }
      
      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, otp, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to reset password");
      }

      router.push("/login?message=Password+reset+successfully.+Please+login.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] relative overflow-hidden flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background decoration */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-slate-900/40 rounded-full blur-[140px] -z-10 pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_80%,transparent_100%)] -z-10" />

      <motion.div 
        initial="hidden" 
        animate="visible" 
        variants={containerVariants}
        className="w-full max-w-[380px] z-10"
      >
        <div className="text-center mb-8">
          <motion.h1 
            variants={itemVariants}
            className="text-2xl font-extrabold text-white tracking-tight"
          >
            Reset Password
          </motion.h1>
        </div>

        <motion.div variants={itemVariants} className="bg-[#131b2c]/80 backdrop-blur-xl p-7 rounded-[1.5rem] border border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.4)] relative overflow-hidden">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.form 
                key="step1"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                className="space-y-4" 
                onSubmit={handleSendOtp}
              >
                {error && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="text-[13px] font-bold text-red-400 bg-red-950/30 px-3 py-2.5 rounded-xl border border-red-900/50 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> {error}
                  </motion.div>
                )}
                
                <p className="text-[13px] text-slate-400 text-center font-medium mb-4">
                  Enter your email or mobile number to receive a verification code.
                </p>

                <div className={`relative rounded-xl border-[1.5px] transition-all duration-300 ${focusedField === 'identifier' ? 'border-emerald-500 bg-[#0B0F19]' : 'border-slate-800 bg-[#0B0F19]/50'}`}>
                  <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors duration-300 ${focusedField === 'identifier' ? 'text-emerald-500' : 'text-slate-500'}`}>
                    {identifier.includes('@') ? <Mail size={16} /> : <Phone size={16} />}
                  </div>
                  <input
                    type="text"
                    required
                    className="block w-full pl-10 pr-3.5 py-3 bg-transparent text-[13px] text-white focus:outline-none placeholder-slate-500 font-semibold"
                    placeholder="Email or Mobile Number"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    onFocus={() => setFocusedField('identifier')}
                    onBlur={() => setFocusedField(null)}
                  />
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={loading || !identifier}
                    className="w-full flex items-center justify-center py-3 px-4 rounded-xl text-[13px] font-extrabold text-[#0B0F19] bg-white hover:bg-slate-200 focus:outline-none focus:ring-4 focus:ring-white/10 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : "Send Code"}
                  </button>
                </div>
              </motion.form>
            ) : (
              <motion.form 
                key="step2"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-5" 
                onSubmit={handleResetPassword}
              >
                {error && (
                  <div className="text-[13px] font-bold text-red-400 bg-red-950/30 px-3 py-2.5 rounded-xl border border-red-900/50 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> {error}
                  </div>
                )}
                
                <div className="bg-[#0B0F19]/50 p-5 rounded-2xl border border-slate-800 space-y-4">
                  <p className="text-[13px] text-center text-slate-400 font-semibold mb-2">
                    Code sent to <strong className="text-white block mt-1">{identifier}</strong>
                  </p>
                  
                  <div className={`relative rounded-xl border-[1.5px] transition-all duration-300 ${focusedField === 'otp' ? 'border-emerald-500 bg-[#0B0F19]' : 'border-slate-700 bg-slate-900/80'}`}>
                    <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors duration-300 ${focusedField === 'otp' ? 'text-emerald-500' : 'text-slate-500'}`}>
                      <KeyRound size={18} />
                    </div>
                    <input
                      type="text"
                      required
                      className="block w-full pl-10 pr-3.5 py-3 bg-transparent text-center tracking-[0.6em] text-xl font-extrabold text-white focus:outline-none"
                      placeholder="------"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      onFocus={() => setFocusedField('otp')}
                      onBlur={() => setFocusedField(null)}
                      maxLength={6}
                    />
                  </div>

                  <div className={`relative rounded-xl border-[1.5px] transition-all duration-300 ${focusedField === 'newPassword' ? 'border-emerald-500 bg-[#0B0F19]' : 'border-slate-700 bg-slate-900/80'}`}>
                    <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors duration-300 ${focusedField === 'newPassword' ? 'text-emerald-500' : 'text-slate-500'}`}>
                      <Lock size={16} />
                    </div>
                    <input
                      type="password"
                      required
                      className="block w-full pl-10 pr-3.5 py-3 bg-transparent text-[13px] text-white focus:outline-none placeholder-slate-500 font-semibold"
                      placeholder="New Password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      onFocus={() => setFocusedField('newPassword')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </div>
                </div>
                
                <div className="pt-1 flex flex-col gap-3">
                  <button
                    type="submit"
                    disabled={loading || otp.length < 6 || !newPassword}
                    className="w-full flex items-center justify-center py-3 px-4 rounded-xl text-[13px] font-extrabold text-[#0B0F19] bg-white hover:bg-slate-200 focus:outline-none focus:ring-4 focus:ring-white/10 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : "Reset Password"}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setStep(1)} 
                    className="w-full py-2.5 px-4 text-[13px] font-bold text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                  >
                    Back
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div variants={itemVariants} className="mt-6 text-center">
          <Link href="/login" className="text-[13px] text-slate-400 hover:text-white font-bold flex items-center justify-center gap-1">
            Back to login
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
