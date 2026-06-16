# Troubleshooting

## Images do not appear
- Check that image files still exist in `images/wordsmart-1/`.
- Make sure `data/words.js` points to the correct relative paths.

## Cards are not in numeric order
- Run `python tools/generate_words.py` again.
- Check filenames for bad numeric prefixes.

## Some letters are inactive
- Inactive letters mean no images were found for those letters.

## Search shows nothing
- Clear the search box.
- Switch back to `Browse All Words` if you were in `Weak Word Review`.
