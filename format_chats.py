import re
from typing import List, Dict


# To ensure our code works with all chat formats and completion types, we use a similarity function to correctly identify different roles formatting.
def similarity_score(str1: str, str2: str) -> float:
    # Convert strings to lowercase and split into words
    words1 = re.split(r'[_\s.]', str1.lower())
    words2 = re.split(r'[_\s.]', str2.lower())
    
    if len(words1) == 1 and len(words2) == 1:
        # Character-based similarity for single-word strings
        chars1 = list(words1[0])
        chars2 = list(words2[0])
        intersection = list(dict.fromkeys(filter(lambda x: x in chars2, chars1)))
        union = list(dict.fromkeys(chars1 + chars2))
    else:
        # Word-based similarity for multi-word strings
        intersection = set(words1) & set(words2)
        union = set(words1) | set(words2)
    
    return len(intersection) / len(union) if union else 0.0

# Convert text to chat format
def format_chat(dialogues: str, roles: Dict[str, str] = {'human': 'user'}) -> List[Dict[str, str]]:
    pattern = re.compile(r'^([^\n:]+)(?=\s*:)', re.MULTILINE)
    matches = list(pattern.finditer(dialogues))
    
    roles_positions = [(match.start(), match.end(), match.group(1)) for match in matches]
    
    formatted = []
    next_start = None
    
    for start, end, role in reversed(roles_positions):
        normalized = role.lower().strip()
        
        best_match = max(roles.items(), key=lambda x: similarity_score(x[0], normalized))[1]
        
        content_start = len(dialogues) if next_start is None else next_start
        content = dialogues[end + 1:content_start].strip().replace(r'^[\d. ]+', '', 1)
        
        formatted.insert(0, {'role': best_match, 'content': content})
        next_start = start
    
    return formatted

# Convert chat to text format
def format_text(dialogues: List[Dict[str, str]]) -> str:
    return '\n'.join(f"{d['role']}: {d['content']}" for d in dialogues).strip()


# extract from xml tags. 
def extract_tag(text: str, tag: str) -> str:
    match = re.search(f'<{tag}>([\\s\\S]*?)</{tag}>', text)
    return match.group(1).strip() if match else ''


shareGPT_into_chatml = lambda chatmls: [{"role": message["from"], "content": message["value"]} for message in chatmls]

chatml_into_shareGPT = lambda shareGPTs: [{"from": message["role"], "value": message["content"]} for message in shareGPTs]

group_into_dicts = lambda conversations: [{"messages": conversation} for conversation in conversations]


def text_to_chat_dynamic(dialogues_str):
    # Identifies two unique roles, adjusts parsing
    pattern = re.compile(r'\b([A-Za-z0-9_]+): ')
    matches = pattern.finditer(dialogues_str)
    roles = set()
    for match in matches:
        role = match.group(1).lower()
        roles.add(role)
        if len(roles) == 2:
            break
    if len(roles) != 2:
        raise ValueError("Exactly two unique roles must be present in the dialogue.")
    # Create a pattern to match only the identified roles
    role_pattern = re.compile(fr'\b({"|".join(roles)}): ', re.IGNORECASE)
    matches = role_pattern.finditer(dialogues_str)
    roles_positions = [(match.start(), match.end(), match.group(1)) for match in matches]
    formatted_dialogues = []
    next_start = None
    for i in range(len(roles_positions)-1, -1, -1):
        start, end, role = roles_positions[i]
        if next_start is None:
            content = dialogues_str[end:].strip()
        else:
            content = dialogues_str[end:next_start].strip()
        content = re.sub(r'\n\s+', '\n', content)
        formatted_dialogues.insert(0, {'role': role.lower(), 'content': content})
        next_start = start
    return formatted_dialogues




# 1. For compatibility with all form of chat and completions format, we need to use similarity function to match the roles
similarity = similarity_score("hello", "hallo")
print(f"Similarity score: {similarity}")

# 2. Format Dialogues as Chat
dialogues = """
Bot: My name is Bot, but you can call me bot.
User: I'm User, I was human or Human for this matter.
Assistant: How may I assist you today?
User: Yes
ai_assistant: How may I assist you today?
Human: Hi
AI_agent: I am the AI agent, like the AI agent from the movie "Her".
human: hello
Agent.Smith: I am the AGI agent, like the AGI agent from the movie "The Matrix".
user: no away
"""
formatted_dialogues = format_chat(dialogues, roles={'ai': 'Assistant', 'AI_agent': 'Assistant', 'bot': 'Assistant', 'human': 'User'})
print(formatted_dialogues)

# 3. Format Dialogues as Text
dialogues_text = format_text(formatted_dialogues)
# print(dialogues_text)

dialogues_text = format_chat(dialogues_text, roles={'user': 'User', 'system': 'System', 'assistant': 'Chatbot', 'human': 'User'})
print(dialogues_text)

# 4. Extract Tag Function Example
html_content = "<title>Example Page</title>"
extracted_title = extract_tag(html_content, "title")
print(f"Extracted title: {extracted_title}")
