import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase, supabaseConfigured } from '../services/supabase';

const COLORS = { page: '#111638', card: '#1B234D', cardSoft: '#252D59', ink: '#FFFFFF', muted: '#AEB5D5', primary: '#6264F2', primaryLight: '#8889FF', yellow: '#FFF172', line: 'rgba(180,190,240,0.28)', red: '#FF8598', redSoft: 'rgba(255,100,125,0.16)', teal: '#B9C1FF' };

function friendlyError(error) {
  const message = error?.message?.toLowerCase() || '';
  if (message.includes('invalid login credentials')) return 'Email ou senha incorretos.';
  if (message.includes('email not confirmed')) return 'Confirme seu email antes de entrar.';
  if (message.includes('user already registered')) return 'Esse email já está cadastrado.';
  return error?.message || 'Não foi possível concluir. Tente novamente.';
}

export default function LoginScreen({ session }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState({ type: 'idle', message: '' });
  const isLogin = mode === 'login';
  const isLoading = status.type === 'loading';

  const submit = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) return setStatus({ type: 'error', message: 'Digite um email válido.' });
    if (password.length < 6) return setStatus({ type: 'error', message: 'A senha precisa ter pelo menos 6 caracteres.' });
    if (!supabaseConfigured || !supabase) return setStatus({ type: 'error', message: 'O login ainda não está configurado.' });
    setStatus({ type: 'loading', message: '' });
    const result = isLogin ? await supabase.auth.signInWithPassword({ email: cleanEmail, password }) : await supabase.auth.signUp({ email: cleanEmail, password });
    if (result.error) return setStatus({ type: 'error', message: friendlyError(result.error) });
    if (isLogin || result.data.session) return setStatus({ type: 'success', message: 'Login realizado. Bem-vindo ao Estuda+.' });
    setStatus({ type: 'success', message: 'Conta criada. Confirme seu email para entrar.' });
    setMode('login');
  };

  const recoverPassword = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) return setStatus({ type: 'error', message: 'Digite seu email para recuperar a senha.' });
    if (!supabaseConfigured || !supabase) return setStatus({ type: 'error', message: 'O login ainda não está configurado.' });
    setStatus({ type: 'loading', message: '' });
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, { redirectTo: 'https://estuda-mais-mauve.vercel.app/' });
    setStatus(error ? { type: 'error', message: friendlyError(error) } : { type: 'success', message: 'Enviamos um link de recuperação para seu email.' });
  };

  const switchMode = (nextMode) => { setMode(nextMode); setStatus({ type: 'idle', message: '' }); };

  if (session) {
    return <ScrollView contentContainerStyle={styles.content}><Brand /><Text style={styles.title}>Conta conectada</Text><Text style={styles.subtitle}>Sua conta está ativa neste dispositivo.</Text><View style={styles.card}><Text style={styles.cardLabel}>Email</Text><Text style={styles.accountEmail}>{session.user?.email}</Text><Pressable accessibilityRole="button" onPress={async () => { setStatus({ type: 'loading', message: '' }); const { error } = await supabase.auth.signOut(); setStatus(error ? { type: 'error', message: friendlyError(error) } : { type: 'success', message: 'Você saiu da conta.' }); }} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Sair da conta</Text></Pressable></View></ScrollView>;
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View pointerEvents="none" style={styles.orbTop}><Ionicons name="school" size={92} color="#6A6CF2" /></View>
      <Brand />
      <Text style={styles.brandSubtitle}>Organize hoje.{'\n'}Conquiste amanhã.</Text>
      <Text style={styles.eyebrow}>MINHA CONTA</Text>
      <Text style={styles.title}>Entre no <Text style={styles.titleAccent}>Estuda+</Text></Text>
      <Text style={styles.subtitle}>Acesse seu acompanhamento acadêmico em qualquer dispositivo.</Text>

      <View style={styles.card}>
        <View style={styles.switcher}>
          <Pressable accessibilityRole="button" accessibilityState={{ selected: isLogin }} onPress={() => switchMode('login')} style={[styles.switchButton, isLogin && styles.switchActive]}><Ionicons name="person-outline" size={19} color={isLogin ? COLORS.ink : COLORS.muted} /><Text style={[styles.switchText, isLogin && styles.switchTextActive]}>Entrar</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityState={{ selected: !isLogin }} onPress={() => switchMode('signup')} style={[styles.switchButton, !isLogin && styles.switchActive]}><Ionicons name="person-add-outline" size={19} color={!isLogin ? COLORS.ink : COLORS.muted} /><Text style={[styles.switchText, !isLogin && styles.switchTextActive]}>Criar conta</Text></Pressable>
        </View>
        {!supabaseConfigured ? <Text style={styles.setupNotice}>O login ainda precisa ser configurado.</Text> : null}
        <Text style={styles.label}>Email</Text>
        <View style={styles.inputWrap}><Ionicons name="mail-outline" size={22} color={COLORS.ink} /><TextInput accessibilityLabel="Email" autoCapitalize="none" autoComplete="email" keyboardType="email-address" value={email} onChangeText={setEmail} placeholder="seu@email.com" placeholderTextColor={COLORS.muted} style={styles.input} /></View>
        <Text style={styles.label}>Senha</Text>
        <View style={styles.inputWrap}><Ionicons name="lock-closed-outline" size={22} color={COLORS.ink} /><TextInput accessibilityLabel="Senha" autoCapitalize="none" autoComplete="password" secureTextEntry={!showPassword} value={password} onChangeText={setPassword} placeholder="Sua senha" placeholderTextColor={COLORS.muted} style={styles.input} /><Pressable accessibilityRole="button" accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'} onPress={() => setShowPassword((value) => !value)}><Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={23} color={COLORS.muted} /></Pressable></View>
        {isLogin ? <Pressable onPress={recoverPassword} style={styles.forgot}><Text style={styles.forgotText}>Esqueci minha senha?</Text></Pressable> : null}
        {status.message ? <Text style={[styles.feedback, status.type === 'error' ? styles.error : styles.success]}>{status.message}</Text> : null}
        <Pressable accessibilityRole="button" accessibilityLabel={isLogin ? 'Entrar na conta' : 'Criar conta'} disabled={isLoading} onPress={submit} style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed, isLoading && styles.disabled]}>{isLoading ? <ActivityIndicator color={COLORS.ink} /> : <><Text style={styles.primaryButtonText}>{isLogin ? 'Entrar' : 'Criar conta'}</Text><Ionicons name="arrow-forward" size={24} color={COLORS.ink} /></>}</Pressable>
        <View style={styles.divider}><View style={styles.dividerLine} /><Text style={styles.dividerText}>ou</Text><View style={styles.dividerLine} /></View>
        <Pressable onPress={() => switchMode(isLogin ? 'signup' : 'login')} style={styles.outlineButton}><Ionicons name="person-add-outline" size={22} color={COLORS.ink} /><Text style={styles.outlineText}>{isLogin ? 'Criar conta' : 'Voltar ao login'}</Text></Pressable>
        <View style={styles.security}><Ionicons name="shield-checkmark-outline" size={18} color={COLORS.teal} /><Text style={styles.securityText}>Seus dados estão seguros com a gente.</Text></View>
      </View>
    </ScrollView>
  );
}

function Brand() { return <View style={styles.brand}><Text style={styles.brandName}>Estuda<Text style={styles.titleAccent}>+</Text></Text></View>; }

const styles = StyleSheet.create({
  content: { backgroundColor: COLORS.page, flexGrow: 1, minHeight: '100%', overflow: 'hidden', padding: 26, paddingBottom: 40, position: 'relative' },
  orbTop: { opacity: 0.22, position: 'absolute', right: -7, top: 34, transform: [{ rotate: '-12deg' }] },
  brand: { marginTop: 16 },
  brandName: { color: COLORS.ink, fontSize: 27, fontWeight: '800', letterSpacing: -0.8 },
  titleAccent: { color: COLORS.primaryLight },
  brandSubtitle: { color: COLORS.muted, fontSize: 15, lineHeight: 22, marginTop: 4 },
  eyebrow: { color: COLORS.primaryLight, fontSize: 12, fontWeight: '800', letterSpacing: 2.3, marginTop: 42 },
  title: { color: COLORS.ink, fontSize: 38, fontWeight: '800', letterSpacing: -1.3, lineHeight: 45, marginTop: 7 },
  subtitle: { color: COLORS.muted, fontSize: 17, lineHeight: 25, marginTop: 8 },
  card: { backgroundColor: 'rgba(36,45,91,0.8)', borderColor: COLORS.line, borderRadius: 24, borderWidth: 1, marginTop: 25, padding: 17, shadowColor: '#000', shadowOpacity: 0.26, shadowRadius: 24, shadowOffset: { height: 12, width: 0 } },
  switcher: { backgroundColor: 'rgba(70,79,136,0.42)', borderRadius: 16, flexDirection: 'row', padding: 4 },
  switchButton: { alignItems: 'center', borderRadius: 13, flex: 1, flexDirection: 'row', gap: 8, justifyContent: 'center', minHeight: 57 },
  switchActive: { backgroundColor: COLORS.primary },
  switchText: { color: COLORS.muted, fontSize: 16, fontWeight: '700' },
  switchTextActive: { color: COLORS.ink },
  setupNotice: { color: COLORS.yellow, fontSize: 12, marginTop: 12, textAlign: 'center' },
  label: { color: COLORS.ink, fontSize: 16, fontWeight: '700', marginBottom: 9, marginTop: 19 },
  inputWrap: { alignItems: 'center', backgroundColor: 'rgba(36,43,86,0.68)', borderColor: COLORS.line, borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: 13, minHeight: 61, paddingHorizontal: 17 },
  input: { color: COLORS.ink, flex: 1, fontSize: 16, minHeight: 57 },
  forgot: { alignSelf: 'flex-end', marginTop: 12 },
  forgotText: { color: COLORS.primaryLight, fontSize: 14, fontWeight: '700' },
  feedback: { borderRadius: 10, fontSize: 13, lineHeight: 18, marginTop: 14, padding: 10 },
  error: { backgroundColor: COLORS.redSoft, color: COLORS.red },
  success: { backgroundColor: 'rgba(124,255,214,0.14)', color: COLORS.teal },
  primaryButton: { alignItems: 'center', backgroundColor: COLORS.primary, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', marginTop: 20, minHeight: 62 },
  primaryButtonText: { color: COLORS.ink, fontSize: 18, fontWeight: '800' },
  buttonPressed: { backgroundColor: '#4D50D5', transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.65 },
  divider: { alignItems: 'center', flexDirection: 'row', gap: 12, marginVertical: 21 },
  dividerLine: { backgroundColor: 'rgba(180,190,240,0.18)', flex: 1, height: 1 },
  dividerText: { color: COLORS.muted, fontSize: 15 },
  outlineButton: { alignItems: 'center', borderColor: COLORS.line, borderRadius: 16, borderWidth: 1.5, flexDirection: 'row', gap: 12, justifyContent: 'center', minHeight: 58 },
  outlineText: { color: COLORS.ink, fontSize: 17, fontWeight: '700' },
  security: { alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: 24 },
  securityText: { color: COLORS.muted, fontSize: 12 },
  cardLabel: { color: COLORS.muted, fontSize: 13, fontWeight: '700' },
  accountEmail: { color: COLORS.ink, fontSize: 16, marginTop: 8 },
});
