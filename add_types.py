import json
import os
import re

def get_type(word):
    info = word.get('info', '')
    german = word.get('german', '').strip()
    
    # 1. Explicit verb pattern: contains "hat" or "ist" with a comma
    if re.search(r'\([^)]*,\s*(hat|ist)\s[^)]*\)', info):
        return 'verb'
    
    # 2. Starts with an article -> definitely a noun
    if re.match(r'^(der|die|das|ein|eine)\s', german):
        return 'noun'
    
    # 3. Ends with -en, -eln, -ern (no hyphen!)
    #    And the info does NOT look like a plural form like "die ..., -e"
    if re.search(r'(en|eln|ern)$', german) and not re.search(r'^[a-zäöüß]+,\s*-[a-zäöüß]+', info):
        return 'verb'
    
    # 4. Adjective comparison forms
    if re.search(r'\([^)]*er,\s*am\s[^)]*sten\)', info):
        return 'adjective'
    
    # Fallback
    return 'other'

for i in range(1, 13):
    filename = f'public/data/A2Chapter{i}.json'
    if not os.path.exists(filename):
        continue
    with open(filename, 'r', encoding='utf-8') as f:
        data = json.load(f)
    for word in data:
        word['type'] = get_type(word)
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f'Updated {filename}: {len(data)} words')