import { useAuthStore } from '~/stores/authStore';

const mockUser = {
  $id: 'user-123',
  $createdAt: '2024-01-01T00:00:00.000Z',
  $updatedAt: '2024-01-01T00:00:00.000Z',
  name: 'Test User',
  email: 'test@example.com',
  phone: '',
  emailVerification: true,
  phoneVerification: false,
  mfa: false,
  prefs: {},
  targets: [],
  accessedAt: '2024-01-01T00:00:00.000Z',
  registration: '2024-01-01T00:00:00.000Z',
  status: true,
  labels: [],
  passwordUpdate: '2024-01-01T00:00:00.000Z',
  hashOptions: {},
  hash: '',
};

describe('stores/authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      error: null,
      status: 'idle',
      user: null,
    });
  });

  describe('initial state', () => {
    it('has correct defaults', () => {
      const state = useAuthStore.getState();

      expect(state.error).toBeNull();
      expect(state.status).toBe('idle');
      expect(state.user).toBeNull();
    });
  });

  describe('setUser', () => {
    it('sets user and status to authenticated when user provided', () => {
      useAuthStore.getState().setUser(mockUser);

      const state = useAuthStore.getState();

      expect(state.user).toEqual(mockUser);
      expect(state.status).toBe('authenticated');
      expect(state.error).toBeNull();
    });

    it('sets status to unauthenticated when user is null', () => {
      useAuthStore.setState({ user: mockUser, status: 'authenticated' });

      useAuthStore.getState().setUser(null);

      const state = useAuthStore.getState();

      expect(state.user).toBeNull();
      expect(state.status).toBe('unauthenticated');
      expect(state.error).toBeNull();
    });

    it('clears error when setting user', () => {
      useAuthStore.setState({ error: 'Previous error' });

      useAuthStore.getState().setUser(mockUser);

      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  describe('setStatus', () => {
    it('updates status to loading', () => {
      useAuthStore.getState().setStatus('loading');

      expect(useAuthStore.getState().status).toBe('loading');
    });

    it('updates status to authenticated', () => {
      useAuthStore.getState().setStatus('authenticated');

      expect(useAuthStore.getState().status).toBe('authenticated');
    });

    it('updates status to unauthenticated', () => {
      useAuthStore.getState().setStatus('unauthenticated');

      expect(useAuthStore.getState().status).toBe('unauthenticated');
    });

    it('updates status to idle', () => {
      useAuthStore.setState({ status: 'authenticated' });

      useAuthStore.getState().setStatus('idle');

      expect(useAuthStore.getState().status).toBe('idle');
    });
  });

  describe('setError', () => {
    it('sets error message', () => {
      useAuthStore.getState().setError('Authentication failed');

      expect(useAuthStore.getState().error).toBe('Authentication failed');
    });

    it('clears error when set to null', () => {
      useAuthStore.setState({ error: 'Previous error' });

      useAuthStore.getState().setError(null);

      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  describe('reset', () => {
    it('returns state to initial values', () => {
      useAuthStore.setState({
        user: mockUser,
        status: 'authenticated',
        error: 'Some error',
      });

      useAuthStore.getState().reset();

      const state = useAuthStore.getState();

      expect(state.user).toBeNull();
      expect(state.status).toBe('idle');
      expect(state.error).toBeNull();
    });
  });
});
