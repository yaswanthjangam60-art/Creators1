export default async function handler(req, res) {

const username = req.query.username
const user_id = req.query.user_id

if(!username || !user_id){
return res.status(400).json({error:"username or user_id missing"})
}

const APIFY_TOKEN = process.env.APIFY_TOKEN
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

try{

// START SCRAPER
const run = await fetch(
`https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}`,
{
method:"POST",
headers:{ "Content-Type":"application/json" },
body:JSON.stringify({
usernames:[username]
})
}
)

const data = await run.json()

if(!data || data.length === 0){
return res.status(404).json({error:"profile not found"})
}

const profile = data[0]
const posts = profile.latestPosts || []

let saved = 0

for(const post of posts){

const db = await fetch(`${SUPABASE_URL}/rest/v1/posts_data`,{
method:"POST",
headers:{
apikey:SUPABASE_KEY,
Authorization:`Bearer ${SUPABASE_KEY}`,
"Content-Type":"application/json",
Prefer:"return=minimal"
},
body:JSON.stringify({
user_id:user_id,
instagram_username:profile.username,
instagram_user_id:profile.id,
post_id:post.id,
shortcode:post.shortCode,
post_url:post.url,
type:post.type,
caption:post.caption,
hashtags:post.hashtags,
mentions:post.mentions,
likes_count:post.likesCount,
comments_count:post.commentsCount,
video_view_count:post.videoViewCount,
location_name:post.locationName,
location_id:post.locationId,
dimensions_height:post.dimensionsHeight,
dimensions_width:post.dimensionsWidth,
display_url:post.displayUrl,
video_url:post.videoUrl,
is_pinned:post.isPinned,
comments_disabled:post.isCommentsDisabled,
post_timestamp:post.timestamp
})
})

if(db.ok){
saved++
}else{
const err = await db.text()
console.log("DB ERROR:",err)
}

}

res.status(200).json({
success:true,
posts_saved:saved
})

}catch(err){

res.status(500).json({
error:"scraping failed",
details:err.message
})

}
}
