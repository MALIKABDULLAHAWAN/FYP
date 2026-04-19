def analyze_paren_depth(path):
    with open(path, "r", encoding="utf-8") as f:
        lines = f.readlines()
    
    depth = 0
    for i, line in enumerate(lines):
        for char in line:
            if char == "(":
                depth += 1
            elif char == ")":
                depth -= 1
        
        # Use sys.stdout.buffer.write to safely handle emojis in potentially non-utf8 terminals
        if 3160 <= i+1 <= 3180:
            import sys
            output = f"Line {i+1} (Depth {depth}): {line.strip()}\n"
            sys.stdout.buffer.write(output.encode('utf-8'))
            sys.stdout.buffer.flush()

if __name__ == "__main__":
    analyze_paren_depth(r"c:\Users\Saaz\Desktop\FYP-46c2fd2fed71053ad452dc0f31c08168507fdd71\frontend\src\pages\Dashboard.jsx")
