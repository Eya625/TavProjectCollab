import re
import json
import unicodedata
import pytesseract
import yaml
from pathlib import Path
from pdf2image import convert_from_path
from PIL import Image, ImageFilter, ImageOps
from jinja2 import Template

# — poppler & tesseract
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
POPPLER_PATH = r"C:\Program Files\poppler-24.08.0\Library\bin"

# — table de conversion lettres→nombre
CONVERSION = {
    "zéro": 0, "un": 1, "une": 1, "deux": 2, "trois": 3, "quatre": 4,
    "cinq": 5, "six": 6, "sept": 7, "huit": 8, "neuf": 9, "dix": 10,
    "onze": 11, "douze": 12, "treize": 13, "quatorze": 14, "quinze": 15,
    "seize": 16, "vingt": 20, "trente": 30, "quarante": 40,
    "cinquante": 50, "soixante": 60, "soixante-dix": 70,
    "quatre-vingt": 80, "quatre-vingt-dix": 90,
    "cent": 100, "cents": 100, "mille": 1000
}

# — corrections ciblées des erreurs OCR dans les montants en lettres
OCR_FIXES = {
    r"\biuit\b": "huit",
    r"\btuntstens\b": "tunisiens",
    # ajoutez d'autres patterns au besoin
}

def apply_ocr_fixes(txt: str) -> str:
    low = txt.lower()
    for pat, rep in OCR_FIXES.items():
        low = re.sub(pat, rep, low, flags=re.IGNORECASE)
    return low

def lettres_vers_nombre(txt: str) -> float:
    # 0) On gère d'abord les nombres « composés » avec tirets
    #     pour qu'ils soient pris comme des unités uniques.
    for mot_hyph in sorted(CONVERSION.keys(), key=lambda w: -len(w)):
        if '-' in mot_hyph:
            pattern = re.compile(re.escape(mot_hyph), flags=re.IGNORECASE)
            txt = pattern.sub(str(CONVERSION[mot_hyph]), txt)

    txt = txt.lower().replace('-', ' ').replace(',', ' ')
    txt = re.sub(r"\bet\b", " ", txt)
    txt = re.sub(r"[^a-z0-9\s]", " ", txt)
    txt = re.sub(r"\bdinars?\b|\bmillimes?\b", " ", txt)
    total = temp = 0
    for mot in txt.split():
        if mot not in CONVERSION and len(mot) > 1 and mot[1:] in CONVERSION:
            mot = mot[1:]
        if mot in CONVERSION:
            v = CONVERSION[mot]
            if v == 100:
                temp = temp * 100 if temp > 0 else 100
            elif v == 1000:
                temp *= 1000
                total += temp
                temp = 0
            else:
                temp += v
        else:
            try:
                temp += int(mot)
            except ValueError:
                pass
    total += temp
    m = re.search(r"(\d+)\s*millimes?", txt, flags=re.IGNORECASE)
    if m:
        total += int(m.group(1)) / 1000.0
    return round(total, 3)

# --- extraction Total TTC v1 (historique) ---
def extract_total_ttc_v1(raw: str) -> float:
    text = raw.replace('\xa0', ' ').replace('\n', ' ')
    m = re.search(r"la somme de\s*[:\s]*(.+?)\s+dinars?\b", text, flags=re.IGNORECASE)
    if not m:
        return 0.0
    montant = m.group(1).strip()
    montant = apply_ocr_fixes(montant)
    mt = re.sub(r"[^A-Za-zÀ-ÿ0-9\s\-]", " ", montant)
    mt = re.sub(r"\s+", " ", mt).strip()
    main = lettres_vers_nombre(mt)
    mm = re.search(r"(\d+)\s*millimes?", text, flags=re.IGNORECASE)
    milli = int(mm.group(1)) / 1000.0 if mm else 0.0
    return round(main + milli, 3)

# --- extraction Total TTC v2 (robuste) ---
def extract_total_ttc_v2(raw: str) -> float:
    text = raw.replace('\xa0', ' ').replace('\n', ' ')
    patterns = [
        r"la somme de\s*[:\s]*(.+?)\s+dinars?\b",
        r"montant ttc\s*[:\s]*(.+?)\s+dinars?\b",
        r"total ttc\s*[:\s]*(.+?)\s+dinars?\b",
    ]
    montant = None
    for pat in patterns:
        m = re.search(pat, text, flags=re.IGNORECASE)
        if m:
            montant = m.group(1).strip()
            break
    if montant is None:
        m = re.search(r"(.+?)\s+dinars?\b", text, flags=re.IGNORECASE)
        if not m:
            return 0.0
        montant = m.group(1).strip()

    # 1) correction OCR ciblée
    montant = apply_ocr_fixes(montant)
    # 2) nettoyage standard
    mt = re.sub(r"[^A-Za-zÀ-ÿ0-9\s\-]", " ", montant)
    mt = re.sub(r"\s+", " ", mt).strip()
    # 3) conversion
    main = lettres_vers_nombre(mt)
    mm = re.search(r"(\d+)\s*millimes?", text, flags=re.IGNORECASE)
    milli = int(mm.group(1)) / 1000.0 if mm else 0.0
    return round(main + milli, 3)

def extract_total_ttc_corrige(raw: str) -> float:
    text = raw.replace('\xa0', ' ').replace('\n', ' ')
    
    # Étape 1 — Essayer d'extraire les montants en lettres comme avant
    t1 = extract_total_ttc_v1(text)
    if t1 > 0:
        return t1
    
    t2 = extract_total_ttc_v2(text)
    if t2 > 0:
        return t2

    # Étape 2 — Essayer d'extraire un montant numérique direct avant "dinars"
    # Exemple : "Total TTC : 152 Dinars"
    m = re.search(r"(?i)(?:total\s+ttc|montant\s+ttc)[\s:]*([\d\s.,]+)\s*dinars?", text)
    if m:
        montant_str = m.group(1).replace(" ", "").replace(",", ".")
        try:
            return round(float(montant_str), 3)
        except ValueError:
            pass

    # Étape 3 — Montant générique : chercher un nombre avant le mot dinars
    m = re.search(r"([\d\s.,]+)\s*dinars?", text, re.IGNORECASE)
    if m:
        montant_str = m.group(1).replace(" ", "").replace(",", ".")
        try:
            return round(float(montant_str), 3)
        except ValueError:
            pass

    return 0.0

# --- extraction équipement (immat + type) ---
def extract_equip(t: str):
    t2 = re.sub(r"(?<!\d)(\d{3,4}TU\d{2,3})", r" \1", t)
    m = re.search(r"\b\d{3,4}TU\d{2,3}\b", t2)
    imma = m.group(0) if m else "N/A"
    typ = "N/A"
    if m:
        after = t2[m.end():]
        words = re.findall(r"\b[A-ZÀ-ÿ0-9\-]{2,}\b", after)
        stop = {'WVW', 'VF', 'JN', 'KM', 'CL', 'DT', 'DATE'}
        sel = []
        for w in words:
            if any(w.startswith(s) for s in stop) or re.match(r"\d{2}[\/\-]\d{2}[\/\-]\d{4}", w):
                break
            sel.append(w)
            if len(sel) >= 4:
                break
        if sel:
            typ = " ".join(sel)
    return imma, typ

# --- OCR helpers ---
def pdf_to_images(path, dpi=300):
    return convert_from_path(path, dpi=dpi, poppler_path=POPPLER_PATH)

def preprocess(img: Image.Image) -> Image.Image:
    g = ImageOps.grayscale(img)
    return ImageOps.autocontrast(g).filter(ImageFilter.UnsharpMask(radius=2, percent=150, threshold=3))

def ocr_text(path: str) -> str:
    pages = pdf_to_images(path)
    out = []
    for p in pages:
        raw = pytesseract.image_to_string(preprocess(p), lang='fra')
        clean = ''.join(c for c in raw if unicodedata.category(c)[0] != "C")
        out.append(clean)
    return "\n".join(out)

def clean_txt(t: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^0-9A-Za-zÀ-ÿTU\/\s-]", " ", t)).strip()

def extract_ref(t: str) -> str:
    m = re.search(r"(?:Ref(?:érence)?|Réf)\s*[:\-]?\s*([A-Z0-9\-]+)", t, re.IGNORECASE)
    return m.group(1) if m else "N/A"

def extract_date(t: str) -> str:
    m = re.search(r"\b(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{4})\b", t)
    return m.group(1) if m else "N/A"

def parse_invoice(path: str) -> dict:
    raw = ocr_text(path)
    Path("debug_ocr").mkdir(exist_ok=True)
    with open(f"debug_ocr/{Path(path).stem}.txt", "w", encoding="utf-8") as f:
        f.write(raw)

    clean = clean_txt(raw).upper()
    return {
        "ref": extract_ref(clean),
        "date": extract_date(clean),
        "raw_text": raw,
        "total_ttc": extract_total_ttc_corrige(raw),
        "immatriculation": extract_equip(clean)[0],
        "vehicule": extract_equip(clean)[1]
    }

if __name__ == "__main__":
    import sys
    config_path = Path(__file__).parent / "templates" / "facture1.yml"
    if not config_path.exists():
        raise FileNotFoundError(f"Template YAML introuvable : {config_path}")
    cfg = yaml.safe_load(config_path.read_text(encoding="utf-8"))
    tmpl = Template(cfg["template"])

    if len(sys.argv) < 2:
        print("Usage: python extractor.py <invoice.pdf>")
        sys.exit(1)

    data = parse_invoice(sys.argv[1])
    # n’écrire QUE le JSON sur stdout
    import sys
    sys.stdout.write(json.dumps(data, ensure_ascii=False))
    # ne rien imprimer d’autre
