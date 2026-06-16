import os
import xml.etree.ElementTree as ET
from datetime import datetime
import requests
from bs4 import BeautifulSoup
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def fetch_and_parse_feed():
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(FEED_URL, headers=headers, timeout=15)
        response.raise_for_status()
    except Exception as e:
        return {"error": f"Failed to fetch feed from Google Cloud: {str(e)}"}, 500

    try:
        root = ET.fromstring(response.content)
        # Atom feed namespace
        ns = {'atom': 'http://www.w3.org/2005/Atom'}
        
        entries = []
        for entry in root.findall('atom:entry', ns):
            title_node = entry.find('atom:title', ns)
            date_str = title_node.text if title_node is not None else "Unknown Date"
            
            updated_node = entry.find('atom:updated', ns)
            updated_iso = updated_node.text if updated_node is not None else ""
            
            id_node = entry.find('atom:id', ns)
            id_text = id_node.text if id_node is not None else ""
            
            # Extract alternate link href
            link_node = entry.find("atom:link[@rel='alternate']", ns)
            if link_node is None:
                link_node = entry.find("atom:link", ns)
            link_href = link_node.attrib.get('href', '') if link_node is not None else ''
            
            content_node = entry.find('atom:content', ns)
            content_html = content_node.text if content_node is not None else ''
            
            # Parse HTML content with BeautifulSoup
            soup = BeautifulSoup(content_html, 'html.parser')
            
            current_type = 'General'
            current_elements = []
            
            def create_item(item_type, elements, idx):
                # Clean tag text
                clean_type = item_type.strip().title()
                if not clean_type:
                    clean_type = "General"
                    
                # Reconstruct HTML fragment
                html_frags = []
                for el in elements:
                    html_frags.append(str(el))
                html_str = "".join(html_frags).strip()
                
                # Extract plain text for tweeting and searching
                temp_soup = BeautifulSoup(html_str, 'html.parser')
                clean_text = temp_soup.get_text().strip()
                
                # Make standard link URL to specific section if possible
                anchor_id = date_str.replace(" ", "_").replace(",", "")
                item_link = f"https://cloud.google.com/bigquery/docs/release-notes#{anchor_id}" if not link_href else link_href
                
                sub_id = f"{id_text}_{idx}" if id_text else f"{date_str}_{clean_type}_{idx}"
                
                return {
                    "id": sub_id,
                    "date": date_str,
                    "updated": updated_iso,
                    "type": clean_type,
                    "content_html": html_str,
                    "content_text": clean_text,
                    "link": item_link
                }
            
            item_index = 0
            for child in soup.children:
                # If child is NavigableString and just whitespace, skip it
                if isinstance(child, str) and not child.strip():
                    continue
                
                if child.name in ['h3', 'h4']:
                    if current_elements:
                        entries.append(create_item(current_type, current_elements, item_index))
                        item_index += 1
                        current_elements = []
                    current_type = child.get_text()
                else:
                    current_elements.append(child)
            
            if current_elements:
                entries.append(create_item(current_type, current_elements, item_index))
                
        # Sort entries (most recent first) - though Atom feed is usually already sorted
        return {"releases": entries}, 200
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": f"Failed to parse XML Atom Feed: {str(e)}"}, 500

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def get_releases():
    data, status_code = fetch_and_parse_feed()
    return jsonify(data), status_code

if __name__ == '__main__':
    app.run(debug=True, port=5001)
