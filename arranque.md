# Arranque manual

## Terminal 1 — MongoDB para user-service

//El comando inicia solo MongoDB dentro de un contenedor. Se incluyó porque el user-service necesita conectarse a una base de datos; sin ella, no puede funcionar. **El seed** se encuentra en cada servicio con su json

```powershell

docker run --rm --name univalle-users-mongo -p 27017:27017 mongo:8

```

## Terminal 2 — user-service

```powershell
cd services/user-service
npm run start:dev
```

## Terminal 3 — API Gateway

```powershell
cd api-gateway
npm run start:dev
```

## Terminal 4 — Frontend

```powershell
cd frontend
npm run dev
```

# Arranque con Docker Compose

```powershell

docker compose up --build

```
