"""Organise supplied originals and resize them for the web; never synthesise imagery."""
import json
import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCES = ROOT / 'assets' / 'herby-health'
PUBLIC = ROOT / 'public' / 'images' / 'herby-health'
PRODUCTS = {
    'hibiscus': 'Hibiscus', 'collagen': 'Collagen', 'moringa': 'Moringa',
    'sea-moss': 'Sea-Moss', 'bay-leaves': 'Bay-Leaves', 'cinnamon': 'Cinnamon',
    'chia-seeds': 'Chia-Seeds', 'ashwagandha': 'Ashwagandha',
}


def organise():
    for original in ROOT.iterdir():
        if not original.is_file() or original.suffix.lower() not in {'.png', '.jpg', '.webp'}:
            continue
        if original.stem in PRODUCTS.values():
            group = 'products'
        elif original.stem.startswith(('hero ', 'hibiscus-hero')):
            group = 'heroes'
        elif original.stem in {'Collection-Preview', 'product-sprites'}:
            group = 'reference'
        else:
            group = 'editorial'
        destination = (SOURCES / group / original.name).resolve()
        # Check both resolved targets before moving any source file.
        if original.resolve().parent != ROOT or not destination.is_relative_to(SOURCES.resolve()):
            raise ValueError(f'Unexpected asset path: {original}')
        destination.parent.mkdir(parents=True, exist_ok=True)
        if destination.exists():
            raise FileExistsError(destination)
        shutil.move(str(original), str(destination))
    for filename in ['images.json', 'product-sprites.css']:
        original = ROOT / filename
        if original.exists():
            destination = SOURCES / 'reference' / filename
            destination.parent.mkdir(parents=True, exist_ok=True)
            if destination.exists():
                raise FileExistsError(destination)
            shutil.move(str(original), str(destination))


def export(source, folder, slug, widths, alt):
    destination = PUBLIC / folder
    destination.mkdir(parents=True, exist_ok=True)
    with Image.open(source) as original:
        original = original.convert('RGB')
        width, height = original.size
        candidates = [size for size in widths if size <= width]
        for size in candidates:
            resized = original.resize((size, round(height * size / width)), Image.Resampling.LANCZOS)
            resized.save(destination / f'{slug}-{size}.webp', 'WEBP', quality=88, method=6)
    base = f'/images/herby-health/{folder}/{slug}'
    return {
        'src': f'{base}-{candidates[-1]}.webp',
        'srcSet': ', '.join(f'{base}-{size}.webp {size}w' for size in candidates),
        'fallback': f'{base}-{candidates[-1]}.webp',
        'width': width, 'height': height, 'alt': alt,
    }


if __name__ == '__main__':
    organise()
    manifest_path = ROOT / 'src' / 'data' / 'images.json'
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    for slug, filename in PRODUCTS.items():
        manifest[f'{slug}-product'] = export(
            SOURCES / 'products' / f'{filename}.png', 'products', slug,
            [320, 480, 640, 800, 1080],
            f'Herby Health {filename.replace("-", " ")} in amber glass with a mulberry lid.',
        )
    for key, filename, alt in [
        ('garden-aerial', 'hero 0.png', 'An aerial view of garden beds surrounding a small farmhouse.'),
        ('garden-harvest', 'hero 1.png', 'Hands gathering fresh moringa leaves into a woven basket.'),
    ]:
        manifest[key] = export(SOURCES / 'heroes' / filename, 'heroes', key,
                               [480, 640, 960, 1280, 1600], alt)
    manifest_path.write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    print('Organised supplied originals; exported 8 product photos and 2 garden photos.')
