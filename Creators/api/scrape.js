export default async function handler(req, res) {

const username = req.query.username

if (!username) {
return res.status(400).json({ error: "username required" })
}

const APIFY_TOKEN = "YOUR_APIFY_TOKEN"

const SUPABASE_URL = "https://vhdtlbpmstvnpcikrcwo.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoZHRsYnBtc3R2bnBjaWtyY3dvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzU3MzIxMCwiZXhwIjoyMDg5MTQ5MjEwfQ.W4X_Bw9NWHJFCC_zSEE4O-8Ooz-hE15nPndUOAJ_OfE"

try {

const scrape = await fetch(
`https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}`,
{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
usernames:[username],
resultsLimit:20
})
}
)

const data = await scrape.json()

const profile = data[0]

if(!profile){
return res.status(400).json({error:"profile not found"})
}

const posts = profile.latestPosts || []

for(const post of posts){

await fetch(`${SUPABASE_URL}/rest/v1/posts`,{
method:"POST",
headers:{
apikey:SUPABASE_KEY,
Authorization:`Bearer ${SUPABASE_KEY}`,
"Content-Type":"application/json",
Prefer:"resolution=merge-duplicates"
},
body:JSON.stringify({
post_id:post.id,
username:profile.username,
type:post.type,
caption:post.caption,
likes:post.likesCount,
comments:post.commentsCount,
video_views:post.videoViewCount,
timestamp:post.timestamp,
is_pinned:post.isPinned,
post_url:post.url
})
})

}

return res.status(200).json({
success:true,
posts_saved:posts.length
})

}catch(err){

return res.status(500).json({
error:"scraping failed",
details:err.message
})

}

}
