# kiosk-queue
Handles virtual queues for kiosks. WIP. See [VirtualQueue.md](VirtualQueue.md) for initial prompt and specifications.

# Backend
Run:
```sh
cd backend
python -m pip install -r requirements.txt
python -m flask --app . init-db
python -m flask --app . run
```

Commands:
```sh
python -m flask reset-db
```

# Frontend
Routes:
`{url}`: Initial "Join queue" display.
`{url}/:lineNumber`: Join queue display for a specific line.
`{url}
Running:
```sh
cd frontend
npm install
npm start
```