# 📋 Site Installation Report Generator

A mobile-first, 100% client-side web application designed for **Field Engineers (FE)** and **NOC Teams** to easily capture, compress, validate, and generate standardized PDF Site Installation Reports directly on their mobile devices or desktop.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![jsPDF](https://img.shields.io/badge/jsPDF-2.5.1-red?style=for-the-badge)
![Privacy](https://img.shields.io/badge/Privacy-100%25%20Client--Side-brightgreen?style=for-the-badge)

---

## ✨ Features

- **🆔 SOL ID Entry & Real-Time Validation**: Enforces mandatory SOL ID input with visual validation indicators.
- **📸 Photo Checklist System**:
  - **5 Required Categories**: Pre-Installation, Old Switch, New Switch, Post-Installation, Sign-Off Report.
  - **2 Optional Categories**: Multimeter Reading, Other Photos.
  - Support for multiple photo uploads per category with live thumbnail previews, retake, and removal features.
- **⚡ Local In-Browser Photo Compression**:
  - Utilizes HTML5 Canvas to compress photos locally before building the PDF.
  - Reduces PDF file size drastically while preserving image quality for fast uploading and sharing.
- **🔒 100% Privacy & Data Security**:
  - **Zero Server Uploads**: Photos and site data never leave the user's browser or device. All processing happens 100% client-side.
- **⚠️ Smart Validation Checklist**:
  - The **GENERATE PDF** button remains disabled until all 5 required photo categories and SOL ID are completed.
  - Displays a detailed error banner highlighting any missing items if generation is attempted prematurely.
- **📑 Multi-Page PDF Generation**:
  - Automatically structures multi-page report layouts with headers (SOL ID, auto-formatted DD-MMM-YYYY date) and page numbers (`Page X of Y`).
  - Preserves original photo aspect ratios without stretching or cropping critical site details.
  - Automatically names output files as `sol id <SOL_ID>.pdf` (e.g., `sol id 1100.pdf`).
- **📱 Download, Share & Reset**:
  - **Direct Download**: Save PDF directly to local storage.
  - **Native Mobile Share**: Uses the Web Share API (`navigator.share`) to send PDFs directly via WhatsApp, Email, or drive apps on mobile devices.
  - **One-Click Reset**: Easily reset the form for the next branch installation without memory accumulation.

---

## 📂 Project Structure

```
PDF Generator/
│
├── index.html   # Main HTML5 document structure & semantic components
├── style.css    # Mobile-first CSS styling, CSS design tokens & animations
└── script.js    # Image compression engine, validation logic & jsPDF integration
```

---

## 🛠️ Built With

- **HTML5** - Markup & Mobile Camera File Captures (`capture="environment"`)
- **CSS3** - Custom CSS Variables, Flexbox/Grid layouts, Glassmorphism UI
- **JavaScript (ES6+)** - HTML5 Canvas API for local image compression & DOM manipulation
- **[jsPDF](https://github.com/parallax/jsPDF)** - Client-side PDF document generation

---

## 💻 How to Run Locally

Since this is a client-side project, no installation or npm packages are required.

### Quick Start:
Simply double-click or open [index.html](index.html) in any modern web browser (Chrome, Edge, Firefox, Safari).

### Local HTTP Server (Optional):
If you prefer running through a local web server:

**Using Node.js:**
```bash
npx serve .
```

**Using Python:**
```bash
python -m http.server 8000
```
Then open `http://localhost:8000` in your browser.

---

## 🌐 Live Deployment

This repository is ready to be hosted for free on **GitHub Pages**, **Netlify**, or **Vercel**:

### Deploying to GitHub Pages:
1. Go to repository **Settings** > **Pages**.
2. Under **Branch**, select `main` and root `/`.
3. Click **Save**. Your site will be published at `https://<YOUR_USERNAME>.github.io/NOC-PDF-REPORT-GENERATOR/`.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
