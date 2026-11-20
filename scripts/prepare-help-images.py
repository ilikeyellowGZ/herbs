"""Export appropriately cropped help banners from the supplied garden original."""
import json
from pathlib import Path
from PIL import Image, ImageOps

root = Path(__file__).resolve().parents[1]
target = root / 'public/images/herby-health/heroes'
manifest_path = root / 'src/data/images.json'
manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
with Image.open(root / 'assets/herby-health/heroes/hero 0.png') as original:
    for key, ratio, widths in [
        ('help-garden', 128 / 25, [768, 1024, 1280, 1600]),
        ('help-garden-mobile', 18 / 13, [360, 480, 640, 960]),
    ]:
        for width in widths:
            crop = ImageOps.fit(original.convert('RGB'), (width, round(width / ratio)), Image.Resampling.LANCZOS, centering=(0.5, 0.6))
            crop.save(target / f'{key}-{width}.webp', quality=70, method=6)
        url = f'/images/herby-health/heroes/{key}'
        manifest[key] = {
            'src': f'{url}-{widths[-1]}.webp',
            'srcSet': ', '.join(f'{url}-{width}.webp {width}w' for width in widths),
            'fallback': f'{url}-{widths[-1]}.webp',
            'width': widths[-1], 'height': round(widths[-1] / ratio),
            'alt': 'An aerial view of the Herby Health garden.',
        }
manifest_path.write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
print('Exported eight responsive help banner images.')
