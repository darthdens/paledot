#!/usr/bin/env python3
# Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
"""Re-check cached NASA metadata and simplified-path milestone sources, then stamp retrieval times."""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import json
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / 'public' / 'left-behind'
MANIFEST = DATA / 'photos' / 'manifest.json'
SIMPLIFIED_SOURCES = {
    'apollo-11': ['https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_artifact_impacts.html'],
    'apollo-15': ['https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_artifact_impacts.html'],
    'apollo-16': ['https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_artifact_impacts.html'],
    'apollo-17': ['https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_artifact_impacts.html'],
    'viking-1': ['https://nssdc.gsfc.nasa.gov/planetary/viking.html'],
    'opportunity': [
        'https://science.nasa.gov/missions/mer/nasas-opportunity-rover-mission-on-mars-comes-to-end/',
        'https://pds-geosciences.wustl.edu/mer/urn-nasa-pds-mer_documentation/document/mission/mer_mission.txt',
    ],
}
HEADERS = {'User-Agent': 'PaleDot/1.0 (NASA source metadata verification)'}


def get(url: str) -> requests.Response:
    response = requests.get(url, headers=HEADERS, timeout=45)
    response.raise_for_status()
    return response


def check_photo(photo: dict) -> None:
    nasa_id = photo['nasaId']
    response = get(f'https://images-api.nasa.gov/search?nasa_id={nasa_id}')
    items = response.json().get('collection', {}).get('items', [])
    if not any(nasa_id in item.get('data', [])[0].get('nasa_id', '') for item in items if item.get('data')):
        raise RuntimeError(f'NASA image metadata not found for {nasa_id}')


def check_source(url: str) -> None:
    if not get(url).content:
        raise RuntimeError(f'Empty milestone source: {url}')


def main() -> None:
    photos = json.loads(MANIFEST.read_text())
    source_urls = sorted({url for urls in SIMPLIFIED_SOURCES.values() for url in urls})
    # Finish every remote check before changing any cached file.
    with ThreadPoolExecutor(max_workers=8) as pool:
        list(pool.map(check_photo, photos))
        list(pool.map(check_source, source_urls))
    retrieved_at = datetime.now(timezone.utc).isoformat(timespec='milliseconds').replace('+00:00', 'Z')
    for photo in photos:
        photo['retrievedAt'] = retrieved_at
    MANIFEST.write_text(json.dumps(photos, ensure_ascii=False, separators=(',', ':')) + '\n')
    for trajectory_id, urls in SIMPLIFIED_SOURCES.items():
        path = DATA / 'trajectories' / f'{trajectory_id}.json'
        trajectory = json.loads(path.read_text())
        if trajectory.get('source') != 'simplified':
            raise RuntimeError(f'Unexpected trajectory source for {trajectory_id}')
        trajectory['milestoneSources'] = urls
        trajectory['retrievedAt'] = retrieved_at
        path.write_text(json.dumps(trajectory, ensure_ascii=False, separators=(',', ':')) + '\n')
    print(f'Rechecked {len(photos)} NASA image records and {len(source_urls)} milestone source pages at {retrieved_at}.')


if __name__ == '__main__':
    main()
