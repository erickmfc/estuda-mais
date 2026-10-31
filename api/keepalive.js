const SUPABASE_URL = 'https://erpysbhdajaaniipmxhv.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_Q9Dx-vDdcmvaO0ec8oT60Q_2_1ssitG';

module.exports = async function keepSupabaseActive(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ ok: false });
  }

  response.setHeader('Cache-Control', 'no-store');

  try {
    const result = await fetch(
      `${SUPABASE_URL}/rest/v1/project_health?select=id&id=eq.1&limit=1`,
      {
        headers: {
          apikey: SUPABASE_PUBLISHABLE_KEY,
          accept: 'application/json',
        },
        signal: AbortSignal.timeout(8000),
      },
    );

    if (!result.ok) return response.status(502).json({ ok: false });

    const rows = await result.json();
    if (!Array.isArray(rows) || rows.length !== 1 || rows[0]?.id !== 1) {
      return response.status(502).json({ ok: false });
    }

    return response.status(200).json({ ok: true });
  } catch {
    return response.status(502).json({ ok: false });
  }
};

