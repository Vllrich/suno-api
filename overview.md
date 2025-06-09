# Suno API Project Overview

## Project Description
Suno API is an open-source project that provides API access to Suno.ai's music generation capabilities. It allows developers to integrate AI music generation into their applications, agents, and workflows.

## Key Features
- **Music Generation**: Generate music from text prompts with enhanced expressiveness
- **Custom Mode**: Advanced music generation with custom lyrics, style, and title
- **Lyrics Generation**: Generate lyrics based on prompts with ReMi model
- **Audio Extension**: Extend existing audio tracks
- **Stem Generation**: Separate audio into individual tracks
- **Extended Song Length**: Generate songs up to 8 minutes long (v4.5)
- **Enhanced Genres**: Expanded genre options and improved genre mashups
- **Richer Vocals**: Enhanced vocal range and emotional depth
- **Prompt Enhancement**: AI-powered prompt enhancement helper
- **Remaster Feature**: Upgrade older tracks to latest quality
- **Personas**: Capture and save unique vocal styles and vibes
- **Covers**: Reimagine uploaded audio with custom prompts
- **Combined Features**: Mix and match Personas, Covers, and Extend
- **OpenAI Compatible**: `/v1/chat/completions` endpoint for easy integration
- **Multiple Deployment Options**: Vercel, Docker, and local deployment
- **CAPTCHA Handling**: Automatic CAPTCHA solving using 2Captcha service

## Technology Stack
- **Framework**: Next.js 14.1.4 with TypeScript
- **UI**: React 18 with Tailwind CSS
- **Browser Automation**: Playwright with Chromium/Firefox
- **CAPTCHA Solving**: 2Captcha integration
- **Documentation**: Swagger UI integration
- **Deployment**: Vercel, Docker support

## Project Structure

### Core Directories
```
suno-api/
├── src/
│   ├── app/
│   │   ├── api/           # API endpoints
│   │   ├── components/    # React components
│   │   ├── docs/          # Documentation pages
│   │   └── v1/            # OpenAI-compatible endpoints
│   └── lib/               # Core libraries and utilities
├── public/                # Static assets
└── docker-compose.yml     # Docker configuration
```

### API Endpoints

#### Core Music Generation
- **`/api/generate`** - Generate music from text prompts
- **`/api/custom_generate`** - Advanced music generation with custom parameters
- **`/api/generate_lyrics`** - Generate lyrics from prompts
- **`/api/extend_audio`** - Extend existing audio tracks
- **`/api/generate_stems`** - Create stem tracks (separate instruments)

#### Data Retrieval
- **`/api/get`** - Retrieve music information by ID(s)
- **`/api/get_limit`** - Get account quota information
- **`/api/get_aligned_lyrics`** - Get timestamped lyrics
- **`/api/clip`** - Get clip information by ID
- **`/api/concat`** - Generate complete songs from extensions

#### OpenAI Compatibility
- **`/v1/chat/completions`** - OpenAI-compatible music generation endpoint

#### Persona Management
- **`/api/persona`** - Manage and retrieve persona information

## API Parameters

### Custom Generate Parameters
- **`prompt`** (string): Lyrics or description for the song
- **`tags`** (string): Music style/genre tags
- **`title`** (string): Song title
- **`make_instrumental`** (boolean): Generate instrumental version
- **`model`** (string): AI model to use (default: 'chirp-v4.5')
- **`wait_audio`** (boolean): Wait for audio generation to complete
- **`negative_tags`** (string): Tags to avoid in generation

### Available Models
- **`chirp-v4.5`** (latest): Most advanced Suno model with enhanced expressiveness, expanded genres, richer vocals, and up to 8-minute song generation
- **`chirp-v4`**: Advanced model with enhanced audio quality, sharper lyrics, and dynamic song structures
- **`chirp-v3-5`**: Previous stable model with high-quality output
- **`chirp-v3-0`**: Earlier stable version
- **`chirp-v2-xxl-alpha`**: Legacy model for compatibility

### Generation Options
- **Style Influence**: Control how closely the AI follows style prompts
- **Instrumental Mode**: Generate music without vocals
- **Custom Lyrics**: Provide specific lyrics for the song
- **Genre Tags**: Specify musical styles and genres
- **Negative Tags**: Exclude unwanted elements

## Environment Configuration

### Required Environment Variables
- **`SUNO_COOKIE`**: Authentication cookie from Suno.ai account
- **`TWOCAPTCHA_KEY`**: API key for CAPTCHA solving service
- **`BROWSER`**: Browser type (chromium/firefox)
- **`BROWSER_HEADLESS`**: Run browser in headless mode
- **`BROWSER_LOCALE`**: Browser language (en/ru recommended)
- **`BROWSER_GHOST_CURSOR`**: Enable smooth mouse movements

## Authentication & Security
- Uses Suno.ai account cookies for authentication
- Automatic session management and token renewal
- CAPTCHA solving through 2Captcha service
- Support for multiple account cookies via request headers

## Deployment Options

### Vercel (Recommended)
- One-click deployment with environment variable configuration
- Automatic scaling and global CDN
- Built-in monitoring and analytics

### Docker
- Complete containerization with docker-compose
- Isolated environment with all dependencies
- Easy scaling and deployment management

### Local Development
- npm/yarn based development environment
- Hot reloading and development tools
- Full debugging capabilities

## Integration Examples

### Python Integration
```python
import requests

def generate_custom_music(prompt, tags, title):
    response = requests.post('http://localhost:3000/api/custom_generate', 
                           json={
                               'prompt': prompt,
                               'tags': tags,
                               'title': title,
                               'make_instrumental': False,
                               'wait_audio': True
                           })
    return response.json()
```

### OpenAI-Compatible Usage
```python
from openai import OpenAI

client = OpenAI(base_url="http://localhost:3000/v1", api_key="dummy")
response = client.chat.completions.create(
    model="chirp-v3-5",
    messages=[{"role": "user", "content": "Create a happy pop song about summer"}]
)
```

## Limitations & Considerations
- Requires active Suno.ai account with credits
- CAPTCHA solving may incur additional costs
- Rate limits based on Suno.ai account tier
- Browser automation may be resource intensive
- macOS systems typically receive fewer CAPTCHAs

## License
LGPL-3.0-or-later - Permissive open-source license allowing free integration and modification

## Community & Support
- GitHub repository: gcui-art/suno-api
- Demo site: https://suno.gcui.ai
- Documentation: https://suno.gcui.ai/docs
- Multi-language support (English, Chinese, Russian) 