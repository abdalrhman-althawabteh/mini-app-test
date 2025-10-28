const { Telegraf } = require('telegraf');
const express = require('express');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL || 'http://localhost:3000';
const PORT = process.env.PORT || 3000;

// Validate environment variables
if (!BOT_TOKEN) {
  console.error('❌ ERROR: BOT_TOKEN environment variable is not set!');
  console.error('Please set BOT_TOKEN in your Vercel environment variables.');
}

console.log('🔧 Configuration loaded:');
console.log('  - BOT_TOKEN:', BOT_TOKEN ? `${BOT_TOKEN.substring(0, 10)}...` : 'NOT SET');
console.log('  - WEBAPP_URL:', WEBAPP_URL);
console.log('  - NODE_ENV:', process.env.NODE_ENV || 'development');

// Initialize bot and express app
const bot = new Telegraf(BOT_TOKEN);
const app = express();

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Store payments in memory (in production, use a database)
const payments = new Map();

// Validate Telegram Web App initData
function validateInitData(initData, botToken) {
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');

    if (!hash) return false;

    urlParams.delete('hash');

    // Create data-check-string
    const dataCheckArray = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`);

    const dataCheckString = dataCheckArray.join('\n');

    // Create secret key
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    // Calculate hash
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    // Compare hashes
    if (calculatedHash !== hash) {
      return false;
    }

    // Check auth_date (within 5 minutes)
    const authDate = parseInt(urlParams.get('auth_date'));
    const currentTime = Math.floor(Date.now() / 1000);

    if (currentTime - authDate > 300) {
      return false; // Data too old
    }

    return true;
  } catch (error) {
    console.error('Validation error:', error);
    return false;
  }
}

// API endpoint to create payment invoice
app.post('/api/create-invoice', async (req, res) => {
  try {
    console.log('📥 Received invoice creation request');
    const { initData, amount } = req.body;

    if (!initData || !amount) {
      console.error('❌ Missing required fields:', { hasInitData: !!initData, hasAmount: !!amount });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('🔐 Validating initData...');
    // Validate initData
    const isValid = validateInitData(initData, BOT_TOKEN);
    if (!isValid) {
      console.error('❌ Invalid authentication data');
      return res.status(401).json({
        error: 'Invalid authentication data',
        hint: 'Make sure the app is opened from Telegram and BOT_TOKEN is correctly set'
      });
    }

    console.log('✅ initData validated successfully');

    // Parse user info
    const urlParams = new URLSearchParams(initData);
    const userJson = urlParams.get('user');
    const user = JSON.parse(userJson);

    // Validate amount
    const starsAmount = parseInt(amount);
    if (isNaN(starsAmount) || starsAmount < 1 || starsAmount > 2500) {
      console.error('❌ Invalid amount:', amount);
      return res.status(400).json({ error: 'Invalid amount. Must be between 1 and 2500 Stars' });
    }

    // Create payment payload
    const payload = JSON.stringify({
      userId: user.id,
      amount: starsAmount,
      timestamp: Date.now()
    });

    console.log(`💳 Creating invoice for user ${user.id} (${user.first_name}) for ${starsAmount} Stars`);

    // Check if bot token is available
    if (!BOT_TOKEN) {
      console.error('❌ BOT_TOKEN is not set!');
      return res.status(500).json({
        error: 'Server configuration error',
        details: 'BOT_TOKEN environment variable is not set'
      });
    }

    // Create invoice link
    const invoiceLink = await bot.telegram.createInvoiceLink({
      title: 'Telegram Stars Payment',
      description: `Payment of ${starsAmount} Telegram Stars`,
      payload: payload,
      currency: 'XTR',
      prices: [{
        label: 'Stars',
        amount: starsAmount
      }]
    });

    console.log('✅ Invoice link created successfully');
    console.log('🔗 Invoice link:', invoiceLink);

    res.json({
      success: true,
      invoiceLink,
      amount: starsAmount
    });

  } catch (error) {
    console.error('❌ Error creating invoice:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      response: error.response?.description
    });
    res.status(500).json({
      error: 'Failed to create invoice',
      details: error.message,
      telegramError: error.response?.description
    });
  }
});

// API endpoint to get payment history (optional)
app.get('/api/payments', (req, res) => {
  const paymentList = Array.from(payments.values()).map(p => ({
    userId: p.userId,
    amount: p.amount,
    date: p.date,
    chargeId: p.telegramChargeId
  }));

  res.json({ payments: paymentList });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    bot: 'running'
  });
});

// Telegram Bot Commands
bot.command('start', async (ctx) => {
  const welcomeMessage = `Welcome! 👋

This is a Telegram Stars Payment Demo Bot.

You can:
• Open the Mini App to make a payment
• Pay any amount you want in Telegram Stars (1-2500)
• See payment confirmations instantly

Use the menu button below to open the payment app!`;

  await ctx.reply(welcomeMessage);
});

bot.command('help', async (ctx) => {
  await ctx.reply(`How to use this bot:

1. Click the menu button (☰) next to the message input
2. Enter the amount of Stars you want to pay
3. Click "Pay with Stars"
4. Confirm the payment in Telegram
5. Receive instant confirmation!

Payments are processed using Telegram Stars.`);
});

// Handle pre-checkout query (must respond within 10 seconds)
bot.on('pre_checkout_query', async (ctx) => {
  try {
    const query = ctx.preCheckoutQuery;
    const payload = JSON.parse(query.invoice_payload);

    console.log(`Pre-checkout query from user ${query.from.id}:`, {
      amount: query.total_amount,
      currency: query.currency,
      payload: payload
    });

    // Validate the order
    // In a real app, check inventory, user eligibility, etc.
    const isValid = payload.amount > 0 && payload.amount <= 2500;

    if (isValid) {
      // Approve the payment
      await ctx.answerPreCheckoutQuery(true);
      console.log('Pre-checkout approved');
    } else {
      // Reject the payment
      await ctx.answerPreCheckoutQuery(false, {
        error_message: 'Invalid payment amount'
      });
      console.log('Pre-checkout rejected');
    }
  } catch (error) {
    console.error('Error handling pre-checkout query:', error);
    await ctx.answerPreCheckoutQuery(false, {
      error_message: 'An error occurred processing your payment'
    });
  }
});

// Handle successful payment
bot.on('message', async (ctx) => {
  if (ctx.message.successful_payment) {
    try {
      const payment = ctx.message.successful_payment;
      const payload = JSON.parse(payment.invoice_payload);

      console.log('Payment successful!', {
        userId: ctx.from.id,
        amount: payment.total_amount,
        currency: payment.currency,
        chargeId: payment.telegram_payment_charge_id
      });

      // Store payment record
      const paymentRecord = {
        userId: payload.userId,
        amount: payment.total_amount,
        currency: payment.currency,
        telegramChargeId: payment.telegram_payment_charge_id,
        providerChargeId: payment.provider_payment_charge_id,
        payload: payload,
        date: new Date().toISOString()
      };

      payments.set(payment.telegram_payment_charge_id, paymentRecord);

      // Send confirmation message
      const confirmationMessage = `✅ Payment Successful!

Amount: ${payment.total_amount} ${payment.currency}
Transaction ID: ${payment.telegram_payment_charge_id}

Thank you for your payment! 🌟`;

      await ctx.reply(confirmationMessage);

      console.log(`Payment processed and confirmed for user ${ctx.from.id}`);

    } catch (error) {
      console.error('Error handling successful payment:', error);
      await ctx.reply('Payment received but there was an error processing it. Please contact support.');
    }
  }
});

// Webhook endpoint for Telegram
app.post(`/bot${BOT_TOKEN}`, (req, res) => {
  bot.handleUpdate(req.body);
  res.sendStatus(200);
});

// Start the server
async function startApp() {
  try {
    // For local development, use polling
    // For production (Vercel), webhooks will be used
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔄 Starting bot in polling mode (development)');

      // Start Express server only in development
      app.listen(PORT, () => {
        console.log(`✅ Server running on port ${PORT}`);
        console.log(`📱 Mini App URL: ${WEBAPP_URL}`);
      });

      await bot.launch();

      // Enable graceful stop
      process.once('SIGINT', () => bot.stop('SIGINT'));
      process.once('SIGTERM', () => bot.stop('SIGTERM'));

      console.log('✅ Bot is running in polling mode');
    } else {
      console.log('🌐 Bot configured for webhook mode (production)');
      console.log(`Webhook URL: ${WEBAPP_URL}/bot${BOT_TOKEN}`);
    }

  } catch (error) {
    console.error('❌ Failed to start app:', error);
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
}

// Start the application only in development
if (process.env.NODE_ENV !== 'production') {
  startApp();
}

// Export for Vercel serverless
module.exports = app;
