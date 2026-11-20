"""Copy approved generated originals and export responsive product gallery photos."""
import json
import runpy
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
export = runpy.run_path(str(ROOT / 'scripts' / 'prepare-assets.py'))['export']
sources = json.loads((ROOT / 'assets/herby-health/product-gallery/generation.json').read_text(encoding='utf-8'))
manifest_path = ROOT / 'src/data/images.json'
manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
descriptions = {
    'collagen-preparation': 'Hands stirring a warm drink beside the Herby Health Collagen jar.',
    'collagen-serving': 'A breakfast bowl of yogurt and pear beside the Herby Health Collagen jar.',
    'moringa-preparation': 'Hands stirring moringa powder into a smoothie beside the Herby Health Moringa jar.',
    'moringa-serving': 'A green smoothie bowl with banana beside the Herby Health Moringa jar.',
    'sea-moss-preparation': 'Hands rinsing golden sea moss in water beside the Herby Health Sea Moss jar.',
    'sea-moss-serving': 'A creamy fruit smoothie and hydrated sea moss beside the Herby Health Sea Moss jar.',
    'bay-leaves-preparation': 'A bay leaf being added to simmering stew beside the Herby Health Bay Leaves jar.',
    'bay-leaves-serving': 'Stew being served into a ceramic bowl beside the Herby Health Bay Leaves jar.',
    'cinnamon-preparation': 'Hands adding a cinnamon quill to tea beside the Herby Health Cinnamon jar.',
    'cinnamon-serving': 'Warm porridge with pear and cinnamon beside the Herby Health Cinnamon jar.',
    'chia-seeds-preparation': 'Hands stirring chia seeds into milk beside the Herby Health Chia Seeds jar.',
    'chia-seeds-serving': 'A spoonful of soaked chia pudding with berries beside the Herby Health Chia Seeds jar.',
    'ashwagandha-preparation': 'Hands holding a warm ceramic mug beside the closed Herby Health Ashwagandha jar.',
    'ashwagandha-serving': 'A quiet moment with a ceramic cup by a window and the Herby Health Ashwagandha jar.',
}
for key, metadata in sources.items():
    original = ROOT / 'assets/herby-health/product-gallery' / f'{key}.png'
    if not original.exists():
        shutil.copy2(metadata['source'], original)
    manifest[key] = export(original, 'product-gallery', key, [160, 320, 480, 640, 800, 1080], descriptions[key])
manifest_path.write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
print(f'Exported {len(sources)} product-in-use photos and updated the image manifest.')
