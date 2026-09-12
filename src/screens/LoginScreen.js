import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase, supabaseConfigured } from '../services/supabase';

const COLORS = {
  background: '#F6F8FC',
  card: '#FFFFFF',
  ink: '#1C2140',
  muted: '#707793',
  line: '#E8EBF4',
  primary: '#5B5CE2',
  primarySoft: '#EEEDFF',
  red: '#D95863',
  redSoft: '#FCE9EC',
  teal: '#1EA99A',
  tealSoft: '#E4F8F4',
};

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
  const [status, setStatus] = useState({ type: 'idle', message: '' });

  const isLogin = mode === 'login';
  const isLoading = status.type === 'loading';

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
      setStatus({ type: 'error', message: 'Configure o Supabase no arquivo .env para usar o login.' });
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
      setStatus({ type: 'success', message: 'Login realizado. Bem-vindo ao Estuda+.' });
      return;
    }

    setStatus({ type: 'success', message: 'Conta criada. Confirme o email para entrar.' });
    setMode('login');
  };

  const signOut = async () => {
    if (!supabase) return;
    setStatus({ type: 'loading', message: '' });
    const { error } = await supabase.auth.signOut();
    setStatus(error ? { type: 'error', message: friendlyError(error) } : { type: 'success', message: 'Você saiu da conta.' });
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.eyebrow}>MINHA CONTA</Text>
        <Text style={styles.title}>{session ? 'Conta conectada' : 'Entre no Estuda+'}</Text>
        <Text style={styles.subtitle}>{session ? 'Sua conta está ativa neste dispositivo.' : 'Acesse seu acompanhamento acadêmico em qualquer dispositivo.'}</Text>
      </View>

      {session ? (
        <View style={styles.card}>
          <Text style={styles.setupTitle}>Usuário conectado</Text>
          <Text style={styles.accountEmail}>{session.user?.email}</Text>
          {status.message ? <Text style={[styles.feedback, status.type === 'error' ? styles.error : styles.success]}>{status.message}</Text> : null}
          <Pressable accessibilityRole="button" accessibilityLabel="Sair da conta" disabled={isLoading} style={[styles.primaryButton, isLoading && styles.disabledButton]} onPress={signOut}>
            {isLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Sair da conta</Text>}
          </Pressable>
        </View>
      ) : (
        <>
          {!supabaseConfigured ? (
            <View style={styles.setupCard}>
              <Text style={styles.setupTitle}>Login quase pronto</Text>
              <Text style={styles.setupText}>Falta preencher a URL e a chave pública do Supabase no arquivo .env.</Text>
            </View>
          ) : null}

          <View style={styles.card}>
            <View style={styles.switcher}>
              <Pressable accessibilityRole="button" accessibilityState={{ selected: isLogin }} style={[styles.switchButton, isLogin && styles.switchButtonActive]} onPress={() => { setMode('login'); setStatus({ type: 'idle', message: '' }); }}>
                <Text style={[styles.switchText, isLogin && styles.switchTextActive]}>Entrar</Text>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityState={{ selected: !isLogin }} style={[styles.switchButton, !isLogin && styles.switchButtonActive]} onPress={() => { setMode('signup'); setStatus({ type: 'idle', message: '' }); }}>
                <Text style={[styles.switchText, !isLogin && styles.switchTextActive]}>Criar conta</Text>
              </Pressable>
            </View>

            <Text style={styles.label}>Email</Text>
            <TextInput accessibilityLabel="Email" autoCapitalize="none" autoComplete="email" keyboardType="email-address" value={email} onChangeText={setEmail} placeholder="voce@email.com" placeholderTextColor="#9AA0B7" style={styles.input} />
            <Text style={styles.label}>Senha</Text>
            <TextInput accessibilityLabel="Senha" autoCapitalize="none" autoComplete="password" secureTextEntry value={password} onChangeText={setPassword} placeholder="Mínimo de 6 caracteres" placeholderTextColor="#9AA0B7" style={styles.input} />

            {status.message ? <Text style={[styles.feedback, status.type === 'error' ? styles.error : styles.success]}>{status.message}</Text> : null}

            <Pressable accessibilityRole="button" accessibilityLabel={isLogin ? 'Entrar na conta' : 'Criar conta'} disabled={isLoading} style={[styles.primaryButton, isLoading && styles.disabledButton]} onPress={submit}>
              {isLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>{isLogin ? 'Entrar' : 'Criar conta'}</Text>}
            </Pressable>
          </View>
        </>
      )}
      <Text style={styles.privacyText}>Seus dados de acesso são tratados pelo Supabase.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 28, paddingBottom: 36 },
  header: { marginBottom: 20 },
  eyebrow: { color: COLORS.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginBottom: 6 },
  title: { color: COLORS.ink, fontSize: 27, fontWeight: '800', letterSpacing: -0.6 },
  subtitle: { color: COLORS.muted, fontSize: 13, lineHeight: 19, marginTop: 7 },
  setupCard: { backgroundColor: COLORS.primarySoft, borderRadius: 16, padding: 15, marginBottom: 14 },
  setupTitle: { color: COLORS.ink, fontSize: 14, fontWeight: '800' },
  setupText: { color: COLORS.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  accountEmail: { color: COLORS.muted, fontSize: 13, marginTop: 7, marginBottom: 22 },
  card: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.line, borderRadius: 18, padding: 16 },
  switcher: { flexDirection: 'row', backgroundColor: '#F5F6FB', borderRadius: 11, padding: 3, marginBottom: 22 },
  switchButton: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 9 },
  switchButtonActive: { backgroundColor: COLORS.card },
  switchText: { color: COLORS.muted, fontSize: 12, fontWeight: '700' },
  switchTextActive: { color: COLORS.primary },
  label: { color: COLORS.ink, fontSize: 11, fontWeight: '800', marginBottom: 6, marginTop: 4 },
  input: { backgroundColor: '#F8F9FD', borderWidth: 1, borderColor: COLORS.line, borderRadius: 11, color: COLORS.ink, fontSize: 13, minHeight: 45, paddingHorizontal: 12, marginBottom: 12 },
  feedback: { fontSize: 12, lineHeight: 18, marginBottom: 12 },
  error: { color: COLORS.red, backgroundColor: COLORS.redSoft, borderRadius: 9, padding: 9 },
  success: { color: COLORS.teal, backgroundColor: COLORS.tealSoft, borderRadius: 9, padding: 9 },
  primaryButton: { alignItems: 'center', justifyContent: 'center', minHeight: 48, borderRadius: 12, backgroundColor: COLORS.primary },
  disabledButton: { opacity: 0.7 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  signOutButton: { alignItems: 'center', marginTop: 16, padding: 4 },
  signOutText: { color: COLORS.muted, fontSize: 12, fontWeight: '700' },
  privacyText: { color: COLORS.muted, fontSize: 11, textAlign: 'center', marginTop: 18 },
});
