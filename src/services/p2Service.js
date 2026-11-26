import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as Network from 'expo-network';
import { supabase } from './supabase';

const queueKey = (userId) => `p2-submissions:${userId}`;

export async function loadProfile(userId) {
  const { data, error } = await supabase.from('p2_profiles').select('user_id,role,advisor_id').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  if (data) return data;
  const created = await supabase.from('p2_profiles').insert({ user_id: userId, role: 'student' }).select('user_id,role,advisor_id').single();
  if (created.error?.code === '23505') return loadProfile(userId);
  if (created.error) throw created.error;
  return created.data;
}

export async function loadSubmissions() {
  const { data, error } = await supabase.from('p2_submissions')
    .select('id,student_id,advisor_id,description,hours,created_at,p2_reviews(decision,note,created_at)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getPending(userId) {
  const raw = await AsyncStorage.getItem(queueKey(userId));
  return raw ? JSON.parse(raw) : [];
}

export async function enqueueSubmission(userId, advisorId, description, hours) {
  const item = { id: Crypto.randomUUID(), student_id: userId, advisor_id: advisorId, description: description.trim(), hours: Number(hours) };
  const pending = await getPending(userId);
  pending.push(item);
  await AsyncStorage.setItem(queueKey(userId), JSON.stringify(pending));
  return item;
}

export async function syncPending(userId) {
  const network = await Network.getNetworkStateAsync();
  if (!network.isConnected || network.isInternetReachable === false) return { offline: true, synced: 0 };
  const pending = await getPending(userId);
  let synced = 0;
  for (const item of pending) {
    const { error } = await supabase.from('p2_submissions').insert(item);
    if (error && error.code === '23505') {
      const existing = await supabase.from('p2_submissions').select('student_id,advisor_id,description,hours').eq('id', item.id).maybeSingle();
      if (existing.error || !existing.data || existing.data.student_id !== userId || existing.data.advisor_id !== item.advisor_id || existing.data.description !== item.description || Number(existing.data.hours) !== item.hours) {
        throw new Error('Conflito de sincronização. O registro local foi mantido para revisão.');
      }
    } else if (error) {
      if (/fetch|network|timeout/i.test(error.message || '')) return { offline: true, synced };
      throw error;
    }
    // Keep the same UUID on retry so a lost response cannot duplicate a record.
    await AsyncStorage.setItem(queueKey(userId), JSON.stringify(pending.slice(synced + 1)));
    synced += 1;
  }
  return { offline: false, synced };
}

export async function reviewSubmission(userId, submissionId, decision, note) {
  const { error } = await supabase.from('p2_reviews').insert({
    submission_id: submissionId, advisor_id: userId, decision, note: note.trim(),
  });
  if (error) throw error;
}
