import os
import re
import json
import unicodedata
import pytesseract
from PyPDF2 import PdfReader
from pdf2image import convert_from_path
from PIL import Image
import ocrmypdf
from ocrmypdf.exceptions import MissingDependencyError
import numpy as np

# Conversion mots→valeurs pour le montant en lettres
CONVERSION = {
    "zéro":0, "un":1, "une":1, "deux":2, "trois":3, "quatre":4,
    "cinq":5, "six":6, "sept":7, "huit":8, "neuf":9, "dix":10,
    "onze":11, "douze":12, "treize":13, "quatorze":14, "quinze":15,
    "seize":16, "vingt":20, "trente":30, "quarante":40,
    "cinquante":50, "soixante":60, "soixante-dix":70,
    "quatre-vingt":80, "quatre-vingt-dix":90,
    "cent":100, "cents":100, "mille":1000
}

def beautify_text(text: str) -> str:
    text = text.replace("\xa0", " ")
    text = re.sub(r"[ ]{2,}", " ", text)
    text = re.sub(r"\n{2,}", "\n", text)
    text = re.sub(r"[^\S\r\n]+", " ", text)
    return text.strip()

def apply_fixes(text: str) -> str:
    corrections = {"cing ": "cinq ", "Cing ": "Cinq ", "Arrétée": "Arrêtée"}
    for bad, good in corrections.items():
        text = text.replace(bad, good)
    text = re.sub(r"([A-Za-z])([0-9])", r"\1 \2", text)
    text = re.sub(r"([0-9])([A-Za-z])", r"\1 \2", text)
    text = re.sub(r"([A-Za-z0-9])'([A-Za-z0-9])", r"\1\2", text)
    return text

def words_to_number(text: str) -> float:
    txt = re.sub(r"[^a-z0-9\s\-]", " ", text.lower()).replace("-", " ")
    total = temp = 0
    for token in txt.split():
        if token in CONVERSION:
            val = CONVERSION[token]
            if val == 100:
                temp = temp * 100 if temp else 100
            elif val == 1000:
                temp = temp * 1000 if temp else 1000
                total += temp
                temp = 0
            else:
                temp += val
        else:
            try:
                temp += int(token)
            except:
                pass
    return total + temp

def _strip_accents(s: str) -> str:
    nfkd = unicodedata.normalize('NFD', s)
    return ''.join(c for c in nfkd if unicodedata.category(c) != 'Mn')

def extract_total_ttc_block_and_value(clean_text: str, raw_text: str) -> tuple[str, float]:
    """
    Renvoie (bloc, valeur) où :
      - bloc contient la partie en toutes‑lettres (dinars + millia/millime)
      - valeur est le total converti mots→nombre (dinars + millimes/1000)
    On ignore la ligne numérique "Total …".
    """
    # 1) Normalisation des retours à la ligne et des espaces
    text = _strip_accents(clean_text)
    text = re.sub(r"[ \u00A0]+", " ", text)
    text = re.sub(r"\r\n?", "\n", text)

    # 2) On localise la section à extraire à partir de "Arrêtée" ou directement "somme de"
    m = re.search(
        r"(?:Arrêtée[\s\S]*?somme de|somme de)\s*[:\-]?\s*"
        r"(?P<lettres>[\s\S]+?Dinar(?:s)?(?:\s*,\s*[\s\S]+?Milli(?:me|a))?)",
        text,
        flags=re.IGNORECASE
    )
    if m:
        # bloc exact en toutes‑lettres
        bloc_lettres = "somme de: \"" + m.group("lettres").strip()
        # on extrait les parties Dinar et Millia(me)
        m_parts = re.match(
            # on ajoute \- pour inclure les mots avec tiret (ex. Dix‑huit)
            r".*?([A-Za-zÀ-ÿ\-\s]+?Dinar(?:s)?)(?:\s*,\s*([A-Za-zÀ-ÿ\-\s]+?Milli(?:me|a)))?",
            m.group("lettres"),
            flags=re.IGNORECASE
        )
        if m_parts:
            dinar_txt  = m_parts.group(1)
            millia_txt = m_parts.group(2) or ""
            total = words_to_number(dinar_txt)
            if millia_txt:
                total += words_to_number(millia_txt) / 1000.0
            return bloc_lettres, round(total, 3)

    # 3) Fallback simple — si jamais on ne trouve pas "Arrêtée…somme de"
    m2 = re.search(
        r"somme\s+de\s*[:\-]?\s*([\s\S]+?)\s+dinars?",
        text,
        flags=re.IGNORECASE
    )
    if m2:
        bloc = m2.group(0).strip()
        return bloc, round(words_to_number(m2.group(1)), 3)

    return "", 0.0


def preprocess_image(img: Image.Image) -> Image.Image:
    gray = img.convert("L")
    return gray

def ocr_extract_numero(pdf_path: str) -> str:
    images = convert_from_path(pdf_path, dpi=400, first_page=1, last_page=1)
    img = images[0]
    crop = img.crop((30, 320, 800, 480))
    processed = preprocess_image(crop)
    cfg = "--oem 1 --psm 6 -c tessedit_char_whitelist=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    txt = pytesseract.image_to_string(processed, lang='fra', config=cfg).strip()
    txt = re.sub(r"[^A-Z0-9]", "", txt.upper())  # suppression des caractères inutiles
    m = re.search(r"(\d{2})([A-Z]{1,3})(\d{3,6})", txt)
    if m:
        return f"{m.group(1)} {m.group(2)} {m.group(3).zfill(6)}"
    return txt

def extract_number_and_date(pdf_path: str, clean_text: str) -> tuple[str, str]:
    # On autorise des espaces à l’intérieur du groupe de digits
    m = re.search(
        r"Numéro\s+Date\s+Référence\s*\n\s*"
        r"(?P<prefix>\d{2})\s*"
        r"(?P<code>[A-Za-z]{1,3})\s*"
        r"(?P<digits>(?:\d[\s]*){3,6})\s+"
        r"(?P<date>\d{1,2}/\d{1,2}/\d{4})",
        clean_text,
        flags=re.IGNORECASE
    )
    if m:
        prefix = m.group("prefix")
        code   = m.group("code").upper()
        # on retire les espaces à l’intérieur des digits avant zfill
        digits_raw = re.sub(r"\s+", "", m.group("digits"))
        digits = digits_raw.zfill(6)
        if code == "F":
            code = "FV"
        numero = f"{prefix}{code}{digits}"
        date   = m.group("date")
        return numero, date
def ensure_ocr(input_pdf: str, output_pdf: str) -> str:
    try:
        ocrmypdf.ocr(input_pdf, output_pdf, language='fra', deskew=True, clean=True, skip_text=True)
    except MissingDependencyError:
        ocrmypdf.ocr(input_pdf, output_pdf, language='fra', skip_text=True)
    return output_pdf

def extract_page1_text(pdf_path: str) -> tuple[str, str]:
    reader = PdfReader(pdf_path)
    raw = reader.pages[0].extract_text() or ""
    raw = apply_fixes(raw)
    clean = beautify_text(raw)
    return raw, clean

if __name__ == "__main__":
    import sys
    if len(sys.argv) != 2:
        print("Usage: python extractor2_improved.py <fichier.pdf>")
        sys.exit(1)

    input_pdf = sys.argv[1]
    base, _ = os.path.splitext(input_pdf)
    ocr_pdf = ensure_ocr(input_pdf, base + "_ocr.pdf")

    raw_text, clean_text = extract_page1_text(ocr_pdf)
    numero, date = extract_number_and_date(ocr_pdf, clean_text)
    bloc_ttc, total_ttc = extract_total_ttc_block_and_value(clean_text, raw_text)

    result = {
        "page_number": 1,
        "numero":      numero,
        "date":        date,
        "total_ttc":   total_ttc,
        "ttc_block":   bloc_ttc,
        "raw_text":    raw_text,
        "clean_text":  clean_text
    }

    print(json.dumps(result, ensure_ascii=False, indent=2))
