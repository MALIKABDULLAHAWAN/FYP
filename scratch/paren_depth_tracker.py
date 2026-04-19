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
        
        if start_found and line_num < 3177:
            if depth <= 0:
                print(f"DEPTH CRITICAL AT LINE {line_num}: {depth} | {line.strip()}")
            elif line_num % 100 == 0:
                print(f"Line {line_num}: Depth {depth}")

if __name__ == "__main__":
    analyze_paren_depth(r"c:\Users\Saaz\Desktop\FYP-46c2fd2fed71053ad452dc0f31c08168507fdd71\frontend\src\pages\Dashboard.jsx")
