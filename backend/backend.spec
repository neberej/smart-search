import os
from PyInstaller.utils.hooks import collect_submodules, collect_data_files
from PyInstaller.building.build_main import Analysis, PYZ, EXE, COLLECT
import sysconfig

block_cipher = None

python_lib_path = sysconfig.get_config_var('LIBDIR')
python_lib_name = sysconfig.get_config_var('LDLIBRARY') or 'libpython3.13.dylib'

lib_path = os.path.join(python_lib_path, python_lib_name)
if os.path.islink(lib_path):
    lib_path = os.path.realpath(lib_path)
elif not os.path.exists(lib_path):
    lib_path = '/opt/homebrew/opt/python@3.13/Frameworks/Python.framework/Versions/3.13/lib/libpython3.13.dylib'

hiddenimports = (
    collect_submodules('parsers') +
    collect_submodules('scipy') +
    collect_submodules('faiss') +
    collect_submodules('backend') +
    collect_submodules('sklearn') +
    collect_submodules('transformers') +
    [
        'fastapi',
        'uvicorn',
        'starlette',
        'websockets',
        'pydantic',
        'asyncio',
        'sentence_transformers',
        'transformers',
        'torch',
        'numpy',
        'docx',
        'bs4',
        'sklearn',
        'pytesseract',
        'PIL',
        'pdfplumber',
        'scipy.sparse',
        'scipy._cyutility',
        'scipy.special._cdflib',
        'faiss',
        'PyPDF2',
        'lxml',
        'pypdfium2',
        'sklearn.metrics',
        'transformers.generation',
        'transformers.models.auto'
    ]
)

binaries = []
if os.path.exists(lib_path):
    binaries.append((lib_path, '.'))
tesseract_path = '/opt/homebrew/bin/tesseract'
if os.path.exists(tesseract_path):
    binaries.append((tesseract_path, '.'))

datas = [
    ('../config.json', '.'),
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
    ['api.py'],
    pathex=['.'],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    runtime_hooks=[],
    excludes=['tkinter', 'PyQt5', 'PySide2', 'matplotlib', 'dask', 'einops'],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='smartsearch-backend',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,
    contents_directory='.',
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='smartsearch-backend'
)