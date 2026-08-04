// DOM Elements
const textInput = document.getElementById('textInput');
const fgColor = document.getElementById('fgColor');
const bgColor = document.getElementById('bgColor');
const sizeInput = document.getElementById('size');
const eccLevel = document.getElementById('eccLevel');
const formatSelect = document.getElementById('format');
const jpegQualityInput = document.getElementById('jpegQuality');
const jpegQualityValue = document.getElementById('jpegQualityValue');
const downloadBtn = document.getElementById('downloadBtn');
const qrCanvas = document.getElementById('qrCanvas');
const jpegQualityContainer = document.getElementById('jpegQualityContainer');
const logoUpload = document.getElementById('logoUpload');
const logoSizeInput = document.getElementById('logoSize');
const logoSizeValue = document.getElementById('logoSizeValue');

// State
let logoImg = null;

// UI Updates
jpegQualityInput.addEventListener('input', () => {
    jpegQualityValue.textContent = jpegQualityInput.value;
});

logoSizeInput.addEventListener('input', () => {
    logoSizeValue.textContent = logoSizeInput.value;
    generateQRCode(); // Regenerate when logo size changes
});

// Format-based UI
function updateFormatUI() {
    if (formatSelect.value === 'jpeg') {
        jpegQualityContainer.style.display = 'block';
    } else {
        jpegQualityContainer.style.display = 'none';
    }
    // Regenerate when format changes (logo may be disallowed for SVG)
    generateQRCode();
}

formatSelect.addEventListener('change', updateFormatUI);
// Initial state
if (formatSelect.value !== 'jpeg') {
    jpegQualityContainer.style.display = 'none';
}

// Logo handling
logoUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) {
        logoImg = null;
        generateQRCode();
        return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
        logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        logoImg.onload = () => {
            generateQRCode();
        };
        logoImg.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

// Main generation function
function generateQRCode() {
    const text = textInput.value.trim();
    if (!text) {
        // Clear canvas if empty
        const ctx = qrCanvas.getContext('2d');
        ctx.clearRect(0, 0, qrCanvas.width, qrCanvas.height);
        return;
    }

    const width = parseInt(sizeInput.value);
    const height = parseInt(sizeInput.value);

    // Update canvas dimensions to match size
    qrCanvas.width = width;
    qrCanvas.height = height;

    // Draw QR code
    QRCode.toCanvas(qrCanvas, text, {
        width: width,
        height: height,
        color: {
            dark: fgColor.value,
            light: bgColor.value
        },
        errorCorrectionLevel: eccLevel.value,
        margin: 2
    }, (error) => {
        if (error) {
            console.error(error);
            alert('Failed to generate QR code');
        } else {
            // Draw logo if present and format is not SVG
            if (logoImg && formatSelect.value !== 'svg') {
                drawLogo();
            }
        }
    });
}

function drawLogo() {
    const canvas = qrCanvas;
    const ctx = canvas.getContext('2d');
    const size = parseInt(sizeInput.value);
    const logoSizePercent = parseInt(logoSizeInput.value);
    const logoSizePx = (size * logoSizePercent) / 100;
    const x = (size - logoSizePx) / 2;
    const y = (size - logoSizePx) / 2;

    ctx.save();
    ctx.drawImage(logoImg, x, y, logoSizePx, logoSizePx);
    ctx.restore();
}

// Event listeners for auto-update
textInput.addEventListener('input', generateQRCode);
fgColor.addEventListener('input', generateQRCode);
bgColor.addEventListener('input', generateQRCode);
sizeInput.addEventListener('input', generateQRCode); // Changed from change to input
eccLevel.addEventListener('change', generateQRCode);
// logo_size already handled

// Initial generation
generateQRCode();

// Download functionality
downloadBtn.addEventListener('click', () => {
    const format = formatSelect.value;
    const filename = `qrcode.${format}`;

    if (format === 'svg') {
        // Generate SVG via QRCode library (logo ignored for SVG)
        QRCode.toString(textInput.value.trim(), {
            type: 'svg',
            color: {
                dark: fgColor.value,
                light: bgColor.value
            },
            errorCorrectionLevel: eccLevel.value,
            margin: 2
        }, (err, svg) => {
            if (err) {
                console.error(err);
                alert('Failed to generate SVG');
                return;
            }
            downloadSVG(svg, filename);
        });
    } else if (format === 'jpeg') {
        const quality = jpegQualityInput.value / 100;
        qrCanvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
        }, 'image/jpeg', quality);
    } else { // png
        qrCanvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
        }, 'image/png');
    }
});

function downloadSVG(svg, filename) {
    const blob = new Blob([svg], {type: 'image/svg+xml;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}