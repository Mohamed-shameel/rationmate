# 🛒 RationMate

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![Twilio](https://img.shields.io/badge/Twilio-F22F46?style=for-the-badge&logo=twilio&logoColor=white)
![Render](https://img.shields.io/badge/Deployed%20on-Render-46E3B7?style=for-the-badge)

> **Live Demo → [rationmate.onrender.com](https://rationmate.onrender.com)**

---

## 🧠 The Problem

In India, millions of families depend on ration shops under the Public Distribution System (PDS). But here's the harsh reality — people travel kilometres to their nearest ration shop, wait in long queues, only to find out the stock ran out days ago.

There's no way to check stock availability beforehand. No transparency. No system.

**RationMate fixes that.**

---

## 💡 What It Does

RationMate is a full-stack inventory management system built for ration shops — with two distinct user roles:

**For Shop Owners 🏪**
- Secure login with password authentication
- Real-time inventory dashboard — add, update, and delete stock
- Changes reflect instantly for citizens

**For Citizens 👨‍👩‍👧**
- OTP-based login via SMS (no password needed)
- Browse all nearby ration shops
- See live stock availability with colour-coded badges — green (available), yellow (low), red (out of stock)
- Know before you go

---

## 📸 Screenshots

### Home Screen
![Home](ss/home.png)

### Shop Owner — Inventory Dashboard
![Admin Inventory](ss/admin%20inventory.png)

### Citizen — Shop Picker
![Shop Picker](ss/shop%20picker.png)

### Citizen — Live Stock View
![User Stock View](ss/user%20stock%20view.png)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express |
| Database | MongoDB Atlas + Mongoose |
| Authentication | JWT (shop owners) + Twilio OTP SMS (citizens) |
| Security | bcrypt, Helmet, CORS, Rate Limiting |
| Frontend | Vanilla HTML + CSS + JavaScript |
| Deployment | Render |

---

## 🏗️ Architecture

```
rationmate/
├── backend/
│   ├── models/          # Mongoose schemas (Shop, OTP, User)
│   ├── routes/          # Express API routes
│   ├── middleware/       # JWT auth middleware
│   └── server.js        # Entry point
├── frontend/
│   ├── css/styles.css
│   ├── js/
│   │   ├── app.js       # SPA routing logic
│   │   └── api.js       # API call handlers
│   └── index.html
└── ss/                  # Screenshots
```

---

## 🚀 Run Locally

**1. Clone the repo**
```bash
git clone https://github.com/Mohamed-shameel/rationmate
cd rationmate/backend
```

**2. Install dependencies**
```bash
npm install
```

**3. Set up `.env`**
```bash
cp .env.example .env
# Fill in your MongoDB URI, JWT secret, and Twilio credentials
```

**4. Start the server**
```bash
npm run dev
```

**5. Open in browser**
```
http://localhost:5000
```

---

## 🔐 Default Credentials (Local Testing)

| Shop | Shop ID | Password |
|------|---------|----------|
| Main Street Ration | `SHOP001` | `admin123` |
| Central Ration Depot | `SHOP002` | `shop123` |

> Citizen login requires a real mobile number for OTP via Twilio.

---

## 🌱 What I Learned

- Designing **role-based authentication** — two completely different auth flows in one app
- Integrating **Twilio SMS API** for real OTP delivery
- Managing **environment-based configuration** (dev vs production)
- Deploying a full-stack Node.js app on **Render** with cloud MongoDB

---

## 🔮 Future Scope

- Push notifications when stock is refilled
- Monthly distribution analytics for shop owners
- Aadhaar-based citizen verification
- Multi-language support (Tamil, Hindi)

---

## 👨‍💻 Built By

**Mohamed Shameel** — 2nd Year BE CSE (AIML) @ Chennai Institute of Technology  
Pursuing BS Data Science @ IIT Madras

[GitHub](https://github.com/Mohamed-shameel) • [LinkedIn](https://www.linkedin.com/in/mohamedshameel2006/)