/**
 * Site Installation Report Generator - Client-Side JavaScript
 * Field Engineer utility for browser-local PDF generation
 */

// Category Configurations
const CATEGORIES = [
    { id: 'pre_install', title: '1. PRE-INSTALLATION', name: 'Pre-Installation', required: true },
    { id: 'old_switch', title: '2. OLD SWITCH', name: 'Old Switch', required: true },
    { id: 'new_switch', title: '3. NEW SWITCH', name: 'New Switch', required: true },
    { id: 'post_install', title: '4. POST-INSTALLATION', name: 'Post-Installation', required: true },
    { id: 'signoff', title: '5. SIGN-OFF REPORT', name: 'Sign-Off Report', required: true },
    { id: 'multimeter', title: '6. MULTIMETER READING', name: 'Multimeter Reading', required: false },
    { id: 'other_photos', title: '7. OTHER PHOTOS', name: 'Other Photos', required: false }
];

// App State
let reportState = {
    solId: '',
    photos: {
        pre_install: [],
        old_switch: [],
        new_switch: [],
        post_install: [],
        signoff: [],
        multimeter: [],
        other_photos: []
    }
};

let currentActiveCategory = null;
let targetRetakeIndex = null;
let generatedPdfBlob = null;
let generatedFilename = '';

// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    // SOL ID input listener
    const solInput = document.getElementById('sol-id');
    solInput.addEventListener('input', (e) => {
        reportState.solId = e.target.value.trim();
        updateValidationState();
        clearCategoryHighlight('card-sol');
    });

    updateValidationState();
}

/**
 * Format device date to DD-MMM-YYYY (e.g. 11-Aug-2026)
 */
function getFormattedDate() {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
}

/**
 * Trigger File Input for adding a photo
 */
function triggerAddPhoto(categoryId) {
    currentActiveCategory = categoryId;
    targetRetakeIndex = null;
    const fileInput = document.getElementById('file-input-add');
    fileInput.value = '';
    fileInput.click();
}

/**
 * Trigger File Input for retaking a photo
 */
function triggerRetakePhoto(categoryId, index) {
    currentActiveCategory = categoryId;
    targetRetakeIndex = index;
    const fileInput = document.getElementById('file-input-retake');
    fileInput.value = '';
    fileInput.click();
}

/**
 * Handle new photo selection
 */
async function handleFileSelected(event) {
    const file = event.target.files[0];
    if (!file || !currentActiveCategory) return;

    showLoading(true, 'Compressing photo...');
    try {
        const compressedBase64 = await compressImage(file);
        reportState.photos[currentActiveCategory].push(compressedBase64);
        renderPhotoGrid(currentActiveCategory);
        updateValidationState();
        clearCategoryHighlight(`card-${currentActiveCategory}`);
    } catch (err) {
        console.error('Error processing photo:', err);
        alert('Could not process photo. Please try again.');
    } finally {
        showLoading(false);
    }
}

/**
 * Handle retake photo selection
 */
async function handleRetakeFileSelected(event) {
    const file = event.target.files[0];
    if (!file || !currentActiveCategory || targetRetakeIndex === null) return;

    showLoading(true, 'Compressing replacement photo...');
    try {
        const compressedBase64 = await compressImage(file);
        reportState.photos[currentActiveCategory][targetRetakeIndex] = compressedBase64;
        renderPhotoGrid(currentActiveCategory);
        updateValidationState();
    } catch (err) {
        console.error('Error processing photo:', err);
        alert('Could not replace photo. Please try again.');
    } finally {
        showLoading(false);
    }
}

/**
 * Remove photo from category
 */
function removePhoto(categoryId, index) {
    if (confirm('Remove this photo?')) {
        reportState.photos[categoryId].splice(index, 1);
        renderPhotoGrid(categoryId);
        updateValidationState();
    }
}

/**
 * Compress image using Canvas locally in browser
 */
function compressImage(file, maxDimension = 1200, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                // Scale down while maintaining aspect ratio
                if (width > maxDimension || height > maxDimension) {
                    if (width > height) {
                        height = Math.round((height * maxDimension) / width);
                        width = maxDimension;
                    } else {
                        width = Math.round((width * maxDimension) / height);
                        height = maxDimension;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(dataUrl);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
}

/**
 * Render thumbnails for a category
 */
function renderPhotoGrid(categoryId) {
    const grid = document.getElementById(`grid-${categoryId}`);
    const photos = reportState.photos[categoryId];

    grid.innerHTML = '';
    photos.forEach((src, idx) => {
        const item = document.createElement('div');
        item.className = 'photo-item';
        item.innerHTML = `
            <span class="photo-label">Photo ${idx + 1}</span>
            <img src="${src}" alt="Photo ${idx + 1}" />
            <div class="photo-item-actions">
                <button class="btn-photo-action btn-retake" onclick="triggerRetakePhoto('${categoryId}', ${idx})">🔄 Retake</button>
                <button class="btn-photo-action btn-remove" onclick="removePhoto('${categoryId}', ${idx})">🗑️ Remove</button>
            </div>
        `;
        grid.appendChild(item);
    });

    // Update Add Photo button text
    const card = document.getElementById(`card-${categoryId}`);
    const addBtn = card.querySelector('.btn-add-photo');
    if (photos.length > 0) {
        addBtn.innerHTML = '<span class="btn-icon">➕</span> Add Another Photo';
    } else {
        addBtn.innerHTML = '<span class="btn-icon">📷</span> Add Photo';
    }
}

/**
 * Update UI badges, counter, and generate button enable status
 */
function updateValidationState() {
    const solValid = reportState.solId.length > 0;
    const solIcon = document.getElementById('sol-valid-icon');
    if (solValid) {
        solIcon.classList.add('visible');
    } else {
        solIcon.classList.remove('visible');
    }

    let requiredCompleted = 0;
    const requiredCategories = CATEGORIES.filter(c => c.required);

    requiredCategories.forEach(cat => {
        const count = reportState.photos[cat.id].length;
        const badge = document.getElementById(`badge-${cat.id}`);
        if (count > 0) {
            requiredCompleted++;
            badge.className = 'status-indicator badge-completed';
            badge.innerHTML = `✅ Complete (${count})`;
        } else {
            badge.className = 'status-indicator badge-required';
            badge.innerHTML = '🔴 Required';
        }
    });

    // Optional categories badge update
    CATEGORIES.filter(c => !c.required).forEach(cat => {
        const count = reportState.photos[cat.id].length;
        const badge = document.getElementById(`badge-${cat.id}`);
        if (count > 0) {
            badge.className = 'status-indicator badge-completed';
            badge.innerHTML = `✅ ${count} photo${count > 1 ? 's' : ''}`;
        } else {
            badge.className = 'status-indicator badge-optional';
            badge.innerHTML = '🟢 Optional';
        }
    });

    // Counter text
    const counterText = document.getElementById('checklist-counter');
    counterText.innerText = `Required: ${requiredCompleted}/${requiredCategories.length}`;

    const progressSummary = document.getElementById('required-progress-text');
    progressSummary.innerHTML = `Required photos completed: <strong>${requiredCompleted}/${requiredCategories.length}</strong>`;

    // Enable generate button if SOL ID and all required categories complete
    const btnGenerate = document.getElementById('btn-generate');
    const allValid = solValid && (requiredCompleted === requiredCategories.length);
    btnGenerate.disabled = !allValid;
}

/**
 * Validate missing items and highlight UI if clicked prematurely
 */
function validateReport() {
    const missing = [];
    const missingCards = [];

    if (!reportState.solId) {
        missing.push('SOL ID');
        missingCards.push('card-sol');
    }

    CATEGORIES.filter(c => c.required).forEach(cat => {
        if (reportState.photos[cat.id].length === 0) {
            missing.push(`${cat.name} photo`);
            missingCards.push(`card-${cat.id}`);
        }
    });

    const banner = document.getElementById('validation-banner');
    const list = document.getElementById('validation-list');

    if (missing.length > 0) {
        list.innerHTML = '';
        missing.forEach(item => {
            const li = document.createElement('li');
            li.innerText = item;
            list.appendChild(li);
        });
        banner.classList.remove('hidden');

        // Highlight missing cards
        missingCards.forEach(cardId => {
            const card = document.getElementById(cardId);
            if (card) card.classList.add('incomplete-highlight');
        });

        // Scroll to banner or first missing card
        banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return false;
    }

    banner.classList.add('hidden');
    return true;
}

function clearCategoryHighlight(cardId) {
    const card = document.getElementById(cardId);
    if (card) card.classList.remove('incomplete-highlight');
    
    // Check if banner can be hidden
    const banner = document.getElementById('validation-banner');
    if (!banner.classList.contains('hidden')) {
        const remainingHighlights = document.querySelectorAll('.incomplete-highlight');
        if (remainingHighlights.length === 0) {
            banner.classList.add('hidden');
        }
    }
}

/**
 * Generate PDF using jsPDF
 */
async function handleGeneratePdf() {
    if (!validateReport()) return;

    showLoading(true, 'Generating PDF document...');
    
    // Brief delay to allow UI loading spinner to render smoothly
    setTimeout(async () => {
        try {
            await createPdf();
        } catch (err) {
            console.error('PDF Generation Failed:', err);
            alert('An error occurred while generating the PDF. Please try again.');
        } finally {
            showLoading(false);
        }
    }, 100);
}

async function createPdf() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth(); // 210 mm
    const pageHeight = doc.internal.pageSize.getHeight(); // 297 mm
    const margin = 14;
    const contentWidth = pageWidth - (margin * 2);
    let currentY = margin;

    const dateStr = getFormattedDate();
    const solId = reportState.solId;
    generatedFilename = `sol id ${solId}.pdf`;

    // Function to print Page Header
    function printPageHeader() {
        doc.setFillColor(30, 41, 59); // Deep Slate
        doc.rect(0, 0, pageWidth, 18, 'F');
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(255, 255, 255);
        doc.text('SITE INSTALLATION REPORT', margin, 12);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`SOL ID: ${solId}`, pageWidth - margin, 12, { align: 'right' });
    }

    // Print main document header on first page
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text('SITE INSTALLATION REPORT', margin, currentY + 6);
    currentY += 14;

    // Subtitle metadata box
    doc.setFillColor(241, 245, 249); // slate-100
    doc.roundedRect(margin, currentY, contentWidth, 16, 2, 2, 'F');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235); // primary blue
    doc.text(`SOL ID: ${solId}`, margin + 6, currentY + 10.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(`Date: ${dateStr}`, pageWidth - margin - 6, currentY + 10.5, { align: 'right' });

    currentY += 24;

    // Process each category
    for (const cat of CATEGORIES) {
        const photos = reportState.photos[cat.id];
        // Skip empty optional sections
        if (!cat.required && photos.length === 0) {
            continue;
        }

        // Check vertical space for Section Header
        if (currentY + 20 > pageHeight - margin) {
            doc.addPage();
            printPageHeader();
            currentY = 26;
        }

        // Section Title Header
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(15, 23, 42);
        doc.text(cat.title, margin, currentY);
        
        // Underline section header
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.5);
        doc.line(margin, currentY + 2, pageWidth - margin, currentY + 2);

        currentY += 8;

        if (photos.length === 0 && cat.required) {
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(10);
            doc.setTextColor(220, 38, 38);
            doc.text('No photos provided', margin, currentY + 4);
            currentY += 12;
            continue;
        }

        // Calculate photo grid layout in PDF
        // We will render 2 photos side-by-side if space allows, or 1 large photo
        const gap = 6;
        const maxImgWidth = (contentWidth - gap) / 2; // ~89mm per image column
        const maxImgHeight = 80; // max height per image mm

        for (let i = 0; i < photos.length; i += 2) {
            const rowPhotos = photos.slice(i, i + 2);
            let rowMaxHeight = 0;

            // Calculate heights for photos in this row
            const imageSpecs = await Promise.all(rowPhotos.map(src => getImageDimensions(src)));
            
            imageSpecs.forEach(spec => {
                let w = maxImgWidth;
                let h = (spec.height * w) / spec.width;
                if (h > maxImgHeight) {
                    h = maxImgHeight;
                    w = (spec.width * h) / spec.height;
                }
                if (h > rowMaxHeight) rowMaxHeight = h;
            });

            // Check page overflow
            if (currentY + rowMaxHeight + 10 > pageHeight - margin) {
                doc.addPage();
                printPageHeader();
                currentY = 26;
            }

            // Draw images in row
            for (let j = 0; j < rowPhotos.length; j++) {
                const src = rowPhotos[j];
                const spec = imageSpecs[j];

                let w = maxImgWidth;
                let h = (spec.height * w) / spec.width;
                if (h > maxImgHeight) {
                    h = maxImgHeight;
                    w = (spec.width * h) / spec.height;
                }

                const posX = margin + j * (maxImgWidth + gap);
                
                // Draw light photo card background/border
                doc.setDrawColor(226, 232, 240);
                doc.setFillColor(250, 250, 250);
                doc.roundedRect(posX, currentY, maxImgWidth, h, 1.5, 1.5, 'FD');

                // Place image
                doc.addImage(src, 'JPEG', posX, currentY, w, h);
            }

            currentY += rowMaxHeight + 8;
        }

        currentY += 6; // Spacing after section
    }

    // Add Page Numbers to all pages
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
    }

    // Output PDF Blob
    generatedPdfBlob = doc.output('blob');

    // Show Success Screen View
    showSuccessScreen();
}

/**
 * Get natural width/height of base64 image
 */
function getImageDimensions(src) {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
            resolve({ width: img.width, height: img.height });
        };
    });
}

/**
 * Show Success Screen
 */
function showSuccessScreen() {
    document.getElementById('main-view').classList.add('hidden');
    document.getElementById('success-view').classList.remove('hidden');
    document.getElementById('generated-filename').innerText = generatedFilename;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Download generated PDF
 */
function downloadPdf() {
    if (!generatedPdfBlob) return;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(generatedPdfBlob);
    link.download = generatedFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Share PDF using Web Share API on mobile
 */
async function sharePdf() {
    if (!generatedPdfBlob) return;

    const file = new File([generatedPdfBlob], generatedFilename, { type: 'application/pdf' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({
                title: generatedFilename,
                text: `Site Installation Report - SOL ID ${reportState.solId}`,
                files: [file]
            });
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Sharing failed:', err);
                downloadPdf(); // Fallback to download
            }
        }
    } else {
        // Fallback for browsers that don't support file sharing
        alert('File sharing is not directly supported by this browser. Initiating PDF download...');
        downloadPdf();
    }
}

/**
 * Reset report for a new site
 */
function confirmResetReport() {
    if (confirm('Are you sure you want to create a new report?\nThis will clear current photos and SOL ID.')) {
        // Reset state
        reportState.solId = '';
        CATEGORIES.forEach(cat => {
            reportState.photos[cat.id] = [];
            renderPhotoGrid(cat.id);
        });

        document.getElementById('sol-id').value = '';
        generatedPdfBlob = null;
        generatedFilename = '';

        document.getElementById('validation-banner').classList.add('hidden');
        document.getElementById('success-view').classList.add('hidden');
        document.getElementById('main-view').classList.remove('hidden');
        
        updateValidationState();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

/**
 * Show/Hide loading overlay
 */
function showLoading(show, message = 'Processing...') {
    const overlay = document.getElementById('loading-overlay');
    const text = document.getElementById('loading-text');
    if (show) {
        text.innerText = message;
        overlay.classList.remove('hidden');
    } else {
        overlay.classList.add('hidden');
    }
}
