# Smart Feedback Collection and Analysis System

> **TCS ion Industry Project** · Chaitanya Deemed to be University

A full-stack web application that collects user feedback, performs real-time **sentiment analysis** using NLP, stores results in **MongoDB**, and presents actionable insights through a rich **analytics dashboard**.

---

## ✨ Features

- 📝 **Feedback Collection** — Structured web form with name, email, category, star rating, and message
- 🤖 **Automated Sentiment Analysis** — Classifies feedback as Positive / Neutral / Negative with keyword extraction
- 📊 **Real-time Dashboard** — Interactive charts (doughnut, bar, polar area, trend line) powered by Chart.js
- 🗂️ **Category & Rating Breakdown** — Visual analytics by feedback category and star rating
- 📈 **7-Day Trend Monitoring** — Track sentiment trends over time
- 🔍 **Filterable Insights** — Filter feedback by sentiment or category
- 🎨 **Premium Dark UI** — Modern glassmorphism design with smooth animations

---

## 🛠️ Tech Stack

| Layer       | Technology                |
|-------------|---------------------------|
| Frontend    | HTML, CSS, JavaScript     |
| Backend     | Node.js, Express.js       |
| Database    | MongoDB (Mongoose ODM)    |
| NLP         | Sentiment (npm library)   |
| Charts      | Chart.js 4                |
| Tools       | VS Code, Git & GitHub     |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [MongoDB](https://www.mongodb.com/) running locally or via Atlas

### Installation

```bash
# Clone the repository
git clone https://github.com/bhavya079/smart-feedback-system.git
cd smart-feedback-system

# Install dependencies
npm install

# Start the server
npm start
```

The app will be available at **http://localhost:3000**

### Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/smart_feedback_db
```

---

## 📁 Project Structure

```
smart-feedback-system/
├── server.js              # Express server entry point
├── package.json           # Dependencies & scripts
├── .env                   # Environment configuration
├── models/
│   └── Feedback.js        # Mongoose schema (feedback + sentiment)
├── routes/
│   └── feedback.js        # REST API routes (CRUD + analytics)
├── utils/
│   └── sentiment.js       # Sentiment analysis module
└── public/
    ├── index.html         # Feedback submission page
    ├── dashboard.html     # Admin analytics dashboard
    ├── css/
    │   └── style.css      # Design system & global styles
    └── js/
        ├── app.js         # Feedback form & overview charts
        └── dashboard.js   # Dashboard charts & filters
```

---

## 📡 API Endpoints

| Method | Endpoint              | Description                        |
|--------|-----------------------|------------------------------------|
| POST   | `/api/feedback`       | Submit & analyze feedback          |
| GET    | `/api/feedback`       | Get all feedback (with filters)    |
| GET    | `/api/feedback/stats` | Dashboard analytics & statistics   |
| DELETE | `/api/feedback/:id`   | Delete a feedback entry            |

---

## 📄 License

ISC
