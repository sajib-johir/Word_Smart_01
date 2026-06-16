#!/usr/bin/env python3
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IMG_ROOT = ROOT / 'images' / 'wordsmart-1'
IMG_EXTS = {'.png', '.jpg', '.jpeg', '.webp'}
preferred = re.compile(r'^(\d+)\.\s+.+\.(png|jpe?g|webp)$', re.I)
num_prefix = re.compile(r'^(\d+)')
num_map = defaultdict(list)
issues = []

for path in sorted(IMG_ROOT.rglob('*')):
    if path.is_dir():
        continue
    if path.suffix.lower() not in IMG_EXTS:
        issues.append(f'Unsupported format: {path.relative_to(ROOT)}')
        continue
    if not num_prefix.match(path.name):
        issues.append(f'No numeric prefix: {path.relative_to(ROOT)}')
        continue
    num = int(num_prefix.match(path.name).group(1))
    num_map[num].append(path.relative_to(ROOT).as_posix())
    if not preferred.match(path.name):
        issues.append(f'Non-preferred filename format: {path.relative_to(ROOT)}')

all_nums = sorted(num_map)
if all_nums:
    for a, b in zip(all_nums, all_nums[1:]):
        if b - a > 1:
            issues.append(f'Possible missing number between {a} and {b}: {list(range(a+1,b))}')
for num, files in sorted(num_map.items()):
    if len(files) > 1:
        issues.append(f'Duplicate number {num}: ' + ' | '.join(files))

if issues:
    print('Image check completed with warnings:')
    for item in issues:
        print('-', item)
else:
    print('No major issues found.')
