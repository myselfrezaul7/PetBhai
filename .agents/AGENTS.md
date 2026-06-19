# PetBhai Project Rules

## CRITICAL: File Encoding Rules

- ALL source files (.ts, .tsx, .js, .json, .css, .html) MUST be saved as UTF-8 (no BOM).
- NEVER use fs.writeFileSync without specifying 'utf8' as the encoding parameter.
- NEVER use PowerShell Set-Content or Out-File without -Encoding UTF8.
- The file `backend/src/data/mockData.ts` contains Bengali (বাংলা) Unicode text.
  Any operation that reads and writes this file MUST preserve the Bengali characters.
- Before committing changes to mockData.ts, verify Bengali text is intact by checking
  for the presence of Unicode range U+0980–U+09FF.

## Blog Content Rules

- Blog articles are stored in MOCK_ARTICLES array in backend/src/data/mockData.ts.
- Article thumbnails are stored as static PNGs in public/blog-images/.
- Thumbnail images should NOT exceed 1MB each.
- No human faces in blog thumbnails — use only desi Bangladeshi stray cats/dogs.
