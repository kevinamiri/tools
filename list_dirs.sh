#!/bin/bash

list_dirs() {
    local target_dir="${1:-.}"
    local gitignore_file="$target_dir/.gitignore"
    local gitignore_patterns=()
    local output=()

    # Read .gitignore patterns
    if [[ -f "$gitignore_file" ]]; then
        while IFS= read -r line || [[ -n "$line" ]]; do
            if [[ ! "$line" =~ ^# && -n "$line" ]]; then
                gitignore_patterns+=("$line")
            fi
        done < "$gitignore_file"
    fi

    # Function to check if a path should be ignored
    should_ignore() {
        local path="$1"
        for pattern in "${gitignore_patterns[@]}"; do
            pattern="${pattern%/}"
            if [[ "$path" == "$pattern" || "$path" == "$pattern"/* ]]; then
                return 0  # Should be ignored
            fi
        done
        return 1  # Should not be ignored
    }

    # Function to list directory and its subdirectories (up to 2 levels deep)
    list_dir_and_subdirs() {
        local dir="$1"
        local depth="$2"
        local rel_path="${dir#$target_dir/}"
        
        if ! should_ignore "$rel_path"; then
            output+=("$dir")
            
            if [ "$depth" -lt 2 ]; then
                for subdir in "$dir"/*; do
                    if [ -d "$subdir" ]; then
                        list_dir_and_subdirs "$subdir" $((depth + 1))
                    fi
                done
            fi
        fi
    }

    # Start with the target directory at depth 0
    list_dir_and_subdirs "$target_dir" 0

    # Print the output
    printf '%s\n' "${output[@]}"
}

# If this script is run directly, call the function with the provided argument
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    list_dirs "$1"
fi


