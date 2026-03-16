import { createClient } from "@supabase/supabase-js"

export default async function handler(req, res) {

const username = req.query.username
const user_id = req.query.user_id

if(!username || !user_id){
return res.status(400).json({error:"username or user_id missing"})
}

const supabase = createClient(
process.env.SUPABASE_URL,
process.env.SUPABASE_SERVICE_ROLE_KEY
)

const APIFY_TOKEN = process.env.APIFY_TOKEN

try{

const run = await fetch(
`https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}`,
{
method:"POST",
headers:{ "Content-Type":"application/json" },
body:JSON.stringify({
usernames:[username],
resultsLimit:20
})
}
)

const data = await run.json()

const profile = data[0]

if(!profile){
return res.status(404).json({error:"profile not found"})
}

await supabase.from("profile_snapshots").insert({

user_id:user_id,
instagram_username:profile.username,
instagram_user_id:profile.id,
full_name:profile.fullName,
biography:profile.biography,
external_url:profile.externalUrl,
external_urls:profile.externalUrls,
followers_count:profile.followersCount,
following_count:profile.followsCount,
posts_count:profile.postsCount,
highlight_reel_count:profile.highlightReelCount,
igtv_video_count:profile.igtvVideoCount,
is_business_account:profile.isBusinessAccount,
business_category_name:profile.businessCategoryName,
is_private:profile.private,
is_verified:profile.verified,
profile_pic_url:profile.profilePicUrl,
profile_pic_url_hd:profile.profilePicUrlHD

})

let insertedPosts = 0

for(const post of profile.latestPosts){

const { error } = await supabase
.from("posts_data")
.insert({

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

if(!error) insertedPosts++

}

await supabase.from("audit_log").upsert({

user_id:user_id,
instagram_username:profile.username,
last_scraped_at:new Date(),
last_posts_count:profile.postsCount

})

res.json({
success:true,
posts_saved:insertedPosts
})

}catch(err){

res.status(500).json({error:err.message})

}

}
