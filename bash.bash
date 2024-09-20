#!/bin/bash

# Configuration
EXCLUDE_DIRS=(
    "venv" "node_modules" ".git" "build" "dist" ".github"
    "target" "out" "bin" "lib" ".idea" ".vscode" ".settings"
    "agent.log" "exchange_log.json" "prompt.md" "readme.md"
    "p.md" "maestro" "generated-projects"
)
INCLUDE_DIRS=(".")

INCLUDE_FILE_EXTENSIONS=("php" "css" "tsx" "js" "ts" "json")
EXCLUDE_FILE_EXTENSIONS=("log" "md" "txt")

EXCLUDE_FILES=(".cursorrules" "prompt.md" "package-lock.json" "yarn.lock" "conversation.json" "exchange_log.json" "readme.md" "exchange_log.md" "p.md" ".env" "bash.bash")
INCLUDE_FILES=()

OUTPUT_FILE="prompt.md"
PROMPT_FILE=".cursorrules"

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

load_prompt() {
    if [ ! -f "$PROMPT_FILE" ]; then
        return 1
    fi

    local content
    content=$(sed -n '/<system>/,/<\/system>/p' "$PROMPT_FILE" | sed '1d;$d')

    if [ -z "$content" ]; then
        return 1
    fi

    echo "$content"
}

# Modified core functions
search_files() {
    local ext="$1"
    local exclude_params=($(construct_exclude_params))
    local exclude_ext_pattern=$(IFS=\|; echo "${EXCLUDE_FILE_EXTENSIONS[*]}")
    
    if [ "${INCLUDE_DIRS[*]}" == "." ]; then
        find . "${exclude_params[@]}" -type f -name "*.$ext" | grep -vE "\.($exclude_ext_pattern)$"
    elif [ ${#INCLUDE_DIRS[@]} -ne 0 ]; then
        for dir in "${INCLUDE_DIRS[@]}"; do
            [ -n "$dir" ] && find "$dir" "${exclude_params[@]}" -type f -name "*.$ext" | grep -vE "\.($exclude_ext_pattern)$"
        done
    else
        find . "${exclude_params[@]}" -type f -name "*.$ext" | grep -vE "\.($exclude_ext_pattern)$"
    fi

    # Include specific files
    for file in "${INCLUDE_FILES[@]}"; do
        if [ -f "$file" ] && [[ "$file" == *.$ext ]]; then
            echo "$file"
        fi
    done
}


generate_markdown() {
    {
        # Try to load the prompt, use fallback if it fails
        if ! prompt_content=$(load_prompt); then
            echo 'You will be provided with files and their contexts inside ``` code blocks ```. Your task is to provide assistance based on these file contexts and given defined Goals.'
            echo -e '\n\n'
        else
            echo "$prompt_content"
        fi

        echo -e '\n\n'

        # Search for files with specified extensions
        for ext in "${INCLUDE_FILE_EXTENSIONS[@]}"; do
            while IFS= read -r file; do
                if [ -f "$file" ]; then
                    language=$(get_language "$file")
                    # Remove './' prefix from the file path
                    clean_path=${file#./}
                    echo '```'"$language:$clean_path"
                    cat "$file"
                    echo -e "\n\`\`\`"  # Note the escaped backticks and newline
                    echo -e '\n\n'
                fi
            done < <(search_files "$ext")
        done

    } > "$OUTPUT_FILE"
}

# Main execution
generate_markdown
echo "Markdown generation completed. Output: $OUTPUT_FILE"
