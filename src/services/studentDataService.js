import { supabase } from './supabase';

function requireClient() {
  if (!supabase) throw new Error('Supabase não configurado.');
  return supabase;
}

function mapSubject(row) {
  return { id: row.id, name: row.name, teacher: row.teacher || 'Professor não informado', absences: row.absences, limit: row.absence_limit };
}

function mapReminder(row) {
  return { id: row.id, title: row.title, date: row.due_label || 'Sem data', done: row.done };
}

function mapActivity(row) {
  return { id: row.id, nome: row.name };
}

function mapInternship(row, days) {
  if (!row) return null;
  const hours = days.reduce((total, day) => total + Number(day.hours), 0);
  const target = Number(row.target_hours);
  return {
    id: row.id,
    company: row.company,
    hours,
    target,
    progress: target > 0 ? Math.min(100, Math.round((hours / target) * 100)) : 0,
    days: days.map((day) => ({ id: day.id, date: day.date_label, description: day.description, hours: Number(day.hours) })),
  };
}

async function unwrap(query) {
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

function isMissingAbsenceTable(error) {
  return error?.code === '42P01' || error?.code === 'PGRST205' || /absence_records.*(does not exist|schema cache)/i.test(error?.message || '');
}

export async function fetchStudentData(userId) {
  const client = requireClient();
  const [subjects, reminders, activities, internship] = await Promise.all([
    unwrap(client.from('subjects').select('id,name,teacher,absences,absence_limit').eq('user_id', userId).order('name')),
    unwrap(client.from('reminders').select('id,title,due_label,done').eq('user_id', userId).order('created_at', { ascending: false })),
    unwrap(client.from('activities').select('id,name').eq('user_id', userId).order('created_at', { ascending: false })),
    unwrap(client.from('internships').select('id,company,target_hours').eq('user_id', userId).maybeSingle()),
  ]);

  let absenceRecords = [];
  const { data: absenceData, error: absenceError } = await client.from('absence_records')
    .select('id,subject_id,absence_date').eq('user_id', userId).order('absence_date', { ascending: false });
  if (absenceError && !isMissingAbsenceTable(absenceError)) throw absenceError;
  if (!absenceError) absenceRecords = absenceData || [];

  const days = internship
    ? await unwrap(client.from('internship_days').select('id,date_label,description,hours').eq('user_id', userId).eq('internship_id', internship.id).order('date_label', { ascending: false }))
    : [];

  return {
    subjects: subjects.map(mapSubject),
    absenceRecords: absenceRecords.map((record) => ({ ...record, date: record.absence_date })),
    reminders: reminders.map(mapReminder),
    activities: activities.map(mapActivity),
    stage: mapInternship(internship, days),
  };
}

export async function registerAbsence(userId, subjectId, date) {
  const { data, error } = await requireClient().from('absence_records')
    .insert({ user_id: userId, subject_id: subjectId, absence_date: date }).select('id').single();
  if (isMissingAbsenceTable(error)) {
    throw new Error('O histórico de faltas ainda não foi habilitado no banco. Aplique a migração supabase/migrations/20261030000000_absence_calendar.sql.');
  }
  if (error) throw error;
  return data;
}

export async function createSubject(userId, { name, teacher, limit }) {
  return unwrap(requireClient().from('subjects').insert({ user_id: userId, name, teacher, absence_limit: limit }).select('id').single());
}

export async function createReminder(userId, title) {
  return unwrap(requireClient().from('reminders').insert({ user_id: userId, title, due_label: 'Hoje' }).select('id').single());
}

export async function updateReminder(userId, reminder) {
  return unwrap(requireClient().from('reminders').update({ done: !reminder.done }).eq('id', reminder.id).eq('user_id', userId).select('id').single());
}

export async function createActivity(userId, name) {
  return unwrap(requireClient().from('activities').insert({ user_id: userId, name }).select('id').single());
}

export async function deleteActivity(userId, id) {
  return unwrap(requireClient().from('activities').delete().eq('id', id).eq('user_id', userId).select('id').single());
}

export async function createInternship(userId, { company, target }) {
  return unwrap(requireClient().from('internships').insert({ user_id: userId, company, target_hours: target }).select('id').single());
}

export async function updateInternship(userId, stage, changes) {
  return unwrap(requireClient().from('internships').update({ company: changes.company, target_hours: changes.target }).eq('id', stage.id).eq('user_id', userId).select('id').single());
}

export async function createInternshipDay(userId, stage, day) {
  return unwrap(requireClient().from('internship_days').insert({ user_id: userId, internship_id: stage.id, date_label: day.date, description: day.description, hours: day.hours }).select('id').single());
}

export async function updateInternshipDay(userId, dayId, changes) {
  return unwrap(requireClient().from('internship_days').update({ date_label: changes.date, description: changes.description, hours: changes.hours }).eq('id', dayId).eq('user_id', userId).select('id').single());
}

export async function deleteInternshipDay(userId, dayId) {
  return unwrap(requireClient().from('internship_days').delete().eq('id', dayId).eq('user_id', userId).select('id').single());
}

export async function fetchWeatherPreference(userId) {
  const row = await unwrap(requireClient().from('user_preferences').select('weather_city').eq('user_id', userId).maybeSingle());
  return row?.weather_city || '';
}

export async function saveWeatherPreference(userId, city) {
  return unwrap(requireClient().from('user_preferences').upsert({ user_id: userId, weather_city: city }, { onConflict: 'user_id' }).select('weather_city').single());
}
