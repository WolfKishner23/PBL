/* ═══════════════════════════════════════════════════
   InvoiceFlow Finance Partner Dashboard — Interactivity
   ═══════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

    /* ─── Elements ─── */
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const mobileSidebarBtn = document.getElementById('mobileSidebarBtn');
    const tableTabs = document.getElementById('tableTabs');
    const financeTable = document.getElementById('financeTable');
    const detailPanel = document.getElementById('detailPanel');
    const detailEmpty = document.getElementById('detailEmpty');
    const detailContent = document.getElementById('detailContent');
    const detailClose = document.getElementById('detailClose');
    const searchInput = document.getElementById('searchInput');

    /* ─── Mobile Sidebar ─── */
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

    /* ─── Tab Filtering ─── */
    if (tableTabs) {
        tableTabs.addEventListener('click', (e) => {
            const btn = e.target.closest('.tab');
            if (!btn) return;

            tableTabs.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.dataset.filter;
            const rows = financeTable.querySelectorAll('tbody tr');

            rows.forEach(row => {
                if (filter === 'all') {
                    row.style.display = '';
                } else {
                    row.style.display = row.dataset.risk === filter ? '' : 'none';
                }
            });

            // Update queue count
            const visibleCount = [...rows].filter(r => r.style.display !== 'none').length;
            const countEl = document.querySelector('.queue-count .mono');
            if (countEl) countEl.textContent = visibleCount;
        });
    }

    /* ─── Row Click → Detail Panel ─── */
    if (financeTable) {
        financeTable.addEventListener('click', (e) => {
            const row = e.target.closest('tbody tr');
            if (!row) return;

            // If clicked on an action button, don't open detail
            if (e.target.closest('.btn-approve') || e.target.closest('.btn-reject')) {
                handleAction(e.target.closest('button'), row);
                return;
            }

            // Highlight row
            financeTable.querySelectorAll('tbody tr').forEach(r => r.classList.remove('selected'));
            row.classList.add('selected');

            // Populate detail panel
            showDetail(row);
        });
    }

    /* ─── Show Detail Panel ─── */
    function showDetail(row) {
        const data = row.dataset;

        // Header
        document.getElementById('detailId').textContent = data.id;
        document.getElementById('detailCompany').textContent = data.company;

        // Metrics
        document.getElementById('detailAmount').textContent = data.amount;
        const score = parseInt(data.score);
        const scoreCircle = document.getElementById('detailScoreCircle');
        scoreCircle.textContent = score;
        scoreCircle.className = 'risk-circle-sm ' + getScoreColor(score);

        document.getElementById('detailDays').textContent = data.days;

        const riskLevelEl = document.getElementById('detailRiskLevel');
        const riskLabel = score > 70 ? 'Low' : score >= 50 ? 'Medium' : 'High';
        const riskClass = score > 70 ? 'risk-low' : score >= 50 ? 'risk-medium' : 'risk-high';
        riskLevelEl.innerHTML = `<span class="badge ${riskClass}">${riskLabel}</span>`;

        // AI Bars
        updateBar('barDebtor', 'barDebtorFill', parseInt(data.debtor));
        updateBar('barPayment', 'barPaymentFill', parseInt(data.payment));
        updateBar('barValidity', 'barValidityFill', parseInt(data.validity));
        updateBar('barIndustry', 'barIndustryFill', parseInt(data.industry));

        // Show content
        detailEmpty.style.display = 'none';
        detailContent.style.display = 'block';

        // Re-trigger animation
        detailContent.style.animation = 'none';
        detailContent.offsetHeight; // Force reflow
        detailContent.style.animation = '';

        // Store selected row ref
        detailPanel._selectedRow = row;
    }

    function updateBar(labelId, fillId, value) {
        const label = document.getElementById(labelId);
        const fill = document.getElementById(fillId);
        if (!label || !fill) return;

        label.textContent = value;
        const color = getScoreColor(value);
        label.className = 'mono detail-bar-val ' + color + '-text';
        fill.className = 'detail-bar-fill ' + color;

        // Animate
        fill.style.width = '0%';
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                fill.style.width = value + '%';
            });
        });
    }

    function getScoreColor(score) {
        if (score > 70) return 'green';
        if (score >= 50) return 'amber';
        return 'red';
    }

    /* ─── Close Detail Panel ─── */
    if (detailClose) {
        detailClose.addEventListener('click', () => {
            detailContent.style.display = 'none';
            detailEmpty.style.display = 'flex';
            financeTable.querySelectorAll('tbody tr').forEach(r => r.classList.remove('selected'));
        });
    }

    /* ─── Detail Panel Actions ─── */
    const detailApproveBtn = document.getElementById('detailApproveBtn');
    const detailRejectBtn = document.getElementById('detailRejectBtn');
    const detailCounterBtn = document.getElementById('detailCounterBtn');

    if (detailApproveBtn) {
        detailApproveBtn.addEventListener('click', () => {
            const row = detailPanel._selectedRow;
            if (row) {
                approveRow(row);
                showToast('Invoice approved! 🎉');
                closeDetail();
            }
        });
    }

    if (detailRejectBtn) {
        detailRejectBtn.addEventListener('click', () => {
            const row = detailPanel._selectedRow;
            if (row) {
                rejectRow(row);
                showToast('Invoice rejected.');
                closeDetail();
            }
        });
    }

    if (detailCounterBtn) {
        detailCounterBtn.addEventListener('click', () => {
            showToast('Counter offer dialog would open here.');
        });
    }

    function closeDetail() {
        detailContent.style.display = 'none';
        detailEmpty.style.display = 'flex';
        financeTable.querySelectorAll('tbody tr').forEach(r => r.classList.remove('selected'));
    }

    /* ─── Table Row Actions ─── */
    function handleAction(btn, row) {
        const action = btn.dataset.action;
        if (action === 'approve') {
            approveRow(row);
            showToast('Invoice approved! 🎉');
        } else if (action === 'reject') {
            rejectRow(row);
            showToast('Invoice rejected.');
        }
    }

    function approveRow(row) {
        row.classList.add('row-approved');
        row.classList.remove('selected');
        updateQueueCount();
    }

    function rejectRow(row) {
        row.classList.add('row-rejected');
        row.classList.remove('selected');
        updateQueueCount();
    }

    function updateQueueCount() {
        const rows = financeTable.querySelectorAll('tbody tr');
        const active = [...rows].filter(r =>
            !r.classList.contains('row-approved') &&
            !r.classList.contains('row-rejected') &&
            r.style.display !== 'none'
        ).length;
        const countEl = document.querySelector('.queue-count .mono');
        if (countEl) countEl.textContent = active;

        // Update stat card
        const queueStatValue = document.querySelector('.stat-card[data-accent="amber"] .stat-card-value');
        if (queueStatValue) queueStatValue.textContent = active;
    }

    /* ─── Search Filter ─── */
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.toLowerCase();
            const rows = financeTable.querySelectorAll('tbody tr');

            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(query) ? '' : 'none';
            });
        });
    }

    /* ─── Toast Notification ─── */
    function showToast(message) {
        const existing = document.querySelector('.finance-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'finance-toast';
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

    /* ─── Inject keyframes ─── */
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
    `;
    document.head.appendChild(styleSheet);

    /* ─── Stat Card Count-Up Animation ─── */
    function animateCountUp() {
        const values = document.querySelectorAll('.stat-card-value[data-count]');
        values.forEach(el => {
            const target = parseFloat(el.dataset.count);
            const text = el.textContent;
            const prefix = text.match(/^[^\d.]*/)?.[0] || '';
            const suffix = text.match(/[^\d.]*$/)?.[0] || '';
            const decimals = (target % 1 === 0) ? 0 : 1;
            let current = 0;
            const duration = 1200;
            const start = performance.now();

            function step(now) {
                const elapsed = now - start;
                const progress = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                current = target * eased;

                el.textContent = prefix + current.toFixed(decimals) + suffix;

                if (progress < 1) {
                    requestAnimationFrame(step);
                } else {
                    el.textContent = text; // Restore original text
                }
            }

            requestAnimationFrame(step);
        });
    }

    // Trigger on load
    setTimeout(animateCountUp, 300);

});
