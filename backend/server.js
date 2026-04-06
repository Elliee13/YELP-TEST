const express = require('express')
const cors = require('cors')
const axios = require('axios')
require('dotenv').config()

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

app.get('/api/restaurants', async (req, res) => {
  const { city } = req.query

  if (!city) {
    return res.status(400).json({ error: 'City is required' })
  }

  try {
    const response = await axios.get('https://api.yelp.com/v3/businesses/search', {
      headers: {
        Authorization: `Bearer ${process.env.YELP_API_KEY}`
      },
      params: {
        location: city,
        categories: 'restaurants',
        limit: 10,
        radius: 8046.72 // 5 miles in meters
      }
    })

    res.json(response.data.businesses)

  } catch (error) {
    if (error.response?.status === 400) {
      return res.status(404).json({ error: 'City not found. Please try another city.' })
    }
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})