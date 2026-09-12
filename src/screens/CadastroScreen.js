import React, { useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ItemLista from '../components/ItemLista';

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
};

export default function CadastroScreen({ activities, onAddActivity, onRemoveActivity }) {
  const [texto, setTexto] = useState('');
  const [erro, setErro] = useState('');

  const adicionarItem = () => {
    const textoTratado = texto.trim();

    if (!textoTratado) {
      setErro('Digite uma atividade antes de adicionar.');
      Alert.alert('Atenção', 'Digite uma atividade antes de adicionar.');
      return;
    }

    onAddActivity(textoTratado);
    setTexto('');
    setErro('');
  };

  return (
    <View style={styles.container}>
      <FlatList
        contentContainerStyle={styles.conteudo}
        data={activities}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={(
          <View>
            <Text style={styles.eyebrow}>NOVA FUNCIONALIDADE</Text>
            <Text style={styles.titulo}>Minhas atividades</Text>
            <Text style={styles.subtitulo}>
              Cadastre uma tarefa ou compromisso da faculdade para acompanhar durante o dia.
            </Text>

            <View style={styles.formulario}>
              <TextInput
                accessibilityLabel="Nova atividade"
                onChangeText={(valor) => {
                  setTexto(valor);
                  if (erro) setErro('');
                }}
                onSubmitEditing={adicionarItem}
                placeholder="Ex.: terminar o trabalho de React Native"
                placeholderTextColor="#9AA0B7"
                returnKeyType="done"
                style={styles.input}
                value={texto}
              />
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Adicionar atividade"
                onPress={adicionarItem}
                style={styles.botao}
              >
                <Text style={styles.textoBotao}>Adicionar atividade</Text>
              </TouchableOpacity>
            </View>

            {erro ? <Text style={styles.erro}>{erro}</Text> : null}

            <View style={styles.tituloLista}>
              <Text style={styles.tituloSecao}>Atividades cadastradas</Text>
              <Text style={styles.contador}>{activities.length}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.vazio}>Nenhuma atividade cadastrada ainda.</Text>}
        renderItem={({ item }) => <ItemLista item={item} onRemover={onRemoveActivity} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: COLORS.background, flex: 1 },
  conteudo: { paddingBottom: 28, paddingHorizontal: 20, paddingTop: 22 },
  eyebrow: { color: COLORS.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginBottom: 5 },
  titulo: { color: COLORS.ink, fontSize: 25, fontWeight: '800', letterSpacing: -0.5 },
  subtitulo: { color: COLORS.muted, fontSize: 13, lineHeight: 20, marginBottom: 20, marginTop: 8 },
  formulario: { backgroundColor: COLORS.card, borderColor: COLORS.line, borderRadius: 16, borderWidth: 1, padding: 12 },
  input: { color: COLORS.ink, fontSize: 13, minHeight: 44, paddingHorizontal: 4 },
  botao: { alignItems: 'center', backgroundColor: COLORS.primary, borderRadius: 11, justifyContent: 'center', marginTop: 10, minHeight: 44, paddingHorizontal: 14 },
  textoBotao: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  erro: { backgroundColor: COLORS.redSoft, borderRadius: 10, color: COLORS.red, fontSize: 12, marginTop: 10, paddingHorizontal: 12, paddingVertical: 9 },
  tituloLista: { alignItems: 'center', flexDirection: 'row', gap: 9, marginBottom: 8, marginTop: 25 },
  tituloSecao: { color: COLORS.ink, flex: 1, fontSize: 17, fontWeight: '800' },
  contador: { alignItems: 'center', backgroundColor: COLORS.primarySoft, borderRadius: 10, color: COLORS.primary, fontSize: 12, fontWeight: '800', minWidth: 28, paddingHorizontal: 8, paddingVertical: 5, textAlign: 'center' },
  vazio: { backgroundColor: COLORS.card, borderColor: COLORS.line, borderRadius: 16, borderWidth: 1, color: COLORS.muted, fontSize: 13, paddingHorizontal: 18, paddingVertical: 24, textAlign: 'center' },
});
