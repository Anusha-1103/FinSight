import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { TrendingUp, User, Lock, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await register(email, password, name);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#FAF8F5]">
      {/* Left Column: Brand & Editorial Showcase */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#F3F0E9] p-16 flex-col justify-between relative overflow-hidden border-r border-[#E7E3DB]">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-stone-900 flex items-center justify-center shadow-xs">
            <TrendingUp className="w-5 h-5 text-[#FAF8F5]" />
          </div>
          <div>
            <h2 className="font-serif text-lg font-black text-stone-900 tracking-tight leading-none">FinSight</h2>
            <p className="text-[9px] text-stone-500 font-mono tracking-wider mt-0.5 uppercase">WEALTH SYSTEMS</p>
          </div>
        </div>

        {/* Hero Tagline & Art Showcase */}
        <div className="space-y-12">
          <div className="space-y-4">
            <h1 className="font-serif text-5xl font-black text-stone-950 tracking-tight leading-[0.95]">
              Sophisticated systems<br />for personal wealth.
            </h1>
            <p className="text-sm text-stone-700 leading-relaxed max-w-sm">
              A quiet, minimal space to coordinate your assets, budgets, liabilities, cash flows, and savings goals. Built for modern builders.
            </p>
          </div>

          <div className="relative">
            <img
              src="/editorial_login_graphic.jpg"
              alt="Editorial Art Graphic"
              className="w-full max-w-[280px] rounded-lg border border-[#E7E3DB] shadow-md select-none"
            />
          </div>
        </div>

        {/* Footer Credit */}
        <p className="text-[10px] text-stone-500 font-mono">© {new Date().getFullYear()} FINSIGHT CORP. ALL RIGHTS RESERVED.</p>
      </div>

      {/* Right Column: Authentication Card */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12 lg:p-16">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo (Visible on small screens only) */}
          <div className="lg:hidden flex flex-col items-center space-y-2 text-center">
            <div className="w-10 h-10 rounded-lg bg-stone-900 flex items-center justify-center shadow-xs">
              <TrendingUp className="w-5.5 h-5.5 text-[#FAF8F5]" />
            </div>
            <h2 className="font-serif text-2xl font-black text-stone-950 tracking-tight">FinSight</h2>
            <p className="text-[9px] text-stone-500 font-mono tracking-wider uppercase">WEALTH SYSTEMS</p>
          </div>

          {/* Intro Text */}
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="font-serif text-3xl font-black text-stone-950 tracking-tight leading-none">
              Register Account
            </h2>
            <p className="text-xs text-stone-600">Create your personal credentials to open a secure portfolio.</p>
          </div>

          {/* Form Card */}
          <Card className="p-8 space-y-6 border border-[#E7E3DB] bg-white rounded-xl shadow-md">
            {error && (
              <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-650 text-xs font-medium font-mono leading-relaxed">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Full Name"
                placeholder="Alex Morgan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
                required
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="alex.morgan@finsight.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />
              
              <Input
                label="Password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />

              <Button type="submit" className="w-full h-10.5 text-xs tracking-wider uppercase font-semibold mt-6" isLoading={isLoading}>
                Create Account
              </Button>
            </form>
          </Card>

          {/* Footer Navigation */}
          <div className="text-center lg:text-left text-xs text-stone-600 pt-2">
            Already have an account?{' '}
            <Link to="/login" className="text-stone-900 font-bold hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
