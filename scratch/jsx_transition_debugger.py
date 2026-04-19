import re

def debug_jsx(path):
    with open(path, "r", encoding="utf-8") as f:
        lines = f.readlines()
    
    depth = 0
    tag_pattern = re.compile(r"<(div|/div)")
    
    checkpoints = [118, 3174, 3196, 3905]
    
    for i, line in enumerate(lines):
        matches = tag_pattern.findall(line)
        for m in matches:
            if m == "div":
                depth += 1
            else:
                depth -= 1
        
        if (i + 1) in checkpoints:
            print(f"Depth at line {i+1}: {depth}")

if __name__ == "__main__":
    debug_jsx(r"c:\Users\Saaz\Desktop\FYP-46c2fd2fed71053ad452dc0f31c08168507fdd71\frontend\src\pages\Dashboard.jsx")
