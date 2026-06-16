#!/usr/bin/env python3
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IMG_ROOT = ROOT / 'images' / 'wordsmart-1'
IMG_EXTS = {'.png', '.jpg', '.jpeg', '.webp'}
letters = Counter()
nums = []
for path in IMG_ROOT.rglob('*'):
    if path.is_file() and path.suffix.lower() in IMG_EXTS:
        letter = path.parts[-2] if len(path.parts) >= 2 else '?'
        letters[letter] += 1
        m = re.match(r'^(\d+)', path.name)
        if m:
            nums.append(int(m.group(1)))
print('Collection summary')
print('------------------')
print('Total images:', sum(letters.values()))
print('Letters:', ', '.join(f'{k}={v}' for k, v in sorted(letters.items())))
if nums:
    print('Numeric range:', min(nums), 'to', max(nums))
