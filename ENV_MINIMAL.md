# ENV переменные для быстрого теста (БЕЗ оплаты)

## Минимальная конфигурация

Для работы генерации нужны только:

```
FAL_AI_API_KEY=ваш_ключ
NEXT_PUBLIC_SUPABASE_URL=https://ваш-проект.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ваш_ключ
```

Stripe можно добавить потом когда будете готовы принимать платежи!

## Для полного flow с оплатой добавьте:

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Промпты (обязательно настроить)

1. Скопируйте `config/prompts.example.json` в `config/prompts.json`.
2. Замените все `REPLACE_WITH_...` значениями ваших реальных промптов и (при необходимости) негативных промптов.
3. Файл `config/prompts.json` уже добавлен в `.gitignore`, поэтому его содержимое не попадёт в репозиторий.
4. Альтернатива: вместо файла можно задать переменную окружения `ABS_PROMPTS_JSON` (строка с JSON) или путь через `ABS_PROMPTS_PATH`.

Без одного из этих вариантов серверные роуты генерации не смогут получить промпты и вернут ошибку.




