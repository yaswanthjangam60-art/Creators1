import { createClient } from "@supabase/supabase-js"

export default async function handler(req, res) {

  const { user_id, username } = req.query

  if (!user_id || !username) {
    return res.status(400).json({ error: "user_id and username are required" })
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Check last_scraped_at for 24hr logic
  const { data: profile } = await supabase
    .from("profiles")
    .select("last_scraped_at")
    .eq("id", user_id)
    .single()

  const lastScraped = profile?.last_scraped_at ? new Date(profile.last_scraped_at) : null
  const now = new Date()
  const hoursSinceLastScrape = lastScraped ? (now - lastScraped) / (1000 * 60 * 60) : null

  if (lastScraped && hoursSinceLastScrape < 24) {
    return res.json({
      success: true,
      scraped: false,
      message: "Using existing data",
      last_scraped_at: lastScraped
    })
  }

  // Call Apify
  try {

    const apifyRes = await fetch(
      `https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?token=${process.env.APIFY_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usernames: [username],
          resultsLimit: 20
        })
      }
    )

    if (!apifyRes.ok) {
      return res.status(502).json({ error: "Apify request failed", status: apifyRes.status })
    }

    const data = await apifyRes.json()
    const igProfile = data[0]

    if (!igProfile) {
      return res.status(404).json({ error: "Instagram profile not found" })
    }

    const scrapedAt = now.toISOString()

    // Insert into profile_snapshots
    const { error: snapshotError } = await supabase
      .from("profile_snapshots")
      .insert({
        user_id:                user_id,
        instagram_username:     igProfile.username,
        instagram_user_id:      igProfile.id,
        full_name:              igProfile.fullName              || null,
        biography:              igProfile.biography             || null,
        external_url:           igProfile.externalUrl           || null,
        external_urls:          igProfile.externalUrls          || null,
        followers_count:        igProfile.followersCount        || 0,
        following_count:        igProfile.followsCount          || 0,
        posts_count:            igProfile.postsCount            || 0,
        highlight_reel_count:   igProfile.highlightReelCount    || 0,
        igtv_video_count:       igProfile.igtvVideoCount        || 0,
        is_business_account:    igProfile.isBusinessAccount     ?? false,
        business_category_name: igProfile.businessCategoryName  || null,
        is_private:             igProfile.private               ?? false,
        is_verified:            igProfile.verified              ?? false,
        profile_pic_url:        igProfile.profilePicUrl         || null,
        profile_pic_url_hd:     igProfile.profilePicUrlHD       || null,
        scraped_at:             scrapedAt
      })

    if (snapshotError) {
      console.error("profile_snapshots error:", snapshotError)
      return res.status(500).json({ error: "Failed to save profile snapshot", detail: snapshotError.message })
    }

    // Insert posts into posts_data
    let insertedPosts = 0
    const posts = igProfile.latestPosts || []

    for (const post of posts) {
      const { error: postError } = await supabase
        .from("posts_data")
        .insert({
          user_id:            user_id,
          instagram_username: igProfile.username,
          instagram_user_id:  igProfile.id,
          post_id:            post.id,
          shortcode:          post.shortCode          || null,
          post_url:           post.url                || null,
          type:               post.type               || null,
          caption:            post.caption            || null,
          hashtags:           post.hashtags           || [],
          mentions:           post.mentions           || [],
          likes_count:        post.likesCount         || 0,
          comments_count:     post.commentsCount      || 0,
          video_view_count:   post.videoViewCount     || null,
          location_name:      post.locationName       || null,
          location_id:        post.locationId         || null,
          dimensions_height:  post.dimensionsHeight   || null,
          dimensions_width:   post.dimensionsWidth    || null,
          display_url:        post.displayUrl         || null,
          video_url:          post.videoUrl           || null,
          is_pinned:          post.isPinned           ?? false,
          comments_disabled:  post.isCommentsDisabled ?? false,
          post_timestamp:     post.timestamp          || null,
          scraped_at:         scrapedAt
        })

      if (!postError) insertedPosts++
    }

    // Upsert audit_log
    await supabase
      .from("audit_log")
      .upsert({
        user_id:            user_id,
        instagram_username: igProfile.username,
        last_scraped_at:    scrapedAt,
        last_posts_count:   igProfile.postsCount || 0
      }, { onConflict: "user_id" })

    // Update last_scraped_at in profiles
    await supabase
      .from("profiles")
      .update({ last_scraped_at: scrapedAt })
      .eq("id", user_id)

    return res.json({
      success: true,
      scraped: true,
      posts_saved: insertedPosts,
      last_scraped_at: scrapedAt
    })

  } catch (err) {
    console.error("Scrape error:", err)
    return res.status(500).json({ error: err.message })
  }

}
