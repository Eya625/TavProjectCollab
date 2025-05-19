#!/usr/bin/env python3
import fitz  # PyMuPDF
import requests
import tempfile
import os
import re
import sys
import json
from datetime import datetime
from PIL import Image
import pytesseract

API_KEY = "K82218161488957"
OCR_URL = "https://api.ocr.space/parse/image"

def ocr_space_image(image_path, retries=1):
    for attempt in range(retries + 1):
        try:
            with open(image_path, 'rb') as f:
                r = requests.post(
                    OCR_URL,
                    headers={"apikey": API_KEY},
                    files={'file': f},
                    data={"OCREngine": "2", "isTable": "true", "language": "fre"},
                    timeout=30
                )
            r.raise_for_status()
            return r.json().get("ParsedResults", [{}])[0].get("ParsedText", "")
        except:
            if attempt == retries:
                return pytesseract.image_to_string(Image.open(image_path), lang='fra')
    return ""

def extract_fields(text):
    def ex(rx, g=1):
        m = re.search(rx, text, re.IGNORECASE)
        return m.group(g).strip() if m else None

    # normalize month abbreviations
    text2 = (text.replace('JAN', 'JAN')
                 .replace('FEV', 'FEB')
                 .replace('AVR', 'APR')
                 .replace('JUIL', 'JUL'))

    # date PO
    raw_date = ex(r"COMMANDE[^:\n]*[:\s]+(\d{2}[-/][A-Z]{3}[-/]\d{2,4})")
    po_date = None
    if raw_date:
        for fmt in ("%d-%b-%y","%d-%b-%Y"):
            try:
                po_date = datetime.strptime(raw_date,fmt).strftime("%d-%b-%Y")
                break
            except:
                pass

    # date livraison
    raw_del = ex(r"Date\s+de\s+Livr(?:aison|alson)\s*[:\s]+(\d{2}[-/][A-Z]{3}[-/]\d{2,4})")
    delivery_date = None
    if raw_del:
        try:
            if len(raw_del.split('-')[-1])==2 and po_date:
                yy = datetime.strptime(po_date,"%d-%b-%Y").year
                raw_del = re.sub(r"(\d{2}-[A-Z]{3})-\d{2}", rf"\1-{str(yy)[-2:]}", raw_del)
            delivery_date = datetime.strptime(raw_del,"%d-%b-%y").strftime("%d-%b-%Y")
        except:
            pass

    fields = {
        "poNumber":         ex(r"BON\s+DE\s+COMMANDE\s*N[°:\s]*([0-9]+)"),
        "destinataire":     ex(r"DESTINAIRE\s*[:\-]*\s*([A-ZÉÈ][A-ZÉÈ\s\-]+)"),
        "supplierCode":     ex(r"FOURNISSEUR\s*[:\-]*\s*([0-9A-Z]+)"),
        "poDate":           po_date,
        "poInternalNumber": ex(r"\bM\s?([0-9]{5,})\b"),
        "demandeNumber":    ex(r"DEMANDE\s*[:\-]*\s*([0-9]+)"),
        "deliveryDate":     delivery_date
    }
    return fields

def process_pdf(pdf_path, retries=2):
    doc = fitz.open(pdf_path)
    # on va accumuler le texte de toutes les pages
    all_text = ""
    for p in range(len(doc)):
        pix = doc.load_page(p).get_pixmap(dpi=300)
        tmp = tempfile.mktemp(suffix=".png")
        pix.save(tmp)
        try:
            t = ocr_space_image(tmp, retries=retries)
            all_text += "\n" + t
        finally:
            os.remove(tmp)
    # on retourne toujours raw_text + champs
    return {"raw_text": all_text, **extract_fields(all_text)}

def parse_po(pdf_path: str) -> dict:
    try:
        return process_pdf(pdf_path)
    except:
        return {}

if __name__=="__main__":
    if len(sys.argv)<2:
        sys.stderr.write("Usage: python extractor_po.py <file.pdf>\n"); sys.exit(1)
    print(json.dumps(process_pdf(sys.argv[1]), ensure_ascii=False, indent=4))
