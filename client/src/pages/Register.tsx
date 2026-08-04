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
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-lg bg-stone-900 mx-auto flex items-center justify-center shadow-sm">
            <TrendingUp className="w-5.5 h-5.5 text-[#FAF8F5]" />
          </div>
          <h1 className="text-xl font-bold text-stone-950 tracking-tight font-serif">FinSight</h1>
          <p className="text-[10px] text-stone-500 font-mono tracking-wide uppercase">WEALTH MANAGEMENT</p>
        </div>

        <Card className="p-6 space-y-4 border-slate-800">
          {error && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
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
            <Button type="submit" className="w-full" isLoading={isLoading}>
              Create FinSight Account
            </Button>
          </form>
        </Card>

        <div className="text-center text-xs text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 font-bold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
