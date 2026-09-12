import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { buscarClima } from '../services/climaService';
import { fetchWeatherPreference, saveWeatherPreference } from '../services/studentDataService';

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
  red: '#D95863',
  redSoft: '#FCE9EC',
};

function Icon({ name, size = 20, color = COLORS.ink }) {
  return <Ionicons name={name} size={size} color={color} />;
}

export default function ClimaScreen({ userId }) {
  const [cidade, setCidade] = useState('');
  const [clima, setClima] = useState(null);
  const [status, setStatus] = useState('idle');
  const [erro, setErro] = useState('');

  useEffect(() => {
    let mounted = true;
    if (!userId) return undefined;
    fetchWeatherPreference(userId).then(async (savedCity) => {
      if (!mounted || !savedCity) return;
      setCidade(savedCity);
      setStatus('loading');
      try {
        const resultado = await buscarClima(savedCity);
        if (mounted) {
          setClima(resultado);
          setStatus('success');
        }
      } catch (error) {
        if (mounted) {
          setStatus('error');
          setErro(error.message || 'Não foi possível atualizar o clima salvo.');
        }
      }
    }).catch(() => {
      // A ausência de preferência não impede a busca manual.
    });
    return () => { mounted = false; };
  }, [userId]);

  const consultarClima = async () => {
    const cidadeTratada = cidade.trim();

    if (!cidadeTratada) {
      setClima(null);
      setStatus('error');
      setErro('Digite uma cidade antes de buscar.');
      return;
    }

    setStatus('loading');
    setClima(null);
    setErro('');

    try {
      const resultado = await buscarClima(cidadeTratada);
      setClima(resultado);
      setStatus('success');
      if (userId) {
        await saveWeatherPreference(userId, cidadeTratada);
      }
    } catch (error) {
      setClima(null);
      setStatus('error');
      setErro(error.message || 'Não foi possível buscar o clima.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
      <Text style={styles.eyebrow}>PLANEJE SEU DIA</Text>
      <Text style={styles.titulo}>Clima da cidade</Text>
      <Text style={styles.subtitulo}>
        Consulte o tempo antes de sair para a aula ou para o estágio.
      </Text>

      <View style={styles.formulario}>
        <View style={styles.inputLinha}>
          <Icon name="location-outline" size={20} color={COLORS.muted} />
          <TextInput
            accessibilityLabel="Cidade para consultar"
            autoCapitalize="words"
            onChangeText={(valor) => {
              setCidade(valor);
              if (erro) {
                setErro('');
                setStatus('idle');
              }
            }}
            onSubmitEditing={consultarClima}
            placeholder="Digite uma cidade"
            placeholderTextColor="#9AA0B7"
            returnKeyType="search"
            style={styles.input}
            value={cidade}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Buscar clima"
          onPress={consultarClima}
          style={styles.botao}
        >
          <Icon name="search-outline" size={19} color="#FFFFFF" />
          <Text style={styles.textoBotao}>Buscar clima</Text>
        </Pressable>
      </View>

      {status === 'loading' ? (
        <View style={styles.estadoCard}>
          <ActivityIndicator color={COLORS.primary} size="small" />
          <Text style={styles.estadoTexto}>Buscando informações...</Text>
        </View>
      ) : null}

      {erro ? <Text style={styles.erro}>{erro}</Text> : null}

      {status === 'success' && clima ? (
        <View style={styles.climaCard}>
          <View style={styles.sucessoLinha}>
            <Icon name="checkmark-circle" size={16} color={COLORS.teal} />
            <Text style={styles.sucessoTexto}>Consulta concluída</Text>
          </View>
          <View style={styles.climaTopo}>
            <View>
              <Text style={styles.local}>{clima.cidade}</Text>
              <Text style={styles.regiao}>{clima.regiao}</Text>
            </View>
            <View style={styles.iconeClima}>
              <Icon name="partly-sunny-outline" size={28} color={COLORS.teal} />
            </View>
          </View>

          <View style={styles.temperaturaLinha}>
            <Text style={styles.temperatura}>{clima.temperatura}°</Text>
            <Text style={styles.condicao}>{clima.condicao}</Text>
          </View>

          <View style={styles.detalhesLinha}>
            <View style={styles.detalhe}>
              <Icon name="thermometer-outline" size={18} color={COLORS.teal} />
              <View>
                <Text style={styles.detalheRotulo}>Sensação</Text>
                <Text style={styles.detalheValor}>{clima.sensacao}°</Text>
              </View>
            </View>
            <View style={styles.detalhe}>
              <Icon name="flag-outline" size={18} color={COLORS.teal} />
              <View>
                <Text style={styles.detalheRotulo}>Vento</Text>
                <Text style={styles.detalheValor}>{clima.vento} km/h</Text>
              </View>
            </View>
          </View>
          <Text style={styles.fonte}>Dados atualizados pela Open-Meteo.</Text>
        </View>
      ) : null}

      {status === 'idle' ? (
        <View style={styles.vazio}>
          <View style={styles.vazioIcone}>
            <Icon name="cloud-outline" size={28} color={COLORS.primary} />
          </View>
          <Text style={styles.vazioTitulo}>Ainda não há uma consulta</Text>
          <Text style={styles.vazioTexto}>Digite sua cidade para ver as condições atuais.</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteudo: { backgroundColor: COLORS.background, flexGrow: 1, paddingBottom: 30, paddingHorizontal: 20, paddingTop: 22 },
  eyebrow: { color: COLORS.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginBottom: 5 },
  titulo: { color: COLORS.ink, fontSize: 25, fontWeight: '800', letterSpacing: -0.5 },
  subtitulo: { color: COLORS.muted, fontSize: 13, lineHeight: 20, marginBottom: 20, marginTop: 8 },
  formulario: { backgroundColor: COLORS.card, borderColor: COLORS.line, borderRadius: 16, borderWidth: 1, padding: 12 },
  inputLinha: { alignItems: 'center', flexDirection: 'row', gap: 8, minHeight: 44 },
  input: { color: COLORS.ink, flex: 1, fontSize: 13, minHeight: 44 },
  botao: { alignItems: 'center', backgroundColor: COLORS.primary, borderRadius: 11, flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: 10, minHeight: 44 },
  textoBotao: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  estadoCard: { alignItems: 'center', backgroundColor: COLORS.primarySoft, borderRadius: 14, flexDirection: 'row', gap: 10, marginTop: 16, padding: 14 },
  estadoTexto: { color: '#55569A', fontSize: 12 },
  erro: { backgroundColor: COLORS.redSoft, borderRadius: 10, color: COLORS.red, fontSize: 12, marginTop: 12, paddingHorizontal: 12, paddingVertical: 9 },
  sucessoLinha: { alignItems: 'center', flexDirection: 'row', gap: 6, marginBottom: 14 },
  sucessoTexto: { color: COLORS.teal, fontSize: 11, fontWeight: '800' },
  climaCard: { backgroundColor: COLORS.card, borderColor: COLORS.line, borderRadius: 19, borderWidth: 1, marginTop: 20, padding: 18 },
  climaTopo: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  local: { color: COLORS.ink, fontSize: 20, fontWeight: '800' },
  regiao: { color: COLORS.muted, fontSize: 12, marginTop: 4 },
  iconeClima: { alignItems: 'center', backgroundColor: COLORS.tealSoft, borderRadius: 15, height: 48, justifyContent: 'center', width: 48 },
  temperaturaLinha: { alignItems: 'baseline', flexDirection: 'row', gap: 12, marginTop: 22 },
  temperatura: { color: COLORS.ink, fontSize: 46, fontWeight: '800', letterSpacing: -1 },
  condicao: { color: COLORS.teal, fontSize: 13, fontWeight: '700' },
  detalhesLinha: { borderTopColor: COLORS.line, borderTopWidth: 1, flexDirection: 'row', gap: 24, marginTop: 20, paddingTop: 16 },
  detalhe: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  detalheRotulo: { color: COLORS.muted, fontSize: 10 },
  detalheValor: { color: COLORS.ink, fontSize: 13, fontWeight: '800', marginTop: 2 },
  fonte: { color: COLORS.muted, fontSize: 10, marginTop: 18 },
  vazio: { alignItems: 'center', backgroundColor: COLORS.card, borderColor: COLORS.line, borderRadius: 18, borderWidth: 1, marginTop: 20, padding: 28 },
  vazioIcone: { alignItems: 'center', backgroundColor: COLORS.primarySoft, borderRadius: 16, height: 56, justifyContent: 'center', width: 56 },
  vazioTitulo: { color: COLORS.ink, fontSize: 15, fontWeight: '800', marginTop: 14 },
  vazioTexto: { color: COLORS.muted, fontSize: 12, lineHeight: 18, marginTop: 5, textAlign: 'center' },
});
