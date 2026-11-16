import React, { useState } from 'react';
import { DragonLogo } from '../Common/DragonLogo';
import { Shield, Sparkles, User, Mail, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  tag: string;
  avatar_url?: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  custom_status?: string;
}

interface AuthScreenProps {
  onSuccessLogin: (user: UserProfile) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccessLogin }) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      if (!email.trim() || !password.trim()) {
        setError('Preencha todos os campos obrigatórios.');
        return;
      }

      const generatedTag = Math.floor(1000 + Math.random() * 9000).toString();
      const user: UserProfile = {
        id: 'usr_' + Date.now(),
        email: email.trim(),
        username: username.trim() || email.split('@')[0],
        tag: generatedTag,
        status: 'online',
        custom_status: 'Explorando DoragonTable',
      };

      onSuccessLogin(user);
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0c0e] select-none p-4 overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(230,57,70,0.12)_0%,transparent_60%)] pointer-events-none" />
      <div className="absolute top-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#e63946]/40 to-transparent" />

      {/* Main Container */}
      <div className="w-full max-w-md bg-[#13161c] border border-[#232732] rounded-3xl p-8 shadow-2xl relative z-10 flex flex-col items-center">
        {/* Dragon Emblem */}
        <div className="mb-4">
          <DragonLogo size={56} glow />
        </div>

        <h1 className="text-2xl font-black text-white tracking-tight">DoragonTable</h1>
        <p className="text-xs text-[#94a3b8] mt-1 mb-6 text-center">
          Sua mesa virtual de RPG com Mestre IA e Servidores na Nuvem
        </p>

        {/* Tab Toggle */}
        <div className="flex w-full bg-[#1b1f27] p-1 rounded-xl mb-6 border border-[#262b37]">
          <button
            type="button"
            onClick={() => { setTab('login'); setError(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              tab === 'login'
                ? 'bg-[#e63946] text-white shadow-md'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setError(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              tab === 'register'
                ? 'bg-[#e63946] text-white shadow-md'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            Criar Conta
          </button>
        </div>

        {error && (
          <div className="w-full mb-4 p-2.5 bg-[#ef4444]/15 border border-[#ef4444]/30 rounded-xl text-xs text-[#ef4444] font-medium text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          {tab === 'register' && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94a3b8] mb-1.5">
                Nome de Jogador
              </label>
              <div className="relative flex items-center">
                <User size={16} className="absolute left-3 text-[#94a3b8]" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ex: MestreDraconico"
                  className="w-full bg-[#1b1f27] border border-[#2c3240] rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-[#64748b] focus:outline-none focus:border-[#e63946] transition-colors"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94a3b8] mb-1.5">
              E-mail
            </label>
            <div className="relative flex items-center">
              <Mail size={16} className="absolute left-3 text-[#94a3b8]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                className="w-full bg-[#1b1f27] border border-[#2c3240] rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-[#64748b] focus:outline-none focus:border-[#e63946] transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94a3b8] mb-1.5">
              Senha
            </label>
            <div className="relative flex items-center">
              <Lock size={16} className="absolute left-3 text-[#94a3b8]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#1b1f27] border border-[#2c3240] rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-[#64748b] focus:outline-none focus:border-[#e63946] transition-colors"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-[#e63946] hover:bg-[#d02e3b] text-white font-extrabold text-xs rounded-xl shadow-lg shadow-[#e63946]/25 flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{tab === 'login' ? 'Entrar no DoragonTable' : 'Concluir Cadastro'}</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 flex items-center gap-2 text-[11px] text-[#64748b]">
          <Shield size={12} className="text-[#10b981]" />
          <span>Servidor Vercel Cloud sincronizado</span>
        </div>
      </div>
    </div>
  );
};
