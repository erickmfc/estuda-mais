import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, AppState, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Network from 'expo-network';
import * as Notifications from 'expo-notifications';
import { enqueueSubmission, getCachedProfile, getPending, loadProfile, loadSubmissions, reviewSubmission, syncPending } from '../services/p2Service';

if (Platform.OS !== 'web') Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }) });

const C = { bg: '#F5F6FF', card: '#FFFFFF', ink: '#161B3D', muted: '#515A78', primary: '#4447C4', danger: '#A7193D' };
const statusName = { approved: 'Aprovado', rejected: 'Rejeitado' };
const reviewOf = (record) => Array.isArray(record.p2_reviews) ? record.p2_reviews[0] : record.p2_reviews;

export default function P2Screen({ session }) {
  const userId = session.user.id;
  const [unlocked, setUnlocked] = useState(Platform.OS === 'web');
  const [profile, setProfile] = useState(null);
  const [records, setRecords] = useState([]);
  const [pending, setPending] = useState([]);
  const [description, setDescription] = useState('');
  const [hours, setHours] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const unlock = useCallback(async () => {
    setError('');
    if (Platform.OS === 'web') return setUnlocked(true);
    try {
      const available = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!available || !enrolled) throw new Error('Configure a biometria ou bloqueio seguro do aparelho para acessar esta área.');
      const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Desbloquear Estuda+', cancelLabel: 'Cancelar' });
      if (!result.success) throw new Error(result.error === 'user_cancel' ? 'Verificação cancelada.' : 'Não foi possível confirmar sua identidade. Tente novamente.');
      setUnlocked(true);
    } catch (e) { setError(e.message); }
  }, []);

  useEffect(() => { void unlock(); }, [unlock]);

  const refresh = useCallback(async () => {
    if (!unlocked) return;
    setBusy(true); setError('');
    try {
      setPending(await getPending(userId));
      const cached = await getCachedProfile(userId);
      if (cached) setProfile(cached);
      const network = await Network.getNetworkStateAsync();
      if (!network.isConnected || network.isInternetReachable === false) {
        setMessage('Sem internet. As atividades pendentes permanecem salvas no aparelho.');
        return;
      }
      const p = await loadProfile(userId);
      setProfile(p);
      const sync = await syncPending(userId);
      const [rows, local] = await Promise.all([loadSubmissions(), getPending(userId)]);
      setRecords(rows); setPending(local);
      if (sync.synced) setMessage(`${sync.synced} registro(s) sincronizado(s).`);
      const reviewed = rows.filter((r) => r.student_id === userId && reviewOf(r)).length;
      const seenKey = `p2-review-count:${userId}`;
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const previous = Number(await AsyncStorage.getItem(seenKey) || reviewed);
      if (Platform.OS !== 'web' && reviewed > previous) {
        if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('reviews', { name: 'Revisões de estágio', importance: Notifications.AndroidImportance.HIGH });
        const permission = await Notifications.requestPermissionsAsync();
        if (permission.granted) await Notifications.scheduleNotificationAsync({ content: { title: 'Estuda+', body: 'Seu orientador revisou uma atividade.' }, trigger: null });
        else setMessage('Há uma nova revisão. Ative notificações nas configurações do aparelho para receber avisos.');
      }
      await AsyncStorage.setItem(seenKey, String(reviewed));
    } catch (e) { setError(e.message || 'Não foi possível atualizar. Confira sua conexão.'); }
    finally { setBusy(false); }
  }, [unlocked, userId]);

  useEffect(() => {
    if (!unlocked) return undefined;
    void refresh();
    const timer = setInterval(() => { void refresh(); }, 20000);
    const sub = AppState.addEventListener('change', (state) => { if (state === 'active') void refresh(); });
    return () => { clearInterval(timer); sub.remove(); };
  }, [unlocked, refresh]);

  const submit = async () => {
    const n = Number(hours.replace(',', '.'));
    if (description.trim().length < 5 || description.trim().length > 500 || !Number.isFinite(n) || n <= 0 || n > 24) {
      setError('Informe uma atividade de 5 a 500 caracteres e horas entre 0 e 24.'); return;
    }
    if (!profile?.advisor_id) { setError('Seu orientador ainda não foi vinculado.'); return; }
    setBusy(true); setError('');
    try {
      await enqueueSubmission(userId, profile.advisor_id, description, n);
      setDescription(''); setHours('');
      setPending(await getPending(userId));
      setMessage('Atividade salva no aparelho. Será enviada quando houver conexão.');
      await refresh();
    } catch (e) { setError(e.message || 'Não foi possível salvar.'); }
    finally { setBusy(false); }
  };

  const review = async (record, decision) => {
    setBusy(true); setError('');
    try { const saved = await reviewSubmission(userId, record.id, decision, note); setNote(''); setMessage(saved.alreadyReviewed ? 'Esta atividade já foi revisada. Estado atualizado.' : 'Revisão registrada na nuvem.'); await refresh(); }
    catch (e) { setError(e.message || 'Não foi possível revisar.'); }
    finally { setBusy(false); }
  };

  if (!unlocked) return <View style={s.center}><Text style={s.title}>Verificação local</Text><Text style={s.body}>Confirme sua identidade para ver os registros desta sessão.</Text><Text style={s.error} accessibilityRole="alert">{error}</Text><Button label="Tentar novamente" onPress={unlock} /></View>;
  return <ScrollView style={s.page} contentContainerStyle={s.content}>
    <Text style={s.title}>Estágio compartilhado</Text>
    <Text style={s.body}>Perfil: {profile?.role === 'advisor' ? 'orientador' : 'aluno'}. Conta autenticada: {session.user.email}</Text>
    <Button label={busy ? 'Atualizando...' : 'Atualizar e sincronizar'} onPress={refresh} disabled={busy} />
    {busy && <ActivityIndicator color={C.primary} />}
    {!!message && <Text style={s.success} accessibilityRole="alert">{message}</Text>}
    {!!error && <Text style={s.error} accessibilityRole="alert">{error}</Text>}
    {profile?.role === 'student' && <View style={s.card}>
      <Text style={s.heading}>Nova atividade</Text>
      <TextInput accessibilityLabel="Descrição da atividade" style={s.input} placeholder="O que você fez no estágio?" value={description} onChangeText={setDescription} maxLength={500} multiline />
      <TextInput accessibilityLabel="Horas realizadas" style={s.input} placeholder="Horas realizadas" keyboardType="decimal-pad" value={hours} onChangeText={setHours} />
      <Button label="Salvar atividade" onPress={submit} disabled={busy} />
      <Text style={s.body}>Pendentes de envio: {pending.length}</Text>
      {!profile.advisor_id && <Text style={s.error}>Peça ao responsável para vincular um orientador a esta conta.</Text>}
    </View>}
    {pending.map((item) => <View style={s.card} key={item.id}>
      <Text style={s.heading}>{item.description}</Text>
      <Text style={s.body}>{item.hours} hora(s)</Text>
      <Text style={s.body}>Estado: Pendente de envio</Text>
    </View>)}
    <Text style={s.heading}>{profile?.role === 'advisor' ? 'Atividades dos alunos' : 'Minhas atividades'}</Text>
    {!records.length && <Text style={s.body}>Nenhuma atividade recebida. Atualize após conectar à internet.</Text>}
    {records.map((r) => {
      const result = reviewOf(r);
      return <View style={s.card} key={r.id}>
        <Text style={s.heading}>{r.description}</Text>
        <Text style={s.body}>{r.hours} hora(s) · {new Date(r.created_at).toLocaleDateString('pt-BR')}</Text>
        <Text style={s.body}>Aluno: {r.student_id}</Text>
        <Text style={s.body}>Estado: {result ? statusName[result.decision] : 'Aguardando revisão'}</Text>
        {!!result?.note && <Text style={s.body}>Comentário: {result.note}</Text>}
        {profile?.role === 'advisor' && !result && <>
          <TextInput accessibilityLabel="Comentário da revisão" style={s.input} placeholder="Comentário opcional" value={note} onChangeText={setNote} maxLength={500} />
          <Button label="Aprovar" onPress={() => review(r, 'approved')} disabled={busy} />
          <Button label="Rejeitar" onPress={() => review(r, 'rejected')} disabled={busy} />
        </>}
      </View>;
    })}
  </ScrollView>;
}

function Button({ label, onPress, disabled }) { return <TouchableOpacity accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} style={[s.button, disabled && { opacity: 0.5 }]}><Text style={s.buttonText}>{label}</Text></TouchableOpacity>; }
const s = StyleSheet.create({ page: { flex: 1, backgroundColor: C.bg }, content: { padding: 20, paddingBottom: 50, gap: 12 }, center: { flex: 1, justifyContent: 'center', padding: 28, backgroundColor: C.bg }, card: { backgroundColor: C.card, padding: 16, borderRadius: 14, gap: 10 }, title: { color: C.ink, fontWeight: '700', fontSize: 25 }, heading: { color: C.ink, fontWeight: '700', fontSize: 18 }, body: { color: C.muted, fontSize: 15, lineHeight: 21 }, input: { borderWidth: 1, borderColor: '#8991B2', borderRadius: 8, padding: 12, color: C.ink, minHeight: 48 }, button: { backgroundColor: C.primary, padding: 13, borderRadius: 9, alignItems: 'center', marginVertical: 3 }, buttonText: { color: '#FFF', fontSize: 15, fontWeight: '700' }, error: { color: C.danger, fontSize: 14 }, success: { color: '#155B3B', fontSize: 14 } });
