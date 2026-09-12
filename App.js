import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CadastroScreen from './src/screens/CadastroScreen';
import ClimaScreen from './src/screens/ClimaScreen';
import LoginScreen from './src/screens/LoginScreen';
import { supabase, supabaseConfigured } from './src/services/supabase';
import {
  createActivity,
  createInternship,
  createInternshipDay,
  createReminder,
  createSubject,
  deleteActivity,
  deleteInternshipDay,
  fetchStudentData,
  registerAbsence,
  updateInternship,
  updateInternshipDay,
  updateReminder,
} from './src/services/studentDataService';

const COLORS = {
  background: '#F6F8FC',
  card: '#FFFFFF',
  ink: '#1C2140',
  muted: '#707793',
  line: '#E8EBF4',
  primary: '#5B5CE2',
  primarySoft: '#EEEDFF',
  teal: '#1EA99A',
  tealSoft: '#E4F8F4',
  amber: '#E69B27',
  amberSoft: '#FFF3D9',
  red: '#D95863',
  redSoft: '#FCE9EC',
};

function Icon({ name, size = 20, color = COLORS.ink }) {
  return <Ionicons name={name} size={size} color={color} />;
}

function currentDateLabel() {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
}

function DataStatus({ status, error, onRetry }) {
  if (status === 'loading') {
    return <View style={styles.dataStatus}><ActivityIndicator size="small" color={COLORS.primary} /><Text style={styles.dataStatusText}>Carregando seus dados...</Text></View>;
  }
  if (status === 'error') {
    return <View style={[styles.dataStatus, styles.dataStatusError]}><Text style={styles.dataStatusText}>{error || 'Não foi possível carregar seus dados.'}</Text><Pressable onPress={onRetry}><Text style={styles.linkText}>Tentar novamente</Text></Pressable></View>;
  }
  return null;
}

function SectionTitle({ eyebrow, title, action, onAction }) {
  return (
    <View style={styles.sectionTitleRow}>
      <View>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.linkText}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function ProgressBar({ value, color = COLORS.primary, track = '#E9EAF8' }) {
  return (
    <View style={[styles.progressTrack, { backgroundColor: track }]}>
      <View style={[styles.progressValue, { width: `${Math.min(value, 100)}%`, backgroundColor: color }]} />
    </View>
  );
}

function SummaryCard({ icon, label, value, detail, tone = 'primary', onPress }) {
  const tones = {
    primary: { background: COLORS.primarySoft, icon: COLORS.primary },
    teal: { background: COLORS.tealSoft, icon: COLORS.teal },
    amber: { background: COLORS.amberSoft, icon: COLORS.amber },
  };
  const selected = tones[tone];
  return (
    <Pressable style={styles.summaryCard} onPress={onPress}>
      <View style={[styles.summaryIcon, { backgroundColor: selected.background }]}>
        <Icon name={icon} size={19} color={selected.icon} />
      </View>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryDetail}>{detail}</Text>
    </Pressable>
  );
}

function HomeScreen({ subjects, reminders, stage, goTo, dataStatus, dataError, onRetry }) {
  const pendingReminders = reminders.filter((item) => !item.done);
  const attentionSubject = subjects.find((subject) => subject.absences / subject.limit >= 0.5);

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.greeting}>Olá, estudante!</Text>
          <Text style={styles.dateText}>{currentDateLabel()}</Text>
        </View>
        <View style={styles.avatar}><Text style={styles.avatarText}>E</Text></View>
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroCopy}>
          <Text style={styles.heroTitle}>Sua vida acadêmica em um só lugar.</Text>
          <Text style={styles.heroText}>Acompanhe suas tarefas, faltas e o estágio sem complicação.</Text>
        </View>
        <View style={styles.heroShape}><Icon name="school-outline" size={38} color="#FFFFFF" /></View>
      </View>

      <SectionTitle eyebrow="VISÃO GERAL" title="Resumo de hoje" />
      <View style={styles.summaryGrid}>
        <SummaryCard icon="alert-circle-outline" label="Faltas" value={attentionSubject ? 'Atenção' : 'Tranquilo'} detail={`${subjects.reduce((total, item) => total + item.absences, 0)} registradas`} tone="amber" onPress={() => goTo('faltas')} />
        <SummaryCard icon="notifications-outline" label="Lembretes" value={pendingReminders.length} detail="pendentes" tone="primary" onPress={() => goTo('lembretes')} />
        <SummaryCard icon="briefcase-outline" label="Estágio" value={stage ? `${stage.progress}%` : '--'} detail={stage ? 'concluído' : 'não cadastrado'} tone="teal" onPress={() => goTo('estagio')} />
      </View>

      <SectionTitle eyebrow="ATENÇÃO" title="Acompanhe de perto" action="Ver faltas" onAction={() => goTo('faltas')} />
      <Pressable style={styles.attentionCard} onPress={() => goTo('faltas')}>
        <View style={styles.attentionIcon}><Icon name="time-outline" size={22} color={COLORS.amber} /></View>
        <View style={styles.attentionBody}>
          <Text style={styles.cardTitle}>{attentionSubject ? attentionSubject.name : 'Nenhuma disciplina cadastrada'}</Text>
          <Text style={styles.cardDescription}>{attentionSubject ? 'Você já usou metade do limite de faltas.' : 'Cadastre suas disciplinas no Supabase para acompanhar faltas.'}</Text>
          {attentionSubject ? <ProgressBar value={(attentionSubject.absences / attentionSubject.limit) * 100} color={COLORS.amber} track="#FCECC7" /> : null}
        </View>
        <Icon name="chevron-forward" size={19} color={COLORS.muted} />
      </Pressable>

      <SectionTitle eyebrow="PRÓXIMOS PASSOS" title="Lembretes" action="Ver todos" onAction={() => goTo('lembretes')} />
      <View style={styles.listCard}>
        {pendingReminders.slice(0, 2).map((reminder, index) => (
          <View key={reminder.id} style={[styles.reminderRow, index > 0 && styles.rowBorder]}>
            <View style={styles.reminderDot}><Icon name="checkmark" size={13} color={COLORS.primary} /></View>
            <View style={styles.reminderTextWrap}>
              <Text style={styles.reminderTitle} numberOfLines={1}>{reminder.title}</Text>
              <Text style={styles.reminderDate}>{reminder.date}</Text>
            </View>
          </View>
        ))}
        {pendingReminders.length === 0 ? <Text style={styles.emptyText}>Tudo em dia por aqui.</Text> : null}
      </View>

      <Pressable style={styles.stagePreview} onPress={() => goTo('estagio')}>
        <View style={styles.stageTopLine}>
          <View><Text style={styles.eyebrow}>MEU ESTÁGIO</Text><Text style={styles.stageTitle}>{stage ? stage.company : 'Nenhum estágio cadastrado'}</Text></View>
          <Text style={styles.stagePercentage}>{stage ? `${stage.progress}%` : '--'}</Text>
        </View>
        {stage ? <><ProgressBar value={stage.progress} color={COLORS.teal} track="#D8F0EC" /><Text style={styles.stageCaption}>{stage.hours} de {stage.target} horas realizadas</Text></> : <Text style={styles.stageCaption}>Toque para cadastrar seu estágio.</Text>}
      </Pressable>
      <DataStatus status={dataStatus} error={dataError} onRetry={onRetry} />
    </ScrollView>
  );
}

function AbsencesScreen({ subjects, onAddAbsence, onAddSubject }) {
  const [subjectForm, setSubjectForm] = useState({ name: '', teacher: '', limit: '' });
  const [subjectError, setSubjectError] = useState('');

  const addSubject = () => {
    const name = subjectForm.name.trim();
    const limit = Number(subjectForm.limit);
    if (!name || !Number.isFinite(limit) || limit <= 0) {
      setSubjectError('Informe a disciplina e um limite válido.');
      return;
    }
    onAddSubject({ name, teacher: subjectForm.teacher.trim(), limit: Math.round(limit) });
    setSubjectForm({ name: '', teacher: '', limit: '' });
    setSubjectError('');
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <SectionTitle eyebrow="ORGANIZAÇÃO" title="Controle de faltas" />
      <Text style={styles.introText}>Registre suas faltas e acompanhe quanto ainda pode faltar em cada matéria.</Text>
      <View style={styles.editorCard}>
        <Text style={styles.editorLabel}>Adicionar disciplina</Text>
        <TextInput accessibilityLabel="Disciplina" value={subjectForm.name} onChangeText={(value) => setSubjectForm((current) => ({ ...current, name: value }))} placeholder="Nome da disciplina" placeholderTextColor="#9AA0B7" style={styles.editorInput} />
        <TextInput accessibilityLabel="Professor" value={subjectForm.teacher} onChangeText={(value) => setSubjectForm((current) => ({ ...current, teacher: value }))} placeholder="Professor (opcional)" placeholderTextColor="#9AA0B7" style={styles.editorInput} />
        <TextInput accessibilityLabel="Limite de faltas" value={subjectForm.limit} onChangeText={(value) => setSubjectForm((current) => ({ ...current, limit: value }))} keyboardType="numeric" placeholder="Limite de faltas" placeholderTextColor="#9AA0B7" style={styles.editorInput} />
        {subjectError ? <Text style={[styles.feedback, styles.dataStatusError]}>{subjectError}</Text> : null}
        <Pressable style={styles.smallPrimaryButton} onPress={addSubject}><Text style={styles.primaryButtonText}>Adicionar disciplina</Text></Pressable>
      </View>
      {subjects.length === 0 ? <Text style={styles.emptyText}>Nenhuma disciplina cadastrada ainda.</Text> : null}
      {subjects.map((subject) => {
        const percent = (subject.absences / subject.limit) * 100;
        const status = percent >= 50 ? 'Atenção' : 'Situação tranquila';
        const color = percent >= 50 ? COLORS.amber : COLORS.teal;
        return (
          <View style={styles.subjectCard} key={subject.id}>
            <View style={styles.subjectHeader}>
              <View style={[styles.subjectIcon, { backgroundColor: percent >= 50 ? COLORS.amberSoft : COLORS.tealSoft }]}>
                <Icon name="book-outline" size={19} color={color} />
              </View>
              <View style={styles.subjectInfo}><Text style={styles.cardTitle}>{subject.name}</Text><Text style={styles.cardDescription}>{subject.teacher}</Text></View>
              <Text style={[styles.statusText, { color }]}>{status}</Text>
            </View>
            <View style={styles.absenceNumbers}><Text style={styles.absenceBig}>{subject.absences}<Text style={styles.absenceSmall}> faltas</Text></Text><Text style={styles.limitText}>limite: {subject.limit}</Text></View>
            <ProgressBar value={percent} color={color} track={percent >= 50 ? '#FCECC7' : '#D8F0EC'} />
            <View style={styles.subjectFooter}><Text style={styles.remainingText}>Ainda pode faltar <Text style={styles.boldText}>{subject.limit - subject.absences} vezes</Text></Text><Pressable style={styles.outlineButton} onPress={() => onAddAbsence(subject.id)}><Icon name="add" size={16} color={COLORS.primary} /><Text style={styles.outlineButtonText}>Registrar</Text></Pressable></View>
          </View>
        );
      })}
      <View style={styles.tipBox}><Icon name="bulb-outline" size={20} color={COLORS.primary} /><Text style={styles.tipText}>Dica: registre a falta no mesmo dia para manter seu acompanhamento atualizado.</Text></View>
    </ScrollView>
  );
}

function RemindersScreen({ reminders, onAdd, onToggle }) {
  const [text, setText] = useState('');
  const addReminder = () => {
    if (!text.trim()) return;
    onAdd(text.trim());
    setText('');
  };
  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <SectionTitle eyebrow="ORGANIZAÇÃO" title="Meus lembretes" />
      <Text style={styles.introText}>Anote pequenas tarefas para não deixar nada importante passar.</Text>
      <View style={styles.inputCard}><TextInput value={text} onChangeText={setText} placeholder="Ex.: falar com o professor" placeholderTextColor="#9AA0B7" style={styles.input} onSubmitEditing={addReminder} /><Pressable style={styles.addButton} onPress={addReminder}><Icon name="add" size={22} color="#FFFFFF" /></Pressable></View>
      <View style={styles.listCard}>
        {reminders.map((reminder, index) => (
          <Pressable key={reminder.id} style={[styles.reminderRow, index > 0 && styles.rowBorder]} onPress={() => onToggle(reminder.id)}>
            <View style={[styles.checkCircle, reminder.done && styles.checkCircleDone]}>{reminder.done ? <Icon name="checkmark" size={14} color="#FFFFFF" /> : null}</View>
            <View style={styles.reminderTextWrap}><Text style={[styles.reminderTitle, reminder.done && styles.doneText]}>{reminder.title}</Text><Text style={styles.reminderDate}>{reminder.date}</Text></View>
            <Icon name="ellipsis-horizontal" size={18} color={COLORS.muted} />
          </Pressable>
        ))}
      </View>
      <View style={styles.tipBox}><Icon name="hand-left-outline" size={20} color={COLORS.primary} /><Text style={styles.tipText}>Toque em um lembrete para marcar como concluído.</Text></View>
    </ScrollView>
  );
}

function CreateInternshipScreen({ onCreate }) {
  const [company, setCompany] = useState('');
  const [target, setTarget] = useState('');
  const [error, setError] = useState('');

  const save = () => {
    const cleanCompany = company.trim();
    const hours = Number(target);
    if (!cleanCompany || !Number.isFinite(hours) || hours <= 0) {
      setError('Informe a empresa e uma meta de horas válida.');
      return;
    }
    onCreate({ company: cleanCompany, target: Math.round(hours) });
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <SectionTitle eyebrow="ACOMPANHAMENTO" title="Meu estágio" />
      <Text style={styles.introText}>Cadastre os dados do seu estágio para começar o acompanhamento.</Text>
      <View style={styles.editorCard}>
        <Text style={styles.editorLabel}>Empresa</Text>
        <TextInput value={company} onChangeText={setCompany} placeholder="Nome da empresa" placeholderTextColor="#9AA0B7" style={styles.editorInput} />
        <Text style={styles.editorLabel}>Meta de horas</Text>
        <TextInput value={target} onChangeText={setTarget} keyboardType="numeric" placeholder="300" placeholderTextColor="#9AA0B7" style={styles.editorInput} />
        {error ? <Text style={[styles.feedback, styles.dataStatusError]}>{error}</Text> : null}
        <Pressable style={styles.primaryButton} onPress={save}><Text style={styles.primaryButtonText}>Salvar estágio</Text></Pressable>
      </View>
    </ScrollView>
  );
}

function InternshipScreen({ stage, onUpdateStage, onAddDay, onUpdateDay, onDeleteDay }) {
  const [editingStage, setEditingStage] = useState(false);
  const [company, setCompany] = useState(stage.company);
  const [target, setTarget] = useState(String(stage.target));
  const [showDayForm, setShowDayForm] = useState(false);
  const [dayForm, setDayForm] = useState({ date: 'Hoje', description: 'Dia realizado', hours: '6' });
  const [editingDayId, setEditingDayId] = useState(null);
  const [dayDraft, setDayDraft] = useState({ date: '', description: '', hours: '' });

  const openStageEditor = () => {
    setCompany(stage.company);
    setTarget(String(stage.target));
    setEditingStage((current) => !current);
  };

  const saveStage = () => {
    const nextCompany = company.trim();
    const nextTarget = Number(target);
    if (!nextCompany || !Number.isFinite(nextTarget) || nextTarget <= 0) {
      Alert.alert('Confira os dados', 'Informe a empresa e uma meta de horas válida.');
      return;
    }
    onUpdateStage({ company: nextCompany, target: Math.max(Math.round(nextTarget), stage.hours) });
    setEditingStage(false);
  };

  const saveNewDay = () => {
    const hours = Number(dayForm.hours);
    if (!dayForm.date.trim() || !dayForm.description.trim() || !Number.isFinite(hours) || hours <= 0) {
      Alert.alert('Confira os dados', 'Preencha a data, a descrição e as horas realizadas.');
      return;
    }
    onAddDay({ date: dayForm.date.trim(), description: dayForm.description.trim(), hours });
    setDayForm({ date: 'Hoje', description: 'Dia realizado', hours: '6' });
    setShowDayForm(false);
  };

  const startDayEdit = (day) => {
    setEditingDayId(day.id);
    setDayDraft({ date: day.date, description: day.description, hours: String(day.hours) });
  };

  const saveDayEdit = () => {
    const hours = Number(dayDraft.hours);
    if (!dayDraft.date.trim() || !dayDraft.description.trim() || !Number.isFinite(hours) || hours <= 0) {
      Alert.alert('Confira os dados', 'Preencha a data, a descrição e as horas realizadas.');
      return;
    }
    onUpdateDay(editingDayId, { date: dayDraft.date.trim(), description: dayDraft.description.trim(), hours });
    setEditingDayId(null);
  };

  const confirmDeleteDay = (day) => {
    Alert.alert('Excluir registro?', `O registro de ${day.date} será removido.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => onDeleteDay(day.id) },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <SectionTitle eyebrow="ACOMPANHAMENTO" title="Meu estágio" action={editingStage ? 'Fechar' : 'Editar estágio'} onAction={openStageEditor} />
      <Text style={styles.introText}>Veja sua evolução e registre cada dia realizado.</Text>
      {editingStage ? (
        <View style={styles.editorCard}>
          <Text style={styles.editorLabel}>Empresa</Text>
          <TextInput value={company} onChangeText={setCompany} placeholder="Nome da empresa" placeholderTextColor="#9AA0B7" style={styles.editorInput} />
          <Text style={styles.editorLabel}>Meta de horas</Text>
          <TextInput value={target} onChangeText={setTarget} keyboardType="numeric" placeholder="300" placeholderTextColor="#9AA0B7" style={styles.editorInput} />
          <View style={styles.editorActions}>
            <Pressable style={styles.secondaryButton} onPress={() => setEditingStage(false)}><Text style={styles.secondaryButtonText}>Cancelar</Text></Pressable>
            <Pressable style={styles.smallPrimaryButton} onPress={saveStage}><Text style={styles.primaryButtonText}>Salvar</Text></Pressable>
          </View>
        </View>
      ) : null}
      <View style={styles.internshipHero}><View><Text style={styles.eyebrowLight}>ESTÁGIO ATUAL</Text><Text style={styles.internshipCompany}>{stage.company}</Text><Text style={styles.internshipMeta}>Desenvolvimento de software · 6h por dia</Text></View><View style={styles.briefcaseCircle}><Icon name="briefcase" size={22} color="#FFFFFF" /></View></View>
      <View style={styles.progressPanel}><View style={styles.progressPanelTop}><Text style={styles.panelLabel}>Progresso total</Text><Text style={styles.panelPercentage}>{stage.progress}%</Text></View><ProgressBar value={stage.progress} color={COLORS.teal} track="#D8F0EC" /><View style={styles.hoursRow}><View><Text style={styles.hoursValue}>{stage.hours}h</Text><Text style={styles.hoursLabel}>realizadas</Text></View><View><Text style={styles.hoursValue}>{stage.target}h</Text><Text style={styles.hoursLabel}>meta total</Text></View><View><Text style={[styles.hoursValue, { color: COLORS.teal }]}>{stage.target - stage.hours}h</Text><Text style={styles.hoursLabel}>restantes</Text></View></View></View>
      <SectionTitle eyebrow="REGISTROS" title="Linha do tempo" />
      <View style={styles.timelineCard}>{stage.days.map((day, index) => <View key={day.id} style={styles.timelineRow}><View style={styles.timelineRail}><View style={styles.timelineDot} />{index < stage.days.length - 1 ? <View style={styles.timelineLine} /> : null}</View><View style={styles.timelineContent}>{editingDayId === day.id ? (<View><TextInput value={dayDraft.date} onChangeText={(value) => setDayDraft((current) => ({ ...current, date: value }))} style={styles.editorInput} placeholder="Data" placeholderTextColor="#9AA0B7" /><TextInput value={dayDraft.description} onChangeText={(value) => setDayDraft((current) => ({ ...current, description: value }))} style={styles.editorInput} placeholder="Descrição" placeholderTextColor="#9AA0B7" /><TextInput value={dayDraft.hours} onChangeText={(value) => setDayDraft((current) => ({ ...current, hours: value }))} keyboardType="numeric" style={styles.editorInput} placeholder="Horas" placeholderTextColor="#9AA0B7" /><View style={styles.editorActions}><Pressable style={styles.secondaryButton} onPress={() => setEditingDayId(null)}><Text style={styles.secondaryButtonText}>Cancelar</Text></Pressable><Pressable style={styles.smallPrimaryButton} onPress={saveDayEdit}><Text style={styles.primaryButtonText}>Salvar</Text></Pressable></View></View>) : (<><View style={styles.timelineHeader}><Text style={styles.timelineDate}>{day.date}</Text><View style={styles.timelineActions}><Pressable onPress={() => startDayEdit(day)} hitSlop={8}><Icon name="create-outline" size={17} color={COLORS.primary} /></Pressable><Pressable onPress={() => confirmDeleteDay(day)} hitSlop={8}><Icon name="trash-outline" size={17} color={COLORS.red} /></Pressable></View></View><Text style={styles.timelineDescription}>{day.description}</Text><Text style={styles.timelineHours}>{day.hours} horas realizadas</Text></>)}</View></View>)}</View>
      {showDayForm ? (<View style={styles.editorCard}><Text style={styles.editorLabel}>Data</Text><TextInput value={dayForm.date} onChangeText={(value) => setDayForm((current) => ({ ...current, date: value }))} style={styles.editorInput} placeholder="Hoje" placeholderTextColor="#9AA0B7" /><Text style={styles.editorLabel}>Descrição</Text><TextInput value={dayForm.description} onChangeText={(value) => setDayForm((current) => ({ ...current, description: value }))} style={styles.editorInput} placeholder="O que foi feito" placeholderTextColor="#9AA0B7" /><Text style={styles.editorLabel}>Horas</Text><TextInput value={dayForm.hours} onChangeText={(value) => setDayForm((current) => ({ ...current, hours: value }))} keyboardType="numeric" style={styles.editorInput} placeholder="6" placeholderTextColor="#9AA0B7" /><View style={styles.editorActions}><Pressable style={styles.secondaryButton} onPress={() => setShowDayForm(false)}><Text style={styles.secondaryButtonText}>Cancelar</Text></Pressable><Pressable style={styles.smallPrimaryButton} onPress={saveNewDay}><Text style={styles.primaryButtonText}>Adicionar</Text></Pressable></View></View>) : null}
      <Pressable style={styles.primaryButton} onPress={() => setShowDayForm((current) => !current)}><Icon name="add-circle-outline" size={20} color="#FFFFFF" /><Text style={styles.primaryButtonText}>{showDayForm ? 'Fechar cadastro' : 'Registrar dia de estágio'}</Text></Pressable>
    </ScrollView>
  );
}

function TabBar({ active, onChange }) {
  const tabs = [{ key: 'inicio', label: 'Início', icon: 'home-outline', activeIcon: 'home' }, { key: 'faltas', label: 'Faltas', icon: 'book-outline', activeIcon: 'book' }, { key: 'lembretes', label: 'Lembretes', icon: 'notifications-outline', activeIcon: 'notifications' }, { key: 'estagio', label: 'Estágio', icon: 'briefcase-outline', activeIcon: 'briefcase' }, { key: 'atividades', label: 'Atividades', icon: 'list-outline', activeIcon: 'list' }, { key: 'clima', label: 'Clima', icon: 'partly-sunny-outline', activeIcon: 'partly-sunny' }, { key: 'conta', label: 'Conta', icon: 'person-outline', activeIcon: 'person' }];
  return <View style={styles.tabBar}>{tabs.map((tab) => { const selected = active === tab.key; return <Pressable key={tab.key} style={styles.tabItem} onPress={() => onChange(tab.key)}><Icon name={selected ? tab.activeIcon : tab.icon} size={21} color={selected ? COLORS.primary : COLORS.muted} /><Text style={[styles.tabLabel, selected && styles.tabLabelActive]}>{tab.label}</Text></Pressable>; })}</View>;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('inicio');
  const [session, setSession] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [activities, setActivities] = useState([]);
  const [stage, setStage] = useState(null);
  const [dataStatus, setDataStatus] = useState('idle');
  const [dataError, setDataError] = useState('');

  useEffect(() => {
    if (!supabaseConfigured || !supabase) return undefined;
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setSession(data.session);
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user?.id;
  const reloadData = useCallback(async () => {
    if (!userId || !supabaseConfigured || !supabase) return;
    setDataStatus('loading');
    setDataError('');
    try {
      const data = await fetchStudentData(userId);
      setSubjects(data.subjects);
      setReminders(data.reminders);
      setActivities(data.activities);
      setStage(data.stage);
      setDataStatus('success');
    } catch (error) {
      setDataStatus('error');
      setDataError(error?.message || 'Não foi possível carregar seus dados.');
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setSubjects([]);
      setReminders([]);
      setActivities([]);
      setStage(null);
      setDataStatus('idle');
      setDataError('');
      return;
    }
    reloadData();
  }, [userId, reloadData]);

  const runDataAction = async (action) => {
    if (!userId) return;
    try {
      setDataError('');
      await action();
      await reloadData();
    } catch (error) {
      setDataStatus('error');
      setDataError(error?.message || 'Não foi possível salvar a alteração.');
    }
  };

  const addAbsence = (id) => {
    const subject = subjects.find((item) => item.id === id);
    if (subject) runDataAction(() => registerAbsence(userId, subject));
  };
  const addSubject = (subject) => runDataAction(() => createSubject(userId, subject));
  const addReminder = (title) => runDataAction(() => createReminder(userId, title));
  const toggleReminder = (id) => {
    const reminder = reminders.find((item) => item.id === id);
    if (reminder) runDataAction(() => updateReminder(userId, reminder));
  };
  const addActivity = (name) => runDataAction(() => createActivity(userId, name));
  const removeActivity = (id) => runDataAction(() => deleteActivity(userId, id));
  const createStage = (changes) => runDataAction(() => createInternship(userId, changes));
  const updateStage = (changes) => {
    if (stage) runDataAction(() => updateInternship(userId, stage, changes));
  };
  const addStageDay = (day) => {
    if (stage) runDataAction(() => createInternshipDay(userId, stage, day));
  };
  const updateStageDay = (id, changes) => runDataAction(() => updateInternshipDay(userId, id, changes));
  const deleteStageDay = (id) => runDataAction(() => deleteInternshipDay(userId, id));
  const screen = useMemo(() => {
    if (activeTab === 'faltas') return <AbsencesScreen subjects={subjects} onAddAbsence={addAbsence} onAddSubject={addSubject} />;
    if (activeTab === 'lembretes') return <RemindersScreen reminders={reminders} onAdd={addReminder} onToggle={toggleReminder} />;
    if (activeTab === 'estagio') return stage ? <InternshipScreen stage={stage} onUpdateStage={updateStage} onAddDay={addStageDay} onUpdateDay={updateStageDay} onDeleteDay={deleteStageDay} /> : <CreateInternshipScreen onCreate={createStage} />;
    if (activeTab === 'atividades') return <CadastroScreen activities={activities} onAddActivity={addActivity} onRemoveActivity={removeActivity} />;
    if (activeTab === 'clima') return <ClimaScreen />;
    if (activeTab === 'conta') return <LoginScreen session={session} />;
    return <HomeScreen subjects={subjects} reminders={reminders} stage={stage} goTo={setActiveTab} dataStatus={dataStatus} dataError={dataError} onRetry={reloadData} />;
  }, [activeTab, subjects, reminders, activities, stage, session, dataStatus, dataError, reloadData]);

  return <SafeAreaView style={styles.safeArea}><StatusBar barStyle="dark-content" backgroundColor={COLORS.background} /><View style={styles.appShell}>{screen}<TabBar active={activeTab} onChange={setActiveTab} /></View></SafeAreaView>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  appShell: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting: { color: COLORS.ink, fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  dateText: { color: COLORS.muted, fontSize: 13, marginTop: 5 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  heroCard: { backgroundColor: COLORS.primary, borderRadius: 24, minHeight: 154, padding: 22, marginBottom: 28, overflow: 'hidden', flexDirection: 'row', alignItems: 'center' },
  heroCopy: { flex: 1, paddingRight: 12 },
  heroTitle: { color: '#FFFFFF', fontSize: 22, lineHeight: 27, fontWeight: '800', letterSpacing: -0.4 },
  heroText: { color: '#DDDEFF', fontSize: 13, lineHeight: 19, marginTop: 10 },
  heroShape: { width: 74, height: 74, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-8deg' }] },
  eyebrow: { color: COLORS.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginBottom: 5 },
  eyebrowLight: { color: '#BBF1E9', fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginBottom: 5 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 13, marginTop: 2 },
  sectionTitle: { color: COLORS.ink, fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  linkText: { color: COLORS.primary, fontSize: 12, fontWeight: '700', marginBottom: 2 },
  summaryGrid: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  summaryCard: { flex: 1, backgroundColor: COLORS.card, borderRadius: 17, padding: 13, minHeight: 139, borderWidth: 1, borderColor: COLORS.line },
  summaryIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 13 },
  summaryLabel: { color: COLORS.muted, fontSize: 11, fontWeight: '600' },
  summaryValue: { color: COLORS.ink, fontSize: 17, fontWeight: '800', marginTop: 4 },
  summaryDetail: { color: COLORS.muted, fontSize: 10, marginTop: 2 },
  attentionCard: { backgroundColor: COLORS.card, borderRadius: 17, borderWidth: 1, borderColor: COLORS.line, padding: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 28 },
  attentionIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: COLORS.amberSoft, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  attentionBody: { flex: 1, marginRight: 10 },
  cardTitle: { color: COLORS.ink, fontSize: 14, fontWeight: '800' },
  cardDescription: { color: COLORS.muted, fontSize: 12, marginTop: 4 },
  progressTrack: { height: 7, borderRadius: 5, overflow: 'hidden', marginTop: 12 },
  progressValue: { height: '100%', borderRadius: 5 },
  listCard: { backgroundColor: COLORS.card, borderRadius: 17, borderWidth: 1, borderColor: COLORS.line, paddingHorizontal: 15, marginBottom: 20 },
  reminderRow: { minHeight: 65, flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowBorder: { borderTopWidth: 1, borderTopColor: COLORS.line },
  reminderDot: { width: 27, height: 27, borderRadius: 10, backgroundColor: COLORS.primarySoft, alignItems: 'center', justifyContent: 'center' },
  reminderTextWrap: { flex: 1 },
  reminderTitle: { color: COLORS.ink, fontSize: 13, fontWeight: '700' },
  reminderDate: { color: COLORS.muted, fontSize: 11, marginTop: 4 },
  emptyText: { color: COLORS.muted, fontSize: 13, paddingVertical: 22, textAlign: 'center' },
  dataStatus: { alignItems: 'center', backgroundColor: COLORS.primarySoft, borderRadius: 12, flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: 8, padding: 11 },
  dataStatusError: { backgroundColor: COLORS.redSoft, borderRadius: 10, padding: 10 },
  dataStatusText: { color: COLORS.muted, flex: 1, fontSize: 12, lineHeight: 17 },
  feedback: { fontSize: 12, lineHeight: 18, marginBottom: 12 },
  stagePreview: { backgroundColor: COLORS.tealSoft, borderRadius: 18, padding: 17, marginBottom: 8 },
  stageTopLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  stageTitle: { color: COLORS.ink, fontSize: 16, fontWeight: '800' },
  stagePercentage: { color: COLORS.teal, fontSize: 25, fontWeight: '800' },
  stageCaption: { color: '#4D7D77', fontSize: 11, marginTop: 9 },
  introText: { color: COLORS.muted, fontSize: 13, lineHeight: 20, marginTop: -6, marginBottom: 22 },
  editorCard: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.line, borderRadius: 17, padding: 15, marginBottom: 15 },
  editorLabel: { color: COLORS.ink, fontSize: 11, fontWeight: '800', marginBottom: 6, marginTop: 4 },
  editorInput: { color: COLORS.ink, backgroundColor: '#F8F9FD', borderWidth: 1, borderColor: COLORS.line, borderRadius: 10, minHeight: 40, paddingHorizontal: 11, fontSize: 13, marginBottom: 9 },
  editorActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 4 },
  secondaryButton: { borderWidth: 1, borderColor: COLORS.line, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 9 },
  secondaryButtonText: { color: COLORS.muted, fontSize: 12, fontWeight: '800' },
  smallPrimaryButton: { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 15, paddingVertical: 9 },
  subjectCard: { backgroundColor: COLORS.card, borderRadius: 18, borderWidth: 1, borderColor: COLORS.line, padding: 16, marginBottom: 13 },
  subjectHeader: { flexDirection: 'row', alignItems: 'center' },
  subjectIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  subjectInfo: { flex: 1 },
  statusText: { fontSize: 10, fontWeight: '800' },
  absenceNumbers: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 18 },
  absenceBig: { color: COLORS.ink, fontSize: 24, fontWeight: '800' },
  absenceSmall: { color: COLORS.muted, fontSize: 12, fontWeight: '600' },
  limitText: { color: COLORS.muted, fontSize: 11 },
  subjectFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 13 },
  remainingText: { color: COLORS.muted, fontSize: 11 },
  boldText: { color: COLORS.ink, fontWeight: '800' },
  outlineButton: { borderWidth: 1, borderColor: '#D9D9FA', borderRadius: 10, paddingHorizontal: 11, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 3 },
  outlineButtonText: { color: COLORS.primary, fontSize: 11, fontWeight: '800' },
  tipBox: { backgroundColor: COLORS.primarySoft, borderRadius: 15, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  tipText: { color: '#55569A', flex: 1, fontSize: 12, lineHeight: 17 },
  inputCard: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.line, borderRadius: 15, padding: 7, paddingLeft: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  input: { flex: 1, color: COLORS.ink, fontSize: 13, height: 42 },
  addButton: { width: 42, height: 42, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  checkCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: '#C9CCDB', alignItems: 'center', justifyContent: 'center' },
  checkCircleDone: { backgroundColor: COLORS.teal, borderColor: COLORS.teal },
  doneText: { textDecorationLine: 'line-through', color: COLORS.muted },
  internshipHero: { backgroundColor: COLORS.teal, borderRadius: 21, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  internshipCompany: { color: '#FFFFFF', fontSize: 22, fontWeight: '800', marginBottom: 6 },
  internshipMeta: { color: '#D6F7F2', fontSize: 11 },
  briefcaseCircle: { width: 51, height: 51, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  progressPanel: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.line, borderRadius: 18, padding: 17, marginBottom: 28 },
  progressPanelTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  panelLabel: { color: COLORS.ink, fontSize: 14, fontWeight: '800' },
  panelPercentage: { color: COLORS.teal, fontSize: 22, fontWeight: '800' },
  hoursRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  hoursValue: { color: COLORS.ink, fontSize: 17, fontWeight: '800' },
  hoursLabel: { color: COLORS.muted, fontSize: 10, marginTop: 3 },
  timelineCard: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.line, borderRadius: 18, padding: 17, marginBottom: 18 },
  timelineRow: { flexDirection: 'row', minHeight: 67 },
  timelineRail: { width: 24, alignItems: 'center' },
  timelineDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: COLORS.teal, borderWidth: 3, borderColor: COLORS.tealSoft, zIndex: 1 },
  timelineLine: { position: 'absolute', top: 10, bottom: -1, width: 1.5, backgroundColor: '#BDE6E1' },
  timelineContent: { flex: 1, paddingLeft: 9, paddingBottom: 12 },
  timelineHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timelineActions: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  timelineDate: { color: COLORS.ink, fontSize: 13, fontWeight: '800' },
  timelineDescription: { color: COLORS.muted, fontSize: 11, marginTop: 3 },
  timelineHours: { color: COLORS.teal, fontSize: 10, fontWeight: '700', marginTop: 4 },
  primaryButton: { height: 51, borderRadius: 15, backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  tabBar: { backgroundColor: COLORS.card, borderTopWidth: 1, borderTopColor: COLORS.line, height: 72, paddingHorizontal: 12, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  tabItem: { alignItems: 'center', flex: 1, justifyContent: 'center', gap: 4, minWidth: 44 },
  tabLabel: { color: COLORS.muted, fontSize: 10, fontWeight: '600' },
  tabLabelActive: { color: COLORS.primary, fontWeight: '800' },
});
