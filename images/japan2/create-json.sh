#!/bin/bash
set -e

log() {
    echo "[$(date '+%H:%M:%S')] $*"
}

recompress_image() {
    local input="$1"
    local output="$2"
    if command -v magick >/dev/null 2>&1; then
        magick "$input" -auto-orient -quality 80 "$output" >/dev/null 2>&1
    elif command -v cwebp >/dev/null 2>&1; then
        cwebp -q 80 "$input" -o "$output" >/dev/null 2>&1
    elif command -v ffmpeg >/dev/null 2>&1; then
        ffmpeg -y -i "$input" -frames:v 1 -q:v 80 "$output" >/dev/null 2>&1
    else
        echo "No image converter found" >&2
        exit 1
    fi
}

recompress_webm() {
    local input="$1"
    local output="$2"
    if command -v ffmpeg >/dev/null 2>&1; then
        ffmpeg -y -i "$input" -c:v libvpx-vp9 -crf 50 -b:v 0 -c:a libopus -b:a 64k -pix_fmt yuv420p "$output" >/dev/null 2>&1
    else
        echo "No ffmpeg found" >&2
        exit 1
    fi
}

output_file="media.json"
echo "{" > "$output_file"
first_dir=true

for dir in */; do
    dir_name="${dir%/}"
    entries_file=$(mktemp)

    while IFS= read -r webp; do
        [ -e "$webp" ] || continue
        log "Recompressing existing WebP: $(basename "$webp")"
        tmp="${webp}.tmp.webp"
        recompress_image "$webp" "$tmp"
        mv "$tmp" "$webp"
        printf 'image\t%s\n' "$(basename "$webp")" >> "$entries_file"
    done < <(find "$dir" -maxdepth 1 -type f -iname '*.webp' | sort)

    while IFS= read -r webm; do
        [ -e "$webm" ] || continue
        log "Recompressing existing WebM: $(basename "$webm")"
        tmp="${webm}.tmp.webm"
        recompress_webm "$webm" "$tmp"
        mv "$tmp" "$webm"
        printf 'video\t%s\n' "$(basename "$webm")" >> "$entries_file"
    done < <(find "$dir" -maxdepth 1 -type f -iname '*.webm' | sort)

    for img in "$dir"*.png "$dir"*.jpg "$dir"*.jpeg "$dir"*.JPG; do
        [ -e "$img" ] || continue
        base="${img%.*}"
        output="$base.webp"
        if [ -e "$output" ]; then
            log "Recompressing existing WebP: $(basename "$output")"
            tmp="$output.tmp.webp"
            recompress_image "$output" "$tmp"
            mv "$tmp" "$output"
            rm -f "$img"
            printf 'image\t%s\n' "$(basename "$output")" >> "$entries_file"
            continue
        fi

        log "Converting image: $(basename "$img")"
        recompress_image "$img" "$output"
        rm -f "$img"
        printf 'image\t%s\n' "$(basename "$output")" >> "$entries_file"
    done

    while IFS= read -r video; do
        [ -e "$video" ] || continue
        log "Processing video file: $(basename "$video")"
        base="${video%.*}"
        output="$base.webm"
        if [ -e "$output" ]; then
            log "Recompressing existing WebM: $(basename "$output")"
            if command -v ffmpeg >/dev/null 2>&1; then
                recompress_webm "$output" "$output.tmp.webm"
                mv "$output.tmp.webm" "$output"
            else
                echo "No ffmpeg found" >&2
                exit 1
            fi
            rm -f "$video"
            printf 'video\t%s\n' "$(basename "$output")" >> "$entries_file"
            continue
        fi

        log "Converting video: $(basename "$video")"
        if command -v ffmpeg >/dev/null 2>&1; then
            recompress_webm "$video" "$output"
        else
            echo "No ffmpeg found" >&2
            exit 1
        fi
        rm -f "$video"
        printf 'video\t%s\n' "$(basename "$output")" >> "$entries_file"
    done < <(find "$dir" -maxdepth 1 -type f \( -iname '*.mp4' -o -iname '*.mov' -o -iname '*.mkv' -o -iname '*.m4v' -o -iname '*.avi' -o -iname '*.mpg' -o -iname '*.mpeg' -o -iname '*.mts' -o -iname '*.m2ts' \) | sort)

    if [ ! -s "$entries_file" ]; then
        rm -f "$entries_file"
        continue
    fi

    python3 - "$entries_file" > "${entries_file}.sorted" <<'PY'
import re
import sys

entries = []
for line in open(sys.argv[1], encoding='utf-8'):
    line = line.strip()
    if not line:
        continue
    media_type, filename = line.split('\t', 1)
    match = re.search(r'(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})', filename)
    if match:
        year, month, day, hour, minute, second = map(int, match.groups())
        key = (year, month, day, hour, minute, second, filename)
    else:
        key = (0, 0, 0, 0, 0, 0, filename)
    entries.append((key, media_type, filename))

entries.sort(key=lambda item: item[0])
for _, media_type, filename in entries:
    print(f"{media_type}\t{filename}")
PY

    if [ "$first_dir" = false ]; then
        echo "," >> "$output_file"
    fi

    echo -n "  \"$dir_name\": [" >> "$output_file"
    entry_written=false
    while IFS=$'\t' read -r media_type filename; do
        [ -n "$filename" ] || continue
        if [ "$entry_written" = true ]; then
            echo -n ", " >> "$output_file"
        fi
        echo -n "{\"type\":\"$media_type\",\"src\":\"$filename\"}" >> "$output_file"
        entry_written=true
    done < <(sort -u "${entries_file}.sorted")

    echo -n "]" >> "$output_file"
    first_dir=false
    rm -f "$entries_file" "${entries_file}.sorted"
done

echo "" >> "$output_file"
echo "}" >> "$output_file"