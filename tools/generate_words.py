#!/usr/bin/env python3
import json, re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IMG_ROOT = ROOT / 'images' / 'wordsmart-1'
DATA_DIR = ROOT / 'data'
NAME_FILE = DATA_DIR / 'word_names.json'
MEANING_FILE = DATA_DIR / 'word_meanings.json'
OUT_FILE = DATA_DIR / 'words.js'
IMG_EXTS = {'.png', '.jpg', '.jpeg', '.webp'}

names = json.load(open(NAME_FILE, encoding='utf-8')) if NAME_FILE.exists() else {}
meanings = json.load(open(MEANING_FILE, encoding='utf-8')) if MEANING_FILE.exists() else {}
words = []

for letter_dir in sorted([p for p in IMG_ROOT.iterdir() if p.is_dir()]):
    letter = letter_dir.name.upper()
    if len(letter) != 1 or not letter.isalpha():
        continue
    for path in sorted(letter_dir.rglob('*')):
        if not path.is_file() or path.suffix.lower() not in IMG_EXTS:
            continue
        m = re.match(r'^(\d+)', path.name)
        if not m:
            continue
        num = int(m.group(1))
        word = names.get(str(num))
        if not word:
            m2 = re.match(r'^\d+\.\s*(.+?)\.(?:png|jpe?g|webp)$', path.name, re.I)
            if m2:
                word = m2.group(1).strip(' .,-')
            else:
                m3 = re.match(r'^\d+[, ]+(.+?)\.(?:png|jpe?g|webp)$', path.name, re.I)
                word = m3.group(1).strip(' .,-') if m3 else f'Word {num}'
        rel = path.relative_to(ROOT).as_posix()
        pack = 'pack-01'
        parent_name = path.parent.name.lower()
        if parent_name.startswith('pack-'):
            pack = path.parent.name
        meta = meanings.get(str(num), {})
        words.append({
            'id': num,
            'uid': str(num),
            'word': word,
            'letter': letter,
            'book': 'Word Smart 1',
            'pack': pack,
            'image': rel,
            'sourceName': path.name,
            'englishMeaning': meta.get('en', ''),
            'banglaMeaning': meta.get('bn', '')
        })

words.sort(key=lambda x: (x['id'], x['word'].lower(), x['image']))
seen = defaultdict(int)
for item in words:
    seen[item['id']] += 1
    if seen[item['id']] > 1:
        item['uid'] = f"{item['id']}__{seen[item['id']]}"

OUT_FILE.write_text('const WORDS = ' + json.dumps(words, ensure_ascii=False, indent=2) + ';
', encoding='utf-8')
active = sorted(set(w['letter'] for w in words))
print('Generated data/words.js successfully.')
print('Total images:', len(words))
print('Active letters:', ', '.join(active) if active else 'None')
if words:
    print('First image:', words[0]['id'], '—', words[0]['word'])
    print('Last image:', words[-1]['id'], '—', words[-1]['word'])
