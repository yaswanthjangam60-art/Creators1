import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
"https://vhdtlbpmstvnpcikrcwo.supabase.co",
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoZHRsYnBtc3R2bnBjaWtyY3dvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzU3MzIxMCwiZXhwIjoyMDg5MTQ5MjEwfQ.W4X_Bw9NWHJFCC_zSEE4O-8Ooz-hE15nPndUOAJ_OfE"
)

export default async function handler(req, res) {

const username = req.query.username

if (!username) {
return res.status(400).json({ error: "username required" })
}

const APIFY_TOKEN = "YOUR_APIFY_TOKEN"

const APIFY_URL =
`https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}`

try {

const response = await fetch(APIFY_URL,{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
usernames:[username],
resultsLimit:20
})
})

const data = await response.json()

const profile = data[0]

/* ---------- STORE PROFILE ---------- */

await supabase.from("profiles").upsert({
username: profile.username,
full_name: profile.fullName,
bio: profile.biography,
followers: profile.followersCount,
following: profile.followsCount,
posts_count: profile.postsCount,
profile_pic: profile.profilePicUrl,
scraped_at: new Date()
})

/* ---------- STORE POSTS ---------- */

const posts = profile.latestPosts || []

for (const post of posts) {

await supabase.from("posts").upsert({
post_id: post.id,
username: profile.username,
type: post.type,
caption: post.caption,
hashtags: post.hashtags,
mentions: post.mentions,
likes: post.likesCount,
comments: post.commentsCount,
video_views: post.videoViewCount,
timestamp: post.timestamp,
is_pinned: post.isPinned,
post_url: post.url
})

}

return res.status(200).json({
success:true,
posts_stored: posts.length
})

} catch(err) {

return res.status(500).json({
error:"scraping failed",
details:err.message
})

}

}
