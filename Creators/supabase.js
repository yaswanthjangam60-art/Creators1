const client = window.supabase.createClient(
"https://vhdtlbpmstvnpcikrcwo.supabase.co",
"sb_publishable_Rs5RaSAA2o3OXbWTL4-e2Q_V8kfzg0y",
{
auth:{
persistSession:true,
autoRefreshToken:true,
storage:window.localStorage
}
}
)
