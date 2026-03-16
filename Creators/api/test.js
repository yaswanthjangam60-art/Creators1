export default function handler(req, res) {

  const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoZHRsYnBtc3R2bnBjaWtyY3dvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzU3MzIxMCwiZXhwIjoyMDg5MTQ5MjEwfQ.W4X_Bw9NWHJFCC_zSEE4O-8Ooz-hE15nPndUOAJ_OfE"

  res.json({
    ok: true,
    env_url: !!process.env.SUPABASE_URL,
    env_key: !!SUPABASE_SERVICE_KEY,
    env_apify: !!process.env.APIFY_TOKEN
  })
}
