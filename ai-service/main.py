"""
InvoiceFlow AI Service — FastAPI Application
Risk scoring + Invoice OCR extraction for B2B invoice factoring
Runs on http://localhost:8000
"""

import re
import os
import shutil
import tempfile
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from model import predict_risk

# ─── FastAPI App ──────────────────────────────────────────────────────────────
app = FastAPI(
    title="InvoiceFlow AI Service",
    description="AI-powered risk scoring for B2B invoice factoring",
    version="1.0.0"
)

# ─── CORS Setup (allow Node.js backend) ──────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Pydantic Models ─────────────────────────────────────────────────────────
class InvoiceData(BaseModel):
    invoice_id: Optional[int] = None
    amount: float
    debtor_company: str
    gst_number: Optional[str] = None
    industry: Optional[str] = None
    due_date: str
    previous_invoices: Optional[int] = 0

    class Config:
        # Allow camelCase fields from Node.js backend
        populate_by_name = True


class InvoiceDataAlt(BaseModel):
    """Alternative schema matching Node.js backend format"""
    invoiceNumber: Optional[str] = None
    amount: float
    debtorCompany: str
    debtorGST: Optional[str] = None
    invoiceDate: Optional[str] = None
    dueDate: str
    paymentTerms: Optional[str] = None


# ─── Health Check ─────────────────────────────────────────────────────────────
@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "message": "AI Service running"
    }


# ─── Risk Scoring Endpoint ───────────────────────────────────────────────────
@app.post("/score")
async def score_invoice(data: dict):
    """
    Score an invoice for risk.
    Accepts both direct InvoiceData and nested invoiceData format from Node.js backend.
    """
    try:
        # Handle nested format from Node.js: { invoiceData: { ... } }
        invoice_data = data.get('invoiceData', data)

        result = predict_risk(invoice_data)

        return {
            "success": True,
            **result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Risk scoring failed: {str(e)}")


# ─── Detailed Risk Analysis ──────────────────────────────────────────────────
@app.post("/api/risk-assessment")
async def risk_assessment(data: dict):
    """
    Full risk assessment endpoint (alternative route for Node.js backend).
    """
    try:
        result = predict_risk(data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Risk assessment failed: {str(e)}")


# ─── Invoice Data Extraction (OCR) ───────────────────────────────────────────
def _extract_text_from_file(file_path: str) -> str:
    """Extract text from PDF or image file."""
    ext = os.path.splitext(file_path)[1].lower()
    text = ""

    # Try PDF text extraction
    if ext == '.pdf':
        try:
            import fitz  # PyMuPDF
            doc = fitz.open(file_path)
            for page in doc:
                text += page.get_text()
            doc.close()
        except ImportError:
            try:
                from PyPDF2 import PdfReader
                reader = PdfReader(file_path)
                for page in reader.pages:
                    text += page.extract_text() or ""
            except ImportError:
                pass

    # Try image OCR
    if not text.strip() and ext in ('.png', '.jpg', '.jpeg', '.pdf'):
        try:
            from PIL import Image
            import pytesseract
            if ext == '.pdf':
                try:
                    from pdf2image import convert_from_path
                    images = convert_from_path(file_path, first_page=1, last_page=1)
                    if images:
                        text = pytesseract.image_to_string(images[0])
                except ImportError:
                    pass
            else:
                img = Image.open(file_path)
                text = pytesseract.image_to_string(img)
        except ImportError:
            pass

    return text


def _parse_invoice_fields(text: str) -> dict:
    """Parse structured invoice fields from raw text using regex."""
    result = {
        "amount": None,
        "debtorCompany": None,
        "debtorGST": None,
        "dueDate": None,
        "invoiceDate": None,
        "paymentTerms": None,
        "industry": None,
        "description": None,
        "invoiceNumber": None,
    }

    if not text:
        return result

    # ── Invoice Number ─────────────────────────────────────────
    inv_match = re.search(r'(?:Invoice\s*(?:No|Number|#|Num)[:\s#]*)\s*([A-Z0-9\-/]+)', text, re.IGNORECASE)
    if inv_match:
        result["invoiceNumber"] = inv_match.group(1).strip()

    # ── Amount / Grand Total ───────────────────────────────────
    # Try Grand Total first, then Total, then Amount
    # Handles ₹, Rs., Rs, INR, and bare numbers
    amt_patterns = [
        r'(?:Grand\s*Total|Total\s*Amount|Net\s*Payable)[:\s]*(?:INR|₹|Rs\.?|Rs)\s*([\d,]+(?:\.\d+)?)',
        r'(?:Grand\s*Total|Total\s*Amount|Net\s*Payable)[:\s]*([\d,]+(?:\.\d+)?)',
        r'(?:Total)[:\s]*(?:INR|₹|Rs\.?)\s*([\d,]+(?:\.\d+)?)',
        r'(?:Amount)[:\s]*(?:INR|₹|Rs\.?)\s*([\d,]+(?:\.\d+)?)',
        r'(?:INR|₹)\s*([\d,]+(?:\.\d+)?)',
    ]
    for pat in amt_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            amt_str = m.group(1).replace(',', '')
            try:
                val = float(amt_str)
                if val > 0:
                    result["amount"] = val
                    break
            except ValueError:
                pass

    # ── GST Numbers (15-char Indian GSTIN) ─────────────────────
    # Find ALL GST numbers in the text
    all_gst = re.findall(r'\b(\d{2}[A-Z]{5}\d{4}[A-Z][A-Z0-9]Z[A-Z0-9])\b', text)

    # Try to find the Bill To section's GST (debtor's GST)
    bill_to_pos = -1
    for pattern in [r'BILL\s*TO', r'Bill\s*To', r'Billed?\s*To', r'CLIENT', r'CUSTOMER']:
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            bill_to_pos = m.start()
            break

    if all_gst and bill_to_pos >= 0:
        # Find the GST that appears after "Bill To" section
        for gst in all_gst:
            gst_pos = text.find(gst)
            if gst_pos > bill_to_pos:
                result["debtorGST"] = gst
                break
        if not result["debtorGST"] and len(all_gst) > 1:
            result["debtorGST"] = all_gst[1]  # Second GST is likely the debtor's
        elif not result["debtorGST"]:
            result["debtorGST"] = all_gst[0]
    elif all_gst:
        # If only one GST or no Bill To section, use last one (likely debtor)
        result["debtorGST"] = all_gst[-1] if len(all_gst) > 1 else all_gst[0]

    # ── Bill To / Debtor Company ───────────────────────────────
    bill_match = re.search(r'(?:Bill\s*To|Billed?\s*To|Client|Customer|Buyer)[:\s]*\n?\s*(.+?)(?:\n|,|$)', text, re.IGNORECASE)
    if bill_match:
        company = bill_match.group(1).strip()
        company = re.sub(r'^[:\s]+', '', company)
        if len(company) > 2 and not company[0].isdigit():
            result["debtorCompany"] = company

    # ── Dates ──────────────────────────────────────────────────
    date_pattern = r'(\d{1,2}[-/]\d{1,2}[-/]\d{4}|\d{1,2}[\s/-]\w{3,9}[\s/-]\d{2,4}|\w{3,9}\s+\d{1,2},?\s+\d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}/\d{1,2}/\d{2,4})'

    def parse_date_to_iso(date_str):
        """Convert a date string to yyyy-mm-dd format."""
        from datetime import datetime as dt
        formats = [
            '%d %b %Y', '%d %B %Y', '%d-%b-%Y', '%d-%B-%Y',
            '%d/%m/%Y', '%d/%m/%y', '%Y-%m-%d',
            '%d %b %y', '%d-%m-%Y', '%d-%m-%y',
            '%B %d, %Y', '%b %d, %Y', '%B %d %Y', '%b %d %Y',
        ]
        for fmt in formats:
            try:
                parsed = dt.strptime(date_str.strip(), fmt)
                return parsed.strftime('%Y-%m-%d')
            except ValueError:
                continue
        return date_str  # Return original if can't parse

    # Due Date — scan line by line for a line containing 'due' keyword, then extract date from it
    date_only_pattern = r'(\d{1,2}[-/]\d{1,2}[-/]\d{4}|\d{1,2}[\s/-]\w{3,9}[\s/-]\d{2,4}|\w{3,9}\s+\d{1,2},?\s+\d{4}|\d{4}-\d{2}-\d{2})'
    for line in text.splitlines():
        if re.search(r'due\s*date|payment\s*due|due\s*on|payable\s*by', line, re.IGNORECASE):
            dm = re.search(date_only_pattern, line, re.IGNORECASE)
            if dm:
                result["dueDate"] = parse_date_to_iso(dm.group(1))
                break
    # fallback to original regex if line scan failed
    if not result["dueDate"]:
        due_match = re.search(r'(?:Due\s*Date|Payment\s*Due)[:\s]*' + date_pattern, text, re.IGNORECASE | re.DOTALL)
        if due_match:
            result["dueDate"] = parse_date_to_iso(due_match.group(1))

    # Invoice Date — only match lines that don't already have 'due' in them
    for line in text.splitlines():
        if re.search(r'invoice\s*date|date\s*of\s*issue', line, re.IGNORECASE) and not re.search(r'due', line, re.IGNORECASE):
            im = re.search(date_only_pattern, line, re.IGNORECASE)
            if im:
                result["invoiceDate"] = parse_date_to_iso(im.group(1))
                break

    # ── Payment Terms ──────────────────────────────────────────
    terms_match = re.search(r'(?:Payment\s*(?:Terms?|Conditions?)|Terms)[:\s]*(Net\s*\d+|\d+\s*days?)', text, re.IGNORECASE)
    if terms_match:
        result["paymentTerms"] = terms_match.group(1).strip()

    # ── Industry Detection ─────────────────────────────────────
    text_lower = text.lower()
    industry_keywords = {
        'manufacturing': ['steel', 'iron', 'metal', 'factory', 'plant', 'assembly', 'fabricat', 'machine'],
        'it': ['software', 'cloud', 'api', 'app development', 'saas', 'digital', 'cyber', 'tech'],
        'healthcare': ['hospital', 'medical', 'clinic', 'health', 'patient', 'surgical'],
        'pharma': ['pharma', 'drug', 'medicine', 'tablet', 'capsule', 'amoxicillin'],
        'construction': ['cement', 'construction', 'building', 'concrete', 'brick'],
        'agriculture': ['organic', 'farm', 'crop', 'rice', 'wheat', 'seed', 'fertilizer'],
        'retail': ['retail', 'store', 'shopping', 'consumer'],
        'export': ['export', 'import', 'customs', 'shipping', 'freight'],
        'automobile': ['auto', 'car', 'vehicle', 'brake', 'engine', 'clutch', 'motor'],
    }
    for ind, keywords in industry_keywords.items():
        if any(kw in text_lower for kw in keywords):
            result["industry"] = ind
            break

    return result


@app.post("/api/extract-invoice")
async def extract_invoice(file: UploadFile = File(...)):
    """
    Extract invoice data from uploaded PDF/image using OCR + regex parsing.
    Returns structured invoice fields for auto-filling the form.
    """
    try:
        # Save uploaded file temporarily
        suffix = os.path.splitext(file.filename or "upload.pdf")[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name

        # Extract text
        raw_text = _extract_text_from_file(tmp_path)

        # Clean up temp file
        try:
            os.unlink(tmp_path)
        except OSError:
            pass

        # Parse fields from text
        extracted = _parse_invoice_fields(raw_text)

        return {
            "success": True,
            "rawText": raw_text[:500] if raw_text else "",
            "extracted": extracted,
            "confidence": 0.85 if raw_text.strip() else 0.0,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")


# ─── Run Server ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    print("[AI] Starting InvoiceFlow AI Service...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
