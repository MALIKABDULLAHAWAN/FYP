import re

def stack_validator(path):
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Simple regex to find <div... or </div>
    # We ignore self-closing ones like <div />
    tag_pattern = re.compile(r"<(div[\s>]|/div>)")
    
    # We want to catch things like <div className="foo" >
    # but not <div />
    
    tokens = []
    # Find all <div or </div
    for i, line in enumerate(content.splitlines()):
        # Extremely simple: search for '<div' and '</div'
        # To avoid being fooled by strings, we'll be slightly better
        
        # This is a hacky but often effective way for large files
        line_num = i + 1
        
        # Find all openings
        for match in re.finditer(r"<div(\s|/?>)", line):
            if "/>" in match.group():
                continue # Self-closing
            tokens.append(("OPEN", line_num))
            
        # Find all closings
        for match in re.finditer(r"</div\s*>", line):
            tokens.append(("CLOSE", line_num))

    stack = []
    for type, line in tokens:
        if type == "OPEN":
            stack.append(line)
        else:
            if not stack:
                print(f"ERROR: Extra closing </div> at line {line}")
            else:
                stack.pop()

    if stack:
        print(f"ERROR: Unclosed <div> tags from lines: {stack}")
    else:
        print("JSX Divs are perfectly balanced.")

if __name__ == "__main__":
    stack_validator(r"c:\Users\Saaz\Desktop\FYP-46c2fd2fed71053ad452dc0f31c08168507fdd71\frontend\src\pages\Dashboard.jsx")
