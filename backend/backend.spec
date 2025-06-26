from PyInstaller.utils.hooks import collect_submodules, collect_data_files
import sysconfig

block_cipher = None

hiddenimports = [
    'fastapi', 'uvicorn', 'starlette', 'websockets', 'pydantic', 'asyncio',
    'sentence_transformers', 'transformers', 'torch', 'numpy', 'docx', 'bs4',
    'sklearn', 'pytesseract', 'PIL', 'pdfplumber', 'scipy.sparse', 'scipy._cyutility',
    'scipy.special._cdflib', 'faiss', 'PyPDF2', 'lxml', 'pypdfium2', 'sklearn.metrics',
    'transformers.generation', 'transformers.models.auto', 'fastapi.middleware.cors'
] + collect_submodules('parsers') + collect_submodules('scipy') + collect_submodules('faiss') + collect_submodules('backend') + collect_submodules('sklearn') + collect_submodules('transformers')

binaries = [
    ('/opt/homebrew/opt/python@3.13/Frameworks/Python.framework/Versions/3.13/lib/libpython3.13.dylib', '.'),
    ('/opt/homebrew/bin/tesseract', '.')
]
datas = [
    ('../config.json', '.'),
    ('./parsers', 'backend/parsers'),
    ('./__init__.py', 'backend'),
    ('./api.py', 'backend'),
    ('./config.py', 'backend'),
    ('./search.py', 'backend'),
    ('./chunker.py', 'backend'),
    ('./embedder.py', 'backend'),
    ('./file_loader.py', 'backend'),
    ('./indexer.py', 'backend'),
    ('./logger.py', 'backend'),
    ('./main.py', 'backend'),
    ('./storage.py', 'backend'),
    *collect_data_files('fastapi'),
    *collect_data_files('uvicorn'),
    *collect_data_files('starlette'),
    *collect_data_files('websockets'),
    *collect_data_files('sentence_transformers'),
    *collect_data_files('transformers'),
    *collect_data_files('torch'),
    *collect_data_files('pdfplumber'),
    *collect_data_files('scipy'),
    *collect_data_files('faiss'),
    *collect_data_files('PyPDF2'),
    *collect_data_files('lxml'),
    *collect_data_files('pypdfium2'),
    *collect_data_files('sklearn'),
]

a = Analysis(
    ['main.py'],
    pathex=['.'],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    runtime_hooks=[],
    excludes=['tkinter', 'PyQt5', 'PySide2', 'matplotlib', 'dask', 'einops'],
    cipher=block_cipher,
)
pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)
exe = EXE(pyz, a.scripts, [], exclude_binaries=True, name='smartsearch-backend', debug=True, bootloader_ignore_signals=False, strip=False, upx=True, console=True, contents_directory='.')
coll = COLLECT(exe, a.binaries, a.zipfiles, a.datas, strip=False, upx=True, upx_exclude=[], name='smartsearch-backend')