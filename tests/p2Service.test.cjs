const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const babel = require('@babel/core');

function serviceHarness() {
  const values = new Map();
  const stored = new Map();
  let connected = true;
  let nextId = 1;
  let insertBehavior = async (item) => { stored.set(item.id, item); return { error: null }; };
  const storage = {
    getItem: async (key) => values.get(key) ?? null,
    setItem: async (key, value) => { values.set(key, value); },
  };
  const supabase = {
    from(table) {
      assert.equal(table, 'p2_submissions');
      return {
        insert: (item) => insertBehavior(item),
        select: () => ({ eq: (_column, id) => ({ maybeSingle: async () => ({ data: stored.get(id) ?? null, error: null }) }) }),
      };
    },
  };
  const code = babel.transformFileSync(path.join(__dirname, '../src/services/p2Service.js'), {
    presets: ['babel-preset-expo'], babelrc: false, configFile: false,
  }).code;
  const exports = {};
  vm.runInNewContext(code, {
    exports,
    require: (name) => {
      if (name === '@react-native-async-storage/async-storage') return { __esModule: true, default: storage };
      if (name === 'expo-crypto') return { randomUUID: () => `test-id-${nextId++}` };
      if (name === 'expo-network') return { getNetworkStateAsync: async () => ({ isConnected: connected, isInternetReachable: connected }) };
      if (name === './supabase') return { supabase };
      return require(name);
    },
  });
  return { api: exports, stored, setConnected: (value) => { connected = value; }, setInsertBehavior: (fn) => { insertBehavior = fn; } };
}

test('mantém atividade offline e sincroniza uma vez ao voltar a conexão', async () => {
  const h = serviceHarness();
  h.setConnected(false);
  const item = await h.api.enqueueSubmission('student', 'advisor', 'Relatório de estágio', 4);
  assert.equal((await h.api.syncPending('student')).offline, true);
  assert.equal((await h.api.getPending('student')).length, 1);
  h.setConnected(true);
  assert.equal((await h.api.syncPending('student')).synced, 1);
  assert.equal((await h.api.getPending('student')).length, 0);
  assert.equal(h.stored.get(item.id).description, 'Relatório de estágio');
});

test('confirma UUID repetido antes de remover pendência', async () => {
  const h = serviceHarness();
  const item = await h.api.enqueueSubmission('student', 'advisor', 'Atividade repetida', 3);
  h.stored.set(item.id, item);
  h.setInsertBehavior(async () => ({ error: { code: '23505', message: 'duplicate key' } }));
  assert.equal((await h.api.syncPending('student')).synced, 1);
  assert.equal((await h.api.getPending('student')).length, 0);
});

test('não apaga atividade criada enquanto outra é enviada', async () => {
  const h = serviceHarness();
  const first = await h.api.enqueueSubmission('student', 'advisor', 'Primeira atividade', 2);
  let releaseInsert;
  let enteredInsert;
  const started = new Promise((resolve) => { enteredInsert = resolve; });
  h.setInsertBehavior(async (item) => {
    enteredInsert();
    await new Promise((resolve) => { releaseInsert = resolve; });
    h.stored.set(item.id, item);
    return { error: null };
  });
  const syncing = h.api.syncPending('student');
  await started;
  const second = await h.api.enqueueSubmission('student', 'advisor', 'Segunda atividade', 5);
  releaseInsert();
  await syncing;
  const pending = await h.api.getPending('student');
  assert.equal(pending.length, 1);
  assert.equal(pending[0].id, second.id);
  assert.equal(h.stored.has(first.id), true);
});
