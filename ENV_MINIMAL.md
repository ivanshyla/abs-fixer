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




