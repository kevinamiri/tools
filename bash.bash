#!/bin/bash

# Added support for priorities. In the case of conflicts, the lower defined priority will be used.

# Priority = 0
INCLUDE_FILES=("documentation.md")
# Priority = 1
EXCLUDE_FILES=(".cursorrules" "prompt.md" "package-lock.json" "yarn.lock" "conversation.json" "exchange_log.json" "readme.md" "exchange_log.md" "p.md" ".env" "bash.bash")

# Priority = 2
INCLUDE_FILE_EXTENSIONS=("yml" "css" "tsx" "js" "ts" "json")
# Priority = 3
EXCLUDE_FILE_EXTENSIONS=("log" "md" "txt")
# Priority = 4
EXCLUDE_DIRS=(
    "venv" "node_modules" ".git" "build" "dist" ".github"
    "target" "out" "bin" "lib" ".idea" ".vscode" ".settings"
    "agent.log" "exchange_log.json" "prompt.md" "readme.md"
    "src/__tests__"  "generated-projects" "src/components/drafts"
)
# Priority = 5
INCLUDE_DIRS=(".")

OUTPUT_FILE="prompt.md"
PROMPT_FILE=".cursorrules"

# Helper functions
get_language() {
    case "$1" in
        *.php) echo "php" ;;
        *.yml|*.yaml) echo "yaml" ;;
        *.js) echo "javascript" ;;
        *.ts) echo "typescript" ;;
        *.tsx) echo "typescript" ;;
        *.css) echo "css" ;;
        *.json) echo "json" ;;
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

load_objectives() {
    local goals_file="objectives.md"
    if [ ! -f "$goals_file" ]; then
        echo "Error: Goals file not found: $goals_file" >&2
        return 1
    fi

    local content
    content=$(awk '/<goals>/,/<\/goals>/' "$goals_file" | sed '1d;$d')

    if [ -z "$content" ]; then
        echo "Error: No content found between <goals> tags in $goals_file" >&2
        return 1
    fi

    # Debug output
    echo "Debug: Objectives content:" >&2
    echo "$content" >&2

    echo "$content"
}

is_file_included() {
    local file="$1"
    local action="exclude"  # Default action
    local action_priority=99

    # Priority 0: INCLUDE_FILES
    for inc_file in "${INCLUDE_FILES[@]}"; do
        if [ "$file" == "$inc_file" ]; then
            action="include"
            action_priority=0
            break  # Highest priority
        fi
    done

    # Priority 1: EXCLUDE_FILES
    if [ "$action_priority" -gt 1 ]; then
        for exc_file in "${EXCLUDE_FILES[@]}"; do
            if [ "$file" == "$exc_file" ]; then
                action="exclude"
                action_priority=1
                break
            fi
        done
    fi

    # Priority 2: INCLUDE_FILE_EXTENSIONS
    if [ "$action_priority" -gt 2 ]; then
        ext="${file##*.}"
        for inc_ext in "${INCLUDE_FILE_EXTENSIONS[@]}"; do
            if [ "$ext" == "$inc_ext" ]; then
                action="include"
                action_priority=2
                break
            fi
        done
    fi

    # Priority 3: EXCLUDE_FILE_EXTENSIONS
    if [ "$action_priority" -gt 3 ]; then
        ext="${file##*.}"
        for exc_ext in "${EXCLUDE_FILE_EXTENSIONS[@]}"; do
            if [ "$ext" == "$exc_ext" ]; then
                action="exclude"
                action_priority=3
                break
            fi
        done
    fi

    # Priority 4: EXCLUDE_DIRS
    if [ "$action_priority" -gt 4 ]; then
        for exc_dir in "${EXCLUDE_DIRS[@]}"; do
            if [[ "$file" == */"$exc_dir"/* ]]; then
                action="exclude"
                action_priority=4
                break
            fi
        done
    fi

    # Priority 5: INCLUDE_DIRS
    if [ "$action_priority" -gt 5 ]; then
        for inc_dir in "${INCLUDE_DIRS[@]}"; do
            if [[ "$file" == "$inc_dir"* ]]; then
                action="include"
                action_priority=5
                break
            fi
        done
    fi

    # Return based on action
    if [ "$action" == "include" ]; then
        return 0  # Include
    else
        return 1  # Exclude
    fi
}

generate_markdown() {
    echo "Starting markdown generation..." >&2
    {
        if ! prompt_content=$(load_prompt); then
            echo "Failed to load prompt, using fallback" >&2
            echo 'You will be provided with files and their contexts inside ``` code blocks ```. Your task is to provide assistance based on these file contexts and given defined Goals.'
        else
            echo "Prompt loaded successfully" >&2
            echo "$prompt_content"
        fi

        echo -e "\n\n"

        echo "# File Contents"
        echo -e "\n"

        # Build the find command
        echo "Building find command..." >&2
        # Build the find command to exclude EXCLUDE_DIRS
        find_command="find ."
        if [ ${#EXCLUDE_DIRS[@]} -gt 0 ]; then
            find_command+=" \( "
            for i in "${!EXCLUDE_DIRS[@]}"; do
                dir="${EXCLUDE_DIRS[$i]}"
                find_command+=" -path './$dir' "
                if [ $i -lt $((${#EXCLUDE_DIRS[@]} -1)) ]; then
                    find_command+=" -o "
                fi
            done
            find_command+=" \) -prune -o "
        fi
        find_command+=" -type f -print"

        echo "Executing find command: $find_command" >&2

        eval "$find_command" | while read -r file; do
            clean_path=${file#./}
            # Call is_file_included
            if is_file_included "$clean_path"; then
                echo "Processing file: $clean_path" >&2
                language=$(get_language "$file")
                echo '```'"$language:$clean_path"
                cat "$file"
                echo -e "\n\`\`\`"
            else
                echo "Skipping file: $clean_path" >&2
            fi
        done

        # Add objectives at the end
        if objectives_content=$(load_objectives); then
            echo "Objectives loaded successfully" >&2
            echo "$objectives_content"
        else
            echo "Failed to load objectives" >&2
        fi

    } > "$OUTPUT_FILE"

    echo "Markdown generation completed. Output: $OUTPUT_FILE" >&2
}

generate_markdown
