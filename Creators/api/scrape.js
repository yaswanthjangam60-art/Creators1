export default async function handler(req, res) {

const APIFY_URL = "https://api.apify.com/v2/datasets/8gR8RUynFc75jD562/items?token=apify_api_gNQRi79dA204kpuWOQdzKDSexLbYZu005pM8"

try {

const response = await fetch(APIFY_URL)
const data = await response.json()

res.status(200).json(data)

} catch(err) {

res.status(500).json({error:"scraping failed"})

}

}
