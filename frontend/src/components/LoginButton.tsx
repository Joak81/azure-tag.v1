import React from 'react';
import { Button, Spinner } from '@fluentui/react-components';
import { PersonRegular } from '@fluentui/react-icons';
import { useAuth } from '../hooks/useAuth';

export const LoginButton: React.FC = () => {
  const { isAuthenticated, isLoading, login, logout, user } = useAuth();

  const handleClick = async () => {
    if (isAuthenticated) {
      await logout();
    } else {
      await login();
    }
  };

  if (isLoading) {
    return <Spinner size="small" />;
  }

  return (
    <Button
      appearance={isAuthenticated ? 'secondary' : 'primary'}
      icon={<PersonRegular />}
      onClick={handleClick}
    >
      {isAuthenticated ? `Sign out (${user?.name || user?.email})` : 'Sign in with Microsoft'}
    </Button>
  );
};