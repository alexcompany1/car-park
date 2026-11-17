module.exports = function authConfig(_req, res) {
  const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = process.env;
  res.setHeader('Cache-Control', 'no-store');

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY?.startsWith('sb_publishable_')) {
    return res.status(503).json({ error: 'Inicio de sesión no disponible.' });
  }

  return res.json({ url: SUPABASE_URL, publishableKey: SUPABASE_PUBLISHABLE_KEY });
};
