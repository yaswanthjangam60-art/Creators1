export default async function handler(req, res) {

const username = req.query.username

if (!username) {
return res.status(400).json({ error: "username required" })
}

const APIFY_TOKEN = "https://api.apify.com/v2/datasets/8gR8RUynFc75jD562/items?token=apify_api_gNQRi79dA204kpuWOQdzKDSexLbYZu005pM8"

try {

const response = await fetch(`https://api.apify.com/v2/acts/apify~instagram-profile-scraper/runs?token=${APIFY_TOKEN}`, {
method: "POST",
headers: {
"Content-Type": "application/json"
},
body: JSON.stringify({
usernames: [username],
resultsLimit: 20
})
})

const runData = await response.json()

const datasetId = runData.data.defaultDatasetId

const datasetResponse = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}`)

const data = await datasetResponse.json()

res.status(200).json(data)

} catch (err) {

res.status(500).json({ error: "scraping failed", details: err.message })

}

}
