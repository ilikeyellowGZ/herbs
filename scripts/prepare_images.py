"""Create responsive bottle derivatives, preserving the supplied source files."""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parent.parent
target = root / 'public' / 'images' / 'herby-health'
for name in ['Hibiscus', 'Collagen', 'Moringa', 'Sea-Moss', 'Bay-Leaves', 'Cinnamon', 'Chia-Seeds', 'Ashwagandha']:
    source = root / 'assets' / 'herby-health' / 'products' / f'{name}.webp'
    if not source.exists():
        source = root / f'{name}.webp'
    with Image.open(source) as image:
        for width in [160, 320, 480, 640, 800]:
            height = round(image.height * width / image.width)
            image.resize((width, height), Image.Resampling.LANCZOS).save(target / f'{name}-bottle-{width}.webp', quality=82, method=6)
print('Created responsive derivatives for all eight bottle images.')
