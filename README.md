# 💡 Prompt of the Day

A fullstack Next.js web application that delivers daily curated prompts from multiple sources, perfect for creative inspiration and professional development.

## 🌟 Features

- **Daily Prompt Selection**: Automatically selects and displays a new prompt each day
- **Weekly Web Crawling**: Scrapes prompts from curated sources including Microsoft Copilot, PromptHero, and Anthropic
- **Content Filtering**: Basic safety filtering to ensure workplace-appropriate content
- **Three Main Views**:
  - 🏠 **Today**: View today's selected prompt
  - 📚 **History**: Browse previously selected prompts
  - 🔍 **Browse All**: Search and filter through all collected prompts
- **Responsive Design**: Built with Tailwind CSS for mobile and desktop
- **Local JSON Storage**: No database required - uses local JSON files
- **China Timezone**: Optimized for Asia/Shanghai timezone

## 🚀 Quick Start

### Prerequisites

- Node.js 20.17.0 or higher
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd prompt_of_the_day
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
# Copy the example file
cp .env.example .env.local

# Edit .env.local to add your PromptHero cookies (see Cookie Setup section)
```

4. **Start the development server**
```bash
npm run dev
```

5. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## 🍪 Cookie Setup for PromptHero

PromptHero requires authentication to access prompt pages. Follow these steps to set up cookies:

### 1. Get Your PromptHero Cookies

1. **Sign in to PromptHero**
   - Go to [https://prompthero.com/](https://prompthero.com/)
   - Create an account or sign in

2. **Extract Cookies**
   - Open Developer Tools (F12 in most browsers)
   - Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
   - Navigate to **Cookies** > **https://prompthero.com**
   - Look for important cookies like:
     - Session cookies (usually start with `__Secure-` or `session_`)
     - Authentication tokens (`auth_token`, `access_token`, etc.)
     - User identification cookies

3. **Format Cookie String**
   - Copy cookie values and format as: `name1=value1; name2=value2; ...`
   - Example: `__Secure-session=abc123; user_token=xyz789; csrf_token=def456`

### 2. Add Cookies to Environment

Edit your `.env.local` file:
```bash
PROMPTHERO_COOKIES="your_cookie_string_here"
```

### 3. Test the Setup

```bash
# Test crawling PromptHero specifically
npm run cli crawl

# Check if prompts are found
npm run status
```

## 📂 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── history/           # History page
│   ├── all/              # Browse all prompts page
│   └── page.tsx          # Home page (today's prompt)
├── components/           # Reusable UI components
├── lib/                 # Core business logic
│   ├── crawlers/        # Web crawling services
│   ├── contentFilter.ts # Content safety filtering
│   ├── dataManager.ts   # JSON file operations
│   ├── promptSelector.ts # Daily selection algorithm
│   └── scheduler.ts     # Cron job management
├── types/               # TypeScript type definitions
data/                    # Local JSON storage
└── scripts/             # CLI tools
```

## 🤖 CLI Commands

The project includes a CLI for manual operations:

```bash
# Manual web crawling
npm run crawl

# Manual prompt selection
npm run select

# System status
npm run status

# Start scheduler (production)
npm run scheduler
```

## 📊 API Endpoints

- `GET /api/prompt/today` - Get today's selected prompt
- `GET /api/prompts/history` - Get prompt history with pagination
- `GET /api/prompts/all` - Get all prompts with filtering
- `POST /api/admin/crawl` - Trigger manual crawl
- `POST /api/admin/select` - Trigger manual selection
- `GET /api/admin/status` - Get scheduler status

## ⏰ Scheduling

The app uses `node-cron` for automated tasks:

- **Weekly Crawling**: Sunday 2 AM (China time)
- **Daily Selection**: Every day 6 AM (China time)

### Enable Scheduler in Development

```bash
export ENABLE_SCHEDULER=true
npm run dev
```

## 🕷️ Web Crawling Sources

1. **Microsoft Copilot**: [copilot.cloud.microsoft/en-us/prompts](https://copilot.cloud.microsoft/en-us/prompts)
2. **PromptHero Veo**: [prompthero.com/veo-prompts](https://prompthero.com/veo-prompts)
3. **PromptHero ChatGPT Images**: [prompthero.com/chatgpt-image-prompts](https://prompthero.com/chatgpt-image-prompts)
4. **Anthropic Prompt Library**: [docs.anthropic.com/en/resources/prompt-library](https://docs.anthropic.com/en/resources/prompt-library/corporate-clairvoyant)

## 🛡️ Content Filtering

Basic keyword-based filtering is applied to ensure workplace-appropriate content:

- Filters out NSFW, violent, and inappropriate content
- Maintains all crawled data but filters display
- Loose filtering rules as requested
- Easily configurable in `src/lib/contentFilter.ts`

## 🔧 Configuration

### Environment Variables

```bash
# Enable scheduler in development
ENABLE_SCHEDULER=true

# Node environment
NODE_ENV=production
```

### Data Storage

All data is stored in the `data/` directory:

- `prompts-YYYY-MM-DD.json` - Daily crawl results
- `history.json` - Selected prompt history

## 🚀 Deployment

### Azure VM Deployment

1. **Setup the VM**
```bash
# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone and setup project
git clone <your-repo-url>
cd prompt_of_the_day
npm install
npm run build
```

2. **Configure as a service**
```bash
# Create systemd service
sudo nano /etc/systemd/system/prompt-of-the-day.service
```

3. **Start the service**
```bash
sudo systemctl enable prompt-of-the-day
sudo systemctl start prompt-of-the-day
```

### Production Build

```bash
npm run build
npm start
```

## 🔮 Future Enhancements

- Database integration (PostgreSQL/MongoDB)
- User authentication and personalization
- Admin dashboard for content management
- OpenAI integration for prompt similarity detection
- Email notifications for daily prompts
- API rate limiting and caching
- Docker containerization

## 🐛 Troubleshooting

### Common Issues

1. **Puppeteer fails on headless systems**
```bash
# Install dependencies
sudo apt-get install -y chromium-browser
```

2. **Permission issues with data directory**
```bash
sudo chown -R $USER:$USER data/
```

3. **Scheduler not running**
```bash
# Check logs
npm run status
```

4. **PromptHero crawling fails**
```bash
# Check if cookies are properly set
echo $PROMPTHERO_COOKIES

# Test crawling with verbose output
DEBUG=puppeteer:* npm run crawl

# Common solutions:
# - Update cookies (they may expire)
# - Check if PromptHero changed their authentication system
# - Verify cookie format is correct: "name1=value1; name2=value2"
```

5. **Cookie Authentication Issues**
```bash
# Signs your cookies might need updating:
# - Crawler gets redirected to login page
# - No prompts found from PromptHero sources
# - 401/403 errors in crawler logs

# To refresh cookies:
# 1. Clear browser cookies for prompthero.com
# 2. Sign in again
# 3. Extract new cookies following the setup guide
# 4. Update .env.local file
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Create an issue on GitHub

---

Built with ❤️ using Next.js 14, TypeScript, and Tailwind CSS
