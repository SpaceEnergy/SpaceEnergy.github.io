#!/bin/bash
set -e

log() {
    echo "[$(date '+%H:%M:%S')] $*"
}

recompress_image() {
    local input="$1"
    local output="$2"
    if command -v magick >/dev/null 2>&1; then
        magick "$input" -auto-orient -quality 84 "$output" >/dev/null 2>&1
    elif command -v cwebp >/dev/null 2>&1; then
        cwebp -q 84 "$input" -o "$output" >/dev/null 2>&1
    elif command -v ffmpeg >/dev/null 2>&1; then
        ffmpeg -y -i "$input" -frames:v 1 -q:v 84 "$output" >/dev/null 2>&1
    else
        echo "No image converter found" >&2
        exit 1
    fi
}

recompress_webm() {
    local input="$1"
    local output="$2"
    if command -v ffmpeg >/dev/null 2>&1; then
        ffmpeg -y -i "$input" -c:v libvpx-vp9 -crf 40 -b:v 0 -c:a libopus -b:a 64k -pix_fmt yuv420p "$output" >/dev/null 2>&1
    else
        echo "No ffmpeg found" >&2
        exit 1
    fi
}

create_video_poster() {
    local input="$1"
    local output="$2"
    if [ -e "$output" ]; then
        log "Skipping existing poster: $(basename "$output")"
        return
    fi
    log "Creating video poster: $(basename "$output")"
    ffmpeg -y -ss 0.5 -i "$input" -frames:v 1 -vf "scale='min(640,iw)':-2" -c:v libwebp -quality 75 "$output" >/dev/null 2>&1
}

output_file="media.json"
echo "{" > "$output_file"
first_dir=true

for dir in */; do
    dir_name="${dir%/}"
    entries_file=$(mktemp)

    while IFS= read -r webm; do
        [ -e "$webm" ] || continue
        log "Skipping existing WebM: $(basename "$webm")"
        poster="${webm%.webm}.poster.webp"
        create_video_poster "$webm" "$poster"
        printf 'video\t%s\n' "$(basename "$webm")" >> "$entries_file"
    done < <(find "$dir" -maxdepth 1 -type f -iname '*.webm' | sort)

    while IFS= read -r webp; do
        [ -e "$webp" ] || continue
        log "Skipping existing WebP: $(basename "$webp")"
        printf 'image\t%s\n' "$(basename "$webp")" >> "$entries_file"
    done < <(find "$dir" -maxdepth 1 -type f -iname '*.webp' ! -name '*.poster.webp' | sort)

    for img in "$dir"*.png "$dir"*.jpg "$dir"*.jpeg "$dir"*.JPG; do
        [ -e "$img" ] || continue
        base="${img%.*}"
        output="$base.webp"
        if [ -e "$output" ]; then
            log "Skipping existing WebP: $(basename "$output")"
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
            log "Skipping existing WebM: $(basename "$output")"
            create_video_poster "$output" "$base.poster.webp"
            rm -f "$video"
            printf 'video\t%s\n' "$(basename "$output")" >> "$entries_file"
            continue
        fi

        log "Converting video: $(basename "$video")"
        recompress_webm "$video" "$output"
        create_video_poster "$output" "$base.poster.webp"
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