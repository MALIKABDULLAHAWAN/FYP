def analyze_paren_depth(path):
    with open(path, "r", encoding="utf-8") as f:
        lines = f.readlines()
    
    depth = 0
    start_found = False
    for i, line in enumerate(lines):
        line_num = i + 1
        if line_num == 1583:
            start_found = True
        
        for char in line:
            if char == "(":
                depth += 1
            elif char == ")":
                depth -= 1
        
        if start_found and depth <= 0 and line_num < 3175:
            print(f"CRITICAL: Depth hit {depth} at line {line_num}: {line.strip()}")
            break

if __name__ == "__main__":
    analyze_paren_depth(r"c:\Users\Saaz\Desktop\FYP-46c2fd2fed71053ad452dc0f31c08168507fdd71\frontend\src\pages\Dashboard.jsx")
