import re

def extreme_probe(path):
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    
    p_depth = 0
    b_depth = 0
    d_depth = 0
    
    # Simple regex for <div> and </div>
    div_open = re.compile(r"<div")
    div_close = re.compile(r"</div")
    
    lines = content.splitlines()
    for i, line in enumerate(lines):
        line_num = i + 1
        
        # Track parens and braces char by char
        for char in line:
            if char == "(": p_depth += 1
            elif char == ")": p_depth -= 1
            elif char == "{": b_depth += 1
            elif char == "}": b_depth -= 1
            
            if p_depth < 0:
                print(f"FAILED PAREN DEPTH at Line {line_num}: {line.strip()}")
                return
            if b_depth < 0:
                print(f"FAILED BRACE DEPTH at Line {line_num}: {line.strip()}")
                return
        
        # Track divs line by line (simplified for this large file)
        d_depth += len(div_open.findall(line))
        d_depth -= len(div_close.findall(line))
        
        if d_depth < 0:
            print(f"FAILED DIV DEPTH at Line {line_num}: {line.strip()}")
            return

    print("All depths stayed non-negative throughout the file.")

if __name__ == "__main__":
    extreme_probe(r"c:\Users\Saaz\Desktop\FYP-46c2fd2fed71053ad452dc0f31c08168507fdd71\frontend\src\pages\Dashboard.jsx")
