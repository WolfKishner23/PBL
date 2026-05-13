/**
 * pdfExtractor.js
 * 
 * Extracts text from a PDF file and parses structured invoice fields.
 * This is a direct Node.js port of the Python logic in ai-service/main.py:
 *   - _extract_text_from_file()  → extractTextFromPDF()
 *   - _parse_invoice_fields()    → parseInvoiceFields()
 * 
 * Eliminates the need to send the PDF file over the network to the AI service,
 * fixing HTTP 429 rate-limit errors on Render's free tier.
 */

const fs = require('fs');
const path = require('path');

// ─── PDF Text Extraction ──────────────────────────────────────────────────────

/**
 * Extracts raw text from a PDF file using pdf-parse.
 * For image-based / scanned PDFs, returns an empty string gracefully.
 *
 * @param {string} filePath - Absolute path to the PDF file on disk
 * @returns {Promise<string>} - Extracted text content
 */
async function extractTextFromPDF(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    let text = '';

    if (ext !== '.pdf') {
        console.log(`[Extractor] Unsupported file type: ${ext}. Only PDF is supported.`);
        return text;
    }

    console.log(`[Extractor] Reading PDF: ${filePath}`);

    try {
        // Dynamically require pdf-parse to avoid issues if not installed
        const pdfParse = require('pdf-parse');
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        text = data.text || '';
        console.log(`[Extractor] pdf-parse extracted ${text.length} characters`);
    } catch (err) {
        console.error(`[Extractor] pdf-parse failed: ${err.message}`);
        // Return empty string — caller will handle gracefully
    }

    return text;
}


// ─── Date Parsing Helper ──────────────────────────────────────────────────────

/**
 * Converts various date string formats to ISO yyyy-mm-dd.
 * Mirrors parse_date_to_iso() in ai-service/main.py.
 *
 * @param {string} dateStr
 * @returns {string} ISO date string or original string if unparseable
 */
function parseDateToISO(dateStr) {
    if (!dateStr) return dateStr;

    const str = dateStr.trim();

    // Already ISO format
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

    // Map of month names to numbers
    const months = {
        jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
        jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
        january: '01', february: '02', march: '03', april: '04', june: '06',
        july: '07', august: '08', september: '09', october: '10',
        november: '11', december: '12'
    };

    // dd/mm/yyyy or dd-mm-yyyy or dd/mm/yy
    let m = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (m) {
        let [, d, mo, y] = m;
        if (y.length === 2) y = '20' + y;
        return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }

    // dd MMM yyyy  or  dd-MMM-yyyy  or  dd MMM yy
    m = str.match(/^(\d{1,2})[\s\-]([A-Za-z]{3,9})[\s\-](\d{2,4})$/);
    if (m) {
        let [, d, mon, y] = m;
        const mo = months[mon.toLowerCase()];
        if (mo) {
            if (y.length === 2) y = '20' + y;
            return `${y}-${mo}-${d.padStart(2, '0')}`;
        }
    }

    // MMM dd, yyyy  or  Month dd, yyyy
    m = str.match(/^([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{4})$/);
    if (m) {
        let [, mon, d, y] = m;
        const mo = months[mon.toLowerCase()];
        if (mo) {
            return `${y}-${mo}-${d.padStart(2, '0')}`;
        }
    }

    // Return original if we can't parse
    return str;
}


// ─── Invoice Field Parser ─────────────────────────────────────────────────────

/**
 * Parses structured invoice fields from raw extracted text using regex.
 * Direct JavaScript port of _parse_invoice_fields() in ai-service/main.py.
 *
 * @param {string} text - Raw text extracted from the PDF
 * @returns {Object} - Structured invoice fields
 */
function parseInvoiceFields(text) {
    const result = {
        amount: null,
        debtorCompany: null,
        debtorGST: null,
        dueDate: null,
        invoiceDate: null,
        paymentTerms: null,
        industry: null,
        description: null,
        invoiceNumber: null,
    };

    if (!text || !text.trim()) {
        console.log('[Extractor] Empty text — returning empty fields');
        return result;
    }

    // ── Invoice Number ────────────────────────────────────────────────────────
    const invMatch = text.match(/(?:Invoice\s*(?:No|Number|#|Num)[:\s#]*)\s*([A-Z0-9\-\/]+)/i);
    if (invMatch) {
        result.invoiceNumber = invMatch[1].trim();
    }

    // ── Amount / Grand Total ──────────────────────────────────────────────────
    // Try patterns from most-specific to least-specific (mirrors Python version)
    const amtPatterns = [
        /(?:Grand\s*Total|Total\s*Amount|Net\s*Payable)[:\s]*(?:INR|₹|Rs\.?|Rs)\s*([\d,]+(?:\.\d+)?)/i,
        /(?:Grand\s*Total|Total\s*Amount|Net\s*Payable)[:\s]*([\d,]+(?:\.\d+)?)/i,
        /(?:Total)[:\s]*(?:INR|₹|Rs\.?)\s*([\d,]+(?:\.\d+)?)/i,
        /(?:Amount)[:\s]*(?:INR|₹|Rs\.?)\s*([\d,]+(?:\.\d+)?)/i,
        /(?:INR|₹)\s*([\d,]+(?:\.\d+)?)/i,
    ];

    for (const pat of amtPatterns) {
        const m = text.match(pat);
        if (m) {
            const val = parseFloat(m[1].replace(/,/g, ''));
            if (!isNaN(val) && val > 0) {
                result.amount = val;
                break;
            }
        }
    }

    // ── GST Numbers (Indian GSTIN — 15 chars) ────────────────────────────────
    const allGST = [...text.matchAll(/\b(\d{2}[A-Z]{5}\d{4}[A-Z][A-Z0-9]Z[A-Z0-9])\b/g)]
        .map(m => m[1]);

    if (allGST.length > 0) {
        // Try to find GST after "Bill To" section (debtor's GST)
        const billToMatch = text.search(/BILL\s*TO|Bill\s*To|Billed?\s*To|CLIENT|CUSTOMER/i);

        if (billToMatch >= 0) {
            const afterBillTo = text.slice(billToMatch);
            const gstInBillTo = afterBillTo.match(/\b(\d{2}[A-Z]{5}\d{4}[A-Z][A-Z0-9]Z[A-Z0-9])\b/);
            if (gstInBillTo) {
                result.debtorGST = gstInBillTo[1];
            } else if (allGST.length > 1) {
                result.debtorGST = allGST[1]; // Second GST is likely the debtor's
            } else {
                result.debtorGST = allGST[0];
            }
        } else {
            // No Bill To section — use last GST (likely debtor's)
            result.debtorGST = allGST.length > 1 ? allGST[allGST.length - 1] : allGST[0];
        }
    }

    // ── Bill To / Debtor Company ──────────────────────────────────────────────
    const billMatch = text.match(
        /(?:Bill\s*To|Billed?\s*To|Client|Customer|Buyer)[:\s]*\n?\s*(.+?)(?:\n|,|$)/i
    );
    if (billMatch) {
        let company = billMatch[1].trim().replace(/^[:\s]+/, '');
        if (company.length > 2 && !/^\d/.test(company)) {
            result.debtorCompany = company;
        }
    }

    // ── Dates ─────────────────────────────────────────────────────────────────
    const dateOnlyPattern =
        /(\d{1,2}[-\/]\d{1,2}[-\/]\d{4}|\d{1,2}[\s\-\/][A-Za-z]{3,9}[\s\-\/]\d{2,4}|[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4}|\d{4}-\d{2}-\d{2})/;

    const lines = text.split('\n');

    // Due Date — scan line by line
    for (const line of lines) {
        if (/due\s*date|payment\s*due|due\s*on|payable\s*by/i.test(line)) {
            const dm = line.match(dateOnlyPattern);
            if (dm) {
                result.dueDate = parseDateToISO(dm[1]);
                break;
            }
        }
    }

    // Fallback for due date using multiline regex
    if (!result.dueDate) {
        const dueMatch = text.match(
            /(?:Due\s*Date|Payment\s*Due)[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{4}|\d{1,2}[\s\-\/][A-Za-z]{3,9}[\s\-\/]\d{2,4}|[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4}|\d{4}-\d{2}-\d{2})/i
        );
        if (dueMatch) result.dueDate = parseDateToISO(dueMatch[1]);
    }

    // Invoice Date — only lines without "due" keyword
    for (const line of lines) {
        if (/invoice\s*date|date\s*of\s*issue/i.test(line) && !/due/i.test(line)) {
            const im = line.match(dateOnlyPattern);
            if (im) {
                result.invoiceDate = parseDateToISO(im[1]);
                break;
            }
        }
    }

    // ── Payment Terms ─────────────────────────────────────────────────────────
    const termsMatch = text.match(
        /(?:Payment\s*(?:Terms?|Conditions?)|Terms)[:\s]*(Net\s*\d+|\d+\s*days?)/i
    );
    if (termsMatch) {
        result.paymentTerms = termsMatch[1].trim();
    }

    // ── Industry Detection ────────────────────────────────────────────────────
    // Mirrors the industry_keywords dict in ai-service/main.py
    const textLower = text.toLowerCase();
    const industryKeywords = {
        manufacturing: ['steel', 'iron', 'metal', 'factory', 'plant', 'assembly', 'fabricat', 'machine'],
        it: ['software', 'cloud', 'api', 'app development', 'saas', 'digital', 'cyber', 'tech'],
        healthcare: ['hospital', 'medical', 'clinic', 'health', 'patient', 'surgical'],
        pharma: ['pharma', 'drug', 'medicine', 'tablet', 'capsule', 'amoxicillin'],
        construction: ['cement', 'construction', 'building', 'concrete', 'brick'],
        agriculture: ['organic', 'farm', 'crop', 'rice', 'wheat', 'seed', 'fertilizer'],
        retail: ['retail', 'store', 'shopping', 'consumer'],
        export: ['export', 'import', 'customs', 'shipping', 'freight'],
        automobile: ['auto', 'car', 'vehicle', 'brake', 'engine', 'clutch', 'motor'],
    };

    for (const [industry, keywords] of Object.entries(industryKeywords)) {
        if (keywords.some(kw => textLower.includes(kw))) {
            result.industry = industry;
            break;
        }
    }

    console.log(`[Extractor] Parsed fields — amount: ${result.amount}, company: ${result.debtorCompany}, GST: ${result.debtorGST}, dueDate: ${result.dueDate}`);
    return result;
}


// ─── Main Export ──────────────────────────────────────────────────────────────

module.exports = {
    extractTextFromPDF,
    parseInvoiceFields,
};
