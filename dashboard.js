/* ═══════════════════════════════════════════════════
   InvoiceFlow Dashboard — Interactions
   Bar chart (pure canvas), filter tabs, sidebar toggle
   ═══════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    /* ─── Sidebar toggle (mobile) ─── */
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const sidebarBtn = document.getElementById('mobileSidebarBtn');

    const openSidebar = () => {
        sidebar.classList.add('open');
        overlay.classList.add('show');
    };
    const closeSidebar = () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('show');
    };

    sidebarBtn?.addEventListener('click', openSidebar);
    overlay?.addEventListener('click', closeSidebar);

    /* ─── Sidebar nav active state ─── */
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            closeSidebar();
        });
    });

    /* ─── Table filter tabs ─── */
    const tabs = document.querySelectorAll('#tableTabs .tab');
    const rows = document.querySelectorAll('#invoiceTable tbody tr');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const filter = tab.dataset.filter;
            rows.forEach(row => {
                if (filter === 'all' || row.dataset.status === filter) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    });

    /* ─── Search filter ─── */
    const searchInput = document.getElementById('searchInput');
    searchInput?.addEventListener('input', () => {
        const q = searchInput.value.toLowerCase();
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(q) ? '' : 'none';
        });
        // reset tab selection to All
        tabs.forEach(t => t.classList.remove('active'));
        tabs[0]?.classList.add('active');
    });

    /* ─── Stat card entrance animation ─── */
    const cards = document.querySelectorAll('.stat-card');
    cards.forEach((card, i) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = 'opacity .5s cubic-bezier(.4,0,.2,1), transform .5s cubic-bezier(.4,0,.2,1)';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 100 + i * 80);
    });

    /* ═══════════════════ CASH FLOW CHART (pure canvas) ═══════════════════ */
    const canvas = document.getElementById('cashFlowChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', () => { resize(); drawChart(1); });

    const months = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];
    const inflow = [3.2, 4.1, 3.8, 5.5, 4.9, 6.3];
    const outflow = [2.8, 3.0, 3.5, 3.2, 3.8, 4.1];
    const maxVal = 8;

    /* Colors */
    const BLUE = '#3B82F6';
    const GREY = '#475569';
    const GRID = 'rgba(255,255,255,.04)';
    const LABEL = '#64748B';

    function drawChart(progress) {
        const W = canvas.width / dpr;
        const H = canvas.height / dpr;
        ctx.clearRect(0, 0, W, H);

        const padL = 44, padR = 16, padT = 12, padB = 36;
        const chartW = W - padL - padR;
        const chartH = H - padT - padB;

        /* Grid lines + Y labels */
        const steps = 4;
        ctx.font = '11px JetBrains Mono, monospace';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        for (let i = 0; i <= steps; i++) {
            const val = (maxVal / steps) * i;
            const y = padT + chartH - (chartH * (val / maxVal));
            ctx.strokeStyle = GRID;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(padL, y);
            ctx.lineTo(W - padR, y);
            ctx.stroke();
            ctx.fillStyle = LABEL;
            ctx.fillText(val === 0 ? '₹0' : '₹' + val.toFixed(0) + 'L', padL - 8, y);
        }

        /* Bars */
        const groupW = chartW / months.length;
        const barW = Math.min(groupW * 0.28, 28);
        const gap = Math.min(barW * 0.2, 5);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        months.forEach((m, i) => {
            const x = padL + i * groupW + groupW / 2;

            /* Inflow bar */
            const ih = (inflow[i] / maxVal) * chartH * progress;
            const ix = x - barW - gap / 2;
            const iy = padT + chartH - ih;
            roundedRect(ctx, ix, iy, barW, ih, 4);
            ctx.fillStyle = BLUE;
            ctx.fill();

            /* Outflow bar */
            const oh = (outflow[i] / maxVal) * chartH * progress;
            const ox = x + gap / 2;
            const oy = padT + chartH - oh;
            roundedRect(ctx, ox, oy, barW, oh, 4);
            ctx.fillStyle = GREY;
            ctx.fill();

            /* Month label */
            ctx.fillStyle = LABEL;
            ctx.font = '11px Sora, sans-serif';
            ctx.fillText(m, x, padT + chartH + 12);
        });
    }

    function roundedRect(ctx, x, y, w, h, r) {
        if (h < 1) h = 1;
        r = Math.min(r, h / 2, w / 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(x, y + h);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    /* Animate chart on load */
    let animStart = null;
    const animDuration = 900;
    function animate(ts) {
        if (!animStart) animStart = ts;
        const elapsed = ts - animStart;
        let t = Math.min(elapsed / animDuration, 1);
        t = 1 - Math.pow(1 - t, 3); // ease-out cubic
        drawChart(t);
        if (t < 1) requestAnimationFrame(animate);
    }

    /* Use IntersectionObserver so chart animates when scrolled into view */
    const chartObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                requestAnimationFrame(animate);
                chartObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });
    chartObserver.observe(canvas);

    /* ─── Chart tooltip on hover ─── */
    const tooltip = document.createElement('div');
    tooltip.style.cssText = `
    position:fixed;pointer-events:none;z-index:999;
    background:#1E293B;border:1px solid rgba(59,130,246,.2);
    border-radius:8px;padding:8px 12px;font-size:12px;
    color:#E2E8F0;font-family:'Sora',sans-serif;
    box-shadow:0 8px 24px rgba(0,0,0,.4);opacity:0;transition:opacity .15s;
  `;
    document.body.appendChild(tooltip);

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const W = rect.width;
        const padL = 44, padR = 16;
        const chartW = W - padL - padR;
        const groupW = chartW / months.length;

        const idx = Math.floor((mx - padL) / groupW);
        if (idx >= 0 && idx < months.length) {
            tooltip.innerHTML = `<strong>${months[idx]}</strong><br>
        <span style="color:#3B82F6">Inflow:</span> ₹${inflow[idx]}L<br>
        <span style="color:#94A3B8">Outflow:</span> ₹${outflow[idx]}L`;
            tooltip.style.opacity = '1';
            tooltip.style.left = (e.clientX + 14) + 'px';
            tooltip.style.top = (e.clientY - 10) + 'px';
        } else {
            tooltip.style.opacity = '0';
        }
    });
    canvas.addEventListener('mouseleave', () => {
        tooltip.style.opacity = '0';
    });
});
