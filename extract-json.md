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
