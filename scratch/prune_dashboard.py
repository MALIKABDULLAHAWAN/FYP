
import os

filepath = r"C:\Users\Saaz\Desktop\FYP-46c2fd2fed71053ad452dc0f31c08168507fdd71\frontend\src\pages\Dashboard.jsx"

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# The VoiceAgent started at line 126 (1-indexed) which is index 125.
# I already replaced lines 123-135 with some comments.
# So the dangling body starts where I left off.
# Let's find the closing brace of the former VoiceAgent function.
# It was around line 3174.

# To be safe, let's just re-read the file and remove the range [125, 3173] in 0-indexed.
# Wait, I already modified the file. Line 123 was replaced by 3 lines.
# So the indices shifted.

# Better: Look for the pattern where the Dashboard component starts.
# "export default function Dashboard() {"

start_marker = "// Dashboard component remains below"
end_marker = "export default function Dashboard() {"

new_lines = []
skip = False
for line in lines:
    if start_marker in line:
        new_lines.append(line)
        skip = True
        continue
    if end_marker in line:
        skip = False
    if not skip:
        new_lines.append(line)

with open(filepath, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Pruning complete.")
