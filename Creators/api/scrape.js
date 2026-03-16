export default async function handler(req, res) {

const username = req.query.username

if (!username) {
return res.status(400).json({ error: "username required" })
}

const APIFY_TOKEN = process.env.APIFY_TOKEN
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY

try {

/* ---------- RUN APIFY SCRAPER ---------- */

const scrape = await fetch(
`https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}`,
{
method: "POST",
headers: {
"Content-Type": "application/json"
},
body: JSON.stringify({
usernames: [username],
resultsLimit: 20
})
}
)

const data = await scrape.json()

const profile = data[0]

if (!profile) {
return res.status(404).json({ error: "Instagram profile not found" })
}

const posts = profile.latestPosts || []

/* ---------- STORE POSTS IN SUPABASE ---------- */

for (const post of posts) {

await fetch(`${SUPABASE_URL}/rest/v1/posts_data`, {
method: "POST",
headers: {
apikey: SUPABASE_KEY,
Authorization: `Bearer ${SUPABASE_KEY}`,
"Content-Type": "application/json",
Prefer: "resolution=merge-duplicates"
},
body: JSON.stringify({
instagram_username: profile.username,
instagram_user_id: profile.id,
post_id: post.id,
type: post.type,
caption: post.caption,
likes: post.likesCount,
comments: post.commentsCount,
video_views: post.videoViewCount,
timestamp: post.timestamp,
is_pinned: post.isPinned,
post_url: post.url
})
})

}

/* ---------- RESPONSE ---------- */

return res.status(200).json({
success: true,
posts_saved: posts.length
})

} catch (err) {

return res.status(500).json({
error: "scraping failed",
details: err.message
})

}

}
