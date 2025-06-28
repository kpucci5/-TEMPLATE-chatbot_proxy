# Personal AI Chatbot

## Quick Setup

### Step 1: Deploy the Proxy

1. **Fork this repo** or download `api/proxy.js`
2. **Deploy to Vercel:**
   - Upload `api/proxy.js` (keep the `/api/` folder structure)
   - Or click: [![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=YOUR_REPO_URL)
3. **Set environment variables** in Vercel:
   ```
   PERSONAL_AI_API_KEY=your_personal_ai_api_key
   DOMAIN_NAME=your_personal_ai_domain_name
   ```
4. **Note your proxy URL:** `https://your-app.vercel.app/api/proxy`

### Step 2: Add Chatbot to Your Site

1. **Download** `chatbot_proxy.html`
2. **Update line 4** with your proxy URL:
   ```javascript
   proxyUrl: "https://your-app.vercel.app/api/proxy",
   ```
3. **Customize your branding** (lines 5-8):
   ```javascript
   chatbotName: "Bob",
   aiAvatarUrl: "https://your-site.com/ai-avatar.png",
   sendButtonColor: "#6656FF",
   ```
4. **Add to your website** - just include the HTML file or add the iFrame implementation below:
   <iframe 
    src="https://your-app.vercel.app/chatbot_proxy.html" 
    style="width: 100vw; height: 100vh; position: fixed; top: 0; left: 0; border: none; z-index: 9999; background: transparent;"
    allow="fullscreen" 
    title="AI Chatbot">
</iframe>

**That's it!** Your AI chatbot is now live.

## Customization

### Quick Branding Changes

```javascript
initPersonalAIChatbot({
  proxyUrl: "your-proxy-url-here",

  // AI Identity
  chatbotName: "Alex",
  aiAvatarUrl: "https://your-site.com/ai-avatar.png",
  initialMessage: "Hi! I'm Alex, how can I help?",

  // Colors (use your brand colors)
  sendButtonColor: "#6656FF",
  messageIconColor: "#6656FF",
  userMessageColor: "#d1b8f4",

  // Position
  initiatorPosition: "bottom-right", // or bottom-left, top-right, top-left
});
```

### Color Schemes

```javascript
// Professional Blue
sendButtonColor: "#2563eb", userMessageColor: "#dbeafe"

// Green
sendButtonColor: "#059669", userMessageColor: "#a7f3d0"

// Orange
sendButtonColor: "#ea580c", userMessageColor: "#fed7aa"
```

### Collect User Info

```javascript
requireIntake: true,
intakeFormTitle: "Welcome to Support",
intakeFormSubtitle: "Tell us about yourself",
```

## Adding to Different Platforms

### WordPress

1. **Copy the script tags** from `chatbot_proxy.html`
2. Go to **Appearance → Theme Editor** → `footer.php`
3. **Paste before** `</body>` tag

   _Or use a plugin like "Insert Headers and Footers"_

### Shopify

1. **Copy the script tags** from `chatbot_proxy.html`
2. Go to **Online Store → Themes → Actions → Edit Code**
3. Edit `theme.liquid`
4. **Paste before** `</body>` tag

### Squarespace

1. **Copy the script tags** from `chatbot_proxy.html`
2. Go to **Settings → Advanced → Code Injection**
3. **Paste in "Footer"** section

### Webflow

1. **Copy the script tags** from `chatbot_proxy.html`
2. Go to **Project Settings → Custom Code**
3. **Paste in "Footer Code"** section

### Wix

1. **Copy the script tags** from `chatbot_proxy.html`
2. Go to **Settings → Custom Code**
3. **Add to "Body - End"** section

### React/Vue/Angular

```javascript
// 1. Copy the script content to a .js file
// 2. Import and initialize in your component

useEffect(() => {
  // Paste the chatbot initialization code here
  initPersonalAIChatbot({
    /* your config */
  });
}, []);
```

## 🔧 Other Proxy Hosting Options

1. Upload `api/proxy.js` to `/netlify/functions/proxy.js`
2. Set environment variables in Netlify dashboard
3. Use URL: `https://your-site.netlify.app/.netlify/functions/proxy`

### Your Own Server

```javascript
// server.js
const express = require("express");
const app = express();

// Copy the proxy logic here or require it
app.post("/api/chatbot-proxy", yourProxyHandler);

app.listen(3000);
```

## Security (Optional)

Restrict which domains can use your chatbot:

```bash
# In your hosting platform's environment variables
ALLOWED_DOMAINS=yourdomain.com,staging.yourdomain.com
```

## Troubleshooting

**Chatbot doesn't appear?**

- Check browser console for errors
- Verify proxy URL is correct
- Make sure environment variables are set

**"Service configuration error"?**

- Check your `PERSONAL_AI_API_KEY` and `DOMAIN_NAME` are set correctly

**CORS errors?**

- Add your domain to `ALLOWED_DOMAINS` environment variable
- Make sure you're testing from the correct domain

**Messages not sending?**

- Check network tab for failed requests
- Verify proxy is deployed and accessible
- Check proxy logs in your hosting platform
