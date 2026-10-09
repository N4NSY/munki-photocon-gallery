#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "gallery.json"
THUMBS_DIR = ROOT / "thumbs"
ASSETS_DIR = ROOT / "assets"
THUMB_MAX = 800
WEBP_QUALITY = 80

FONT_CANDIDATES = [
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
    "/usr/share/fonts/truetype/noto/NotoSansCJK-Bold.ttc",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
]


def load_font(size: int) -> ImageFont.ImageFont:
    for path in FONT_CANDIDATES:
        if Path(path).exists():
            try:
                return ImageFont.truetype(path, size=size)
            except OSError:
                pass
    return ImageFont.load_default()


def open_rgb(path: Path) -> Image.Image:
    with Image.open(path) as src:
        image = ImageOps.exif_transpose(src)
        if image.mode == "RGBA":
            base = Image.new("RGB", image.size, (11, 11, 12))
            base.paste(image, mask=image.getchannel("A"))
            return base
        return image.convert("RGB")


def generate_thumbnails(data: dict) -> None:
    THUMBS_DIR.mkdir(parents=True, exist_ok=True)

    for work in data["works"]:
        for image in work["images"]:
            source = ROOT / image["src"]
            if not source.exists():
                raise FileNotFoundError(source)

            thumb_name = f"{Path(image['src']).stem}.webp"
            destination = THUMBS_DIR / thumb_name

            photo = open_rgb(source)
            photo.thumbnail((THUMB_MAX, THUMB_MAX), Image.Resampling.LANCZOS)
            width, height = photo.size
            photo.save(
                destination,
                "WEBP",
                quality=WEBP_QUALITY,
                method=6,
                optimize=True,
            )

            image["thumb"] = f"thumbs/{thumb_name}"
            image["thumbWidth"] = width
            image["thumbHeight"] = height

    data["meta"]["thumbnailMode"] = f"webp-{THUMB_MAX}"


def fit_photo(path: Path, size: tuple[int, int]) -> Image.Image:
    photo = open_rgb(path)
    return ImageOps.fit(
        photo,
        size,
        method=Image.Resampling.LANCZOS,
        centering=(0.5, 0.5),
    )


def centered_text(draw: ImageDraw.ImageDraw, xy_y: int, text: str, font, fill) -> None:
    bbox = draw.textbbox((0, 0), text, font=font)
    width = bbox[2] - bbox[0]
    draw.text(((1200 - width) // 2, xy_y), text, font=font, fill=fill)


def generate_ogp(data: dict) -> None:
    ASSETS_DIR.mkdir(parents=True, exist_ok=True)

    all_images = [
        image
        for work in data["works"]
        for image in work["images"]
    ]
    if not all_images:
        return

    indexes = [
        0,
        len(all_images) // 3,
        (len(all_images) * 2) // 3,
        len(all_images) - 1,
    ]

    canvas = Image.new("RGB", (1200, 630), (11, 11, 12))
    cells = [
        (0, 0, 600, 315),
        (600, 0, 1200, 315),
        (0, 315, 600, 630),
        (600, 315, 1200, 630),
    ]

    for index, box in zip(indexes, cells):
        src = ROOT / all_images[index]["src"]
        tile = fit_photo(src, (box[2] - box[0], box[3] - box[1]))
        canvas.paste(tile, (box[0], box[1]))

    overlay = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    overlay_draw = ImageDraw.Draw(overlay)
    overlay_draw.rectangle((0, 0, 1200, 630), fill=(0, 0, 0, 78))
    overlay_draw.rectangle((0, 398, 1200, 630), fill=(6, 6, 7, 220))
    canvas = Image.alpha_composite(canvas.convert("RGBA"), overlay)

    draw = ImageDraw.Draw(canvas)
    title_font = load_font(54)
    sub_font = load_font(24)
    meta_font = load_font(20)

    centered_text(draw, 430, "むんきちゃんフォトコン", title_font, (255, 255, 255, 255))
    centered_text(draw, 505, "PHOTO GALLERY", sub_font, (210, 210, 214, 255))
    centered_text(
        draw,
        552,
        f"{data['meta']['workCount']} works  ·  {data['meta']['photoCount']} photos",
        meta_font,
        (155, 155, 165, 255),
    )

    canvas.convert("RGB").save(
        ASSETS_DIR / "ogp.jpg",
        "JPEG",
        quality=88,
        optimize=True,
        progressive=True,
    )


def main() -> None:
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    generate_thumbnails(data)
    generate_ogp(data)
    DATA_PATH.write_text(
        json.dumps(data, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
