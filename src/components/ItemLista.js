import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ActivityTouchableOpacity from './ActivityTouchableOpacity';

const COLORS = {
  card: '#FFFFFF',
  ink: '#1C2140',
  muted: '#707793',
  line: '#E8EBF4',
  primary: '#5B5CE2',
  primarySoft: '#EEEDFF',
};

export default function ItemLista({ item, onRemover }) {
  return (
    <View style={styles.container}>
      <View style={styles.info}>
        <View style={styles.icon}><Text style={styles.iconText}>✓</Text></View>
        <Text style={styles.nome}>{item.nome}</Text>
      </View>
      <ActivityTouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`Remover ${item.nome}`}
        style={styles.botaoRemover}
        onPress={() => onRemover(item.id)}
      >
        <Text style={styles.textoBotao}>Remover</Text>
      </ActivityTouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderBottomColor: COLORS.line,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 66,
    paddingVertical: 10,
  },
  info: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: 10, paddingRight: 10 },
  icon: { alignItems: 'center', backgroundColor: COLORS.primarySoft, borderRadius: 10, height: 28, justifyContent: 'center', width: 28 },
  iconText: { color: COLORS.primary, fontSize: 14, fontWeight: '800' },
  nome: { color: COLORS.ink, flex: 1, fontSize: 13, fontWeight: '700' },
  botaoRemover: { borderColor: '#D9D9FA', borderRadius: 9, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 7 },
  textoBotao: { color: COLORS.primary, fontSize: 11, fontWeight: '800' },
});
