import os
import time
import urllib.request
import feedparser
from bs4 import BeautifulSoup
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

FEED_URL = 'https://docs.cloud.google.com/feeds/bigquery-release-notes.xml'
CACHE_FILE = 'releases_cache.json'
CACHE_EXPIRY = 3600  # 1 hour in seconds

def get_empty_cache_structure():
    return {
        'last_fetched': 0,
        'updates': []
    }

def read_cache():
    if not os.path.exists(CACHE_FILE):
        return get_empty_cache_structure()
    try:
        import json
        with open(CACHE_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        app.logger.error(f"Error reading cache file: {e}")
        return get_empty_cache_structure()

def write_cache(data):
    try:
        import json
        with open(CACHE_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        app.logger.error(f"Error writing cache file: {e}")

def parse_feed_content(xml_data):
    feed = feedparser.parse(xml_data)
    updates = []
    
    # Process each entry in the Atom feed
    for entry_idx, entry in enumerate(feed.entries):
        date_str = entry.title  # Usually the date, e.g. "June 23, 2026"
        entry_url = entry.link if hasattr(entry, 'link') else 'https://cloud.google.com/bigquery/docs/release-notes'
        content_html = entry.content[0].value if hasattr(entry, 'content') else ''
        
        soup = BeautifulSoup(content_html, 'html.parser')
        h3s = soup.find_all('h3')
        
        if not h3s:
            # Fallback if there are no H3 subheadings: treat the whole entry as a general update
            text_content = soup.get_text().strip()
            updates.append({
                'id': f"entry_{entry_idx}_0",
                'date': date_str,
                'category': 'General',
                'content_html': content_html,
                'text': text_content,
                'url': entry_url
            })
            continue
            
        for h3_idx, h3 in enumerate(h3s):
            category = h3.get_text().strip()
            
            # Extract all siblings until the next h3 tag
            siblings = []
            sibling = h3.next_sibling
            while sibling and sibling.name != 'h3':
                siblings.append(sibling)
                sibling = sibling.next_sibling
                
            section_soup = BeautifulSoup('', 'html.parser')
            for s in siblings:
                section_soup.append(s)
                
            section_html = str(section_soup).strip()
            section_text = section_soup.get_text().strip()
            
            # Format category to standard title case (e.g. Feature, Changed, Deprecated)
            category_clean = category.title()
            
            updates.append({
                'id': f"entry_{entry_idx}_{h3_idx}",
                'date': date_str,
                'category': category_clean,
                'content_html': section_html,
                'text': section_text,
                'url': entry_url
            })
            
    return updates

def fetch_and_parse_feed():
    req = urllib.request.Request(
        FEED_URL, 
        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
    )
    with urllib.request.urlopen(req, timeout=10) as response:
        xml_data = response.read()
    
    return parse_feed_content(xml_data)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def get_releases():
    force_refresh = request.args.get('force_refresh', 'false').lower() == 'true'
    cache = read_cache()
    current_time = time.time()
    
    is_cache_expired = (current_time - cache.get('last_fetched', 0)) > CACHE_EXPIRY
    
    if force_refresh or is_cache_expired or not cache.get('updates'):
        try:
            updates = fetch_and_parse_feed()
            cache = {
                'last_fetched': current_time,
                'updates': updates
            }
            write_cache(cache)
            return jsonify({
                'status': 'success',
                'source': 'network',
                'last_fetched': current_time,
                'updates': updates
            })
        except Exception as e:
            app.logger.error(f"Failed to fetch feed: {e}")
            # If network fetch fails but we have cached data, fallback to cache
            if cache.get('updates'):
                return jsonify({
                    'status': 'warning',
                    'message': 'Failed to fetch new data. Showing cached release notes.',
                    'source': 'cache',
                    'last_fetched': cache.get('last_fetched', 0),
                    'updates': cache.get('updates')
                })
            else:
                return jsonify({
                    'status': 'error',
                    'message': f'Failed to fetch release notes and no cached data is available: {str(e)}',
                    'updates': []
                }), 500
    
    return jsonify({
        'status': 'success',
        'source': 'cache',
        'last_fetched': cache.get('last_fetched', 0),
        'updates': cache.get('updates')
    })

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)
