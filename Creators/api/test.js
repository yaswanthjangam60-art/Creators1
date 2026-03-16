export default function handler(req, res) {

  
  res.json({
    ok: true,
    env_url: !!process.env.SUPABASE_URL,
    env_key: !!SUPABASE_SERVICE_KEY,
    env_apify: !!process.env.APIFY_TOKEN
  })
}
