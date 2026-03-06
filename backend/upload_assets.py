#!/usr/bin/env python3
"""
Upload all static images from frontend/public/images to the database.
This script reads all images and uploads them via the API.
Run this once to migrate all assets to the database.
"""

import os
import sys
import base64
import mimetypes
import requests
from pathlib import Path

IMAGES_DIR = Path(__file__).parent.parent / "frontend" / "public" / "images"
API_URL = os.environ.get("BACKEND_URL", "http://localhost:8000")

ASSETS_TO_UPLOAD = [
    {"path": "logo.png", "key": "logo", "category": "logo", "alt": "OeH Wirtschaft Logo"},
    {"path": "oehli-logo.png", "key": "oehli-logo", "category": "logo", "alt": "OeHli Chatbot Logo"},
    {"path": "background/hero-main.jpg", "key": "background/hero-main", "category": "background", "alt": "Hero Hauptbild"},
    {"path": "background/hero-small1.jpg", "key": "background/hero-small1", "category": "background", "alt": "Hero Klein 1"},
    {"path": "background/hero-small2.jpg", "key": "background/hero-small2", "category": "background", "alt": "Hero Klein 2"},
    {"path": "background/about-main.jpg", "key": "background/about-main", "category": "background", "alt": "Ueber uns Hauptbild"},
    {"path": "background/about-small.jpg", "key": "background/about-small", "category": "background", "alt": "Ueber uns Klein"},
    {"path": "background/slide-1.jpg", "key": "background/slide-1", "category": "background", "alt": "Slider Bild 1"},
    {"path": "background/slide-2.jpg", "key": "background/slide-2", "category": "background", "alt": "Slider Bild 2"},
    {"path": "background/slide-3.jpg", "key": "background/slide-3", "category": "background", "alt": "Slider Bild 3"},
    {"path": "background/slide-4.jpg", "key": "background/slide-4", "category": "background", "alt": "Slider Bild 4"},
    {"path": "background/slide-5.jpg", "key": "background/slide-5", "category": "background", "alt": "Slider Bild 5"},
    {"path": "background/bg-1.jpg", "key": "background/bg-1", "category": "background", "alt": "Hintergrund 1"},
    {"path": "background/bg-2.jpg", "key": "background/bg-2", "category": "background", "alt": "Hintergrund 2"},
    {"path": "background/bg-3.jpg", "key": "background/bg-3", "category": "background", "alt": "Hintergrund 3"},
    {"path": "background/bg-4.jpg", "key": "background/bg-4", "category": "background", "alt": "Hintergrund 4"},
    {"path": "background/bg-5.jpg", "key": "background/bg-5", "category": "background", "alt": "Hintergrund 5"},
    {"path": "background/bg-6.jpg", "key": "background/bg-6", "category": "background", "alt": "Hintergrund 6"},
    {"path": "background/bg-7.jpg", "key": "background/bg-7", "category": "background", "alt": "Hintergrund 7"},
    {"path": "background/bg-8.jpg", "key": "background/bg-8", "category": "background", "alt": "Hintergrund 8"},
    {"path": "background/gallery-1.jpg", "key": "background/gallery-1", "category": "background", "alt": "Galerie 1"},
    {"path": "background/gallery-2.jpg", "key": "background/gallery-2", "category": "background", "alt": "Galerie 2"},
    {"path": "background/gallery-3.jpg", "key": "background/gallery-3", "category": "background", "alt": "Galerie 3"},
    {"path": "background/gallery-4.jpg", "key": "background/gallery-4", "category": "background", "alt": "Galerie 4"},
    {"path": "background/gallery-5.jpg", "key": "background/gallery-5", "category": "background", "alt": "Galerie 5"},
    {"path": "team/Maximilian-Pilsner.png", "key": "team/maximilian-pilsner", "category": "team", "alt": "Maximilian Pilsner"},
    {"path": "team/Lucia-Schoisswohl.png", "key": "team/lucia-schoisswohl", "category": "team", "alt": "Lucia Schoisswohl"},
    {"path": "team/Stefan-Gstoettenmayer.png", "key": "team/stefan-gstoettenmayer", "category": "team", "alt": "Stefan Gstoettenmayer"},
    {"path": "team/Sebastian-Jensen.png", "key": "team/sebastian-jensen", "category": "team", "alt": "Sebastian Jensen"},
    {"path": "team/Carolina-Goetsch.png", "key": "team/carolina-goetsch", "category": "team", "alt": "Carolina Goetsch"},
    {"path": "team/Simon-Plangger.png", "key": "team/simon-plangger", "category": "team", "alt": "Simon Plangger"},
    {"path": "team/Matej-Kromka.png", "key": "team/matej-kromka", "category": "team", "alt": "Matej Kromka"},
    {"path": "team/Florian-Zimmermann.png", "key": "team/florian-zimmermann", "category": "team", "alt": "Florian Zimmermann"},
    {"path": "team/Maxim-Tafincev.png", "key": "team/maxim-tafincev", "category": "team", "alt": "Maxim Tafincev"},
    {"path": "team/Simon-Reisinger.png", "key": "team/simon-reisinger", "category": "team", "alt": "Simon Reisinger"},
    {"path": "team/Paul-Mairleitner.png", "key": "team/paul-mairleitner", "category": "team", "alt": "Paul Mairleitner"},
    {"path": "team/Sarika-Bimanaviona.png", "key": "team/sarika-bimanaviona", "category": "team", "alt": "Sarika Bimanaviona"},
    {"path": "team/Thomas-Kreilinger.png", "key": "team/thomas-kreilinger", "category": "team", "alt": "Thomas Kreilinger"},
    {"path": "team/Lilli-Huber.png", "key": "team/lilli-huber", "category": "team", "alt": "Lilli Huber"},
    {"path": "team/Theresa-Kloibhofer.png", "key": "team/theresa-kloibhofer", "category": "team", "alt": "Theresa Kloibhofer"},
    {"path": "team/Philipp-Bergsmann.png", "key": "team/philipp-bergsmann", "category": "team", "alt": "Philipp Bergsmann"},
    {"path": "team/Paul-Hamminger.png", "key": "team/paul-hamminger", "category": "team", "alt": "Paul Hamminger"},
    {"path": "team/Alex-Sighireanu.png", "key": "team/alex-sighireanu", "category": "team", "alt": "Alex Sighireanu"},
    {"path": "team/Victoria-Riener.png", "key": "team/victoria-riener", "category": "team", "alt": "Victoria Riener"},
    {"path": "team/placeholder-missing.png", "key": "team/placeholder-missing", "category": "team", "alt": "Platzhalter"},
    {"path": "Portraits/Maximilian-Pilsner-trans.png", "key": "portrait/maximilian-pilsner", "category": "portrait", "alt": "Maximilian Pilsner Portrait"},
    {"path": "Portraits/Lucia-Schoisswohl-trans.png", "key": "portrait/lucia-schoisswohl", "category": "portrait", "alt": "Lucia Schoisswohl Portrait"},
    {"path": "Portraits/Stefan-Gstoettenmayr-trans.png", "key": "portrait/stefan-gstoettenmayr", "category": "portrait", "alt": "Stefan Gstoettenmayer Portrait"},
    {"path": "Portraits/Theresa-Kloibhofer-trans.png", "key": "portrait/theresa-kloibhofer", "category": "portrait", "alt": "Theresa Kloibhofer Portrait"},
    {"path": "Portraits/Michael-Tremetzberger-trans.png", "key": "portrait/michael-tremetzberger", "category": "portrait", "alt": "Michael Tremetzberger Portrait"},
    {"path": "Portraits/team-transparent.png", "key": "portrait/team-transparent", "category": "portrait", "alt": "Team Portrait"},
]


def get_mime_type(filepath):
    mime, _ = mimetypes.guess_type(filepath)
    return mime or "application/octet-stream"


def read_and_encode_image(filepath):
    with open(filepath, "rb") as f:
        data = f.read()
    b64 = base64.b64encode(data).decode("utf-8")
    mime = get_mime_type(str(filepath))
    return f"data:{mime};base64,{b64}", mime


def upload_all_assets(token):
    print(f"Uploading assets from {IMAGES_DIR}")
    print(f"API URL: {API_URL}")
    print("-" * 50)

    assets_data = []
    skipped = []

    for asset in ASSETS_TO_UPLOAD:
        filepath = IMAGES_DIR / asset["path"]
        if not filepath.exists():
            skipped.append(asset["path"])
            continue

        data_url, mime_type = read_and_encode_image(filepath)
        assets_data.append({
            "asset_key": asset["key"],
            "data_url": data_url,
            "mime_type": mime_type,
            "filename": asset["path"].split("/")[-1],
            "category": asset["category"],
            "alt_text": asset.get("alt")
        })
        print(f"  Prepared: {asset['key']}")

    if skipped:
        print(f"\nSkipped {len(skipped)} missing files:")
        for s in skipped:
            print(f"  - {s}")

    print(f"\nUploading {len(assets_data)} assets...")

    import json
    headers = {"Authorization": f"Bearer {token}"}

    response = requests.post(
        f"{API_URL}/api/admin/assets/bulk-upload",
        data={"assets_data": json.dumps(assets_data)},
        headers=headers
    )

    if response.status_code == 200:
        result = response.json()
        print(f"\nSuccess! Uploaded {result.get('uploaded', 0)} assets")
        if result.get("errors"):
            print("Errors:")
            for err in result["errors"]:
                print(f"  - {err}")
    else:
        print(f"Error: {response.status_code}")
        print(response.text)


def login_and_get_token():
    username = os.environ.get("MASTER_ADMIN_USERNAME")
    password = os.environ.get("MASTER_ADMIN_PASSWORD")

    if not username or not password:
        print("Error: MASTER_ADMIN_USERNAME and MASTER_ADMIN_PASSWORD must be set")
        sys.exit(1)

    response = requests.post(
        f"{API_URL}/api/auth/login",
        json={"username": username, "password": password}
    )

    if response.status_code != 200:
        print(f"Login failed: {response.status_code}")
        print(response.text)
        sys.exit(1)

    return response.json()["access_token"]


if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()

    API_URL = os.environ.get("BACKEND_URL", "http://localhost:8000")

    print("Logging in...")
    token = login_and_get_token()
    print("Login successful!\n")

    upload_all_assets(token)
