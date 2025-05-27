import re   # modue pour les expressions régulières : recherche / remplacement
import unicodedata  # utilitaires pour normalisation Unicode (suppression d'accents, catégories de caractères)
import pytesseract   # wrapper Python pour l'OCR Tesseract (au lieu de lancer un cmd manuelle)
from pdf2image import convert_from_path   # conversion de pages PDF en images via poppler
from PIL import Image, ImageFilter, ImageOps, ImageEnhance  # PIL/Pillow pour traitement d'images (filtres, contraste, inversion)
import os  # module pour les opérations système (utilisé si besoin de vérifier chemins)
import json  # module pour sérialiser/désérialiser JSON


# 1) Configuration de l’exécutable Tesseract
#    On indique à pytesseract où trouver le binaire Tesseract sur Windows
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.EXE"


# fonction de génération des versions d'extraction différentes
# img nom de params passé 
# indice de type : Image1 fait ref au module PIL.Image(importé via PIL import)
#image.Image est la classe définit à l'intérieur de module PIL.Image
# donc img est une instance de la classe PIL.Image.Imahe
def generate_variants(img: Image.Image):
    # 
    """
    Génère plusieurs variantes de l’image d’entrée pour améliorer la reconnaissance OCR.
    Chaque variante applique un pré-traitement différent (niveaux de gris, contraste, netteté, inversion…).
    """
    # Conversion en niveaux de gris
    gray = ImageOps.grayscale(img)
    return [
        gray,
        ImageOps.autocontrast(gray), # ajuste automatiquement les contrastes
        gray.filter(ImageFilter.UnsharpMask(radius=2, percent=150, threshold=3)), # renforce la netteté
        ImageOps.invert(gray),  # inverse les couleurs (utile si fond sombre)
        ImageEnhance.Contrast(gray).enhance(2.0), # double le contraste
        gray.point(lambda x: 0 if x < 128 else 255) # seuillage simple
    ]


# 3) OCR multi‑variante et nettoyage du texte
def ocr_all_variants(pdf_path: str, poppler_path: str) -> str:
    """
    Convertit la première page du PDF en image et applique OCR sur plusieurs variantes :
    1) Conversion de la page en image (300 dpi) via poppler.
    2) Génération de variantes pré-traitées.
    3) Application de Tesseract (fra+eng) sur chaque variante.
    4) Nettoyage du texte (suppression des contrôles, filtrage des caractères).
    Retourne tous les textes concaténés, séparés par "\n---\n".
    """
    # a) extraction de la première page en image
    page = convert_from_path(pdf_path, dpi=300, poppler_path=poppler_path)[0]
    texts = []
    # b) OCR sur chaque variante
    for var in generate_variants(page):
        raw = pytesseract.image_to_string(var, lang='fra+eng')
        clean = ''.join(c for c in raw if unicodedata.category(c)[0] != 'C')
        # supprimer les caractères de contrôle Unicode
        clean = re.sub(r"[^\w\s:/\-,;().%€+&]", "", clean)
        # réduire les espaces multiples à un seul
        clean = re.sub(r"\s{2,}", " ", clean)
        texts.append(clean.strip())
    # c) on sépare chaque variante par un délimiteur pour liaison
    return "\n---\n".join(texts)

# 4) Extraction de Référence, Date et Total TTC dans le dernier paragraphe
def parse_last_paragraph(brut_text: str):
    """
    Analyse le texte OCR multi-variant et extrait, dans le dernier paragraphe :
    - la référence (numéro alphanumérique ≥6 caractères)
    - la date (JJ/MM/AAAA)
    - le Total TTC (avant le mot "Arrêtée" ou via un fallback)
    Retourne un tuple : (dernier paragraphe, référence, date, total_ttc).
    """
    # 1) Séparation en paragraphes
    paragraphs = brut_text.split('---')
    last_para = paragraphs[-1]
    # 2) Extraction de la référence et de la date
    reference = date = None
    for para in paragraphs:
        # s'assurer qu'il y a un espace après les mots-clés mal collés
        p = re.sub(r"(Référence)(\w)", r"\1 \2", para, flags=re.IGNORECASE)
        p = re.sub(r"(Date)(\d)",      r"\1 \2", p,  flags=re.IGNORECASE)
        p = re.sub(r"(Numéro)(\w)",    r"\1 \2", p,  flags=re.IGNORECASE)

        # tentative de capture "REF12345 | 28/01/2025"
        m = re.search(
            r"\b([A-Z0-9\/-]{6,})[ \t]*[|:;,\-]*[ \t]*(\d{2}/\d{2}/\d{4})",
            p
        )
        if not m:
            # forme inversée "28/01/2025 REF12345"
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

    # 3) Extraction du Total TTC dans le dernier paragraphe
    # on retire les accents pour simplifier les regex
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

    # si fallback et chaîne trop longue, ne conserver que les deux derniers morceaux
    if fallback and total_ttc:
        parts = total_ttc.split()
        if len(parts) > 2:
            total_ttc = " ".join(parts[-2:])

    return last_para, reference, date, total_ttc

# 5) Fonction principale exposée

def main(pdf_path: str,
         poppler_path: str = r"C:\Program Files\poppler-24.08.0\Library\bin") -> dict:
    """
    Fonction principale :
    1) OCR multi-variante de la première page du PDF
    2) Extraction de la référence, de la date et du Total TTC
    3) Retourne un dictionnaire prêt à l’emploi (JSON serializable)
    """
    # a) obtenir le texte OCR varié
    brut = ocr_all_variants(pdf_path, poppler_path)
    # b) parser le dernier paragraphe
    last_para, ref, date, total = parse_last_paragraph(brut)
    # c) assembler le résultat
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
    # Vérification des arguments en ligne de commande
    if len(sys.argv) != 2:
        print("Usage: extractor2.py <file.pdf>", file=sys.stderr)
        sys.exit(1)
    # Exécution et affichage du résultat JSON
    result = main(sys.argv[1])
    print(json.dumps(result, ensure_ascii=False))