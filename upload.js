/* ═══════════════════════════════════════════════════
   InvoiceFlow Upload Page — Interactivity
   ═══════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

    /* ─── Elements ─── */
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const mobileSidebarBtn = document.getElementById('mobileSidebarBtn');
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const uploadedState = document.getElementById('uploadedState');
    const replaceBtn = document.getElementById('replaceBtn');
    const extractBtn = document.getElementById('extractBtn');
    const previewPlaceholder = document.getElementById('previewPlaceholder');
    const previewFields = document.getElementById('previewFields');
    const stepProgress = document.getElementById('stepProgress');

    /* ─── Mobile Sidebar Toggle ─── */
    if (mobileSidebarBtn) {
        mobileSidebarBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            sidebarOverlay.classList.toggle('show');
        });
    }
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            sidebarOverlay.classList.remove('show');
        });
    }

    /* ─── Drag & Drop ─── */
    if (dropzone) {
        // Click to browse
        dropzone.addEventListener('click', () => fileInput.click());

        // Drag events
        ['dragenter', 'dragover'].forEach(evt => {
            dropzone.addEventListener(evt, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropzone.classList.add('drag-over');
            });
        });

        ['dragleave', 'drop'].forEach(evt => {
            dropzone.addEventListener(evt, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropzone.classList.remove('drag-over');
            });
        });

        dropzone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) handleFile(files[0]);
        });

        // File input change
        fileInput.addEventListener('change', () => {
            if (fileInput.files.length > 0) handleFile(fileInput.files[0]);
        });
    }

    /* ─── Handle File Upload ─── */
    function handleFile(file) {
        const validTypes = ['application/pdf', 'image/png', 'image/jpeg'];
        const maxSize = 10 * 1024 * 1024; // 10 MB

        if (!validTypes.includes(file.type)) {
            showToast('Please upload a PDF, PNG, or JPG file.');
            return;
        }
        if (file.size > maxSize) {
            showToast('File exceeds 10MB limit.');
            return;
        }

        // Show uploaded state
        showUploadedState(file);
    }

    function showUploadedState(file) {
        // Hide dropzone, show uploaded
        dropzone.style.display = 'none';
        uploadedState.style.display = 'block';

        // Update filename & size
        const nameEl = uploadedState.querySelector('.uploaded-name');
        const sizeEl = uploadedState.querySelector('.uploaded-size');
        if (nameEl) nameEl.textContent = '✅ ' + file.name;
        if (sizeEl) sizeEl.textContent = formatSize(file.size);

        // Show preview
        showPreview();

        // Update step 1 as completed
        updateSteps(1);
    }

    /* ─── Replace file ─── */
    if (replaceBtn) {
        replaceBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            fileInput.click();
        });
    }

    /* ─── Extract Button ─── */
    if (extractBtn) {
        extractBtn.addEventListener('click', () => {
            // Simulate extraction with loading state
            extractBtn.disabled = true;
            extractBtn.innerHTML = `
                <svg class="spin" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="2" stroke-dasharray="28" stroke-dashoffset="8" stroke-linecap="round"/>
                </svg>
                Extracting fields…
            `;

            setTimeout(() => {
                extractBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8l4 4 6-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Fields Extracted ✓
                `;
                extractBtn.style.background = 'var(--green)';
                updateSteps(2);

                // After a moment, slide to step 3
                setTimeout(() => {
                    updateSteps(3);
                    // Smooth scroll to risk card
                    const riskCard = document.getElementById('riskCard');
                    if (riskCard) {
                        riskCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                    animateRiskMeter();
                }, 800);
            }, 1800);
        });
    }

    /* ─── Show Preview ─── */
    function showPreview() {
        if (previewPlaceholder) previewPlaceholder.style.display = 'none';
        if (previewFields) previewFields.style.display = 'flex';
    }

    /* ─── Step Progress ─── */
    function updateSteps(completedUpTo) {
        if (!stepProgress) return;
        const items = stepProgress.querySelectorAll('.step-item');
        const lines = stepProgress.querySelectorAll('.step-line');

        items.forEach((item, idx) => {
            const stepNum = idx + 1; // items are at indices 0,1,2,3 but with lines interspersed
            item.classList.remove('active', 'completed');

            const itemStep = parseInt(item.dataset.step);
            if (itemStep < completedUpTo) {
                item.classList.add('completed');
                item.querySelector('.step-circle').textContent = '✓';
            } else if (itemStep === completedUpTo) {
                item.classList.add('active');
                item.querySelector('.step-circle').textContent = itemStep;
            } else {
                item.querySelector('.step-circle').textContent = itemStep;
            }
        });

        lines.forEach((line, idx) => {
            line.classList.remove('completed');
            if (idx < completedUpTo - 1) {
                line.classList.add('completed');
            }
        });
    }

    /* ─── Risk Meter Animation ─── */
    function animateRiskMeter() {
        const marker = document.querySelector('.risk-marker');
        if (!marker) return;

        // Animate from 0 to 25%
        marker.style.left = '0%';
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                marker.style.left = '25%';
            });
        });

        // Animate factor bars
        const fills = document.querySelectorAll('.factor-fill');
        fills.forEach((fill) => {
            const target = fill.style.width;
            fill.style.width = '0%';
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    fill.style.width = target;
                });
            });
        });
    }

    /* ─── Submit for Funding ─── */
    const submitBtn = document.getElementById('submitFundingBtn');
    if (submitBtn) {
        submitBtn.addEventListener('click', () => {
            updateSteps(4);
            submitBtn.disabled = true;
            submitBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8l4 4 6-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Submitted Successfully!
            `;
            submitBtn.style.background = 'var(--green)';
            showToast('Invoice submitted for funding! 🎉');
        });
    }

    /* ─── Back Button ─── */
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            updateSteps(2);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    /* ─── Toast Notification ─── */
    function showToast(message) {
        // Remove existing toast
        const existing = document.querySelector('.upload-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'upload-toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 32px;
            right: 32px;
            background: var(--bg-elevated);
            color: var(--white);
            font-family: var(--font-body);
            font-size: 14px;
            font-weight: 500;
            padding: 14px 24px;
            border-radius: var(--radius-sm);
            border: 1px solid var(--border);
            box-shadow: 0 8px 32px rgba(0,0,0,.4);
            z-index: 999;
            animation: toastIn .3s cubic-bezier(.4,0,.2,1);
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'toastOut .3s cubic-bezier(.4,0,.2,1) forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    /* ─── Inject toast + spin keyframes ─── */
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        @keyframes toastIn {
            from { opacity: 0; transform: translateY(16px) scale(.96); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes toastOut {
            from { opacity: 1; transform: translateY(0) scale(1); }
            to   { opacity: 0; transform: translateY(16px) scale(.96); }
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        .spin {
            animation: spin .8s linear infinite;
        }
    `;
    document.head.appendChild(styleSheet);

    /* ─── Utility: format bytes ─── */
    function formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    /* ─── Auto-show uploaded state on page load (demo mode) ─── */
    // The page loads with the uploaded state visible by default for demo.
    // The dropzone is shown initially; to demo the uploaded state,
    // uncomment the line below:
    // simulateUpload();

    function simulateUpload() {
        if (dropzone) dropzone.style.display = 'none';
        if (uploadedState) uploadedState.style.display = 'block';
        showPreview();
        updateSteps(1);
    }

    // On load, trigger factor bar animations for scoring card
    setTimeout(() => {
        const fills = document.querySelectorAll('.scoring-card .factor-fill');
        fills.forEach((fill) => {
            const target = fill.style.width;
            fill.style.width = '0%';
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    fill.style.width = target;
                });
            });
        });
    }, 600);

});
