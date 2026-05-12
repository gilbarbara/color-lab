import type { SubmitEvent } from 'react';
import { useEffect } from 'react';
import { useSetState } from '@gilbarbara/hooks';
import { Button, Tab, Tabs } from '@heroui/react';

import useAuth from '~/hooks/useAuth';
import useTheme from '~/hooks/useTheme';
import { useAppStore } from '~/stores/appStore';
import { useAuthStore } from '~/stores/authStore';
import { trackEvent } from '~/utils/analytics';

import { Input, Password } from '~/components/Field';
import Modal, { ModalBody, ModalContent } from '~/components/Modal';

type AuthTab = 'login' | 'signup' | 'magic-link';

interface State {
  email: string;
  magicLinkSent: boolean;
  name: string;
  password: string;
  tab: AuthTab;
}

export default function Login() {
  const {
    error,
    isAuthenticated,
    isLoading,
    loginWithEmail,
    loginWithOAuth,
    sendMagicLink,
    signupWithEmail,
  } = useAuth();
  const { closeLoginModal, showLoginModal } = useAppStore();
  const { isDarkMode } = useTheme();

  const [{ email, magicLinkSent, name, password, tab }, setState] = useSetState<State>({
    email: '',
    magicLinkSent: false,
    name: '',
    password: '',
    tab: 'login',
  });

  // Close modal when auth succeeds (e.g. OAuth popup completes)
  useEffect(() => {
    if (isAuthenticated && showLoginModal) {
      closeLoginModal();
    }
  }, [isAuthenticated, showLoginModal, closeLoginModal]);

  // Clear stale auth errors when modal opens
  useEffect(() => {
    if (showLoginModal) {
      useAuthStore.getState().setError(null);
    }
  }, [showLoginModal]);

  const handleClose = () => {
    closeLoginModal();
    setState({ email: '', magicLinkSent: false, name: '', password: '', tab: 'login' });
  };

  const handleEmailLogin = async (event: SubmitEvent) => {
    event.preventDefault();

    try {
      await loginWithEmail(email, password);
      trackEvent('login', { provider: 'email' });
      handleClose();
    } catch {
      // Error is handled by auth context
    }
  };

  const handleEmailSignup = async (event: SubmitEvent) => {
    event.preventDefault();

    try {
      await signupWithEmail(email, password, name || undefined);
      trackEvent('login', { provider: 'email' });
      handleClose();
    } catch {
      // Error is handled by auth context
    }
  };

  const handleMagicLink = async (event: SubmitEvent) => {
    event.preventDefault();

    try {
      await sendMagicLink(email);
      trackEvent('login', { provider: 'magic-link' });
      setState({ magicLinkSent: true });
    } catch {
      // Error is handled by auth context
    }
  };

  const handleOAuth = (provider: 'google' | 'github') => {
    trackEvent('login', { provider });
    loginWithOAuth(provider);
  };

  if (!showLoginModal) {
    return null;
  }

  return (
    <Modal isOpen={showLoginModal} onClose={handleClose} size="sm">
      <ModalContent>
        <ModalBody>
          <div className="flex items-center justify-center py-4">
            <h2 className="text-5xl font-bold">Sign in</h2>
          </div>

          {/* OAuth Buttons */}
          <div className="flex flex-col gap-3">
            <Button
              fullWidth
              onPress={() => handleOAuth('google')}
              startContent={<img alt="Google" className="size-5" src="/icons/google.svg" />}
              variant="bordered"
            >
              Continue with Google
            </Button>
            <Button
              fullWidth
              onPress={() => handleOAuth('github')}
              startContent={
                <img
                  alt="GitHub"
                  className="size-5"
                  src={isDarkMode ? '/icons/github-dark.svg' : '/icons/github.svg'}
                />
              }
              variant="bordered"
            >
              Continue with GitHub
            </Button>

            <div className="flex items-center">
              <div className="grow border-t border-default" />

              <span className="shrink mx-4 text-foreground-500">OR</span>

              <div className="grow border-t border-default" />
            </div>

            {/* Tab-based Email Auth */}
            <Tabs
              fullWidth
              onSelectionChange={key => setState({ tab: key as AuthTab })}
              selectedKey={tab}
            >
              <Tab key="login" title="Login">
                <form className="flex flex-col gap-4 pt-2" onSubmit={handleEmailLogin}>
                  <Input
                    isRequired
                    label="Email"
                    onValueChange={value => setState({ email: value })}
                    type="email"
                    value={email}
                  />
                  <Password
                    isRequired
                    label="Password"
                    onValueChange={value => setState({ password: value })}
                    value={password}
                  />
                  <Button color="primary" fullWidth isLoading={isLoading} type="submit">
                    Login
                  </Button>
                </form>
              </Tab>

              <Tab key="signup" title="Sign Up">
                <form className="flex flex-col gap-4 pt-2" onSubmit={handleEmailSignup}>
                  <Input
                    label="Name"
                    onValueChange={value => setState({ name: value })}
                    type="text"
                    value={name}
                  />
                  <Input
                    isRequired
                    label="Email"
                    onValueChange={value => setState({ email: value })}
                    type="email"
                    value={email}
                  />
                  <Password
                    isRequired
                    label="Password"
                    onValueChange={value => setState({ password: value })}
                    value={password}
                  />
                  <Button color="primary" fullWidth isLoading={isLoading} type="submit">
                    Create Account
                  </Button>
                </form>
              </Tab>

              <Tab key="magic-link" title="Magic Link">
                <form className="flex flex-col gap-4 pt-2" onSubmit={handleMagicLink}>
                  {magicLinkSent ? (
                    <p className="text-success text-center py-4">
                      Check your email for the login link!
                    </p>
                  ) : (
                    <>
                      <Input
                        isRequired
                        label="Email"
                        onValueChange={value => setState({ email: value })}
                        type="email"
                        value={email}
                      />
                      <Button color="primary" fullWidth isLoading={isLoading} type="submit">
                        Send Magic Link
                      </Button>
                    </>
                  )}
                </form>
              </Tab>
            </Tabs>

            {error && <p className="text-danger text-center text-sm">{error}</p>}
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
