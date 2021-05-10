## Install
1. Create a `api/.env` file:
```
ZOOM_API_URL=https://api.zoom.us/v2
ZOOM_API_KEY=***
ZOOM_API_SECRET=***
ZOOM_USERNAME=***
PORT=3001
```

2. Create a `front/.env` file:
```
REACT_APP_API_URL=http://localhost:3001
```
3. Install dependencies: `yarn`
4. Start api: `yarn workspace api start`
5. Start front: `yarn workspace front start`