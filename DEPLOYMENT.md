# Deployment Guide for Telegram Stars Mini App

This guide will walk you through deploying your Telegram Stars payment app to Vercel and configuring it properly.

## Quick Start Checklist

- [ ] Push code to GitHub
- [ ] Deploy to Vercel
- [ ] Configure environment variables
- [ ] Set webhook URL
- [ ] Configure bot menu button
- [ ] Test the payment flow

## Step-by-Step Deployment

### Step 1: Push to GitHub

The code is already in a git repository. Just push it:

```bash
git add .
git commit -m "Initial commit: Telegram Stars payment mini app"
git push -u origin claude/session-011CUZQsEwnsi5YrFi3wxUFy
```

### Step 2: Deploy to Vercel

1. Go to [https://vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Other
   - **Root Directory**: ./
   - **Build Command**: (leave empty)
   - **Output Directory**: public

### Step 3: Configure Environment Variables

In Vercel project settings, add these environment variables:

| Variable | Value | Example |
|----------|-------|---------|
| `BOT_TOKEN` | Your bot token from @BotFather | `8310837939:AAHYYvHk...` |
| `WEBAPP_URL` | Your Vercel deployment URL | `https://your-app.vercel.app` |
| `NODE_ENV` | `production` | `production` |

**Important**: After deployment, you'll get your Vercel URL. Update the `WEBAPP_URL` variable with this URL.

### Step 4: Set Telegram Webhook

After deployment, set the webhook to your Vercel URL:

**Option A: Using curl**

```bash
curl -X POST "https://api.telegram.org/bot8310837939:AAHYYvHk6VnCcSKf_S962toYwZvMmgp12Og/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-app.vercel.app/bot8310837939:AAHYYvHk6VnCcSKf_S962toYwZvMmgp12Og",
    "allowed_updates": ["message", "pre_checkout_query"]
  }'
```

**Option B: Using browser**

Visit this URL in your browser:
```
https://api.telegram.org/bot8310837939:AAHYYvHk6VnCcSKf_S962toYwZvMmgp12Og/setWebhook?url=https://your-app.vercel.app/bot8310837939:AAHYYvHk6VnCcSKf_S962toYwZvMmgp12Og
```

Replace `your-app.vercel.app` with your actual Vercel domain.

**Verify webhook:**

```bash
curl "https://api.telegram.org/bot8310837939:AAHYYvHk6VnCcSKf_S962toYwZvMmgp12Og/getWebhookInfo"
```

You should see:
```json
{
  "ok": true,
  "result": {
    "url": "https://your-app.vercel.app/bot...",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

### Step 5: Configure Bot Menu Button

1. Open Telegram and search for @BotFather
2. Send `/mybots`
3. Select your bot
4. Click "Bot Settings"
5. Click "Menu Button"
6. Click "Edit Menu Button URL"
7. Enter: `https://your-app.vercel.app`
8. Set button text: `Pay with Stars` or `💳 Payment`

Alternatively, use the API:

```bash
curl -X POST "https://api.telegram.org/bot8310837939:AAHYYvHk6VnCcSKf_S962toYwZvMmgp12Og/setChatMenuButton" \
  -H "Content-Type: application/json" \
  -d '{
    "menu_button": {
      "type": "web_app",
      "text": "💳 Pay with Stars",
      "web_app": {
        "url": "https://your-app.vercel.app"
      }
    }
  }'
```

### Step 6: Test Your App

1. Open Telegram and find your bot
2. Send `/start` to your bot
3. You should see a welcome message
4. Click the menu button (☰) next to the message input field
5. The Mini App should open
6. Try making a test payment:
   - Enter an amount (e.g., 1 Star for testing)
   - Click "Pay with Stars"
   - Complete the payment
7. You should receive a confirmation message from the bot

## Troubleshooting

### Mini App doesn't open

**Check:**
- Menu button URL is set correctly in @BotFather
- Your Vercel deployment is successful and accessible
- URL uses HTTPS (required for Mini Apps)

**Fix:**
```bash
# Verify deployment
curl https://your-app.vercel.app

# Should return the HTML of your mini app
```

### Bot doesn't respond

**Check:**
- Webhook is set correctly
- Bot token is correct in environment variables
- Webhook URL includes the bot token path

**Fix:**
```bash
# Check webhook info
curl "https://api.telegram.org/bot8310837939:AAHYYvHk6VnCcSKf_S962toYwZvMmgp12Og/getWebhookInfo"

# If there are errors, delete and reset webhook
curl -X POST "https://api.telegram.org/bot8310837939:AAHYYvHk6VnCcSKf_S962toYwZvMmgp12Og/deleteWebhook"
# Then set it again
```

### Payment fails

**Check:**
- You have enough Telegram Stars in your account
- Amount is between 1-2500
- initData validation is working

**Debug:**
```bash
# Check Vercel logs
vercel logs your-app.vercel.app

# Look for errors in the /api/create-invoice endpoint
```

### "Invalid authentication data" error

**Check:**
- Bot token in environment variables matches the one in @BotFather
- Mini App is being opened from the correct bot
- Clock on your server is synchronized (affects auth_date validation)

## Custom Domain Setup (Optional)

If you want to use your own domain instead of Vercel's:

1. In Vercel project settings, go to "Domains"
2. Add your custom domain (e.g., `stars.yourdomain.com`)
3. Follow Vercel's DNS configuration instructions
4. After DNS is set up, update:
   - Environment variable `WEBAPP_URL`
   - Webhook URL
   - Bot menu button URL

```bash
# Update webhook with custom domain
curl -X POST "https://api.telegram.org/bot8310837939:AAHYYvHk6VnCcSKf_S962toYwZvMmgp12Og/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://stars.yourdomain.com/bot8310837939:AAHYYvHk6VnCcSKf_S962toYwZvMmgp12Og"}'
```

## Monitoring

### Check Application Health

```bash
curl https://your-app.vercel.app/api/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "bot": "running"
}
```

### View Payment History

```bash
curl https://your-app.vercel.app/api/payments
```

### View Vercel Logs

```bash
vercel logs your-app.vercel.app --follow
```

Or view in the Vercel dashboard: Project > Logs

## Security Considerations

1. **Never commit `.env` file** - Already in `.gitignore`
2. **Keep bot token secret** - Only in environment variables
3. **Use HTTPS only** - Vercel provides this by default
4. **Validate all payments** - Already implemented in code
5. **Monitor for unusual activity** - Check payment logs regularly

## Production Checklist

- [ ] Environment variables set in Vercel
- [ ] Webhook configured and verified
- [ ] Bot menu button working
- [ ] Test payment completed successfully
- [ ] Custom domain configured (optional)
- [ ] Monitoring set up
- [ ] Bot description updated with your use case

## Next Steps

After deployment, you might want to:

1. **Customize the UI** - Edit `public/index.html` to match your brand
2. **Add a database** - Store payments in PostgreSQL/MongoDB instead of memory
3. **Add more features**:
   - Payment history for users
   - Recurring subscriptions
   - Different products/services
   - Refund functionality
4. **Add analytics** - Track payment success rates
5. **Set up alerts** - Get notified of failed payments

## Support

If you encounter issues:

1. Check Vercel deployment logs
2. Check webhook info: `https://api.telegram.org/bot<TOKEN>/getWebhookInfo`
3. Test the API health endpoint
4. Review this guide for missed steps

## Useful Commands Reference

```bash
# Deploy to Vercel
vercel --prod

# Check webhook
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"

# Set webhook
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://your-app.vercel.app/bot<TOKEN>"

# Delete webhook
curl -X POST "https://api.telegram.org/bot<TOKEN>/deleteWebhook"

# Get bot info
curl "https://api.telegram.org/bot<TOKEN>/getMe"

# Test payment (get invoice link)
curl -X POST "https://api.telegram.org/bot<TOKEN>/createInvoiceLink" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test",
    "description": "Test payment",
    "payload": "test",
    "currency": "XTR",
    "prices": [{"label": "Test", "amount": 1}]
  }'
```

---

**Congratulations!** 🎉 Your Telegram Stars payment Mini App is now deployed and ready to use!
