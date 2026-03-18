import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import api from '../../lib/api';

export function OAuthCallbackPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { setUser } = useAuthStore();
  const [error, setError] = useState('');

  const accessToken = params.get('accessToken');
  const refreshToken = params.get('refreshToken');
  const hasTokens = !!accessToken && !!refreshToken;

  useEffect(() => {
    if (!hasTokens) return;

    localStorage.setItem('accessToken', accessToken!);
    localStorage.setItem('refreshToken', refreshToken!);

    api.get('/auth/me')
      .then((res) => {
        setUser(res.data.data);
        navigate('/dashboard');
      })
      .catch(() => {
        setError('Failed to load profile. Please try again.');
        setTimeout(() => navigate('/login'), 2000);
      });
  }, [hasTokens, accessToken, refreshToken, navigate, setUser]);

  if (!hasTokens) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg className="h-6 w-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-slate-700 font-medium">Authentication failed. Please try again.</p>
          <p className="text-sm text-slate-500 mt-1">
            <a href="/login" className="text-indigo-600 hover:underline">Return to login</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <svg className="animate-spin h-8 w-8 text-indigo-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-slate-700 font-medium">Signing you in...</p>
        <p className="text-sm text-slate-500 mt-1">Please wait</p>
      </div>
    </div>
  );
}
