from PyPDF2 import PdfReader

def parse(path):
    reader = PdfReader(str(path))
    return "\n".join([page.extract_text() or "" for page in reader.pages])