// src/pages/Login.tsx
import { useState } from 'react';
import { useAuth } from '../features/auth/hooks/useAuth';
import { Button, Input, Card, Alert } from '@/components/ui';
import { ThemeToggle } from '@/components/shared/ThemeToggle';

export default function Login() {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const { login, isLoggingIn, loginError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(credentials);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">
          Accounting System
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Username"
            type="text"
            value={credentials.username}
            onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
            required
            autoFocus
          />

          <Input
            label="Password"
            type="password"
            value={credentials.password}
            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
            required
          />

          {loginError && (
            <Alert variant="error">
              Invalid username or password
            </Alert>
          )}

          <Button
            type="submit"
            fullWidth
            isLoading={isLoggingIn}
          >
            {isLoggingIn ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </Card>
    </div>
  );
}