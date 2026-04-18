import re
import os

jsx_path = r"c:\Users\Saaz\Desktop\Dhayan-FYP-main\frontend\src\pages\Dashboard.jsx"
data_dir = r"c:\Users\Saaz\Desktop\Dhayan-FYP-main\frontend\src\data"
data_path = os.path.join(data_dir, "contentLibrary.js")

if not os.path.exists(data_dir):
    os.makedirs(data_dir)

with open(jsx_path, "r", encoding="utf-8") as f:
    content = f.read()

start_idx = content.find("const CONTENT_LIBRARY = {")
end_idx = content.find("// Voice Agent with Full Interactive System")

if start_idx != -1 and end_idx != -1:
    lib_content = content[start_idx:end_idx].strip()
    
    with open(data_path, "w", encoding="utf-8") as f:
        f.write("export " + lib_content + "\n")
        
    new_jsx = content[:start_idx] + "\n" + content[end_idx:]
    
    # insert import
    import_str = "import { CONTENT_LIBRARY } from '../data/contentLibrary';\n"
    
    # find where to insert (after last import)
    last_import_idx = new_jsx.rfind("import ")
    if last_import_idx != -1:
        last_import_end = new_jsx.find("\n", last_import_idx)
        new_jsx = new_jsx[:last_import_end+1] + import_str + new_jsx[last_import_end+1:]
    else:
        new_jsx = import_str + new_jsx
        
    with open(jsx_path, "w", encoding="utf-8") as f:
        f.write(new_jsx)
    print("Successfully extracted CONTENT_LIBRARY.")
else:
    print("Could not find CONTENT_LIBRARY markers.")
