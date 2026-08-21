# Salon Frontend

This frontend is a React app that connects to the Salon backend services through the API gateway.

## Service Linking

- Gateway base URL: `REACT_APP_API_BASE_URL`
- Notifications websocket URL: `REACT_APP_NOTIFICATIONS_WS_URL`
- Assets base URL: `REACT_APP_ASSETS_BASE_URL`

If these values are not set, defaults are:

- `REACT_APP_API_BASE_URL=http://localhost:5000`
- `REACT_APP_NOTIFICATIONS_WS_URL=http://localhost:5000/api/notifications/ws`
- `REACT_APP_ASSETS_BASE_URL=http://localhost:5000/assets`

## Environment Setup

Create `frontend/.env` with:

```env
REACT_APP_API_BASE_URL=http://localhost:5000
REACT_APP_NOTIFICATIONS_WS_URL=http://localhost:5000/api/notifications/ws
REACT_APP_ASSETS_BASE_URL=http://localhost:5000/assets
```

## Running Locally

1. Start backend services and gateway.
2. From the `frontend` folder, install dependencies.
3. Start the frontend app.

```bash
npm install
npm start
```

Frontend will run at `http://localhost:3000`.

## Assets

The frontend uses `REACT_APP_ASSETS_BASE_URL` for static assets such as partner page images.

If your gateway does not currently serve `/assets`, use one of these options:

1. Configure gateway/static server to expose an `/assets` path.
2. Point `REACT_APP_ASSETS_BASE_URL` to any reachable static host.

## Notes

- Avoid hardcoding `localhost` URLs in components.
- Use values from `src/config/api.js` so service routes can be switched per environment.

## Documentation

- Frontend workflow: [docs/frontend-workflow.md](docs/frontend-workflow.md)
