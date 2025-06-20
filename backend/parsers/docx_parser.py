from docx import Document

def parse(path):
    doc = Document(str(path))
    return "\n".join([para.text for para in doc.paragraphs])