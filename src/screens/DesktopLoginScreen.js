import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase, supabaseConfigured } from '../services/supabase';

const COLORS = { white: '#FFFFFF', page: '#111111', muted: 'rgba(255,255,255,0.72)', field: 'rgba(255,255,255,0.06)', line: 'rgba(255,255,255,0.86)', primary: '#FF357A', yellow: '#FFF172', green: '#00FF0A', red: '#FF6B81', teal: '#7CFFD6' };

function friendlyError(error) {
  const message = error?.message?.toLowerCase() || '';
  if (message.includes('invalid login credentials')) return 'Email ou senha incorretos.';
  if (message.includes('email not confirmed')) return 'Confirme seu email antes de entrar.';
  if (message.includes('user already registered')) return 'Esse email já está cadastrado.';
  return error?.message || 'Não foi possível concluir. Tente novamente.';
}

function Ring({ size, color, reverse, rotation }) {
  const spin = rotation.interpolate({ inputRange: [0, 1], outputRange: reverse ? ['360deg', '0deg'] : ['0deg', '360deg'] });
  return <Animated.View pointerEvents="none" style={[styles.ring, { width: size, height: size, borderColor: color, transform: [{ rotate: spin }] }]} />;
}

export default function DesktopLoginScreen() {
  const { width, height } = useWindowDimensions();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState({ type: 'idle', message: '' });
  const rotation = useRef(new Animated.Value(0)).current;
  const isLogin = mode === 'login';
  const isLoading = status.type === 'loading';
  const compact = width < 720 || height < 650;
  const ringSize = compact ? Math.min(width - 34, 480) : 520;

  useEffect(() => {
    const animation = Animated.loop(Animated.timing(rotation, { toValue: 1, duration: 7000, easing: Easing.linear, useNativeDriver: true }));
    animation.start();
    return () => animation.stop();
  }, [rotation]);

  const submit = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) return setStatus({ type: 'error', message: 'Digite um email válido.' });
    if (password.length < 6) return setStatus({ type: 'error', message: 'A senha precisa ter pelo menos 6 caracteres.' });
    if (!supabaseConfigured || !supabase) return setStatus({ type: 'error', message: 'O projeto ainda precisa receber as variáveis do Supabase.' });
    setStatus({ type: 'loading', message: '' });
    const result = isLogin ? await supabase.auth.signInWithPassword({ email: cleanEmail, password }) : await supabase.auth.signUp({ email: cleanEmail, password });
    if (result.error) return setStatus({ type: 'error', message: friendlyError(result.error) });
    if (isLogin || result.data.session) return setStatus({ type: 'success', message: 'Tudo certo. Abrindo seu espaço...' });
    setStatus({ type: 'success', message: 'Conta criada. Confirme o email para entrar.' });
    setMode('login');
  };

  const changeMode = (nextMode) => { setMode(nextMode); setStatus({ type: 'idle', message: '' }); };

  return (
    <View style={styles.page}>
      <View pointerEvents="none" style={[styles.backGlow, { width: ringSize + 180, height: ringSize + 180 }]} />
      <View style={[styles.ringStage, { width: ringSize, height: ringSize }]}>
        <Ring size={ringSize} color={COLORS.green} rotation={rotation} />
        <Ring size={ringSize - 22} color={COLORS.primary} reverse rotation={rotation} />
        <Ring size={ringSize - 44} color={COLORS.yellow} rotation={rotation} />
        <View style={[styles.login, compact && styles.loginCompact]}>
          <View style={styles.brand}><View style={styles.brandMark}><Ionicons name="school" size={17} color={COLORS.white} /></View><Text style={styles.brandText}>Estuda<Text style={styles.brandPlus}>+</Text></Text></View>
          <Text style={styles.title}>{isLogin ? 'Login' : 'Criar conta'}</Text>
          <Text style={styles.subtitle}>{isLogin ? 'Entre para continuar seus estudos.' : 'Comece a organizar sua rotina.'}</Text>
          {!supabaseConfigured ? <Text style={styles.setupNotice}>Configure o Supabase no arquivo .env para usar o login.</Text> : null}
          <View style={styles.switcher}>
            <Pressable accessibilityRole="button" accessibilityState={{ selected: isLogin }} onPress={() => changeMode('login')} style={[styles.switchButton, isLogin && styles.switchActive]}><Text style={[styles.switchText, isLogin && styles.switchTextActive]}>Entrar</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityState={{ selected: !isLogin }} onPress={() => changeMode('signup')} style={[styles.switchButton, !isLogin && styles.switchActive]}><Text style={[styles.switchText, !isLogin && styles.switchTextActive]}>Criar conta</Text></Pressable>
          </View>
          <View style={styles.inputBox}><Ionicons name="mail-outline" size={17} color={COLORS.muted} /><TextInput accessibilityLabel="Email" autoCapitalize="none" autoComplete="email" keyboardType="email-address" value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor={COLORS.muted} style={styles.input} /></View>
          <View style={styles.inputBox}><Ionicons name="lock-closed-outline" size={17} color={COLORS.muted} /><TextInput accessibilityLabel="Senha" autoCapitalize="none" autoComplete="password" secureTextEntry value={password} onChangeText={setPassword} placeholder="Senha" placeholderTextColor={COLORS.muted} style={styles.input} /></View>
          {status.message ? <Text style={[styles.feedback, status.type === 'error' ? styles.error : styles.success]}>{status.message}</Text> : null}
          <Pressable accessibilityRole="button" accessibilityLabel={isLogin ? 'Entrar na conta' : 'Criar conta'} disabled={isLoading} onPress={submit} style={({ pressed }) => [styles.submit, pressed && styles.submitPressed, isLoading && styles.disabled]}>{isLoading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.submitText}>{isLogin ? 'Entrar' : 'Criar conta'}</Text>}</Pressable>
          <View style={styles.links}><Text style={styles.linkText}>Acesso protegido</Text><Pressable onPress={() => changeMode(isLogin ? 'signup' : 'login')}><Text style={styles.linkText}>{isLogin ? 'Signup' : 'Voltar ao login'}</Text></Pressable></View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { alignItems: 'center', backgroundColor: COLORS.page, flex: 1, justifyContent: 'center', overflow: 'hidden' },
  backGlow: { backgroundColor: '#262626', borderRadius: 999, opacity: 0.5, position: 'absolute' },
  ringStage: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  ring: { borderRadius: 999, borderWidth: 2, position: 'absolute' },
  login: { alignItems: 'center', justifyContent: 'center', maxWidth: 300, minHeight: 390, width: '100%' },
  loginCompact: { minHeight: 350, maxWidth: 270 },
  brand: { alignItems: 'center', flexDirection: 'row', gap: 8, marginBottom: 12 },
  brandMark: { alignItems: 'center', backgroundColor: COLORS.primary, borderRadius: 9, height: 28, justifyContent: 'center', width: 28 },
  brandText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  brandPlus: { color: COLORS.yellow },
  title: { color: COLORS.white, fontSize: 29, fontWeight: '700' },
  subtitle: { color: COLORS.muted, fontSize: 12, marginBottom: 15, marginTop: 5, textAlign: 'center' },
  setupNotice: { color: COLORS.yellow, fontSize: 10, lineHeight: 14, marginBottom: 9, textAlign: 'center' },
  switcher: { alignSelf: 'stretch', flexDirection: 'row', marginBottom: 10 },
  switchButton: { alignItems: 'center', flex: 1, paddingVertical: 7 },
  switchActive: { borderBottomColor: COLORS.yellow, borderBottomWidth: 1 },
  switchText: { color: COLORS.muted, fontSize: 11, fontWeight: '700' },
  switchTextActive: { color: COLORS.yellow },
  inputBox: { alignItems: 'center', alignSelf: 'stretch', backgroundColor: COLORS.field, borderColor: COLORS.line, borderRadius: 22, borderWidth: 1, flexDirection: 'row', gap: 8, marginBottom: 10, minHeight: 43, paddingHorizontal: 14 },
  input: { color: COLORS.white, flex: 1, fontSize: 12, minHeight: 41 },
  feedback: { alignSelf: 'stretch', borderRadius: 8, fontSize: 11, marginBottom: 9, padding: 8, textAlign: 'center' },
  error: { backgroundColor: 'rgba(255,107,129,0.18)', color: COLORS.red },
  success: { backgroundColor: 'rgba(124,255,214,0.14)', color: COLORS.teal },
  submit: { alignItems: 'center', alignSelf: 'stretch', backgroundColor: COLORS.primary, borderRadius: 22, justifyContent: 'center', minHeight: 44 },
  submitPressed: { backgroundColor: '#D82164', transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.65 },
  submitText: { color: COLORS.white, fontSize: 13, fontWeight: '800' },
  links: { alignItems: 'center', alignSelf: 'stretch', flexDirection: 'row', justifyContent: 'space-between', marginTop: 13, paddingHorizontal: 5 },
  linkText: { color: COLORS.muted, fontSize: 10 },
});
