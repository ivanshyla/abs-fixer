# ABS Fixer - AI-powered Abs Enhancement

Это веб-приложение для улучшения пресса с помощью ИИ. Загрузи фото, нарисуй маску области пресса, и получи улучшенное изображение.

## Возможности

- 📸 Загрузка фотографий
- 🎨 Рисование масок кистью и ластиком
- 🤖 Генерация через Replicate, Google Gemini, OpenAI DALL-E
- 👥 Выбор пола (мужской/женский пресс)
- 🎛️ Настройка интенсивности изменений
- 📱 Адаптивный дизайн для мобильных устройств

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Настройка API ключей

Для работы приложения нужны API ключи:

### 1. Replicate API
- Зарегистрируйся на [replicate.com](https://replicate.com)
- Получи API токен в настройках аккаунта
- Добавь в `.env.local`:
```bash
REPLICATE_API_TOKEN=твой_токен_здесь
```

### 2. Google AI API (Gemini)
- Получи API ключ на [Google AI Studio](https://makersuite.google.com/app/apikey)
- Добавь в `.env.local`:
```bash
GOOGLE_AI_API_KEY=твой_ключ_здесь
```

### 3. OpenAI API (DALL-E Edit)
- Зарегистрируйся на [platform.openai.com](https://platform.openai.com)
- Получи API ключ в настройках аккаунта
- Добавь в `.env.local`:
```bash
OPENAI_API_KEY=твой_ключ_здесь
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
