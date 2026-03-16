export default async function handler(req, res) {

const username = req.query.username

if (!username) {
return res.status(400).json({ error: "username required" })
}

const APIFY_TOKEN = "apify_api_gNQRi79dA204kpuWOQdzKDSexLbYZu005pM8"

const APIFY_URL =
`https://api.apify.com/v2/acts/apify/instagram-profile-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}`

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

return res.status(200).json(data)

} catch(err) {

return res.status(500).json({
error:"scraping failed",
details:err.message
})

}

}
