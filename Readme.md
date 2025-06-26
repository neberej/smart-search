
Index your files for quick search. Runs locally!



[Demo](https://github.com/user-attachments/assets/aed054e0-a91f-4599-ac4c-f6fffe2a3d85)



Models used:
- PyPDF2
- pytesseract
- beautifulsoup4
- python-docx

---

## Development

There are two portions - backend which does heavy lifting creating embeddings and frontend which communicates using rest APIs.

### Install:

```
./install.sh
```

### Run

```
./start-frontend.sh
./start-backend.sh
```

---


## Build (for prod/usage)

The following build process creates a .dmg file that can be installed.

```
./build.sh
```

outputs into dist_electron/ folder.

Run/install it!

And then, Ctrl + Space or Cmd + Space shows/hides the search!

### Additional shortcuts (when in search):

- Backspace to go back to input
- Esc to close
- Top/Bottom arrows to navigate and Enter to open folder

        
