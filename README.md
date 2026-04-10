# Restaurant Finder

A small restaurant search app powered by the Yelp Business Search API.

The app has two parts:

- `frontend/`: static HTML, CSS, and vanilla JavaScript
- `backend/`: Express API that proxies Yelp requests

The frontend searches by city, shows restaurant cards, and opens a minimal detail page for each result.
Favorites are client-side only and reset on refresh.

## Features

- Search restaurants by city
- Yelp-backed results through a local backend route
- Minimal responsive frontend
- Result cards with open/closed state, rating, address, coordinates, and categories
- Detail page with restaurant image, metadata, and favorite toggle
- Smooth scroll to results after search

## Project Structure

```text
.
|-- backend/
|   |-- package.json
|   `-- server.js
|-- frontend/
|   |-- config.js
|   |-- index.html
|   |-- script.js
|   |-- styles.css
|   `-- vercel.json
`-- render.yaml
```

## Requirements

- Node.js 18+ recommended
- A Yelp API key

## Backend Environment Variables

Create `backend/.env` with:

```env
YELP_API_KEY=your_yelp_api_key_here
FRONTEND_ORIGIN=http://localhost:5500
```

Notes:

- `YELP_API_KEY` is required
- `FRONTEND_ORIGIN` is optional locally, but recommended
- In production, `FRONTEND_ORIGIN` should be your Vercel frontend URL

## Run Locally

### 1. Install backend dependencies

```bash
cd backend
npm install
```

### 2. Start the backend

```bash
npm start
```

The API runs on:

```text
http://localhost:3001
```

### 3. Serve the frontend

Open `frontend/index.html` using a local static server.

Examples:

```bash
# Option 1: VS Code Live Server
# Open frontend/index.html with Live Server

# Option 2: Python
cd frontend
python -m http.server 5500
```

Then open:

```text
http://localhost:5500
```

## Frontend API Configuration

The frontend reads its backend base URL from:

- [`frontend/config.js`](./frontend/config.js)

Example local config:

```js
window.APP_CONFIG = {
  API_BASE_URL: 'http://localhost:3001'
}
```

Current checked-in production config:

```js
window.APP_CONFIG = {
  API_BASE_URL: 'https://yelp-test.onrender.com'
}
```

Before deploying a different frontend or running locally against a local backend, update `API_BASE_URL` to the correct backend URL.

Example:

```js
window.APP_CONFIG = {
  API_BASE_URL: 'https://your-render-service.onrender.com'
}
```

## API Route

The frontend calls:

```text
GET /api/restaurants?city=New%20York
```

The backend forwards that request to Yelp and returns the `businesses` array.

## Deployment

Recommended split:

- Render for the backend
- Vercel for the frontend

### Deploy Backend on Render

This repo includes:

- [`render.yaml`](./render.yaml)

Render config expects:

- root directory: `backend`
- build command: `npm install`
- start command: `npm start`

Set these environment variables in Render:

- `YELP_API_KEY`
- `FRONTEND_ORIGIN`

Example `FRONTEND_ORIGIN`:

```text
https://your-project.vercel.app
```

### Deploy Frontend on Vercel

Deploy `frontend/` as the project root.

Included file:

- [`frontend/vercel.json`](./frontend/vercel.json)

Before deploying:

1. Update [`frontend/config.js`](./frontend/config.js)
2. Set `API_BASE_URL` to your Render backend URL

## Current Production Checklist

- Add a valid Yelp API key in Render
- Set `FRONTEND_ORIGIN` in Render to the Vercel domain with no trailing slash
- Confirm `frontend/config.js` points to the correct Render backend URL
- Deploy `backend/` to Render
- Deploy `frontend/` to Vercel

## Notes

- The backend currently maps Yelp `400` responses to:

```json
{"error":"City not found. Please try another city."}
```

- The backend uses a fixed radius of `8046` meters, which is about 5 miles
- No database is used
- No frontend framework is used
- Favorites are stored only in frontend memory and are not persisted

## License

For personal or project use in its current form unless you want to add your own license file.
