import argparse
import csv
import json
import os
import random
import re
import time
from pathlib import Path
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup


BASE_URL = "https://www.dofus-touch.com"
ROOT_DIR = Path(__file__).resolve().parent
HTML_DIR = ROOT_DIR / "html" / "monstres"
DEEP_HTML_DIR = ROOT_DIR / "deep_html" / "monstres"
DATA_DIR = ROOT_DIR / "data"
JSON_DIR = DATA_DIR / "json"

DEFAULT_LIST_PAGES = list(range(1, 57))
DEFAULT_MONSTER_URLS = [
    "https://www.dofus-touch.com/fr/mmorpg/encyclopedie/monstres/2309-abrakroc-edente"
]
DEFAULT_DETAIL_DELAY = 0.0
DEFAULT_RATE_LIMIT_PAUSE = 300.0

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/126.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
    "Referer": "https://www.dofus-touch.com/fr/mmorpg/encyclopedie/monstres",
}

SESSION = requests.Session()
SESSION.headers.update(HEADERS)

RESISTANCE_LABELS = {
    "neutral": "neutral",
    "neutre": "neutral",
    "earth": "earth",
    "terre": "earth",
    "fire": "fire",
    "feu": "fire",
    "water": "water",
    "eau": "water",
    "air": "air",
}


class RateLimitedError(RuntimeError):
    pass


def clean_text(text: str | None) -> str:
    if not text:
        return ""
    return re.sub(r"\s+", " ", text).strip()


def normalize_label(text: str) -> str:
    replacements = {
        "é": "e",
        "è": "e",
        "ê": "e",
        "ë": "e",
        "à": "a",
        "â": "a",
        "î": "i",
        "ï": "i",
        "ô": "o",
        "ù": "u",
        "û": "u",
        "ç": "c",
    }
    normalized = text.lower()
    for source, target in replacements.items():
        normalized = normalized.replace(source, target)
    return normalized


def has_css_class(tag, class_name: str) -> bool:
    return class_name in (tag.get("class") or [])


def parse_first_int(text: str | None) -> int | None:
    match = re.search(r"-?\d+", clean_text(text))
    return int(match.group(0)) if match else None


def parse_number_range(text: str | None) -> tuple[int | None, int | None]:
    cleaned = clean_text(text).replace("\u202f", " ").replace("\xa0", " ")
    numbers = [int(number.replace(" ", "")) for number in re.findall(r"[+-]?\d[\d ]*", cleaned)]
    if not numbers:
        return None, None
    if len(numbers) == 1:
        return numbers[0], numbers[0]
    return numbers[0], numbers[1]


def parse_probability(text: str | None) -> float | None:
    cleaned = clean_text(text).replace(",", ".")
    match = re.search(r"(\d+(?:\.\d+)?)\s*%", cleaned)
    return float(match.group(1)) if match else None


def is_blocked_html(html_content: str) -> bool:
    markers = [
        "403 ERROR",
        "The request could not be satisfied",
        "verify that you're not a robot",
        "JavaScript is disabled",
    ]
    return any(marker in html_content for marker in markers)


def request_html(url: str, retries: int = 3, delay: float = 2.0) -> str:
    last_error: Exception | None = None
    for attempt in range(1, retries + 1):
        try:
            response = SESSION.get(url, timeout=20)
            if response.status_code == 403:
                raise RateLimitedError(f"403 Client Error: Forbidden for url: {url}")
            response.raise_for_status()
            if is_blocked_html(response.text):
                raise RateLimitedError("Page bloquée par anti-bot/CloudFront")
            return response.text
        except RateLimitedError:
            raise
        except Exception as exc:
            last_error = exc
            if attempt < retries:
                print(f"⚠️ {url} indisponible ({exc}) - tentative {attempt}/{retries}")
                time.sleep(delay * attempt)
    raise RuntimeError(f"Impossible de télécharger {url}: {last_error}")


def split_id_slug(url_or_href: str) -> tuple[str, str]:
    path = urlparse(url_or_href).path or url_or_href
    tail = path.rstrip("/").split("/")[-1]
    match = re.match(r"(?P<id>\d+)-(?P<slug>.+)", tail)
    if not match:
        raise ValueError(f"URL monstre invalide: {url_or_href}")
    return match.group("id"), match.group("slug")


def make_full_url(href: str) -> str:
    if href.startswith("http"):
        return href
    return f"{BASE_URL}{href}"


def fetch_list_page_if_missing(page: int) -> str | None:
    HTML_DIR.mkdir(parents=True, exist_ok=True)
    filename = HTML_DIR / f"monstres_page_{page}.html"
    if filename.exists():
        print(f"✓ Fichier existant: {filename}")
        return filename.read_text(encoding="utf-8")

    url = f"{BASE_URL}/fr/mmorpg/encyclopedie/monstres?page={page}"
    print(f"📥 Téléchargement: {url}")
    try:
        html_content = request_html(url, retries=3)
    except RateLimitedError:
        raise
    except Exception as exc:
        print(f"❌ {exc}")
        return None

    filename.write_text(html_content, encoding="utf-8")
    return html_content


def wait_until_reopened(
    source: dict,
    detail_retries: int,
    request_delay: float,
    rate_limit_pause: float,
) -> str:
    while True:
        print(f"⏸️ Rate limit détecté. Pause {rate_limit_pause:.0f}s avant retry...")
        time.sleep(rate_limit_pause)
        try:
            html_content = fetch_monster_page_if_missing(
                source["url"],
                retries=detail_retries,
                request_delay=request_delay,
            )
            if html_content:
                print("✅ Fenêtre rouverte, reprise du spam.")
                return html_content
        except RateLimitedError as exc:
            print(f"⚠️ Toujours fermé: {exc}")


def monster_cache_path(monster_url: str) -> Path:
    monster_id, monster_slug = split_id_slug(monster_url)
    return DEEP_HTML_DIR / f"{monster_id}_{monster_slug}.html"


def fetch_monster_page_if_missing(
    monster_url: str,
    retries: int = 1,
    request_delay: float = DEFAULT_DETAIL_DELAY,
    cache_only: bool = False,
) -> str | None:
    DEEP_HTML_DIR.mkdir(parents=True, exist_ok=True)
    filename = monster_cache_path(monster_url)
    if filename.exists():
        print(f"✓ Fichier existant: {filename}")
        return filename.read_text(encoding="utf-8")

    if cache_only:
        print(f"⚠️ Cache manquant: {filename}")
        return None

    time.sleep(request_delay + random.uniform(0, request_delay * 0.35))
    print(f"📥 Téléchargement: {monster_url}")
    try:
        html_content = request_html(monster_url, retries=retries)
    except Exception as exc:
        print(f"❌ {exc}")
        return None

    filename.write_text(html_content, encoding="utf-8")
    return html_content


def extract_monster_urls_from_html(html_content: str) -> list[dict]:
    soup = BeautifulSoup(html_content, "html.parser")
    monsters = []
    for link in soup.find_all("a", href=re.compile(r"/fr/mmorpg/encyclopedie/monstres/\d+-")):
        href = link.get("href")
        if not href:
            continue
        try:
            monster_id, monster_slug = split_id_slug(href)
        except ValueError:
            continue
        monsters.append(
            {
                "monster_id": monster_id,
                "monster_slug": monster_slug,
                "url": make_full_url(href),
            }
        )

    seen = set()
    unique_monsters = []
    for monster in monsters:
        if monster["monster_id"] in seen:
            continue
        seen.add(monster["monster_id"])
        unique_monsters.append(monster)
    return unique_monsters


def panel_title(panel) -> str:
    title = panel.find("div", class_="ak-panel-title", recursive=False)
    return clean_text(title.get_text(" ", strip=True)) if title else ""


def find_panels(soup: BeautifulSoup, title_pattern: str):
    regex = re.compile(title_pattern, re.IGNORECASE)
    return [
        panel
        for panel in soup.find_all(lambda tag: tag.name == "div" and has_css_class(tag, "ak-panel"))
        if regex.search(panel_title(panel))
    ]


def extract_link_entity(element, expected_category: str | None = None) -> dict:
    href_pattern = r"/fr/mmorpg/encyclopedie/([^/]+)/(\d+)-([^\"#?]+)"
    links = element.find_all("a", href=re.compile(href_pattern))
    link = next((candidate for candidate in links if clean_text(candidate.get_text(" ", strip=True))), None)
    if not link and links:
        link = links[0]
    if not link:
        return {}

    href = link.get("href", "")
    match = re.search(href_pattern, href)
    if not match:
        return {}

    category, entity_id, slug = match.groups()
    if expected_category and category != expected_category:
        return {}

    image = element.find("img")
    return {
        "id": entity_id,
        "name": clean_text(link.get_text(" ", strip=True)),
        "category": category,
        "slug": slug,
        "url": make_full_url(href),
        "image_url": image.get("src") or image.get("data-src") if image else None,
    }


def extract_monster_name(soup: BeautifulSoup) -> str:
    title = soup.find("h1", class_="ak-return-link") or soup.find("h1")
    return clean_text(title.get_text(" ", strip=True)) if title else ""


def extract_monster_basics(soup: BeautifulSoup) -> dict:
    info = {
        "name": extract_monster_name(soup),
        "type": None,
        "level": None,
        "image_url": None,
    }

    image = soup.select_one(".ak-encyclo-detail-illu img")
    if image:
        info["image_url"] = image.get("src") or image.get("data-src")

    type_element = soup.select_one(".ak-encyclo-detail-type span")
    if type_element:
        info["type"] = clean_text(type_element.get_text(" ", strip=True))

    level_element = soup.select_one(".ak-encyclo-detail-level")
    if level_element:
        info["level"] = parse_first_int(level_element.get_text(" ", strip=True))

    return info


def stat_label_from_element(element) -> str:
    pieces = []
    for script in element.find_all("script", type="application/json"):
        pieces.append(script.get_text(" ", strip=True))

    aside = element.find("div", class_="ak-aside")
    if aside:
        pieces.append(" ".join(aside.get("class", [])))
        pieces.append(aside.get_text(" ", strip=True))

    title = element.find("div", class_="ak-title")
    if title:
        pieces.append(title.get_text(" ", strip=True))

    return normalize_label(" ".join(pieces))


def extract_stats(soup: BeautifulSoup) -> dict:
    stats = {
        "pv_min": None,
        "pv_max": None,
        "resistances": {
            "neutral": {"min": None, "max": None},
            "earth": {"min": None, "max": None},
            "fire": {"min": None, "max": None},
            "water": {"min": None, "max": None},
            "air": {"min": None, "max": None},
        },
    }

    for element in soup.find_all(lambda tag: tag.name == "div" and has_css_class(tag, "ak-list-element")):
        title = element.find("div", class_="ak-title")
        title_text = clean_text(title.get_text(" ", strip=True)) if title else ""
        label = stat_label_from_element(element)

        if any(marker in label for marker in ["point de vie", "points de vie", "vitalite", "pv"]):
            stats["pv_min"], stats["pv_max"] = parse_number_range(title_text)
            continue

        for marker, resistance_key in RESISTANCE_LABELS.items():
            if marker in label:
                resistance_min, resistance_max = parse_number_range(title_text)
                if resistance_min is not None:
                    stats["resistances"][resistance_key] = {
                        "min": resistance_min,
                        "max": resistance_max,
                    }
                break

    page_text = clean_text(soup.get_text(" ", strip=True))
    if stats["pv_min"] is None:
        pv_match = re.search(r"(\d[\d ]*)\s*(?:a|à|-)\s*(\d[\d ]*)\s*(?:PV|points de vie)", page_text, re.IGNORECASE)
        if pv_match:
            stats["pv_min"], stats["pv_max"] = parse_number_range(pv_match.group(0))

    return stats


def extract_zones(soup: BeautifulSoup) -> list[str]:
    zones = []
    for panel in find_panels(soup, r"^zones?$"):
        content = panel.find("div", class_="ak-panel-content", recursive=False)
        if not content:
            continue
        zone_text = clean_text(content.get_text(" ", strip=True))
        zones.extend(zone.strip() for zone in zone_text.split(",") if zone.strip())

    seen = set()
    unique_zones = []
    for zone in zones:
        if zone in seen:
            continue
        seen.add(zone)
        unique_zones.append(zone)
    return unique_zones


def extract_drops_from_panel(panel, drop_kind: str) -> list[dict]:
    drops = []
    list_elements = panel.find_all(lambda tag: tag.name == "div" and has_css_class(tag, "ak-list-element"))
    for element in list_elements:
        nearest_panel = element.find_parent(lambda tag: tag.name == "div" and has_css_class(tag, "ak-panel"))
        if nearest_panel is not panel:
            continue

        item = extract_link_entity(element)
        if not item or item["category"] == "monstres":
            continue

        aside = element.find("div", class_="ak-aside")
        item_level = parse_first_int(aside.get_text(" ", strip=True)) if aside else None
        probability_element = element.find("div", class_="ak-drop-percent")
        probability_text = clean_text(probability_element.get_text(" ", strip=True)) if probability_element else ""
        if not probability_text:
            probability_text = clean_text(element.get_text(" ", strip=True))
        text_elements = [clean_text(text.get_text(" ", strip=True)) for text in element.find_all("div", class_="ak-text")]
        front = element.find("div", class_="ak-front")
        front_text = clean_text(front.get_text(" ", strip=True)) if front else ""

        condition = ""
        if drop_kind == "conditioned":
            candidates = [front_text, *text_elements]
            condition = " | ".join(candidate for candidate in candidates if candidate and "%" not in candidate)

        drops.append(
            {
                "item_id": item["id"],
                "item_name": item["name"],
                "item_category": item["category"],
                "item_slug": item["slug"],
                "item_url": item["url"],
                "item_image_url": item["image_url"],
                "item_level": item_level,
                "item_type": next((text for text in text_elements if "%" not in text), None),
                "probability": parse_probability(probability_text),
                "probability_text": probability_text,
                "condition": condition or None,
                "drop_kind": drop_kind,
            }
        )
    return drops


def extract_drops(soup: BeautifulSoup) -> dict:
    normal_drops = []
    conditioned_drops = []

    for panel in find_panels(soup, r"butin|drop"):
        title = normalize_label(panel_title(panel))
        if "condition" in title:
            conditioned_drops.extend(extract_drops_from_panel(panel, "conditioned"))
        else:
            normal_drops.extend(extract_drops_from_panel(panel, "normal"))

    return {
        "drops": normal_drops,
        "conditioned_drops": conditioned_drops,
    }


def extract_monster_details(html_content: str, source_url: str | None = None) -> dict:
    soup = BeautifulSoup(html_content, "html.parser")
    basics = extract_monster_basics(soup)
    stats = extract_stats(soup)
    zones = extract_zones(soup)
    drops = extract_drops(soup)

    monster_id = None
    monster_slug = None
    if source_url:
        monster_id, monster_slug = split_id_slug(source_url)

    return {
        "monster_id": monster_id,
        "monster_slug": monster_slug,
        "name": basics["name"],
        "type": basics["type"],
        "level": basics["level"],
        "image_url": basics["image_url"],
        "url": source_url,
        "pv_min": stats["pv_min"],
        "pv_max": stats["pv_max"],
        "zones": zones,
        "resistances": stats["resistances"],
        "drops": drops["drops"],
        "conditioned_drops": drops["conditioned_drops"],
    }


def flatten_monsters(monsters: list[dict]) -> list[dict]:
    rows = []
    for monster in monsters:
        resistances = monster["resistances"]
        rows.append(
            {
                "monster_id": monster["monster_id"],
                "monster_slug": monster["monster_slug"],
                "name": monster["name"],
                "type": monster["type"],
                "level": monster["level"],
                "pv_min": monster["pv_min"],
                "pv_max": monster["pv_max"],
                "zones": " | ".join(monster["zones"]),
                "res_neutral_min": resistances["neutral"]["min"],
                "res_neutral_max": resistances["neutral"]["max"],
                "res_earth_min": resistances["earth"]["min"],
                "res_earth_max": resistances["earth"]["max"],
                "res_fire_min": resistances["fire"]["min"],
                "res_fire_max": resistances["fire"]["max"],
                "res_water_min": resistances["water"]["min"],
                "res_water_max": resistances["water"]["max"],
                "res_air_min": resistances["air"]["min"],
                "res_air_max": resistances["air"]["max"],
                "image_url": monster["image_url"],
                "url": monster["url"],
            }
        )
    return rows


def flatten_drops(monsters: list[dict]) -> list[dict]:
    rows = []
    for monster in monsters:
        for drop in [*monster["drops"], *monster["conditioned_drops"]]:
            rows.append(
                {
                    "monster_id": monster["monster_id"],
                    "monster_name": monster["name"],
                    "drop_kind": drop["drop_kind"],
                    "item_id": drop["item_id"],
                    "item_name": drop["item_name"],
                    "item_category": drop["item_category"],
                    "item_type": drop["item_type"],
                    "item_level": drop["item_level"],
                    "probability": drop["probability"],
                    "probability_text": drop["probability_text"],
                    "condition": drop["condition"],
                    "item_url": drop["item_url"],
                    "item_image_url": drop["item_image_url"],
                }
            )
    return rows


def write_csv(path: Path, rows: list[dict]) -> None:
    if not rows:
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


def save_monster_sources(sources: list[dict]) -> None:
    write_csv(DATA_DIR / "monster_sources.csv", sources)
    print(f"💾 URLs sauvegardées: {DATA_DIR / 'monster_sources.csv'}")


def save_failed_sources(failed_sources: list[dict]) -> None:
    if not failed_sources:
        return
    write_csv(DATA_DIR / "monster_failed_sources.csv", failed_sources)
    print(f"⚠️ Échecs sauvegardés: {DATA_DIR / 'monster_failed_sources.csv'}")


def save_monsters(monsters: list[dict]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    JSON_DIR.mkdir(parents=True, exist_ok=True)

    with (JSON_DIR / "monsters.json").open("w", encoding="utf-8") as file:
        json.dump(monsters, file, ensure_ascii=False, indent=4)

    write_csv(DATA_DIR / "monstres_data.csv", flatten_monsters(monsters))
    write_csv(DATA_DIR / "monster_drops.csv", flatten_drops(monsters))

    print(f"💾 JSON sauvegardé: {JSON_DIR / 'monsters.json'}")
    print(f"💾 CSV sauvegardé: {DATA_DIR / 'monstres_data.csv'}")
    print(f"💾 CSV sauvegardé: {DATA_DIR / 'monster_drops.csv'}")


def collect_monster_sources(pages: list[int], monster_urls: list[str], include_list_details: bool) -> list[dict]:
    sources = []
    for page in pages:
        html_content = fetch_list_page_if_missing(page)
        if not html_content:
            continue
        page_monsters = extract_monster_urls_from_html(html_content)
        print(f"✓ Page monstres {page}: {len(page_monsters)} URLs trouvées")
        sources.extend(page_monsters)

    for monster_url in monster_urls:
        monster_id, monster_slug = split_id_slug(monster_url)
        sources.append(
            {
                "monster_id": monster_id,
                "monster_slug": monster_slug,
                "url": monster_url,
            }
        )

    unique_sources = {}
    for source in sources:
        unique_sources[source["monster_id"]] = source
    return list(unique_sources.values())


def scrape_monsters(
    pages: list[int],
    monster_urls: list[str],
    include_list_details: bool,
    detail_retries: int,
    detail_delay: float,
    stop_after_consecutive_failures: int,
    save_every: int,
    cache_only: bool,
    rate_limit_pause: float,
) -> tuple[list[dict], list[dict]]:
    sources = collect_monster_sources(pages, monster_urls, include_list_details)
    save_monster_sources(sources)
    if not include_list_details:
        return [], []

    monsters = []
    failed_sources = []
    consecutive_failures = 0

    for index, source in enumerate(sources, 1):
        print(f"🔍 [{index}/{len(sources)}] {source['url']}")
        try:
            html_content = fetch_monster_page_if_missing(
                source["url"],
                retries=detail_retries,
                request_delay=detail_delay,
                cache_only=cache_only,
            )
        except RateLimitedError as exc:
            print(f"⚠️ {exc}")
            save_failed_sources(failed_sources)
            if monsters:
                save_monsters(monsters)
            html_content = wait_until_reopened(
                source=source,
                detail_retries=detail_retries,
                request_delay=detail_delay,
                rate_limit_pause=rate_limit_pause,
            )

        if not html_content:
            failed_sources.append(source)
            consecutive_failures += 1
            if (
                stop_after_consecutive_failures > 0
                and not cache_only
                and consecutive_failures >= stop_after_consecutive_failures
            ):
                print(
                    "⏸️ Arrêt après "
                    f"{consecutive_failures} échecs consécutifs. "
                    "Relance plus tard pour reprendre depuis le cache."
                )
                break
            continue
        consecutive_failures = 0
        monster = extract_monster_details(html_content, source["url"])
        monster["monster_id"] = source["monster_id"]
        monster["monster_slug"] = source["monster_slug"]
        monsters.append(monster)
        if save_every > 0 and len(monsters) % save_every == 0:
            save_failed_sources(failed_sources)
            save_monsters(monsters)

    return monsters, failed_sources


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Scrape les monstres Dofus Touch.")
    parser.add_argument("--pages", type=int, nargs="*", default=DEFAULT_LIST_PAGES)
    parser.add_argument("--monster-url", action="append", dest="monster_urls", default=[])
    parser.add_argument(
        "--no-list-details",
        action="store_true",
        help="Télécharge les pages de liste sans télécharger les fiches des monstres listés.",
    )
    parser.add_argument(
        "--detail-retries",
        type=int,
        default=1,
        help="Nombre d'essais par fiche monstre avant de passer à la suivante.",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=DEFAULT_DETAIL_DELAY,
        help="Délai minimum entre deux téléchargements de fiches détail. Défaut: 0 pour spammer.",
    )
    parser.add_argument(
        "--rate-limit-pause",
        type=float,
        default=DEFAULT_RATE_LIMIT_PAUSE,
        help="Pause en secondes après un 403 avant de retenter la même fiche.",
    )
    parser.add_argument(
        "--stop-after-consecutive-failures",
        type=int,
        default=8,
        help="Stoppe le crawl après N échecs consécutifs (0 pour désactiver).",
    )
    parser.add_argument(
        "--save-every",
        type=int,
        default=25,
        help="Sauvegarde les CSV/JSON partiels tous les N monstres extraits.",
    )
    parser.add_argument(
        "--cache-only",
        action="store_true",
        help="N'effectue aucun téléchargement de fiche détail, extrait seulement le cache local.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    monster_urls = args.monster_urls or DEFAULT_MONSTER_URLS
    monsters, failed_sources = scrape_monsters(
        pages=args.pages,
        monster_urls=monster_urls,
        include_list_details=not args.no_list_details,
        detail_retries=args.detail_retries,
        detail_delay=args.delay,
        stop_after_consecutive_failures=args.stop_after_consecutive_failures,
        save_every=args.save_every,
        cache_only=args.cache_only,
        rate_limit_pause=args.rate_limit_pause,
    )
    save_failed_sources(failed_sources)

    if not monsters:
        print("⚠️ Aucun monstre extrait. Vérifie le cache HTML ou le blocage réseau.")
        return

    save_monsters(monsters)
    print(f"✅ {len(monsters)} monstres extraits")


if __name__ == "__main__":
    main()
