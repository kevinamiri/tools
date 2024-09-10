#!/bin/bash

# Configuration
EXCLUDE_DIRS=(
    "venv" "node_modules" ".git" "build" "dist" ".github"
    "target" "out" "bin" "lib" ".idea" ".vscode" ".settings"
    "agent.log" "exchange_log.json" "prompt.md" "readme.md"
    "p.md" "maestro" "generated-projects"
)
INCLUDE_DIRS=(".")

INCLUDE_FILE_EXTENSIONS=("php" "yml" "yaml" "js" "ts" "json")
EXCLUDE_FILE_EXTENSIONS=("log" "md" "txt")

EXCLUDE_FILES=("package-lock.json" "yarn.lock" "conversation.json" "exchange_log.json" "readme.md" "exchange_log.md" "p.md" ".env" "bash.bash")
INCLUDE_FILES=()

OUTPUT_FILE="prompt.md"

# Helper functions
construct_exclude_params() {
    local params=()
    for dir in "${EXCLUDE_DIRS[@]}"; do
        params+=(! -path "*/$dir/*")
    done
    for file in "${EXCLUDE_FILES[@]}"; do
        params+=(! -name "$file")
    done
    echo "${params[@]}"
}

get_language() {
    case "$1" in
        *.php) echo "php" ;;
        *.yml|*.yaml) echo "yaml" ;;
        *.js|*.ts) echo "typescript" ;;
        *.py) echo "python" ;;
        *) echo "plaintext" ;;
    esac
}

# Core functions
search_files() {
    local ext="$1"
    local exclude_params=($(construct_exclude_params))
    local exclude_ext_pattern=$(IFS=\|; echo "${EXCLUDE_FILE_EXTENSIONS[*]}")
    
    if [ "${INCLUDE_DIRS[*]}" == "." ]; then
        find . "${exclude_params[@]}" -type f \( -name "*.$ext" -o -name "*" \) | grep -vE "\.($exclude_ext_pattern)$"
    elif [ ${#INCLUDE_DIRS[@]} -ne 0 ]; then
        for dir in "${INCLUDE_DIRS[@]}"; do
            [ -n "$dir" ] && find "$dir" "${exclude_params[@]}" -type f \( -name "*.$ext" -o -name "*" \) | grep -vE "\.($exclude_ext_pattern)$"
        done
    else
        find . "${exclude_params[@]}" -type f \( -name "*.$ext" -o -name "*" \) | grep -vE "\.($exclude_ext_pattern)$"
    fi

    # Include specific files
    for file in "${INCLUDE_FILES[@]}"; do
        if [ -f "$file" ]; then
            echo "$file"
        fi
    done
}

generate_markdown() {
    {
        echo 'You will be provided with files and their contexts inside ``` code blocks ```. Your task is to provide assistance based on these file contexts and given defined Goals.'
        echo -e '\n\n'

        for ext in "${INCLUDE_FILE_EXTENSIONS[@]}"; do
            while IFS= read -r file; do
                local language=$(get_language "$file")
                local relative_path="${file#./}"
                echo "Here is the file context for $relative_path:"
                echo ""
                echo "\`\`\`$language:$relative_path"
                cat "$file"
                echo ""
                echo "\`\`\`"
                echo "---"
            done < <(search_files "$ext")
        done
        echo 'Goal: Given codes and contexts, please help me fix this bug.'
    } > "$OUTPUT_FILE"
}

# Main execution
generate_markdown
echo "Markdown generation completed. Output: $OUTPUT_FILE"
