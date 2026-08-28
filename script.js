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
        signoff: null,      // Stores { file, dataUrl, width, height }
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
    if (solInput) {
        solInput.addEventListener('input', (e) => {
            reportState.solId = e.target.value.trim();
            updateValidationState();
            clearCategoryHighlight('card-sol');
        });
    }

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
 * Format device date to DD-MMM-YYYY (e.g. 28-Aug-2026)
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
 * Format PDF Filename: <SOL ID> <BRANCH_NAME>.pdf
 * 1. Trim SOL ID and Branch Name
 * 2. Replace one or more spaces in Branch Name with a single underscore '_'
 * 3. Sanitize invalid OS filename characters (/ \ : * ? " < > |)
 */
function generatePdfFilename(solId, branchName) {
    const cleanSolId = (solId || '').trim();
    let cleanBranch = (branchName || '').trim();

    // Replace one or more spaces with a single underscore
    cleanBranch = cleanBranch.replace(/\s+/g, '_');

    // Remove invalid filename characters
    cleanBranch = cleanBranch.replace(/[/\\?%*:|"<>]/g, '');

    return `${cleanSolId} ${cleanBranch}.pdf`;
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
 * Normalizes an uploaded File object or DataURL:
 * 1. Fully decodes image respecting EXIF orientation.
 * 2. Draws image onto 2D Canvas with solid white background.
 * 3. Exports sRGB 24-bit JPEG DataURL (quality 0.92).
 * 4. Returns verified { dataUrl, width, height }.
 */
async function processAndNormalizeImage(fileOrDataUrl) {
    return new Promise(async (resolve, reject) => {
        try {
            let bitmap = null;

            // Attempt createImageBitmap with EXIF orientation handling
            if (fileOrDataUrl instanceof File || fileOrDataUrl instanceof Blob) {
                if ('createImageBitmap' in window) {
                    try {
                        bitmap = await createImageBitmap(fileOrDataUrl, { imageOrientation: 'from-image' });
                    } catch (e) {
                        // Fall back to Image element if createImageBitmap fails
                    }
                }
            }

            if (bitmap) {
                const width = bitmap.width;
                const height = bitmap.height;
                if (!width || !height) {
                    reject(new Error("Invalid image dimensions"));
                    return;
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');

                // Solid white background to avoid dark/black transparency artifacts
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(bitmap, 0, 0);

                const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
                bitmap.close();

                if (!dataUrl || dataUrl === 'data:,' || dataUrl.length < 100) {
                    reject(new Error("Empty image data generated"));
                    return;
                }

                resolve({ dataUrl, width, height });
                return;
            }

            // Fallback using HTMLImageElement
            const img = new Image();
            img.crossOrigin = 'anonymous';

            let srcUrl = fileOrDataUrl;
            let objectUrlToRevoke = null;

            if (fileOrDataUrl instanceof File || fileOrDataUrl instanceof Blob) {
                srcUrl = URL.createObjectURL(fileOrDataUrl);
                objectUrlToRevoke = srcUrl;
            }

            img.onload = () => {
                if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);

                const width = img.naturalWidth || img.width;
                const height = img.naturalHeight || img.height;

                if (!width || !height) {
                    reject(new Error("Invalid image dimensions"));
                    return;
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');

                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0);

                const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

                if (!dataUrl || dataUrl === 'data:,' || dataUrl.length < 100) {
                    reject(new Error("Empty image data generated"));
                    return;
                }

                resolve({ dataUrl, width, height });
            };

            img.onerror = (err) => {
                if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
                reject(err || new Error("Failed to load image"));
            };

            img.src = srcUrl;
        } catch (err) {
            reject(err);
        }
    });
}

/**
 * Handle photo selection
 */
async function handleFileSelected(event) {
    const file = event.target.files[0];
    if (!file || !currentActiveCategory) return;

    showLoading(true, 'Processing & normalizing photo...');
    try {
        const processed = await processAndNormalizeImage(file);
        reportState.photos[currentActiveCategory] = {
            file: file,
            dataUrl: processed.dataUrl,
            width: processed.width,
            height: processed.height
        };
        renderPhotoCard(currentActiveCategory);
        updateValidationState();
        clearCategoryHighlight(`card-${currentActiveCategory}`);
    } catch (err) {
        console.error('Error processing photo:', err);
        const catConfig = CATEGORIES.find(c => c.id === currentActiveCategory);
        const catName = catConfig ? catConfig.name : 'Photo';
        alert(`Unable to process the ${catName}. Please select a valid photo file.`);
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
    const photoObj = reportState.photos[categoryId];

    if (photoObj && photoObj.dataUrl) {
        container.innerHTML = `
            <div class="single-photo-card">
                <img src="${photoObj.dataUrl}" alt="Photo Preview" class="single-photo-preview" />
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
    if (solIcon) {
        if (solValid) {
            solIcon.classList.add('visible');
        } else {
            solIcon.classList.remove('visible');
        }
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
        const hasPhoto = reportState.photos[cat.id] !== null && reportState.photos[cat.id] !== undefined;
        const badge = document.getElementById(`badge-${cat.id}`);
        if (badge) {
            if (hasPhoto) {
                completedCount++;
                badge.className = 'status-indicator badge-completed';
                badge.innerHTML = '✅ Complete';
            } else {
                badge.className = 'status-indicator badge-required';
                badge.innerHTML = '🔴 Required';
            }
        }
    });

    const counterText = document.getElementById('checklist-counter');
    if (counterText) {
        counterText.innerText = `Required: ${completedCount}/${CATEGORIES.length}`;
    }

    const progressSummary = document.getElementById('required-progress-text');
    if (progressSummary) {
        progressSummary.innerHTML = `Required photos completed: <strong>${completedCount}/${CATEGORIES.length}</strong>`;
    }

    const btnGenerate = document.getElementById('btn-generate');
    if (btnGenerate) {
        const allValid = solValid && branchValid && (completedCount === CATEGORIES.length);
        btnGenerate.disabled = !allValid;
    }
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
 * Sequential PDF Generation with Pre-Flight Image Verification
 */
async function handleGeneratePdf() {
    if (!validateReport()) return;

    showLoading(true, 'Verifying photos & building PDF...');

    setTimeout(async () => {
        try {
            await createPdf();
        } catch (err) {
            console.error('PDF Generation Error:', err);
            alert(err.message || 'An error occurred while generating the PDF. Please try again.');
        } finally {
            showLoading(false);
        }
    }, 100);
}

async function createPdf() {
    const { jsPDF } = window.jspdf;

    const solId = reportState.solId.trim();
    const branchName = reportState.branchName.trim();
    const dateStr = getFormattedDate();

    // 1. Strict Pre-flight Verification of all 4 images before starting PDF construction
    const normalizedMap = {};

    for (const cat of CATEGORIES) {
        const photoObj = reportState.photos[cat.id];
        if (!photoObj || (!photoObj.file && !photoObj.dataUrl)) {
            throw new Error(`Please upload the ${cat.name}.`);
        }

        try {
            const norm = await processAndNormalizeImage(photoObj.file || photoObj.dataUrl);
            if (!norm.dataUrl || !norm.width || !norm.height) {
                throw new Error("Invalid image dimensions or empty data");
            }
            normalizedMap[cat.id] = norm;
        } catch (e) {
            console.error(`Failed pre-flight image verification for ${cat.name}:`, e);
            throw new Error(`Unable to process the ${cat.name}. Please remove and upload the photo again.`);
        }
    }

    // 2. Create PDF document
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();   // 210 mm
    const pageHeight = doc.internal.pageSize.getHeight();  // 297 mm
    generatedFilename = generatePdfFilename(solId, branchName);

    // 3. Render 4 Pages strictly sequentially
    for (let i = 0; i < CATEGORIES.length; i++) {
        const cat = CATEGORIES[i];
        if (i > 0) {
            doc.addPage();
        }

        const pageNum = i + 1;
        const norm = normalizedMap[cat.id];

        // Header Bar (12mm)
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

        const maxImgWidth = pageWidth - (marginSide * 2);  // 194 mm
        const maxImgHeight = pageHeight - marginTop - marginBottom;  // 270 mm

        // Proportional Fit-Inside Scaling Math (Equal scale factor for W and H preserves 100% exact aspect ratio)
        const imgW = norm.width;
        const imgH = norm.height;

        const scale = Math.min(maxImgWidth / imgW, maxImgHeight / imgH);
        const renderW = imgW * scale;
        const renderH = imgH * scale;

        // Center image horizontally and vertically
        const posX = marginSide + (maxImgWidth - renderW) / 2;
        const posY = marginTop + (maxImgHeight - renderH) / 2;

        // Add normalized sRGB JPEG image to PDF
        doc.addImage(norm.dataUrl, 'JPEG', posX, posY, renderW, renderH);

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

        const solInput = document.getElementById('sol-id');
        if (solInput) solInput.value = '';

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
    if (overlay && text) {
        if (show) {
            text.innerText = message;
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }
}
