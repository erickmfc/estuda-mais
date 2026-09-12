import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase, supabaseConfigured } from '../services/supabase';

const COLORS = {
  ink: '#171A3A',
  muted: '#6F7593',
  primary: '#5B5CE2',
  primaryDark: '#3D3FB5',
  soft: '#F2F3FF',
  line: '#E3E6F2',
  red: '#C9485A',
  redSoft: '#FFF0F2',
  teal: '#1EA99A',
};

function friendlyError(error) {
  const message = error?.message?.toLowerCase() || '';
  if (message.includes('invalid login credentials')) return 'Email ou senha incorretos.';
  if (message.includes('email not confirmed')) return 'Confirme seu email antes de entrar.';
  if (message.includes('user already registered')) return 'Esse email já está cadastrado.';
  return error?.message || 'Não foi possível concluir. Tente novamente.';
}

function FloatingOrb({ animation, style }) {
  return <Animated.View style={[styles.orb, style, styles.nonInteractive, { transform: [{ translateY: animation.interpolate({ inputRange: [0, 1], outputRange: [0, -18] }) }] }]} />;
}

export default function DesktopLoginScreen() {
  const { width } = useWindowDimensions();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState({ type: 'idle', message: '' });
  const floatOne = useRef(new Animated.Value(0)).current;
  const floatTwo = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const isLogin = mode === 'login';
  const isLoading = status.type === 'loading';
  const compact = width < 940;

  useEffect(() => {
    const first = Animated.loop(Animated.sequence([
      Animated.timing(floatOne, { toValue: 1, duration: 2800, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      Animated.timing(floatOne, { toValue: 0, duration: 2800, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
    ]));
    const second = Animated.loop(Animated.sequence([
      Animated.delay(650),
      Animated.timing(floatTwo, { toValue: 1, duration: 3400, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      Animated.timing(floatTwo, { toValue: 0, duration: 3400, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
    ]));
    const breathing = Animated.loop(Animated.sequence([
      Animated.timing(glow, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      Animated.timing(glow, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
    ]));
    first.start();
    second.start();
    breathing.start();
    return () => {
      first.stop();
      second.stop();
      breathing.stop();
    };
  }, [floatOne, floatTwo, glow]);

  const submit = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setStatus({ type: 'error', message: 'Digite um email válido.' });
      return;
    }
    if (password.length < 6) {
      setStatus({ type: 'error', message: 'A senha precisa ter pelo menos 6 caracteres.' });
      return;
    }
    if (!supabaseConfigured || !supabase) {
      setStatus({ type: 'error', message: 'O projeto ainda precisa receber as variáveis do Supabase.' });
      return;
    }

    setStatus({ type: 'loading', message: '' });
    const result = isLogin
      ? await supabase.auth.signInWithPassword({ email: cleanEmail, password })
      : await supabase.auth.signUp({ email: cleanEmail, password });

    if (result.error) {
      setStatus({ type: 'error', message: friendlyError(result.error) });
      return;
    }
    if (isLogin || result.data.session) {
      setStatus({ type: 'success', message: 'Tudo certo. Abrindo seu espaço...' });
      return;
    }
    setStatus({ type: 'success', message: 'Conta criada. Confirme o email para entrar.' });
    setMode('login');
  };

  return (
    <View style={styles.page}>
      <View style={styles.backgroundGlow} pointerEvents="none" />
      <FloatingOrb animation={floatOne} style={styles.orbOne} />
      <FloatingOrb animation={floatTwo} style={styles.orbTwo} />
      <View style={[styles.layout, compact && styles.layoutCompact]}>
        <View style={[styles.presentation, compact && styles.presentationCompact]}>
          <View style={styles.brandLine}>
            <View style={styles.brandMark}><Ionicons name="school" size={20} color="#FFFFFF" /></View>
            <Text style={styles.brandName}>Estuda<Text style={styles.brandPlus}>+</Text></Text>
          </View>
          <View style={styles.presentationCopy}>
            <Text style={styles.kicker}>SUA ROTINA, NO SEU RITMO</Text>
            <Text style={styles.headline}>Comece pelo que importa hoje.</Text>
            <Text style={styles.description}>Organize suas matérias, tarefas e estágio em um só lugar, com uma visão simples do seu dia.</Text>
          </View>
          <View style={styles.featureList}>
            <View style={styles.featureRow}><View style={styles.featureIcon}><Ionicons name="checkmark" size={15} color={COLORS.teal} /></View><Text style={styles.featureText}>Acompanhe sua evolução sem complicação</Text></View>
            <View style={styles.featureRow}><View style={styles.featureIcon}><Ionicons name="checkmark" size={15} color={COLORS.teal} /></View><Text style={styles.featureText}>Tenha seus lembretes sempre à mão</Text></View>
            <View style={styles.featureRow}><View style={styles.featureIcon}><Ionicons name="checkmark" size={15} color={COLORS.teal} /></View><Text style={styles.featureText}>Seus dados ficam na sua conta</Text></View>
          </View>
          <View style={styles.quote}><View style={styles.quoteMark}><Ionicons name="sparkles-outline" size={17} color="#D8D9FF" /></View><Text style={styles.quoteText}>Um passo de cada vez também é progresso.</Text></View>
        </View>

        <Animated.View style={[styles.loginCard, { transform: [{ translateY: glow.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }) }] }]}>
          <View style={styles.cardHeader}>
            <View><Text style={styles.cardTitle}>{isLogin ? 'Que bom ter você aqui' : 'Crie sua conta'}</Text><Text style={styles.cardSubtitle}>{isLogin ? 'Entre para continuar sua jornada.' : 'Leva menos de um minuto.'}</Text></View>
            <View style={styles.statusDot}><View style={styles.statusDotInner} /></View>
          </View>

          {!supabaseConfigured ? <View style={styles.setupNotice}><Ionicons name="information-circle-outline" size={18} color={COLORS.primary} /><Text style={styles.setupNoticeText}>O login está pronto. Falta configurar o projeto Supabase.</Text></View> : null}

          <View style={styles.switcher}>
            <Pressable accessibilityRole="button" accessibilityState={{ selected: isLogin }} style={[styles.switchButton, isLogin && styles.switchButtonActive]} onPress={() => { setMode('login'); setStatus({ type: 'idle', message: '' }); }}><Text style={[styles.switchText, isLogin && styles.switchTextActive]}>Entrar</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityState={{ selected: !isLogin }} style={[styles.switchButton, !isLogin && styles.switchButtonActive]} onPress={() => { setMode('signup'); setStatus({ type: 'idle', message: '' }); }}><Text style={[styles.switchText, !isLogin && styles.switchTextActive]}>Criar conta</Text></Pressable>
          </View>

          <Text style={styles.label}>Email</Text>
          <View style={styles.inputWrap}><Ionicons name="mail-outline" size={18} color={COLORS.muted} /><TextInput accessibilityLabel="Email" autoCapitalize="none" autoComplete="email" keyboardType="email-address" value={email} onChangeText={setEmail} placeholder="voce@email.com" placeholderTextColor="#9AA0B7" style={styles.input} /></View>
          <Text style={styles.label}>Senha</Text>
          <View style={styles.inputWrap}><Ionicons name="lock-closed-outline" size={18} color={COLORS.muted} /><TextInput accessibilityLabel="Senha" autoCapitalize="none" autoComplete="password" secureTextEntry value={password} onChangeText={setPassword} placeholder="Mínimo de 6 caracteres" placeholderTextColor="#9AA0B7" style={styles.input} /></View>

          {status.message ? <Text style={[styles.feedback, status.type === 'error' ? styles.error : styles.success]}>{status.message}</Text> : null}
          <Pressable accessibilityRole="button" accessibilityLabel={isLogin ? 'Entrar na conta' : 'Criar conta'} disabled={isLoading} style={({ pressed }) => [styles.submitButton, pressed && styles.submitButtonPressed, isLoading && styles.disabledButton]} onPress={submit}><Text style={styles.submitText}>{isLoading ? 'Entrando...' : (isLogin ? 'Entrar no Estuda+' : 'Criar conta')}</Text>{!isLoading ? <Ionicons name="arrow-forward" size={18} color="#FFFFFF" /> : <ActivityIndicator size="small" color="#FFFFFF" />}</Pressable>
          <Text style={styles.securityText}><Ionicons name="shield-checkmark-outline" size={13} color={COLORS.teal} /> Acesso protegido e privado</Text>
        </Animated.View>
      </View>
      <Text style={styles.footer}>Estuda+ · organização acadêmica feita para você</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: '#0E1230', flex: 1, justifyContent: 'center', overflow: 'hidden', position: 'relative' },
  backgroundGlow: { backgroundColor: '#202563', borderRadius: 500, height: 580, opacity: 0.55, position: 'absolute', right: -190, top: -220, width: 580 },
  orb: { borderRadius: 999, position: 'absolute' },
  nonInteractive: { pointerEvents: 'none' },
  orbOne: { backgroundColor: '#6365E8', height: 110, left: '11%', opacity: 0.28, top: '12%', width: 110 },
  orbTwo: { backgroundColor: '#34C4B5', bottom: '13%', height: 150, opacity: 0.13, right: '8%', width: 150 },
  layout: { alignItems: 'center', flexDirection: 'row', gap: 76, justifyContent: 'center', paddingHorizontal: 56, width: '100%' },
  layoutCompact: { gap: 36, paddingHorizontal: 28 },
  presentation: { maxWidth: 520, flex: 1 },
  presentationCompact: { maxWidth: 430 },
  brandLine: { alignItems: 'center', flexDirection: 'row', gap: 10, marginBottom: 70 },
  brandMark: { alignItems: 'center', backgroundColor: COLORS.primary, borderRadius: 13, height: 42, justifyContent: 'center', width: 42 },
  brandName: { color: '#FFFFFF', fontSize: 21, fontWeight: '800', letterSpacing: -0.4 },
  brandPlus: { color: '#8DE1D7' },
  presentationCopy: { maxWidth: 470 },
  kicker: { color: '#8F94C8', fontSize: 10, fontWeight: '800', letterSpacing: 1.7, marginBottom: 14 },
  headline: { color: '#FFFFFF', fontSize: 51, fontWeight: '800', letterSpacing: -2.1, lineHeight: 56 },
  description: { color: '#B4B8D9', fontSize: 15, lineHeight: 24, marginTop: 20, maxWidth: 430 },
  featureList: { gap: 15, marginTop: 32 },
  featureRow: { alignItems: 'center', flexDirection: 'row', gap: 11 },
  featureIcon: { alignItems: 'center', backgroundColor: 'rgba(30,169,154,0.15)', borderRadius: 9, height: 25, justifyContent: 'center', width: 25 },
  featureText: { color: '#D3D5EA', fontSize: 13 },
  quote: { alignItems: 'center', borderTopColor: 'rgba(255,255,255,0.12)', borderTopWidth: 1, flexDirection: 'row', gap: 10, marginTop: 48, maxWidth: 350, paddingTop: 19 },
  quoteMark: { alignItems: 'center', backgroundColor: 'rgba(91,92,226,0.4)', borderRadius: 10, height: 30, justifyContent: 'center', width: 30 },
  quoteText: { color: '#969BC9', fontSize: 12, fontStyle: 'italic' },
  loginCard: { backgroundColor: '#FFFFFF', borderRadius: 24, maxWidth: 430, padding: 30, shadowColor: '#000000', shadowOpacity: 0.25, shadowRadius: 30, shadowOffset: { height: 14, width: 0 }, elevation: 12, width: '100%' },
  cardHeader: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 22 },
  cardTitle: { color: COLORS.ink, fontSize: 23, fontWeight: '800', letterSpacing: -0.5 },
  cardSubtitle: { color: COLORS.muted, fontSize: 13, marginTop: 6 },
  statusDot: { alignItems: 'center', backgroundColor: '#E7F8F4', borderRadius: 13, height: 26, justifyContent: 'center', width: 26 },
  statusDotInner: { backgroundColor: COLORS.teal, borderRadius: 5, height: 9, width: 9 },
  setupNotice: { alignItems: 'center', backgroundColor: COLORS.soft, borderRadius: 12, flexDirection: 'row', gap: 8, marginBottom: 16, padding: 11 },
  setupNoticeText: { color: COLORS.muted, flex: 1, fontSize: 11, lineHeight: 16 },
  switcher: { backgroundColor: '#F5F6FB', borderRadius: 11, flexDirection: 'row', marginBottom: 22, padding: 3 },
  switchButton: { alignItems: 'center', borderRadius: 9, flex: 1, paddingVertical: 10 },
  switchButtonActive: { backgroundColor: '#FFFFFF', shadowColor: '#11152E', shadowOpacity: 0.08, shadowRadius: 5, shadowOffset: { height: 2, width: 0 }, elevation: 1 },
  switchText: { color: COLORS.muted, fontSize: 12, fontWeight: '700' },
  switchTextActive: { color: COLORS.primary },
  label: { color: COLORS.ink, fontSize: 11, fontWeight: '800', marginBottom: 7, marginTop: 4 },
  inputWrap: { alignItems: 'center', backgroundColor: '#F8F9FD', borderColor: COLORS.line, borderRadius: 11, borderWidth: 1, flexDirection: 'row', gap: 10, minHeight: 48, paddingHorizontal: 13, marginBottom: 14 },
  input: { color: COLORS.ink, flex: 1, fontSize: 13, minHeight: 46 },
  feedback: { borderRadius: 9, fontSize: 12, lineHeight: 17, marginBottom: 13, padding: 10 },
  error: { backgroundColor: COLORS.redSoft, color: COLORS.red },
  success: { backgroundColor: '#E5F8F4', color: COLORS.teal },
  submitButton: { alignItems: 'center', backgroundColor: COLORS.primary, borderRadius: 12, flexDirection: 'row', gap: 9, justifyContent: 'center', minHeight: 50, marginTop: 3 },
  submitButtonPressed: { backgroundColor: COLORS.primaryDark, transform: [{ scale: 0.99 }] },
  disabledButton: { opacity: 0.72 },
  submitText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  securityText: { color: COLORS.muted, fontSize: 11, marginTop: 18, textAlign: 'center' },
  footer: { bottom: 18, color: '#7177A8', fontSize: 11, position: 'absolute', textAlign: 'center', width: '100%' },
});
