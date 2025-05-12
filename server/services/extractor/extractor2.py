import re
import unicodedata
import pytesseract
from pdf2image import convert_from_path
from PIL import Image, ImageFilter, ImageOps, ImageEnhance
import os
import json

# 1) Configuration de l’exécutable Tesseract
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.EXE"

# 2) Génération de variantes de prétraitement de l’image
def generate_variants(img: Image.Image):
    gray = ImageOps.grayscale(img)
    return [
        gray,
        ImageOps.autocontrast(gray),
        gray.filter(ImageFilter.UnsharpMask(radius=2, percent=150, threshold=3)),
        ImageOps.invert(gray),
        ImageEnhance.Contrast(gray).enhance(2.0),
        gray.point(lambda x: 0 if x < 128 else 255)
    ]

# 3) OCR multi‑variante et nettoyage du texte
def ocr_all_variants(pdf_path: str, poppler_path: str) -> str:
    page = convert_from_path(pdf_path, dpi=300, poppler_path=poppler_path)[0]
    texts = []
    for var in generate_variants(page):
        raw = pytesseract.image_to_string(var, lang='fra+eng')
        clean = ''.join(c for c in raw if unicodedata.category(c)[0] != 'C')
        clean = re.sub(r"[^\w\s:/\-,;().%€+&]", "", clean)
        clean = re.sub(r"\s{2,}", " ", clean)
        texts.append(clean.strip())
    return "\n---\n".join(texts)

# 4) Extraction de Référence, Date et Total TTC dans le dernier paragraphe
def parse_last_paragraph(brut_text: str):
    # On découpe en paragraphes
    paragraphs = brut_text.split('---')
    last_para = paragraphs[-1]

    # 1) Extraction de référence + date : on parcourt tous les paragraphes
    reference = date = None
    for para in paragraphs:
        p = re.sub(r"(Référence)(\w)", r"\1 \2", para, flags=re.IGNORECASE)
        p = re.sub(r"(Date)(\d)",      r"\1 \2", p,  flags=re.IGNORECASE)
        p = re.sub(r"(Numéro)(\w)",    r"\1 \2", p,  flags=re.IGNORECASE)

        # Tentative "REF  28/01/2025"
        m = re.search(
            r"\b([A-Z0-9\/-]{6,})[ \t]*[|:;,\-]*[ \t]*(\d{2}/\d{2}/\d{4})",
            p
        )
        if not m:
            # Forme inversée "28/01/2025  REF"
            m2 = re.search(
                r"(\d{2}/\d{2}/\d{4})[ \t]*[|:;,\-]*[ \t]*([A-Z0-9\/-]{6,})",
                p
            )
            if m2:
                reference, date = m2.group(2), m2.group(1)
        else:
            reference, date = m.group(1), m.group(2)

        # Valider la date
        if date:
            j = int(date.split('/')[0])
            if 1 <= j <= 31:
                break
            else:
                reference = date = None

    # 2) Extraction du Total TTC dans le dernier paragraphe
    # (on ne modifie pas last_para pour éviter tout décalage)
    para_no_acc = unicodedata.normalize('NFD', last_para)
    para_no_acc = ''.join(ch for ch in para_no_acc if unicodedata.category(ch) != 'Mn')

    primary = re.search(
        r"(?<!\d)(\d{1,3}(?:[ \.]\d{3})*(?:,\d+))(?=[^\d]*Arr[eé]t[eé]e)",
        para_no_acc
    )
    fallback = None
    if not primary:
        fallback = re.search(
            r"(?<!\d)(\d{1,3}(?:[ \.]\d{3})*(?:,\d+)?)(?=\s+\d+\s*;\s*Arr[eé]t[eé]e)",
            para_no_acc
        )
    m_ttc = primary or fallback
    total_ttc = m_ttc.group(1) if m_ttc else None

    # Si fallback et plusieurs morceaux, on garde les deux derniers
    if fallback and total_ttc:
        parts = total_ttc.split()
        if len(parts) > 2:
            total_ttc = " ".join(parts[-2:])

    return last_para, reference, date, total_ttc

# 5) Fonction principale exposée

def main(pdf_path: str, poppler_path: str = r"C:\Program Files\poppler-24.08.0\Library\bin") -> dict:
    brut = ocr_all_variants(pdf_path, poppler_path)
    last_para, ref, date, total = parse_last_paragraph(brut)
    return {
        "ref":           ref,
        "date":          date,
        "total_ttc":     total,
        "immatriculation": "",
        "vehicule":      "",
        "category":      "Tyre",
        "ocr_text":      brut
    }

if __name__ == "__main__":
    import sys
    if len(sys.argv) != 2:
        print("Usage: extractor2.py <file.pdf>", file=sys.stderr)
        sys.exit(1)
    result = main(sys.argv[1])
    print(json.dumps(result, ensure_ascii=False))