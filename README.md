# BlackDate

Du an fullstack dung NodeJS, Express, React va Vite.

## Yeu cau

- NodeJS 20 tro len
- npm

## Cai dat

```bash
npm install
```

Tao file `.env` tu cac file mau neu can cau hinh rieng:

```text
client/.env.example
server/.env.example
```

## Lenh chay

```bash
npm run dev
npm run dev:client
npm run dev:server
npm run build
npm run lint
npm run start
```

## Cau truc thu muc

```text
client/
  src/
    components/   UI component dung lai
    config/       bien cau hinh frontend
    hooks/        React hooks dung chung
    layouts/      khung giao dien
    pages/        cac man hinh
    routes/       cau hinh routing
    services/     lop goi API
    styles/       CSS nen tang va bien giao dien
    utils/        ham tien ich

server/
  src/
    routes/       API routes
    server.js     cau hinh Express app
    index.js      entrypoint server
```

Frontend alias import `@` tro den `client/src`, vi du:

```js
import { Home } from '@/pages/Home'
```

Mac dinh:

- Client: http://127.0.0.1:5173
- Server: http://127.0.0.1:3000
- Health check: http://127.0.0.1:3000/health
