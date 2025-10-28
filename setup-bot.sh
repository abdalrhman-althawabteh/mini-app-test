#!/bin/bash

# Telegram Stars Mini App Setup Script
# This script helps configure your bot after deployment

echo "🤖 Telegram Stars Mini App Setup"
echo "=================================="
echo ""

# Read configuration
read -p "Enter your bot token: " BOT_TOKEN
read -p "Enter your deployed app URL (e.g., https://your-app.vercel.app): " APP_URL

echo ""
echo "📡 Setting up webhook..."

# Set webhook
WEBHOOK_URL="${APP_URL}/bot${BOT_TOKEN}"
RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"${WEBHOOK_URL}\", \"allowed_updates\": [\"message\", \"pre_checkout_query\"]}")

echo "Response: $RESPONSE"

# Verify webhook
echo ""
echo "🔍 Verifying webhook..."
WEBHOOK_INFO=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo")
echo "$WEBHOOK_INFO" | python3 -m json.tool 2>/dev/null || echo "$WEBHOOK_INFO"

# Set menu button
echo ""
echo "🎨 Setting menu button..."
MENU_RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setChatMenuButton" \
  -H "Content-Type: application/json" \
  -d "{
    \"menu_button\": {
      \"type\": \"web_app\",
      \"text\": \"💳 Pay with Stars\",
      \"web_app\": {
        \"url\": \"${APP_URL}\"
      }
    }
  }")

echo "Response: $MENU_RESPONSE"

# Get bot info
echo ""
echo "ℹ️  Bot Information:"
BOT_INFO=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getMe")
echo "$BOT_INFO" | python3 -m json.tool 2>/dev/null || echo "$BOT_INFO"

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Open Telegram and find your bot"
echo "2. Send /start to your bot"
echo "3. Click the menu button (☰) to open the payment app"
echo "4. Test making a payment!"
echo ""
echo "Troubleshooting:"
echo "- Check webhook info: curl \"https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo\""
echo "- Check app health: curl \"${APP_URL}/api/health\""
echo "- View Vercel logs in your dashboard"
