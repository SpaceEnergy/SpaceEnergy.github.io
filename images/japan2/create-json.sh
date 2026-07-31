#!/bin/bash
set -e

echo "{" > images.json
first_dir=true

for dir in */; do
    dir_name="${dir%/}"

    for img in "$dir"*.png "$dir"*.jpg "$dir"*.jpeg; do
        [ -e "$img" ] || continue
        base="${img%.*}"
        if command -v cwebp >/dev/null 2>&1; then
            cwebp -q 90 "$img" -o "$base.webp" >/dev/null 2>&1
        elif command -v ffmpeg >/dev/null 2>&1; then
            ffmpeg -y -i "$img" "$base.webp" >/dev/null 2>&1
        else
            echo "No webp converter found" >&2
            exit 1
        fi
        rm -f "$img"
    done

    files=()
    for file in "$dir"*.webp; do
        [ -e "$file" ] || continue
        files+=("$(basename "$file")")
    done

    [ ${#files[@]} -gt 0 ] || continue

    if [ "$first_dir" = false ]; then
        echo "," >> images.json
    fi

    echo -n "  \"$dir_name\": [" >> images.json
    for i in "${!files[@]}"; do
        [ "$i" -gt 0 ] && echo -n ", " >> images.json
        echo -n "\"${files[$i]}\"" >> images.json
    done
    echo -n "]" >> images.json
    first_dir=false
done

echo "" >> images.json
echo "}" >> images.json