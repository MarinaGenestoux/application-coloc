import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Home, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button, Input } from '../components/ui';
import { authApi } from '../api/auth';

const MIN_PASSWORD_LENGTH = 8;

export function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'password' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStep('password');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères`);
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword(email, password);
      setStep('success');
    } catch {
      setError('Impossible de réinitialiser le mot de passe. Vérifiez votre email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 grid lg:grid-cols-2">
      {/* Left — Branding */}
      <div className="hidden lg:flex relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-primary via-blue-500 to-accent" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -left-24 w-[500px] h-[500px] rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-accent/30 blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <Home className="w-5 h-5" />
            </div>
            <span className="font-display text-2xl">ColocApp</span>
          </div>

          <div className="space-y-6">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="font-display text-5xl leading-[1.1]"
            >
              Réinitialisez
              <br />
              votre mot de passe
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-lg text-white/80 max-w-md"
            >
              Entrez votre email et choisissez un nouveau mot de passe pour retrouver l'accès à votre compte.
            </motion.p>
          </div>

          <div className="flex items-center gap-6 text-sm text-white/50">
            <span>Dépenses partagées</span>
            <span className="w-1 h-1 rounded-full bg-white/30" />
            <span>Soldes en temps réel</span>
            <span className="w-1 h-1 rounded-full bg-white/30" />
            <span>Décisions collectives</span>
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex items-center justify-center bg-white px-6 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-12">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md mx-auto"
        >
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25">
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-xl text-slate-900">ColocApp</span>
          </div>

          {step === 'email' && (
            <>
              <div className="mb-10">
                <h2 className="font-display text-2xl sm:text-3xl text-slate-900 mb-2">
                  Mot de passe oublié
                </h2>
                <p className="text-slate-500">Entrez l'email associé à votre compte</p>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-5">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  leftIcon={<Mail className="w-5 h-5" />}
                  required
                />

                <Button type="submit" className="w-full" size="lg">
                  Continuer
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
            </>
          )}

          {step === 'password' && (
            <>
              <div className="mb-10">
                <h2 className="font-display text-2xl sm:text-3xl text-slate-900 mb-2">
                  Nouveau mot de passe
                </h2>
                <p className="text-slate-500">
                  Choisissez un nouveau mot de passe pour <strong>{email}</strong>
                </p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-5">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                <Input
                  label="Nouveau mot de passe"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  leftIcon={<Lock className="w-5 h-5" />}
                  required
                />

                <Input
                  label="Confirmer le mot de passe"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  leftIcon={<Lock className="w-5 h-5" />}
                  required
                />

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => { setStep('email'); setError(''); }}
                    className="flex-shrink-0"
                    size="lg"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <Button type="submit" isLoading={isLoading} className="w-full" size="lg">
                    Réinitialiser
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            </>
          )}

          {step === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6"
            >
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h2 className="font-display text-2xl sm:text-3xl text-slate-900 mb-2">
                  Mot de passe mis à jour
                </h2>
                <p className="text-slate-500">
                  Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
                </p>
              </div>
              <Button onClick={() => navigate('/login')} className="w-full" size="lg">
                Se connecter
                <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}

          <p className="mt-10 text-center text-slate-500">
            <Link to="/login" className="text-primary font-medium hover:text-primary-dark transition-colors">
              Retour à la connexion
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
