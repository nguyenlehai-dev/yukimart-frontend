# YukiMart Frontend

> Vue.js 3 + TypeScript + Vite

## Yêu cầu hệ thống
- Node.js 18+ (khuyến nghị 20 LTS)
- npm 9+

## Cài đặt

```bash
# Clone repo
git clone <repo-url> yukimart-frontend
cd yukimart-frontend

# Cài dependencies
npm install

# Chạy dev server
npm run dev
```

## Scripts

| Command | Mô tả |
|---------|-------|
| `npm run dev` | Chạy dev server (port 3000) |
| `npm run build` | Build production |
| `npm run preview` | Preview bản build |

## Cấu trúc thư mục
```
src/
├── assets/          # CSS, images
├── components/      # Vue components
├── router/          # Vue Router
├── services/        # API service (Axios)
├── stores/          # Pinia stores
├── views/           # Page views
├── App.vue          # Root component
└── main.ts          # Entry point
```

## Kết nối Backend
Dev server tự động proxy `/api/*` → `http://localhost:8000` (Laravel backend).

Đảm bảo backend đang chạy trước khi start frontend.

## Lưu ý cho team
- Chạy `npm install` sau mỗi lần pull
- File `node_modules/` KHÔNG commit vào Git
- Env variables đặt trong `.env.local` (không commit)
