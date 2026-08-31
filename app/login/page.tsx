"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Phone, KeyRound, ArrowRight, Loader2, ShieldCheck, Layers } from "lucide-react";

function LoginForm() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get("message");

  const dynamicWords = ["shipping costs", "editing time", "dimensional weight", "return rates"];
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % dynamicWords.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const isEmail = identifier.includes('@');
      const payload = isEmail ? { email: identifier, purpose: "login" } : { mobileNumber: identifier, purpose: "login" };
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        identifier,
        password: loginMethod === 'password' ? password : "",
        otp: loginMethod === 'otp' ? otp : "",
        loginType: loginMethod,
      });

      if (res?.error) {
        setError(res.error || "Invalid credentials or OTP");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Animation variants
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
        {/* Logo & Headline */}
        <div className="text-center mb-8">
          <motion.div variants={itemVariants} className="flex items-center justify-center space-x-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#0B0F19] shadow-md">
              <Layers className="h-5 w-5" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-white">
              EcomLens
            </span>
          </motion.div>

          <motion.h1 
            variants={itemVariants}
            className="text-2xl font-extrabold text-white tracking-tight flex flex-col gap-1 items-center justify-center"
          >
            <span>Reduce your</span>
            <span className="relative h-[1.2em] block w-full overflow-hidden text-center">
              <AnimatePresence>
                <motion.span
                  key={wordIndex}
                  initial={{ y: "100%", opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: "-100%", opacity: 0 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="absolute inset-0 block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-indigo-400 pb-2"
                >
                  {dynamicWords[wordIndex]}
                </motion.span>
              </AnimatePresence>
            </span>
          </motion.h1>
        </div>

        {/* Form Card */}
        <motion.div variants={itemVariants} className="bg-[#131b2c]/80 backdrop-blur-xl p-7 rounded-[1.5rem] border border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.4)] relative overflow-hidden">
          
          <h2 className="text-lg font-bold text-white tracking-tight text-center mb-2">
            Welcome back
          </h2>
          <p className="text-[13px] text-slate-400 text-center font-medium mb-6">
            Log in to your dashboard to continue.
          </p>

          {step === 1 && (
            <motion.div variants={itemVariants} className="flex bg-[#0B0F19]/60 p-1 rounded-xl mb-6 relative border border-slate-800/50">
              <button
                type="button"
                className={`flex-1 py-2 text-[13px] font-bold rounded-lg transition-all duration-300 z-10 ${
                  loginMethod === 'password' ? 'text-white' : 'text-slate-400 hover:text-white'
                }`}
                onClick={() => { setLoginMethod('password'); setError(""); }}
              >
                Password
              </button>
              <button
                type="button"
                className={`flex-1 py-2 text-[13px] font-bold rounded-lg transition-all duration-300 z-10 ${
                  loginMethod === 'otp' ? 'text-white' : 'text-slate-400 hover:text-white'
                }`}
                onClick={() => { setLoginMethod('otp'); setError(""); }}
              >
                OTP Login
              </button>
              {/* Animated Background Pill */}
              <motion.div
                className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-slate-800 rounded-lg shadow-sm border border-slate-700"
                initial={false}
                animate={{ left: loginMethod === 'password' ? '4px' : 'calc(50% + 0px)' }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            </motion.div>
          )}
          
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.form 
                key="step1"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                className="space-y-4" 
                onSubmit={loginMethod === 'password' ? handleLogin : handleSendOtp}
              >
                {message && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="text-[13px] font-bold text-emerald-400 bg-emerald-950/30 px-3 py-2.5 rounded-xl border border-emerald-900/50 flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-500" /> {message}
                  </motion.div>
                )}
                {error && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="text-[13px] font-bold text-red-400 bg-red-950/30 px-3 py-2.5 rounded-xl border border-red-900/50 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> {error}
                  </motion.div>
                )}
                
                <div className="space-y-4">
                  <div className={`relative rounded-xl border-[1.5px] transition-all duration-300 ${focusedField === 'identifier' ? 'border-emerald-500 bg-[#0B0F19] shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 'border-slate-800 bg-[#0B0F19]/50'}`}>
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
                  
                  <AnimatePresence>
                    {loginMethod === 'password' && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      >
                        <div className={`relative rounded-xl border-[1.5px] transition-all duration-300 ${focusedField === 'password' ? 'border-emerald-500 bg-[#0B0F19] shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 'border-slate-800 bg-[#0B0F19]/50'}`}>
                          <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors duration-300 ${focusedField === 'password' ? 'text-emerald-500' : 'text-slate-500'}`}>
                            <Lock size={16} />
                          </div>
                          <input
                            type="password"
                            required
                            className="block w-full pl-10 pr-3.5 py-3 bg-transparent text-[13px] text-white focus:outline-none placeholder-slate-500 font-semibold"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onFocus={() => setFocusedField('password')}
                            onBlur={() => setFocusedField(null)}
                          />
                        </div>
                        <div className="flex justify-end mt-2">
                          <Link href="/forgot-password" className="text-[12px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors">
                            Forgot Password?
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center py-3 px-4 rounded-xl text-[13px] font-extrabold text-[#0B0F19] bg-white hover:bg-slate-200 focus:outline-none focus:ring-4 focus:ring-white/10 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                  >
                    {loading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>
                        {loginMethod === 'password' ? "Sign In" : "Get Code"}
                        <ArrowRight size={16} className="ml-1.5" />
                      </>
                    )}
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
                onSubmit={handleLogin}
              >
                {error && (
                  <div className="text-[13px] font-bold text-red-400 bg-red-950/30 px-3 py-2.5 rounded-xl border border-red-900/50 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> {error}
                  </div>
                )}
                
                <div className="bg-[#0B0F19]/50 p-5 rounded-2xl border border-slate-800">
                  <p className="text-[13px] text-center text-slate-400 font-semibold mb-5">
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
                </div>
                
                <div className="pt-1 flex flex-col gap-3">
                  <button
                    type="submit"
                    disabled={loading || otp.length < 6}
                    className="w-full flex items-center justify-center py-3 px-4 rounded-xl text-[13px] font-extrabold text-[#0B0F19] bg-white hover:bg-slate-200 focus:outline-none focus:ring-4 focus:ring-white/10 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                  >
                    {loading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>
                        Verify & Login
                        <ArrowRight size={16} className="ml-1.5" />
                      </>
                    )}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setStep(1)} 
                    className="w-full py-2.5 px-4 text-[13px] font-bold text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                  >
                    Back to options
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div variants={itemVariants} className="mt-6 text-center">
          <p className="text-[13px] text-slate-400 font-semibold">
            Don't have an account?{" "}
            <Link href="/signup" className="text-white hover:underline underline-offset-4 transition-all font-bold">
              Create a free account
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#0B0F19]">
        <Loader2 size={32} className="text-white animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
