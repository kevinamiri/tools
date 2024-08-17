#!/usr/bin/env python3

import json
import sys
from pathlib import Path

def detect_format(file_path):
    with open(file_path, 'r') as f:
        first_char = f.read(1)
    return 'json' if first_char == '[' else 'jsonl'

def convert_json_to_jsonl(input_path, output_path):
    with open(input_path, 'r') as input_file, open(output_path, 'w') as output_file:
        data = json.load(input_file)
        for item in data:
            json.dump(item, output_file)
            output_file.write('\n')

def convert_jsonl_to_json(input_path, output_path):
    with open(input_path, 'r') as input_file, open(output_path, 'w') as output_file:
        data = [json.loads(line) for line in input_file]
        json.dump(data, output_file, indent=2)

def main():
    if len(sys.argv) != 3:
        print("Usage: python script.py <input_file> <output_file>")
        sys.exit(1)

    input_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])

    input_format = detect_format(input_path)
    output_format = 'json' if output_path.suffix.lower() == '.json' else 'jsonl'

    if input_format == output_format:
        print(f"Input and output formats are the same ({input_format}). No conversion needed.")
        return

    if input_format == 'json' and output_format == 'jsonl':
        convert_json_to_jsonl(input_path, output_path)
    else:
        convert_jsonl_to_json(input_path, output_path)

    print(f"Conversion from {input_format.upper()} to {output_format.upper()} completed.")

if __name__ == "__main__":
    main()
