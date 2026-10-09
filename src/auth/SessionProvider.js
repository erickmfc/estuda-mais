import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { supabase, supabaseConfigured } from '../services/supabase';

export const SESSION_IDLE_TIMEOUT_MS = 120_000;

const SessionContext = createContext(null);

const SIGN_OUT_MESSAGES = {
  idle: 'Sessão encerrada após 2 minutos sem atividade. Entre novamente.',
  background: 'Sessão encerrada ao sair do aplicativo. Entre novamente.',
  manual: 'Você saiu da sua conta.',
};

export function SessionProvider({ children }) {
  const [session, setSession] = useState(null);
  // Render the sign-in screen while Supabase restores a persisted session.
  // A stalled auth initialization must never keep the whole app on a spinner;
  // private screens still require a confirmed session below.
  const [loading, setLoading] = useState(false);
  const [authNotice, setAuthNotice] = useState('');
  const sessionRef = useRef(null);
  const lockedRef = useRef(false);
  const signOutPromiseRef = useRef(null);
  const lastActivityAtRef = useRef(0);
  const idleTimerRef = useRef(null);
  const authInitTimerRef = useRef(null);
  const mountedRef = useRef(true);
  const authInitializedRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = null;
  }, []);

  const signOut = useCallback(async (reason = 'manual') => {
    if (!sessionRef.current && !signOutPromiseRef.current) return { error: null };
    if (signOutPromiseRef.current) return signOutPromiseRef.current;

    lockedRef.current = true;
    sessionRef.current = null;
    lastActivityAtRef.current = 0;
    clearIdleTimer();
    setSession(null);
    setAuthNotice(SIGN_OUT_MESSAGES[reason] || SIGN_OUT_MESSAGES.manual);

    signOutPromiseRef.current = (async () => {
      try {
        if (!supabase) return { error: null };
        const { error } = await supabase.auth.signOut({ scope: 'local' });
        if (error && mountedRef.current) {
          setAuthNotice('A sessão foi bloqueada neste dispositivo. Entre novamente para continuar.');
        }
        return { error: error || null };
      } catch (error) {
        if (mountedRef.current) {
          setAuthNotice('A sessão foi bloqueada neste dispositivo. Entre novamente para continuar.');
        }
        return { error };
      } finally {
        signOutPromiseRef.current = null;
      }
    })();

    return signOutPromiseRef.current;
  }, [clearIdleTimer]);

  const scheduleIdleTimer = useCallback(() => {
    clearIdleTimer();
    if (!sessionRef.current || lockedRef.current) return;

    const elapsed = Date.now() - lastActivityAtRef.current;
    const remaining = Math.max(0, SESSION_IDLE_TIMEOUT_MS - elapsed);
    idleTimerRef.current = setTimeout(() => {
      if (!sessionRef.current || lockedRef.current) return;
      const idleFor = Date.now() - lastActivityAtRef.current;
      if (idleFor >= SESSION_IDLE_TIMEOUT_MS) {
        void signOut('idle');
      } else {
        scheduleIdleTimer();
      }
    }, remaining);
  }, [clearIdleTimer, signOut]);

  const registerActivity = useCallback(() => {
    if (!sessionRef.current || lockedRef.current) return;
    lastActivityAtRef.current = Date.now();
    scheduleIdleTimer();
  }, [scheduleIdleTimer]);

  useEffect(() => {
    mountedRef.current = true;
    if (!supabaseConfigured || !supabase) {
      setLoading(false);
      return () => { mountedRef.current = false; };
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mountedRef.current) return;
      authInitializedRef.current = true;
      if (authInitTimerRef.current) {
        clearTimeout(authInitTimerRef.current);
        authInitTimerRef.current = null;
      }

      if (event === 'SIGNED_OUT') {
        sessionRef.current = null;
        lastActivityAtRef.current = 0;
        clearIdleTimer();
        setSession(null);
      } else if (nextSession && (!lockedRef.current || event === 'SIGNED_IN')) {
        const isNewSession = !sessionRef.current || lockedRef.current || event === 'SIGNED_IN';
        lockedRef.current = false;
        sessionRef.current = nextSession;
        setSession(nextSession);
        if (isNewSession) {
          lastActivityAtRef.current = Date.now();
          setAuthNotice('');
          scheduleIdleTimer();
        }
      }

      setLoading(false);
    });

    // A network failure or a stale persisted token must not strand the app
    // on its splash screen. Supabase can still deliver a late session event.
    authInitTimerRef.current = setTimeout(() => {
      authInitTimerRef.current = null;
      if (!mountedRef.current || authInitializedRef.current) return;
      setLoading(false);
      setAuthNotice('Não foi possível conectar ao serviço de autenticação. Confira sua conexão e tente novamente.');
    }, 8_000);

    return () => {
      mountedRef.current = false;
      clearIdleTimer();
      if (authInitTimerRef.current) clearTimeout(authInitTimerRef.current);
      subscription.unsubscribe();
    };
  }, [clearIdleTimer, scheduleIdleTimer]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextState;
      if (nextState !== 'active' && previousState === 'active' && sessionRef.current) {
        void signOut('background');
      }
    });
    return () => subscription.remove();
  }, [signOut]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !session) return undefined;

    const onActivity = () => registerActivity();
    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') void signOut('background');
    };
    const activityEvents = ['pointerdown', 'keydown', 'input', 'scroll', 'touchstart'];
    activityEvents.forEach((eventName) => window.addEventListener(eventName, onActivity, { passive: true }));
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', onVisibilityChange);

    return () => {
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, onActivity));
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', onVisibilityChange);
    };
  }, [registerActivity, session, signOut]);

  return (
    <SessionContext.Provider value={{ session, loading, authNotice, registerActivity, signOut }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession precisa estar dentro de SessionProvider.');
  return context;
}
