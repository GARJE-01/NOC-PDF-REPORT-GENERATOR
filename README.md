# 📋 Site Installation Report Generator (Customer-End Version)

A mobile-first, 100% client-side web application designed for **Field Engineers (FE)** and **NOC Teams** to generate clean, high-quality 4-page customer-end PDF Site Installation Reports directly on mobile or desktop devices.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![jsPDF](https://img.shields.io/badge/jsPDF-2.5.1-red?style=for-the-badge)
![Privacy](https://img.shields.io/badge/Privacy-100%25%20Client--Side-brightgreen?style=for-the-badge)

---

## ✨ Features & Customer Report Structure

- **🆔 SOL ID Validation**: Real-time validation for SOL ID input.
- **📸 4 Mandatory Photo Sections** (Exactly 1 photo per section):
  1. **Page 1**: Sign-off Report (Large, clear, readable format)
  2. **Page 2**: Pre-Installation Photo (Full-page presentation)
  3. **Page 3**: Post-Installation Photo (Full-page presentation)
  4. **Page 4**: New Switch Serial Number Photo (Full-page presentation)
- **🔍 High-Fidelity Image Preservation**:
  - Preserves original uploaded photo quality without lossy downscaling or aggressive quality reduction.
  - Maintains exact aspect ratio without cropping essential site details or serial numbers.
- **🔒 100% Privacy & Security**: Zero photos leave the device or browser memory.
- **📑 Standardized Naming & Sharing**:
  - Automatic PDF filename: `sol id <SOL_ID>.pdf` (e.g. `sol id 1100.pdf`).
  - Single-click PDF download & native mobile Web Share integration.

---

## 📂 Project Structure

```
PDF Generator/
│
├── index.html   # HTML5 structure with 4 required photo cards
├── style.css    # Clean CSS design system & single-photo card preview
├── script.js    # High-quality photo loader & 4-page jsPDF generator
└── README.md    # Project documentation
```

---

## 💻 How to Run Locally

Open [index.html](index.html) directly in any modern browser or run locally via:

```bash
npx serve .
# or
python -m http.server 8000
```

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
