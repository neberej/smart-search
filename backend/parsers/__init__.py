from . import pdf_parser, json_parser, image_parser, docx_parser, html_parser

PARSERS = {
    ".pdf": pdf_parser,
    ".json": json_parser,
    ".jpg": image_parser,
    ".jpeg": image_parser,
    ".png": image_parser,
    ".docx": docx_parser,
    ".doc": docx_parser,
    ".html": html_parser,
    ".htm": html_parser
}

def get_parser(ext):
    return PARSERS.get(ext.lower())