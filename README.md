# telegram-console

<p align="center">
  <img src="logo.png" alt="Telegram Console" width="600">
</p>

A terminal-based Telegram client for technical users.

## Installation

```bash
npm install -g telegram-console
```

## Setup

### Step 1: Get Telegram API Credentials

1. Go to [my.telegram.org](https://my.telegram.org/auth) and log in with your phone number
2. You'll receive a confirmation code in Telegram - enter it
3. Click on **"API development tools"**
4. Fill in the form:
   - **App title**: Any name (e.g., "My Console Client")
   - **Short name**: A short identifier (e.g., "console")
   - Platform, description, and other fields can be left as default
5. Click **"Create application"**
6. You'll see your **API ID** (a number) and **API Hash** (a string) - save these

> **Important**: Never share your API credentials. They give full access to your Telegram account.

### Step 2: Run the Client

1. Run `telegram-console`
2. Enter your API ID and API Hash when prompted
3. Authenticate using one of these methods:
   - **QR Code** (default): Scan the QR code with Telegram mobile app (Settings → Devices → Link Desktop Device)
   - **Phone Code**: Enter your phone number and the code sent to your Telegram

## Usage

```bash
telegram-console
```

### Keyboard Shortcuts

| Key    | Action                           |
| ------ | -------------------------------- |
| ↑/↓    | Navigate chats / scroll messages |
| ←/→    | Switch panels                    |
| Enter  | Select chat / send message       |
| Tab    | Focus input                      |
| Esc    | Go back                          |
| Ctrl+C | Exit                             |

## Features

- View chat list (private chats + groups)
- Read messages
- Send text messages
- Unread indicators
- Connection status display
- Session persistence
- QR code + phone code authentication

## Configuration

Config file location: `~/.config/telegram-console/config.json`

### Environment Variables

| Variable          | Description                   |
| ----------------- | ----------------------------- |
| `TG_API_ID`       | Telegram API ID               |
| `TG_API_HASH`     | Telegram API Hash             |
| `TG_SESSION_MODE` | `persistent` or `ephemeral`   |
| `TG_AUTH_METHOD`  | `qr` or `phone`               |

## Contributing

Contributions are welcome! Feel free to open issues and pull requests.

## License

MIT
