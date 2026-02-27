"""
InvoiceFlow AI Service — FastAPI Application
Risk scoring endpoint for B2B invoice factoring
Runs on http://localhost:8000
"""

from fastapi import FastAPI, HTTPException
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
    allow_origins=["http://localhost:5000", "http://localhost:5173"],
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


# ─── Run Server ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    print("🤖 Starting InvoiceFlow AI Service...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
