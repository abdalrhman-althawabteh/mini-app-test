# Telegram Stars Payment Mini App

A simple Telegram Mini App that demonstrates Telegram Stars payment integration. Users can enter any amount they want to pay (1-2500 Stars) and complete the payment through Telegram's native payment system.

## Features

- 💳 Pay any amount in Telegram Stars (1-2500)
- ⚡ Instant payment confirmation
- 🎨 Beautiful UI that adapts to Telegram theme
- 📱 Fully responsive mobile design
- 🔒 Secure payment processing with validation
- ✅ Real-time payment webhooks

## Tech Stack

- **Backend**: Node.js + Express
- **Bot Framework**: Telegraf
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Deployment**: Vercel
- **Payment**: Telegram Stars

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- A Telegram bot (created via @BotFather)
- Vercel account (for deployment)

### 2. Local Development

Install dependencies:
```bash
npm install
```

Configure environment variables in `.env`:
```
BOT_TOKEN=your_bot_token_here
WEBAPP_URL=http://localhost:3000
PORT=3000
```

Start the development server:
```bash
npm start
```

The app will run on `http://localhost:3000` with the bot in polling mode.

### 3. Deploy to Vercel

1. Push this repository to GitHub

2. Go to [Vercel Dashboard](https://vercel.com/dashboard)

3. Click "Add New Project" and import your GitHub repository

4. Configure environment variables in Vercel:
   - `BOT_TOKEN`: Your Telegram bot token
   - `WEBAPP_URL`: Your Vercel deployment URL (e.g., https://your-app.vercel.app)

5. Click "Deploy"

6. After deployment, set up the webhook and mini app URL

### 4. Configure Bot with @BotFather

1. Open @BotFather on Telegram

2. Send `/setmenubutton` and select your bot

3. Choose "Edit menu button URL"

4. Enter your deployed URL: `https://your-app.vercel.app`

5. Set button text to something like "💳 Pay with Stars"

### 5. Set Webhook (Production)

After deploying to Vercel, set the webhook URL:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-app.vercel.app/bot<YOUR_BOT_TOKEN>"}'
```

Replace `<YOUR_BOT_TOKEN>` with your actual bot token and `your-app.vercel.app` with your Vercel domain.

### 6. Test the App

1. Open your bot on Telegram
2. Click the menu button (☰) next to the message input
3. The Mini App will open
4. Enter an amount and click "Pay with Stars"
5. Complete the payment
6. You'll receive a confirmation message!

## Project Structure

```
mini-app-test/
├── server.js              # Express server + Telegram bot logic
├── public/
│   └── index.html         # Mini App frontend
├── package.json           # Dependencies
├── vercel.json           # Vercel deployment config
├── .env                  # Environment variables (local)
├── .env.example          # Example environment variables
└── README.md             # This file
```

## API Endpoints

- `POST /api/create-invoice` - Creates a payment invoice
- `GET /api/payments` - Lists payment history
- `GET /api/health` - Health check endpoint
- `POST /bot<TOKEN>` - Telegram webhook endpoint

## Bot Commands

- `/start` - Welcome message and instructions
- `/help` - Show help information

## Payment Flow

1. User opens Mini App from bot menu
2. User enters desired amount in Stars
3. Frontend validates and sends request to backend
4. Backend validates initData and creates invoice via Telegram API
5. User completes payment in Telegram
6. Telegram sends pre_checkout_query to bot
7. Bot validates and approves payment
8. Telegram processes payment and sends successful_payment
9. Bot stores payment record and sends confirmation
10. User receives success message

## Security

- All initData is validated using HMAC-SHA256
- Auth date is checked (must be within 5 minutes)
- Payment amounts are validated (1-2500 Stars)
- Secure webhook endpoint with token

## Troubleshooting

### Bot not receiving updates

Make sure webhook is set correctly:
```bash
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

### Mini App not opening

- Check that menu button URL is set correctly in @BotFather
- Ensure your domain is accessible via HTTPS
- Check browser console for errors

### Payment not working

- Verify bot token is correct
- Check that you're using XTR currency
- Ensure amounts are between 1-2500
- Check Vercel logs for errors

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
