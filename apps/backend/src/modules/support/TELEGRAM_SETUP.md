# Telegram Bot Setup Guide

## Step 1: Create a Telegram Bot

1. **Open Telegram** on your phone or computer
2. **Search for "BotFather"** in Telegram (official Telegram bot creator the first one in search)
3. **Start a chat** with BotFather by clicking "Start"
4. **Send the command**: `/newbot`
5. **Follow the prompts**:
   - BotFather will ask for a name (e.g., "RCC Support Bot")
   - Then ask for a username (must end with "bot", e.g., "rcc_support_bot")
6. **Copy the bot token** that BotFather gives you (looks like: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

## Step 2: Get Your Chat ID (User ID)

### Method 1: Using a Helper Bot (Easiest)

1. **Search for "userinfobot"** in Telegram
2. **Start a chat** with @userinfobot
3. **Send any message** (like "hi")
4. **The bot will reply with your chat_id** (a number like `123456789`)
5. **Copy that number**

### Method 3: Using getUpdates API (For Developers)

You can also use this API endpoint to get your chat_id:
```
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
```

Look for the `"chat":{"id":123456789}` in the response - that's your chat_id.

## Step 3: Configure Environment Variables

Add these to your `.env` file:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=8570492727:AAECDzoLtPx_9MLs2j8lf6scy3Vpu_TqEZI
TELEGRAM_SUPPORT_PHONE=+201007582994
TELEGRAM_CHAT_ID=1196840062
```

## Step 4: Test the Setup

1. Make sure you've sent at least one message to your bot
2. Create a test support ticket
4. You should receive a notification on Telegram!

