from html.parser import HTMLParser
from pathlib import Path


ROOT = Path(__file__).parent


class SiteParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []
        self.h1_count = 0
        self.links = []
        self.images = []
        self.project_count = 0

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if values.get("id"):
            self.ids.append(values["id"])
        if tag == "h1":
            self.h1_count += 1
        if tag == "a":
            self.links.append(values)
        if tag == "img":
            self.images.append(values)
        if tag == "article" and "project-card" in values.get("class", "").split():
            self.project_count += 1


def main():
    html = (ROOT / "index.html").read_text()
    css = (ROOT / "css/styles.css").read_text()
    js = (ROOT / "js/main.js").read_text()
    parser = SiteParser()
    parser.feed(html)

    assert len(parser.ids) == len(set(parser.ids)), "HTML IDs must be unique"
    assert parser.h1_count == 1, "The page must have exactly one h1"
    assert parser.project_count == 4, "All four portfolio projects must remain visible"
    assert "Not All Tokens Are Equal" in html, "Résumé-backed BERT project is missing"
    assert "Selected" not in html, "The removed 'Selected' label must not return"
    assert "</span>, I’m Shivam" not in html, "The comma before the introduction must stay removed"
    assert html.count('class="capability-core"') == 4, "Four capability groups must remain visible"
    assert html.count('class="capability-disclosure"') == 3, "Three supporting capability groups must be expandable"
    assert 'class="project-tags capability-tags"' in html, "Capabilities must use the project tag treatment"
    assert "Foundations: Data, Data, Everywhere" in html, "The full certification list is required"
    assert "hero-signal" in html + css, "The authored hero motion is missing"
    assert 'id="site-loader"' in html, "The milestone loader is missing"
    assert "setupLoader" in js, "The loader sequence setup is missing"
    assert all(f"value: {value}" in js for value in (35, 57, 100)), "Loader milestones must pause at 35%, 57%, and 100%"
    assert "animation: signal-scan 3000ms" in css, "The hero signal must run for three seconds"
    assert "setupDisclosures" in js, "Disclosure motion setup is missing"
    assert "object-position: 50% 45%" in css, "The portrait crop must keep the subject centered"
    assert "preloader" not in html + js, "Removed preloader code must not return"
    assert ":focus-visible" in css, "Visible keyboard focus is required"
    assert "prefers-reduced-motion" in css + js, "Reduced motion support is required"

    for link in parser.links:
        if link.get("target") == "_blank":
            rel = set(link.get("rel", "").split())
            assert {"noopener", "noreferrer"} <= rel, f"Unsafe new-tab link: {link.get('href')}"

    for image in parser.images:
        assert "alt" in image, f"Image missing alt text: {image.get('src')}"
        assert image["alt"].lower() not in {"logo", "your name"}, "Placeholder alt text found"

    for relative_path in (
        "css/styles.css",
        "js/main.js",
        "Shivam_s_Resume.pdf",
        "img/favicon.png",
        "img/profile.webp",
    ):
        assert (ROOT / relative_path).is_file(), f"Missing local asset: {relative_path}"

    print("site checks passed")


if __name__ == "__main__":
    main()
