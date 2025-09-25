# 🍽️ TableRunner Hub

**A Modern Point-of-Sale System for Restaurants in Nepal**

[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green?logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-blue?logo=tailwindcss)](https://tailwindcss.com/)

> A comprehensive, secure, and user-friendly point-of-sale system designed specifically for restaurants and cafes in Nepal, featuring NPR currency, local business needs, and modern web technologies.

## 📚 Complete Documentation

**For comprehensive documentation including API reference, deployment guide, technical implementation, and troubleshooting, see [DOCUMENTATION.md](./DOCUMENTATION.md)**

---

## 📋 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- Bun or npm package manager
- Supabase account

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/tablerunner-hub.git
cd tablerunner-hub

# Install dependencies
bun install
# or
npm install

# Set up environment variables
cp .env.example .env

# Start development server
bun dev
# or
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🌟 Features

### 🔐 **Secure Authentication System**
- Role-based access control (Admin/Owner)
- Secure user registration and login
- Row-level Security (RLS) policies
- Data isolation between restaurants

### 📱 **Modern POS Interface**
- Intuitive order management
- Real-time order processing
- Sequential order numbering
- Professional receipt generation

### 🍽️ **Comprehensive Menu Management**
- Category-based organization (Tea, Snacks, Ice Cream, etc.)
- Easy add/edit/delete functionality
- Price management in NPR
- Local cuisine categories

### 📊 **Business Analytics**
- Revenue tracking and reporting
- Popular item analysis
- Order volume metrics
- Dashboard with key insights

### 🎨 **Premium UI/UX**
- Responsive design for all devices
- Dark/light theme support
- Professional shadcn/ui components
- Smooth animations and transitions

### 🔒 **Enterprise Security**
- Database-level security policies
- Encrypted data transmission
- Secure password handling
- GDPR-compliant data practices

---

## 🏗️ Architecture

### **Frontend**
- **React 18** with TypeScript for type safety
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for responsive styling
- **shadcn/ui** for consistent UI components
- **Tanstack Query** for efficient data management

### **Backend**
- **Supabase** for PostgreSQL database and real-time features
- **Row-Level Security** for data isolation
- **RESTful API** auto-generated from database schema
- **Real-time subscriptions** for live updates

### **Security**
- End-to-end encryption
- Database-level access controls
- Secure authentication flows
- Regular security audits

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [📖 Project Documentation](./PROJECT_DOCUMENTATION.md) | Complete system overview and architecture |
| [⚙️ Technical Documentation](./TECHNICAL_DOCUMENTATION.md) | Developer implementation guide |
| [👥 User Guide](./USER_GUIDE.md) | End-user manual for admins and owners |
| [📡 API Documentation](./API_DOCUMENTATION.md) | Complete API reference and examples |
| [🚀 Deployment Guide](./DEPLOYMENT_GUIDE.md) | Production deployment instructions |
| [🔒 Security Setup](./SECURITY_SETUP.md) | Security configuration guide |
| [✅ Security Verification](./SECURITY_VERIFICATION.md) | Security validation checklist |

---

## 🚀 Getting Started

### For Restaurant Owners
1. **Sign Up**: Create your restaurant account
2. **Setup Menu**: Add your menu items with categories and prices
3. **Start Processing Orders**: Begin taking orders immediately
4. **Monitor Analytics**: Track your business performance

### For Developers
1. **Read Documentation**: Start with [Technical Documentation](./TECHNICAL_DOCUMENTATION.md)
2. **Setup Environment**: Follow the installation guide
3. **Explore Codebase**: Understand the component architecture
4. **Run Tests**: Ensure everything works correctly

### For System Administrators
1. **Deploy System**: Use the [Deployment Guide](./DEPLOYMENT_GUIDE.md)
2. **Configure Security**: Follow [Security Setup](./SECURITY_SETUP.md)
3. **Verify Installation**: Use [Security Verification](./SECURITY_VERIFICATION.md)
4. **Train Users**: Share the [User Guide](./USER_GUIDE.md)

---

## 🛠️ Tech Stack

### **Core Technologies**
- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **State Management**: Tanstack Query
- **Build Tool**: Vite with TypeScript
- **Package Manager**: Bun (with npm fallback)

### **Key Libraries**
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "typescript": "^5.0.0",
    "@supabase/supabase-js": "^2.38.0",
    "@tanstack/react-query": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "@radix-ui/react-*": "^1.0.0"
  }
}
```

---

## 📊 Project Statistics

- **Lines of Code**: ~15,000+
- **Components**: 25+ React components
- **Database Tables**: 4 main tables with relationships
- **Security Policies**: 12+ RLS policies
- **Documentation Pages**: 7 comprehensive guides
- **Supported Languages**: English (extendable)
- **Currency**: NPR (Nepalese Rupee)

---

## 🔐 Security Features

### **Database Security**
- Row-Level Security (RLS) policies
- Role-based access control
- Data encryption at rest and in transit
- SQL injection prevention

### **Authentication Security**
- Secure password hashing
- Session management
- Role verification
- Access token security

### **Application Security**
- Input validation and sanitization
- CORS protection
- XSS prevention
- CSRF protection

---

## 🌐 Browser Support

| Browser | Version | Status |
|---------|---------|---------|
| Chrome | 90+ | ✅ Fully Supported |
| Firefox | 88+ | ✅ Fully Supported |
| Safari | 14+ | ✅ Fully Supported |
| Edge | 90+ | ✅ Fully Supported |

---

## 📱 Device Support

- **Desktop**: Windows, macOS, Linux
- **Tablet**: iPad, Android tablets
- **Mobile**: iOS Safari, Chrome Mobile
- **Resolution**: 320px - 4K displays

---

## 🚀 Deployment

### **Production Requirements**
- Node.js 18+ runtime
- PostgreSQL database (via Supabase)
- HTTPS-enabled domain
- CDN for static assets (optional)

### **Supported Platforms**
- **Vercel** (recommended)
- **Netlify**
- **Railway**
- **Self-hosted** with Docker

### **Environment Setup**
```bash
# Production build
bun run build

# Preview production build
bun run preview

# Deploy to Vercel
vercel --prod
```

---

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Test** thoroughly
5. **Submit** a pull request

### **Development Workflow**
```bash
# Create feature branch
git checkout -b feature/amazing-feature

# Make changes and commit
git commit -m "Add amazing feature"

# Push to your fork
git push origin feature/amazing-feature

# Open a pull request
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support

### **Getting Help**
- 📖 Check the [documentation](./PROJECT_DOCUMENTATION.md)
- 🐛 Report issues on GitHub
- 💬 Join our community discussions
- 📧 Contact support team

### **Troubleshooting**
- **Build Issues**: Check Node.js version and dependencies
- **Database Errors**: Verify Supabase configuration
- **Authentication Problems**: Check environment variables
- **Deployment Issues**: Review deployment logs

---

## 🎯 Roadmap

### **Version 2.0 (Planned)**
- [ ] Multi-language support (Nepali, Hindi)
- [ ] Advanced reporting and analytics
- [ ] Inventory management
- [ ] Customer management system
- [ ] Mobile app (React Native)
- [ ] Integration with payment gateways

### **Version 2.1 (Future)**
- [ ] Multi-location support
- [ ] Staff management
- [ ] Kitchen display system
- [ ] Advanced discounting
- [ ] Loyalty program integration

---

## 🏆 Acknowledgments

- **shadcn/ui** for beautiful UI components
- **Supabase** for excellent backend-as-a-service
- **Tailwind CSS** for utility-first styling
- **React community** for amazing tools and libraries
- **Nepal's restaurant industry** for inspiration and feedback

---

<div align="center">

**Built with ❤️ for Nepal's Restaurant Industry**

[Live Demo](https://tablerunner-hub.vercel.app) • [Documentation](./PROJECT_DOCUMENTATION.md) • [API Reference](./API_DOCUMENTATION.md)

</div>
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/01e3e80f-0bd0-4b90-bad3-6acabdcaf682) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
