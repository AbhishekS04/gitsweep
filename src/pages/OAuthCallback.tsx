import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { getOctokit } from '../lib/github';
import { toast } from 'sonner';

export const OAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setToken, setUser } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const savedState = sessionStorage.getItem('oauth_state');

      if (!code) {
        setError('No authorization code found in URL.');
        return;
      }

      if (state !== savedState) {
        setError('State mismatch. Potential CSRF attack.');
        return;
      }

      try {
        // Exchange code for token via our backend endpoint
        const response = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to exchange token');
        }

        const data = await response.json();
        const { access_token } = data;

        if (!access_token) {
          throw new Error('No access token returned from backend');
        }

        // Save token and initialize octokit
        setToken(access_token);

        // Fetch user profile
        const client = getOctokit();
        const userRes = await client.rest.users.getAuthenticated();
        
        setUser({
          login: userRes.data.login,
          avatar_url: userRes.data.avatar_url,
        });

        // Clean up and redirect
        sessionStorage.removeItem('oauth_state');
        navigate('/', { replace: true });
      } catch (err) {
        const error = err as Error;
        console.error('OAuth Error:', error.message || error);
        const msg = error.message || 'An unexpected error occurred during authentication.';
        
        // Clear stale credentials on login failure
        useAuthStore.getState().logout();
        
        toast.error('Authentication Failed', { description: msg });
        setError(msg);
      }
    };

    handleCallback();
  }, [searchParams, navigate, setToken, setUser]);

  if (error) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center space-y-4">
        <div className="text-destructive font-mono font-medium text-lg">Authentication Failed</div>
        <div className="text-muted-foreground">{error}</div>
        <button onClick={() => navigate('/')} className="text-primary hover:underline">
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <div className="font-mono text-muted-foreground">Authenticating with GitHub...</div>
    </div>
  );
};
