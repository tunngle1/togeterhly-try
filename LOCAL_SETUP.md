# Инструкция по запуску GIFTER локально

## Проблема с PowerShell
У вас заблокировано выполнение скриптов в PowerShell. Есть два решения:

### Решение 1: Разрешить выполнение скриптов (рекомендуется)
Запустите PowerShell от имени администратора и выполните:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Решение 2: Использовать CMD вместо PowerShell
Используйте обычную командную строку (cmd.exe) вместо PowerShell.

---

## Шаги для локального запуска

### 1. Настройка Backend

#### 1.1 Установка зависимостей
```bash
cd backend
npm install
```

#### 1.2 Настройка базы данных
Файл `backend/.env` уже создан с настройками:
```
DATABASE_URL="file:./dev.db"
PORT=3000
```

#### 1.3 Инициализация базы данных
```bash
npx prisma generate
npx prisma db push
```

#### 1.4 Заполнение тестовыми данными (опционально)
```bash
npm run prisma:seed
```

Это создаст:
- 3 тестовых пользователя (включая вас как админа)
- Группу "Семья" (ID: TEST01, пароль: 1234)
- Тестовое событие "День рождения Анны"
- Вишлист с несколькими подарками
- Комнату Secret Santa

#### 1.5 Запуск backend сервера
```bash
npm run dev
```

Backend будет доступен на `http://localhost:3000`

---

### 2. Настройка Frontend

#### 2.1 Создайте файл `.env.local` в корне проекта
```
VITE_API_URL=http://localhost:3000/api
```

#### 2.2 Установка зависимостей (в корне проекта)
```bash
npm install
```

#### 2.3 Запуск frontend
```bash
npm run dev
```

Frontend будет доступен на `http://localhost:5173` (или другом порту, который покажет Vite)

---

## Быстрый запуск (после первой настройки)

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

## Проверка работы

1. Откройте `http://localhost:5173` в браузере
2. Проверьте консоль браузера (F12) на наличие ошибок
3. Проверьте консоль backend на наличие логов подключения к БД

---

## Возможные проблемы

### "Cannot find module '@prisma/client'"
Решение:
```bash
cd backend
npx prisma generate
```

### "Port 3000 already in use"
Решение: Измените PORT в `backend/.env` на другой (например, 3001)

### Ошибки CORS
Убедитесь, что в `backend/src/index.ts` есть:
```typescript
app.use(cors());
```
