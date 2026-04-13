'use client';

import { useEffect, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Target,
  Sprout,
  RefreshCw,
  Leaf,
  ArrowRight,
  Shield,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// ─── Animation variants ────────────────────────────────────────────────────

const fadeUpVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay: i * 0.15,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
};

const floatVariants = {
  animate: (i: number) => ({
    y: [0, -8, 0],
    transition: {
      duration: 3 + i * 0.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  }),
};

// ─── Feature cards ──────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: <LayoutDashboard className="w-6 h-6" />,
    title: 'Financial Garden',
    description:
      'See your complete financial landscape at a glance. Watch your wealth bloom with real-time charts and insights.',
    gradient: 'from-brand-500/20 to-brand-400/10',
    iconColor: 'text-brand-400',
    iconBg: 'bg-brand-500/10',
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: 'Seed & Track',
    description:
      'Plant every dollar with purpose. Categorize income, expenses, bills, and watch your financial seeds take root.',
    gradient: 'from-amber-500/20 to-amber-400/10',
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/10',
  },
  {
    icon: <Target className="w-6 h-6" />,
    title: 'Harvest Goals',
    description:
      'Set savings goals and debt payoff targets. Nurture your progress and reap the rewards of disciplined planning.',
    gradient: 'from-orange-600/20 to-amber-600/10',
    iconColor: 'text-orange-400',
    iconBg: 'bg-orange-500/10',
  },
  {
    icon: <RefreshCw className="w-6 h-6" />,
    title: 'Always Growing',
    description:
      'Your financial garden syncs across all devices instantly. Tend to your budget anywhere, anytime.',
    gradient: 'from-brand-700/20 to-brand-600/10',
    iconColor: 'text-brand-300',
    iconBg: 'bg-brand-700/10',
  },
];

// ─── Google icon SVG ────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

// ─── Main landing page ──────────────────────────────────────────────────────

export default function LandingPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [signingIn, setSigningIn] = useState(false);

  // Redirect authenticated users
  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  const handleSignIn = useCallback(async () => {
    setSigningIn(true);
    try {
      await signInWithGoogle();
      // Redirect happens via useEffect when user state updates
    } catch (err) {
      console.error('Sign-in failed:', err);
      setSigningIn(false);
    }
  }, [signInWithGoogle]);

  // Show nothing while auth is loading or user is already signed in — prevents flash
  if (loading || user || signingIn) {
    return (
      <div className="fixed inset-0 bg-navy-950 flex items-center justify-center">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-navy-800" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-brand-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-950 overflow-hidden relative">
      {/* ── Background decorative elements ───────────────────────────────── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Top-left orb */}
        <motion.div
          custom={0}
          variants={floatVariants}
          animate="animate"
          className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-brand-500/[0.04] blur-3xl"
        />
        {/* Top-right orb */}
        <motion.div
          custom={1}
          variants={floatVariants}
          animate="animate"
          className="absolute -top-20 -right-40 w-[600px] h-[600px] rounded-full bg-amber-500/[0.03] blur-3xl"
        />
        {/* Bottom center orb */}
        <motion.div
          custom={2}
          variants={floatVariants}
          animate="animate"
          className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-brand-500/[0.03] blur-3xl"
        />
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
      </div>

      {/* ── Navigation bar ───────────────────────────────────────────────── */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-glow">
            <Sprout className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold gradient-text-accent tracking-tight">
            Harvestly
          </span>
        </div>

        <button
          onClick={handleSignIn}
          className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-navy-300 hover:text-white border border-navy-700/50 hover:border-navy-600 bg-navy-900/50 hover:bg-navy-800/50 transition-all duration-200"
        >
          Sign in
          <ArrowRight className="w-4 h-4" />
        </button>
      </motion.nav>

      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-16 md:pt-24 pb-20">
        {/* Badge */}
        <motion.div
          custom={0}
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 mb-8"
        >
          <Leaf className="w-3.5 h-3.5 text-brand-400" />
          <span className="text-xs font-medium text-brand-400">
            Smart budgeting, naturally simple
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          custom={1}
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl"
        >
          <span className="text-white">Grow Your</span>
          <br />
          <span className="gradient-text-accent">Financial Future</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          custom={2}
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          className="mt-6 text-base sm:text-lg text-navy-400 max-w-2xl leading-relaxed"
        >
          Cultivate your wealth from the ground up. Track income, expenses, bills, savings,
          and debt — all in one beautiful dashboard. Plant seeds today, harvest results tomorrow.
        </motion.p>

        {/* CTA button */}
        <motion.div
          custom={3}
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          className="mt-10"
        >
          <button
            onClick={handleSignIn}
            className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-base font-semibold text-white bg-gradient-to-r from-brand-500 to-brand-600 shadow-glow hover:shadow-glow-lg transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98]"
          >
            <GoogleIcon />
            <span>Get Started with Google</span>
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />

            {/* Glow effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-brand-400/20 to-brand-600/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
          </button>

          <p className="mt-4 text-xs text-navy-500 flex items-center justify-center gap-1.5">
            <Shield className="w-3 h-3" />
            Secure Google authentication. No passwords needed.
          </p>
        </motion.div>
      </section>

      {/* ── Features Section ─────────────────────────────────────────────── */}
      <section className="relative z-10 px-6 md:px-12 pb-24">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Everything you need to cultivate your wealth
          </h2>
          <p className="text-sm text-navy-400 max-w-lg mx-auto">
            Powerful features rooted in simplicity, designed to help your finances flourish.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              custom={i + 4}
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
              className="group relative rounded-2xl bg-navy-900/60 border border-navy-800/50 p-6 hover:border-navy-700/50 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            >
              {/* Gradient overlay on hover */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
              />

              <div className="relative z-10">
                <div
                  className={`w-12 h-12 rounded-xl ${feature.iconBg} flex items-center justify-center ${feature.iconColor} mb-4`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-base font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-navy-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-navy-800/50 py-8 px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between max-w-6xl mx-auto gap-4">
          <div className="flex items-center gap-2">
            <Sprout className="w-4 h-4 text-brand-500" />
            <span className="text-sm font-semibold gradient-text-accent">
              Harvestly
            </span>
          </div>
          <p className="text-xs text-navy-500">
            Grown with care. Your data stays private and secure.
          </p>
        </div>
      </footer>
    </div>
  );
}
