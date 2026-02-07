# Deployment Guide

## Prerequisites
- Node.js 18+ installed
- Firebase project created
- Domain name (optional, but recommended)

## Step 1: Firebase Setup

### 1.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Follow the wizard to create your project
4. Enable Blaze (pay-as-you-go) plan for production use

### 1.2 Enable Services

#### Authentication
1. Navigate to Authentication → Sign-in method
2. Enable:
   - Email/Password
   - Google
   - Apple (optional)
3. Add authorized domains (your domain and localhost)

#### Firestore Database
1. Navigate to Firestore Database
2. Create database in production mode
3. Deploy security rules from `firestore.rules`

#### Storage (Optional)
1. Navigate to Storage
2. Get started and use default security rules
3. Update rules if storing user uploads

### 1.3 Get Configuration
1. Project Settings → General
2. Scroll to "Your apps"
3. Click web app icon (</>) to add a web app
4. Copy the configuration object

## Step 2: Environment Configuration

Create `.env.production` file:

```env
VITE_FIREBASE_API_KEY=your_actual_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

## Step 3: Build for Production

```bash
# Install dependencies
npm install

# Build the app
npm run build

# Test production build locally
npm run preview
```

## Step 4: Deployment Options

### Option A: Firebase Hosting (Recommended)

#### Install Firebase CLI
```bash
npm install -g firebase-tools
firebase login
```

#### Initialize Firebase Hosting
```bash
firebase init hosting
```

Select:
- Use existing project
- Public directory: `dist`
- Single-page app: Yes
- Automatic builds: No (we'll build manually)

#### Deploy
```bash
npm run build
firebase deploy --only hosting
```

Your app will be live at: `https://your-project.firebaseapp.com`

#### Custom Domain
1. Firebase Console → Hosting
2. Click "Add custom domain"
3. Follow verification steps
4. Update DNS records as instructed

### Option B: Netlify

#### Using Netlify CLI
```bash
npm install -g netlify-cli
netlify login
npm run build
netlify deploy --prod --dir=dist
```

#### Using Netlify Web Interface
1. Push code to GitHub
2. Import project in Netlify
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Add environment variables in Netlify dashboard
5. Deploy!

### Option C: Vercel

#### Using Vercel CLI
```bash
npm install -g vercel
vercel login
npm run build
vercel --prod
```

#### Using Vercel Web Interface
1. Import GitHub repository
2. Framework preset: Vite
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add environment variables
6. Deploy!

## Step 5: Post-Deployment

### 5.1 Initial Data Setup

Create an admin user:
```javascript
// In Firestore Console, manually add to 'users' collection:
{
  uid: "your-firebase-auth-uid",
  email: "admin@emeraldlakers.com",
  displayName: "Admin User",
  role: "admin",
  createdAt: "2024-01-01T00:00:00.000Z"
}
```

### 5.2 Import Initial Data

1. Log in as admin
2. Navigate to Admin Dashboard
3. Use CSV import to add players
4. Set up teams and curriculum

### 5.3 Configure Security

#### Firestore Security Rules
```bash
firebase deploy --only firestore:rules
```

#### Update Authorized Domains
Firebase Console → Authentication → Settings → Authorized domains
Add your production domain

### 5.4 Testing Checklist

- [ ] Authentication works (Google, Email)
- [ ] Role-based access control functions
- [ ] Offline mode works
- [ ] Data syncs when coming back online
- [ ] PWA installation works on mobile
- [ ] CSV import/export functions
- [ ] All dashboards load correctly
- [ ] Charts and analytics display
- [ ] Mobile responsiveness
- [ ] Performance is acceptable

## Step 6: Monitoring & Maintenance

### Enable Firebase Analytics
```bash
firebase init analytics
firebase deploy --only firestore,hosting,analytics
```

### Set Up Error Tracking
Consider integrating:
- Sentry for error tracking
- Google Analytics for usage metrics
- Firebase Performance Monitoring

### Regular Backups
```bash
# Schedule automated Firestore exports
gcloud firestore export gs://your-bucket/backups
```

### Update Deployment
```bash
# Make changes to code
npm run build
firebase deploy --only hosting
```

## Troubleshooting

### PWA Not Installing
- Check manifest.json is served correctly
- Verify HTTPS is enabled
- Check service worker registration in DevTools

### Authentication Errors
- Verify authorized domains in Firebase Console
- Check environment variables are correct
- Ensure auth services are enabled

### Deployment Fails
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and reinstall
- Check build logs for specific errors

### Performance Issues
- Enable compression on hosting
- Optimize images
- Check bundle size: `npm run build -- --report`

## Security Best Practices

1. **Never commit `.env` files**
2. **Rotate API keys regularly**
3. **Review Firestore rules monthly**
4. **Enable App Check for abuse prevention**
5. **Monitor Firebase Console for unusual activity**
6. **Keep dependencies updated**: `npm audit fix`
7. **Use HTTPS only** (enforced by Firebase Hosting)
8. **Implement rate limiting** for API calls

## Scaling Considerations

### When you grow beyond 50 users:
- Consider Firebase Functions for heavy computations
- Implement Cloud Firestore composite indexes
- Use Cloud Storage for media files
- Consider Cloud Run for custom backend services

### When you reach 1000+ users:
- Implement caching strategies
- Consider database sharding
- Use Cloud CDN for global distribution
- Implement proper monitoring and alerting

## Support

For deployment issues:
- Firebase: https://firebase.google.com/support
- Netlify: https://www.netlify.com/support/
- Vercel: https://vercel.com/support

## Estimated Costs (Firebase)

**Free Tier (Spark Plan):**
- Good for development and small clubs (< 50 active users)
- 50K reads/day, 20K writes/day
- 1 GB storage
- 10 GB/month bandwidth

**Paid Tier (Blaze Plan):**
For 200 active users with moderate usage:
- ~$5-15/month for Firestore
- ~$1-5/month for Authentication
- ~$1-5/month for Hosting
- Total: ~$10-25/month

Actual costs depend on usage patterns.
