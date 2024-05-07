This script extracts JSON objects from a file named `json-prompts.md`, adds commas between them, combines them into a single JSON array, and saves the result in a file named `json-prompts.json`. It then cleans up the temporary files used during the process.

```bash

sed -n '/^{/,/^}/p' json-prompts.md > extracted.json
awk 'NR>1{print prev}{prev=$0} END{print $0}' extracted.json > comma_separated.json
jq -s '.' comma_separated.json > json-prompts.json

# Clean up temporary files
rm extracted.json comma_separated.json

```



The provided bash script performs the following tasks:

1. `sed -n '/^{/,/^}/p' json-prompts.md > extracted.json`
   - This command uses `sed` to extract JSON objects from a file named `json-prompts.md`.
   - The `-n` option suppresses the default output of `sed`.
   - The `/^{/,/^}/p` pattern matches lines starting with `{` up to lines starting with `}`, effectively extracting JSON objects.
   - The extracted JSON objects are redirected to a file named `extracted.json`.

2. `awk 'NR>1{print prev}{prev=$0} END{print $0}' extracted.json > comma_separated.json`
   - This command uses `awk` to add commas between the extracted JSON objects.
   - `NR>1` checks if the current record number (line number) is greater than 1.
   - If the condition is true, it prints the previous line (`prev`) followed by a comma.
   - `{prev=$0}` assigns the current line to the `prev` variable for the next iteration.
   - `END{print $0}` prints the last line without a trailing comma.
   - The output is redirected to a file named `comma_separated.json`.

3. `jq -s '.' comma_separated.json > json-prompts.json`
   - This command uses `jq` to combine the comma-separated JSON objects into a single JSON array.
   - The `-s` option tells `jq` to read the entire input as a single JSON object.
   - The `.` filter passes the input unchanged.
   - The resulting JSON array is redirected to a file named `json-prompts.json`.

4. `rm extracted.json comma_separated.json`
   - This command removes the temporary files `extracted.json` and `comma_separated.json` that were created during the process.

---

To skip malformed elements: 

```bash

# Extract JSON blocks from a Markdown document
sed -n '/^{/,/^}/p' agent-tasks-v6.md > extracted_json_blocks.json

# Prepare an empty JSON array to store valid JSON objects
echo "[]" > valid_json_objects.json

# Read each line from the extracted JSON blocks and validate them
while IFS= read -r current_line; do
    # Detect the start or end of a JSON object
    if [[ "$current_line" =~ ^\{ ]] || [[ "$current_line" =~ ^\} ]]; then
        # Handle the start of a JSON object
        if [[ "$current_line" =~ ^\{ ]]; then
            json_object="$current_line"
        else
            # Complete the JSON object at the end marker and validate it
            json_object+="$current_line"
            if echo "$json_object" | jq . > /dev/null 2>&1; then
                # Append valid JSON object to the array in the valid_json_objects.json file
                updated_json_array=$(jq --argjson obj "$json_object" '. + [$obj]' valid_json_objects.json)
                echo "$updated_json_array" > valid_json_objects.json
            fi
            # Reset json_object for the next block
            json_object=""
        fi
    else
        # Build the JSON object by appending lines inside the object markers
        if [ -n "$json_object" ]; then
            json_object+="$current_line"
        fi
    fi
done < extracted_json_blocks.json

# Finalize the name of the file containing valid JSON objects
mv valid_json_objects.json finalized_valid_tasks.json

# Remove temporary file
rm extracted_json_blocks.json

```
