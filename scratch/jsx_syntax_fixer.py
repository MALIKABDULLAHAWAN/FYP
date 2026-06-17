import os
import re

def fix_jsx_duplicates(directory):
    duplicate_pattern = re.compile(
        r"(\s+</div>\n\s+</div>\n\s+\);\n\s+}\n)(\s+</div>\n\s+</div>\n\s+\);\n\s+}\n)",
        re.MULTILINE
    )
    
    files_fixed = []
    
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(".jsx"):
                path = os.path.join(root, file)
                with open(path, "r", encoding="utf-8") as f:
                    content = f.read()
                
                if duplicate_pattern.search(content):
                    new_content = duplicate_pattern.sub(r"\1", content)
                    with open(path, "w", encoding="utf-8") as f:
                        f.write(new_content)
                    files_fixed.append(file)
                    print(f"Fixed duplicate tags in: {file}")
                    
    return files_fixed

if __name__ == "__main__":
    games_dir = r"c:\Users\Saaz\Desktop\FYP-46c2fd2fed71053ad452dc0f31c08168507fdd71\frontend\src\pages\games"
    fixed = fix_jsx_duplicates(games_dir)
    print(f"Total files fixed: {len(fixed)}")
