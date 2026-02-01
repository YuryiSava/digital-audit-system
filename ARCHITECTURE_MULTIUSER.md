# Архитектура многопользовательской системы и Field App

**Дата:** 26 января 2026  
**Версия:** Концепция для v0.4.0 и v0.5.0  
**Статус:** 📋 Планирование

---

## 🎯 Цели

1. **Разделение по ролям** - разные уровни доступа для разных пользователей
2. **Field App** - мобильное приложение для инженеров на объекте
3. **Синхронизация данных** - работа онлайн и оффлайн
4. **Безопасность** - контроль доступа к данным

---

## 👥 Роли пользователей

### 1. Администратор (Admin)
**Полный доступ ко всему:**
- ✅ Управление пользователями
- ✅ Управление нормативной базой
- ✅ Управление проектами
- ✅ Настройка системы
- ✅ Просмотр всех отчетов
- ✅ Публикация RequirementSets

**Интерфейс:** Desktop Web App (текущий)

### 2. Менеджер проектов (Project Manager)
**Управление проектами:**
- ✅ Создание проектов
- ✅ Pre-Audit Setup
- ✅ Назначение инженеров
- ✅ Просмотр прогресса
- ✅ Генерация отчетов
- ❌ Управление нормативной базой
- ❌ Управление пользователями

**Интерфейс:** Desktop Web App

### 3. Инженер (Field Engineer)
**Полевая работа:**
- ✅ Просмотр назначенных проектов
- ✅ Заполнение чек-листов
- ✅ Создание дефектов
- ✅ Загрузка фото
- ✅ Работа оффлайн
- ❌ Создание проектов
- ❌ Pre-Audit Setup
- ❌ Публикация RequirementSets

**Интерфейс:** Mobile App (PWA или Native)

### 4. Просмотр (Viewer / Client)
**Только чтение:**
- ✅ Просмотр проектов
- ✅ Просмотр отчетов
- ❌ Редактирование
- ❌ Создание

**Интерфейс:** Desktop Web App (read-only)

---

## 🏗️ Архитектура системы

### Текущая (v0.3.0)
```
┌─────────────────┐
│   Browser       │
│  (Single User)  │
└────────┬────────┘
         │
┌────────▼────────┐
│   Next.js App   │
│   (localhost)   │
└────────┬────────┘
         │
┌────────▼────────┐
│   Supabase      │
│   (Cloud DB)    │
└─────────────────┘
```

### Целевая (v0.4.0+)
```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Desktop Web  │  │ Mobile PWA   │  │ Mobile App   │
│ (Admin/PM)   │  │ (Engineer)   │  │ (Engineer)   │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       └─────────────────┼─────────────────┘
                         │
              ┌──────────▼──────────┐
              │   Next.js API       │
              │   + Auth Layer      │
              └──────────┬──────────┘
                         │
              ┌──────────▼──────────┐
              │   Supabase          │
              │   + Row Level       │
              │     Security (RLS)  │
              └─────────────────────┘
```

---

## 🔐 Аутентификация и авторизация

### Вариант 1: Supabase Auth (Рекомендуется)
**Преимущества:**
- ✅ Встроенная в Supabase
- ✅ Row Level Security (RLS)
- ✅ JWT токены
- ✅ Email/Password, OAuth
- ✅ Готовые хуки для React

**Реализация:**
```typescript
// 1. Установка
npm install @supabase/auth-helpers-nextjs

// 2. Middleware для защиты роутов
// middleware.ts
export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  
  return res
}

// 3. Проверка роли
const { data: { user } } = await supabase.auth.getUser()
const role = user?.user_metadata?.role // 'admin', 'pm', 'engineer', 'viewer'
```

### Вариант 2: NextAuth.js
**Преимущества:**
- ✅ Гибкая настройка
- ✅ Много провайдеров
- ✅ Кастомные адаптеры

**Минусы:**
- ❌ Сложнее интеграция с Supabase RLS
- ❌ Больше кода

---

## 📱 Field App для инженеров

### Вариант 1: PWA (Progressive Web App) - Рекомендуется
**Преимущества:**
- ✅ Один код для всех платформ
- ✅ Работает в браузере
- ✅ Можно установить на телефон
- ✅ Offline режим (Service Workers)
- ✅ Доступ к камере
- ✅ Геолокация

**Технологии:**
- Next.js + PWA plugin
- IndexedDB для offline хранения
- Service Workers для кеширования
- Camera API для фото

**Реализация:**
```bash
# 1. Установка
npm install next-pwa

# 2. Конфигурация next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
})

module.exports = withPWA({
  // ... остальная конфигурация
})

# 3. Создать manifest.json
{
  "name": "Digital Audit Field App",
  "short_name": "Audit Field",
  "icons": [...],
  "theme_color": "#1e40af",
  "background_color": "#0f172a",
  "display": "standalone",
  "start_url": "/field"
}
```

### Вариант 2: React Native
**Преимущества:**
- ✅ Нативное приложение
- ✅ Лучшая производительность
- ✅ Доступ к нативным API

**Минусы:**
- ❌ Отдельная кодовая база
- ❌ Сложнее разработка
- ❌ Нужна публикация в App Store/Play Store

---

## 🗄️ Схема базы данных для ролей

### Новые таблицы

```sql
-- Таблица пользователей (расширение Supabase Auth)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'pm', 'engineer', 'viewer')),
  phone TEXT,
  avatar_url TEXT,
  organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Организации (для multi-tenancy)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Назначения инженеров на проекты
CREATE TABLE project_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'engineer', -- 'pm', 'engineer', 'viewer'
  assigned_at TIMESTAMP DEFAULT NOW(),
  assigned_by UUID REFERENCES user_profiles(id),
  UNIQUE(project_id, user_id)
);

-- Логи активности
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id),
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'view'
  entity_type TEXT NOT NULL, -- 'project', 'checklist', 'defect', etc.
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Row Level Security (RLS)

```sql
-- Включить RLS для всех таблиц
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE defects ENABLE ROW LEVEL SECURITY;

-- Политики для projects
-- Админы видят все
CREATE POLICY "Admins can view all projects"
  ON projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- PM видят проекты своей организации
CREATE POLICY "PMs can view org projects"
  ON projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() 
        AND role = 'pm'
        AND organization_id = projects.organization_id
    )
  );

-- Инженеры видят только назначенные проекты
CREATE POLICY "Engineers can view assigned projects"
  ON projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_assignments
      WHERE project_id = projects.id 
        AND user_id = auth.uid()
    )
  );

-- Инженеры могут обновлять только audit_results
CREATE POLICY "Engineers can update audit results"
  ON audit_results FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_assignments pa
      JOIN audit_checklists ac ON ac.project_id = pa.project_id
      WHERE ac.id = audit_results.checklist_id
        AND pa.user_id = auth.uid()
    )
  );
```

---

## 📲 Field App - Функционал

### Главный экран
```
┌─────────────────────────────┐
│  👤 Иван Петров             │
│  📶 Online | 🔋 85%          │
├─────────────────────────────┤
│                             │
│  📋 Мои проекты (3)         │
│                             │
│  ┌───────────────────────┐  │
│  │ 🏢 БЦ Астана          │  │
│  │ 📍 ул. Кабанбай, 15   │  │
│  │ ⏱️  В работе (45%)    │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │ 🏢 ТРЦ Mega           │  │
│  │ 📍 пр. Абая, 109      │  │
│  │ ✅ Завершен (100%)    │  │
│  └───────────────────────┘  │
│                             │
└─────────────────────────────┘
```

### Экран проекта
```
┌─────────────────────────────┐
│  ← БЦ Астана                │
├─────────────────────────────┤
│                             │
│  📊 Прогресс: 45%           │
│  ████████░░░░░░░░░░         │
│                             │
│  📋 Чек-листы:              │
│                             │
│  ┌───────────────────────┐  │
│  │ 🔥 АПС                │  │
│  │ 12/20 проверено       │  │
│  │ 2 дефекта             │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │ 📢 СОУЭ               │  │
│  │ 8/15 проверено        │  │
│  │ 0 дефектов            │  │
│  └───────────────────────┘  │
│                             │
│  [📸 Галерея] [📝 Заметки]  │
│                             │
└─────────────────────────────┘
```

### Экран чек-листа
```
┌─────────────────────────────┐
│  ← АПС (12/20)              │
│  🔍 [ Поиск по нормам... ]  │
├─────────────────────────────┤
│                             │
│  ✅ 5.1 Извещатели          │
│     Норма | 📸 2 фото       │
│                             │
│  ⚠️  5.2 Шлейфы             │
│     Дефект | 📸 3 фото      │
│                             │
│  ⏺️  5.3 Приборы            │
│     [Не проверено]          │
│     ┌─────────────────────┐ │
│     │ ✅ Норма            │ │
│     │ ⚠️  Дефект          │ │
│     │ ❌ Не применимо     │ │
│     └─────────────────────┘ │
│                             │
│  [📸 Добавить фото]         │
│  [📝 Комментарий]           │
│                             │
└─────────────────────────────┘
```

### 🧠 Ключевые UX-фишки для Поля:

1. **Умный контекстный поиск**:
   - Полнотекстовый поиск (FTS) по пунктам чек-листа и текстам нормативов прямо на экране проверки.
   - Фильтрация "на лету" (например, ввел "высота" — видишь только требования к высоте установки датчиков).

2. **Оптимизированная фото-фиксация**:
   - Загрузка в один клик прямо из пункта нарушения.
   - Автоматическое наложение водяных знаков (Дата, Время, Проект, Объект, Координаты).
   - Авто-вращение и сжатие на стороне клиента для экономии трафика.

3. **Голосовой ввод дефектов**:
   - Использование Speech-to-Text для заполнения описания дефекта и рекомендаций (удобно, когда заняты руки).

### Offline режим
```typescript
// Стратегия синхронизации
interface SyncQueue {
  id: string
  action: 'create' | 'update' | 'delete'
  entity: 'audit_result' | 'defect' | 'photo'
  data: any
  timestamp: number
  synced: boolean
}

// Сохранение в IndexedDB при offline
async function saveOffline(data: AuditResult) {
  await db.auditResults.put(data)
  await db.syncQueue.add({
    id: uuid(),
    action: 'update',
    entity: 'audit_result',
    data: data,
    timestamp: Date.now(),
    synced: false
  })
}

// Синхронизация при online
async function syncToServer() {
  const queue = await db.syncQueue.where('synced').equals(false).toArray()
  
  for (const item of queue) {
    try {
      await supabase.from(item.entity).upsert(item.data)
      await db.syncQueue.update(item.id, { synced: true })
    } catch (error) {
      console.error('Sync failed:', error)
    }
  }
}
```

---

## 🚀 План внедрения

### Фаза 1: Аутентификация (v0.4.0)
**Срок:** 1-2 недели

1. **Настроить Supabase Auth**
   - Email/Password регистрация
   - Страница логина
   - Middleware для защиты роутов

2. **Создать таблицы**
   - user_profiles
   - organizations
   - project_assignments

3. **Базовые роли**
   - Admin
   - Engineer

4. **RLS политики**
   - Для projects
   - Для audit_checklists
   - Для audit_results

### Фаза 2: Field App MVP (v0.4.0)
**Срок:** 2-3 недели

1. **PWA Setup**
   - next-pwa конфигурация
   - manifest.json
   - Service Workers

2. **Мобильный интерфейс**
   - Список проектов
   - Чек-лист с кнопками статусов
   - Камера для фото

3. **Базовый offline**
   - IndexedDB для чтения
   - Синхронизация при online

### Фаза 3: Полный функционал (v0.5.0)
**Срок:** 3-4 недели

1. **Расширенные роли**
   - Project Manager
   - Viewer

2. **Назначения**
   - Назначение инженеров на проекты
   - Уведомления

3. **Полный offline**
   - Создание дефектов offline
   - Загрузка фото offline
   - Умная синхронизация

4. **Аналитика**
   - Логи активности
   - Отчеты по инженерам

---

## 💡 Рекомендации

### Для быстрого старта (MVP)
1. **Используйте Supabase Auth** - проще всего интегрировать
2. **Начните с PWA** - один код для всех платформ
3. **Базовые роли** - Admin и Engineer достаточно для начала
4. **Простой offline** - только чтение, синхронизация при online

### Для production
1. **Multi-tenancy** - организации для изоляции данных
2. **Audit trail** - логирование всех действий
3. **Backup strategy** - регулярные бэкапы
4. **Мониторинг** - отслеживание ошибок и производительности

## 🧩 Масштабирование: Работа с массовым оборудованием

На крупных объектах с тысячами однотипных элементов (датчики, модули, клапаны) используется гибридный подход:

### 1. Объектная модель внутри Требования
Вместо одного статуса на требование, система позволяет добавлять **"Инстансы дефектов"**:
- **Requirement:** "Расстояние между датчиками" (Status: FAIL)
  - *Instance 1:* Помещение 101, датчик №4, фото, коммент.
  - *Instance 2:* Помещение 205, датчик №12, фото, коммент.

### 2. Выборочный контроль (Sampling Rate)
Возможность указать объем проверки для статистической значимости отчета:
- Общее кол-во на объекте (согласно проекту).
- Кол-во фактически проверенных элементов.
- Автоматический расчет % охвата.

### 3. Реестр по адресам
В Field App добавляется возможность быстрого ввода адресов устройств (например, через цифровую клавиатуру или сканирование QR-кодов, если они есть), чтобы дефект в отчете был привязан к конкретному "железу".

---

## 📊 Оценка трудозатрат

| Фаза | Функционал | Время | Сложность |
|------|-----------|-------|-----------|
| 1 | Supabase Auth + RLS | 1-2 недели | Средняя |
| 2 | Field App PWA (MVP) | 2-3 недели | Средняя |
| 3 | Offline + Sync | 2-3 недели | Высокая |
| 4 | Расширенные роли | 1 неделя | Низкая |
| 5 | Аналитика | 1 неделя | Низкая |

**Итого:** 7-10 недель для полного функционала

---

## 🎯 Следующий шаг

**Рекомендую начать с Фазы 1:**
1. Настроить Supabase Auth
2. Создать страницу логина
3. Добавить базовые роли (Admin/Engineer)
4. Настроить RLS для projects

**Хотите начать?** Я могу помочь с реализацией! 🚀
