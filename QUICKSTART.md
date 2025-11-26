# 🚀 Быстрый старт GIFTER (SQLite)

## Первый запуск

### 1. Исправьте PowerShell (один раз)
Запустите PowerShell **от имени администратора**:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 2. Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run prisma:seed
npm run dev
```

### 3. Frontend (в новом терминале)
```bash
# В корне проекта
npm install
npm run dev
```

### 4. Создайте `.env.local` в корне проекта
```
VITE_API_URL=http://localhost:3000/api
```

---

## Последующие запуски

### Терминал 1 - Backend:
```bash
cd backend
npm run dev
```

### Терминал 2 - Frontend:
```bash
npm run dev
```

---

## 🎯 Тестовые данные

После выполнения `npm run prisma:seed`:

- **Группа ID:** TEST01
- **Пароль:** 1234
- **Админ:** Владислав (Telegram ID: 414153884)
- **Пользователи:** 
  - Тестовый Пользователь (ID: 123456789)
  - Анна Иванова (ID: 987654321)

---

## 🔧 Полезные команды

### Сброс базы данных
```bash
cd backend
rm prisma/dev.db
npx prisma db push
npm run prisma:seed
```

### Просмотр базы данных
```bash
cd backend
npx prisma studio
```

### Проверка логов
Backend логи будут показывать:
- `[AUTH]` - попытки входа
- SQL запросы (благодаря Prisma logging)

---

## ❓ Проблемы?

### "Cannot find module '@prisma/client'"
```bash
cd backend
npx prisma generate
```

### "Port 3000 already in use"
Измените PORT в `backend/.env`:
```
PORT=3001
```

### Ошибки при seed
Удалите базу и пересоздайте:
```bash
cd backend
rm prisma/dev.db
npx prisma db push
npm run prisma:seed
```
