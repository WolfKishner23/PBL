/* ═══════════════════════════════════════════════════
   InvoiceFlow Admin Dashboard — Interactivity
   ═══════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

    /* ─── Elements ─── */
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const mobileSidebarBtn = document.getElementById('mobileSidebarBtn');
    const adminTabs = document.getElementById('adminTabs');
    const searchInput = document.getElementById('searchInput');

    const panels = {
        users: document.getElementById('tabUsers'),
        analytics: document.getElementById('tabAnalytics'),
        health: document.getElementById('tabHealth')
    };

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

    /* ─── Tab Switching ─── */
    if (adminTabs) {
        adminTabs.addEventListener('click', (e) => {
            const tab = e.target.closest('.admin-tab');
            if (!tab) return;

            adminTabs.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const target = tab.dataset.tab;
            Object.entries(panels).forEach(([key, panel]) => {
                if (panel) {
                    panel.style.display = key === target ? 'block' : 'none';
                    if (key === target) {
                        panel.style.animation = 'none';
                        panel.offsetHeight;
                        panel.style.animation = 'panelFade .3s cubic-bezier(.4,0,.2,1)';
                    }
                }
            });

            // Animate analytics bars when tab is shown
            if (target === 'analytics') {
                animateAnalyticsBars();
            }
        });
    }

    /* ─── Animate Analytics Bars ─── */
    function animateAnalyticsBars() {
        const fills = document.querySelectorAll('.analytics-bar-fill');
        fills.forEach(fill => {
            const target = fill.style.width;
            fill.style.width = '0%';
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    fill.style.width = target;
                });
            });
        });
    }

    /* ─── Search Users ─── */
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.toLowerCase();
            const rows = document.querySelectorAll('#adminTable tbody tr');
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(query) ? '' : 'none';
            });
        });
    }

    /* ─── Suspend / Restore Actions ─── */
    document.addEventListener('click', (e) => {
        const suspendBtn = e.target.closest('.btn-suspend');
        const restoreBtn = e.target.closest('.btn-restore');

        if (suspendBtn) {
            const row = suspendBtn.closest('tr');
            const statusBadge = row.querySelector('.status-active, .status-suspended');
            if (statusBadge) {
                statusBadge.className = 'badge status-suspended';
                statusBadge.textContent = 'Suspended';
            }
            suspendBtn.className = 'btn-restore';
            suspendBtn.textContent = 'Restore';
            suspendBtn.setAttribute('aria-label', 'Restore user');
            showToast('User suspended');
        }

        if (restoreBtn) {
            const row = restoreBtn.closest('tr');
            const statusBadge = row.querySelector('.status-active, .status-suspended');
            if (statusBadge) {
                statusBadge.className = 'badge status-active';
                statusBadge.textContent = 'Active';
            }
            restoreBtn.className = 'btn-suspend';
            restoreBtn.textContent = 'Suspend';
            restoreBtn.setAttribute('aria-label', 'Suspend user');
            showToast('User restored');
        }
    });

    /* ─── Toast ─── */
    function showToast(message) {
        const existing = document.querySelector('.admin-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'admin-toast';
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
        }, 2500);
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

});
