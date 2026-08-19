/**
 * Site Installation Report Generator - Customer-End Version
 * Field Engineer utility for generating high-quality 4-page PDF reports
 */

// Category Configurations (Exact Order for Customer-End Report)
const CATEGORIES = [
    { id: 'signoff', title: 'SIGN-OFF REPORT', name: 'Sign-off Report', page: 1 },
    { id: 'pre_install', title: 'PRE-INSTALLATION PHOTO', name: 'Pre-Installation Photo', page: 2 },
    { id: 'post_install', title: 'POST-INSTALLATION PHOTO', name: 'Post-Installation Photo', page: 3 },
    { id: 'new_switch_sn', title: 'NEW SWITCH SERIAL NUMBER PHOTO', name: 'New Switch Serial Number Photo', page: 4 }
];

// App State
let reportState = {
    solId: '',
    branchName: '',
    photos: {
        signoff: null,
        pre_install: null,
        post_install: null,
        new_switch_sn: null
    }
};

let currentActiveCategory = null;
let generatedPdfBlob = null;
let generatedFilename = '';

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    const solInput = document.getElementById('sol-id');
    solInput.addEventListener('input', (e) => {
        reportState.solId = e.target.value.trim();
        updateValidationState();
        clearCategoryHighlight('card-sol');
    });

    const branchInput = document.getElementById('branch-name');
    if (branchInput) {
        branchInput.addEventListener('input', (e) => {
            reportState.branchName = e.target.value.trim();
            updateValidationState();
            clearCategoryHighlight('card-branch');
        });
    }

    // Render initial photo containers
    CATEGORIES.forEach(cat => renderPhotoCard(cat.id));
    updateValidationState();
}

/**
 * Format device date to DD-MMM-YYYY (e.g. 19-Aug-2026)
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
 * Generate PDF Filename in format: <SOL ID> <BRANCH_NAME>.pdf
 * Spaces in Branch Name are replaced with underscores (_).
 * Invalid OS filename characters are sanitized.
 */
function generatePdfFilename(solId, branchName) {
    let sanitizedBranch = branchName.replace(/\s+/g, '_');
    sanitizedBranch = sanitizedBranch.replace(/[/\\?%*:|"<>]/g, '');
    return `${solId} ${sanitizedBranch}.pdf`;
}

/**
 * Trigger File Input for uploading/replacing photo
 */
function triggerUploadPhoto(categoryId) {
    currentActiveCategory = categoryId;
    const fileInput = document.getElementById('file-input-upload');
    fileInput.value = '';
    fileInput.click();
}

/**
 * Read original photo file with maximum quality (No lossy compression or resizing)
 */
function readPhotoAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
    });
}

/**
 * Handle photo selection
 */
async function handleFileSelected(event) {
    const file = event.target.files[0];
    if (!file || !currentActiveCategory) return;

    showLoading(true, 'Loading photo...');
    try {
        const rawDataUrl = await readPhotoAsDataUrl(file);
        reportState.photos[currentActiveCategory] = rawDataUrl;
        renderPhotoCard(currentActiveCategory);
        updateValidationState();
        clearCategoryHighlight(`card-${currentActiveCategory}`);
    } catch (err) {
        console.error('Error reading photo:', err);
        alert('Could not read photo file. Please try again.');
    } finally {
        showLoading(false);
    }
}

/**
 * Remove photo from category
 */
function removePhoto(categoryId) {
    if (confirm('Remove this photo?')) {
        reportState.photos[categoryId] = null;
        renderPhotoCard(categoryId);
        updateValidationState();
    }
}

/**
 * Render single photo preview card for category
 */
function renderPhotoCard(categoryId) {
    const container = document.getElementById(`grid-${categoryId}`);
    const actionsContainer = document.getElementById(`actions-${categoryId}`);
    const photoDataUrl = reportState.photos[categoryId];

    if (photoDataUrl) {
        container.innerHTML = `
            <div class="single-photo-card">
                <img src="${photoDataUrl}" alt="Photo Preview" class="single-photo-preview" />
            </div>
        `;
        actionsContainer.innerHTML = `
            <div class="single-photo-actions">
                <button class="btn btn-secondary btn-action" onclick="triggerUploadPhoto('${categoryId}')">
                    <span>🔄</span> Replace Photo
                </button>
                <button class="btn btn-outline-danger btn-action" onclick="removePhoto('${categoryId}')">
                    <span>🗑️</span> Remove
                </button>
            </div>
        `;
    } else {
        container.innerHTML = '';
        actionsContainer.innerHTML = `
            <button class="btn btn-add-photo" onclick="triggerUploadPhoto('${categoryId}')">
                <span class="btn-icon">📷</span> Take / Upload Photo
            </button>
        `;
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

    const branchValid = reportState.branchName.length > 0;
    const branchIcon = document.getElementById('branch-valid-icon');
    if (branchIcon) {
        if (branchValid) {
            branchIcon.classList.add('visible');
        } else {
            branchIcon.classList.remove('visible');
        }
    }

    let completedCount = 0;

    CATEGORIES.forEach(cat => {
        const hasPhoto = reportState.photos[cat.id] !== null;
        const badge = document.getElementById(`badge-${cat.id}`);
        if (hasPhoto) {
            completedCount++;
            badge.className = 'status-indicator badge-completed';
            badge.innerHTML = '✅ Complete';
        } else {
            badge.className = 'status-indicator badge-required';
            badge.innerHTML = '🔴 Required';
        }
    });

    const counterText = document.getElementById('checklist-counter');
    counterText.innerText = `Required: ${completedCount}/${CATEGORIES.length}`;

    const progressSummary = document.getElementById('required-progress-text');
    progressSummary.innerHTML = `Required photos completed: <strong>${completedCount}/${CATEGORIES.length}</strong>`;

    const btnGenerate = document.getElementById('btn-generate');
    const allValid = solValid && branchValid && (completedCount === CATEGORIES.length);
    btnGenerate.disabled = !allValid;
}

/**
 * Validate missing items and show clear validation banner
 */
function validateReport() {
    const missing = [];
    const missingCards = [];

    if (!reportState.solId) {
        missing.push('Please enter SOL ID.');
        missingCards.push('card-sol');
    }

    if (!reportState.branchName) {
        missing.push('Please enter Branch Name.');
        missingCards.push('card-branch');
    }

    CATEGORIES.forEach(cat => {
        if (!reportState.photos[cat.id]) {
            missing.push(`Please upload the ${cat.name}.`);
            missingCards.push(`card-${cat.id}`);
        }
    });

    const banner = document.getElementById('validation-banner');
    const list = document.getElementById('validation-list');

    if (missing.length > 0) {
        list.innerHTML = '';
        missing.forEach(msg => {
            const li = document.createElement('li');
            li.innerText = msg;
            list.appendChild(li);
        });
        banner.classList.remove('hidden');

        missingCards.forEach(cardId => {
            const card = document.getElementById(cardId);
            if (card) card.classList.add('incomplete-highlight');
        });

        banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return false;
    }

    banner.classList.add('hidden');
    return true;
}

function clearCategoryHighlight(cardId) {
    const card = document.getElementById(cardId);
    if (card) card.classList.remove('incomplete-highlight');

    const banner = document.getElementById('validation-banner');
    if (!banner.classList.contains('hidden')) {
        const remainingHighlights = document.querySelectorAll('.incomplete-highlight');
        if (remainingHighlights.length === 0) {
            banner.classList.add('hidden');
        }
    }
}

/**
 * Generate PDF using jsPDF (Exactly 4 Pages, High Quality)
 */
async function handleGeneratePdf() {
    if (!validateReport()) return;

    showLoading(true, 'Building high-quality PDF report...');
    
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
    const solId = reportState.solId;
    const branchName = reportState.branchName;
    const dateStr = getFormattedDate();
    generatedFilename = generatePdfFilename(solId, branchName);

    // 4 Pages in exact order:
    // Page 1: Sign-off Report
    // Page 2: Pre-Installation Photo
    // Page 3: Post-Installation Photo
    // Page 4: New Switch Serial Number Photo
    for (let i = 0; i < CATEGORIES.length; i++) {
        const cat = CATEGORIES[i];
        if (i > 0) {
            doc.addPage();
        }

        const pageNum = i + 1;
        const photoDataUrl = reportState.photos[cat.id];

        // Minimal Header Bar
        doc.setFillColor(30, 41, 59); // Deep Slate
        doc.rect(0, 0, pageWidth, 12, 'F');
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.text(`${pageNum}. ${cat.title}`, 10, 8.5);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const headerText = `SOL ID: ${solId} | Branch: ${branchName} | Date: ${dateStr}`;
        doc.text(headerText, pageWidth - 10, 8.5, { align: 'right' });

        // Printable bounds for full-page photo
        const marginTop = 15;
        const marginBottom = 12;
        const marginSide = 8;

        const maxImgWidth = pageWidth - (marginSide * 2); // 194 mm
        const maxImgHeight = pageHeight - marginTop - marginBottom; // 270 mm

        if (photoDataUrl) {
            const dimensions = await getImageDimensions(photoDataUrl);
            
            // Maintain exact original aspect ratio
            let renderW = maxImgWidth;
            let renderH = (dimensions.height * renderW) / dimensions.width;

            if (renderH > maxImgHeight) {
                renderH = maxImgHeight;
                renderW = (dimensions.width * renderH) / dimensions.height;
            }

            // Center image on page
            const posX = marginSide + (maxImgWidth - renderW) / 2;
            const posY = marginTop + (maxImgHeight - renderH) / 2;

            // Detect image format from data URL (PNG vs JPEG)
            const imageFormat = photoDataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
            doc.addImage(photoDataUrl, imageFormat, posX, posY, renderW, renderH);
        }

        // Footer Page Numbering (Page X of 4)
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text(`Page ${pageNum} of 4`, pageWidth / 2, pageHeight - 5, { align: 'center' });
    }

    generatedPdfBlob = doc.output('blob');
    showSuccessScreen();
}

/**
 * Get natural dimensions of DataURL image
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
 * Show Success View
 */
function showSuccessScreen() {
    document.getElementById('main-view').classList.add('hidden');
    document.getElementById('success-view').classList.remove('hidden');
    document.getElementById('generated-filename').innerText = generatedFilename;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Download PDF
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
 * Native Web Share API
 */
async function sharePdf() {
    if (!generatedPdfBlob) return;
    const file = new File([generatedPdfBlob], generatedFilename, { type: 'application/pdf' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({
                title: generatedFilename,
                text: `Site Installation Report - SOL ID ${reportState.solId} (${reportState.branchName})`,
                files: [file]
            });
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Sharing failed:', err);
                downloadPdf();
            }
        }
    } else {
        alert('Direct sharing is not supported on this browser. Initiating PDF download...');
        downloadPdf();
    }
}

/**
 * Reset Form for new report
 */
function confirmResetReport() {
    if (confirm('Create a new report?\nThis will clear current photos, SOL ID, and Branch Name.')) {
        reportState.solId = '';
        reportState.branchName = '';
        CATEGORIES.forEach(cat => {
            reportState.photos[cat.id] = null;
            renderPhotoCard(cat.id);
        });

        document.getElementById('sol-id').value = '';
        const branchInput = document.getElementById('branch-name');
        if (branchInput) branchInput.value = '';
        
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
 * Loading Overlay
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
