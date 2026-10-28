import { useEffect } from 'react';
import { site } from '../../content/site';

function setMeta(
  selector: string,
  attr: 'name' | 'property',
  key: string,
  content: string,
) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attr, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function setCanonical(url: string | null) {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!url) {
    link?.remove();
    document.head.querySelector('meta[property="og:url"]')?.remove();
    return;
  }
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = url;
  setMeta('meta[property="og:url"]', 'property', 'og:url', url);
}

export default function PageMeta({
  title,
  description,
  image,
}: {
  title: string;
  description?: string;
  image?: string;
}) {
  useEffect(() => {
    const fullTitle =
      title === site.name
        ? [site.name, site.descriptor].join(' | ')
        : [title, site.name].join(' | ');
    const pageDescription = description ?? site.description;
    let origin = '';

    if (site.url) {
      try {
        origin = new URL(site.url).origin;
      } catch {
        origin = '';
      }
    }

    document.title = fullTitle;
    setMeta('meta[property="og:title"]', 'property', 'og:title', fullTitle);
    setMeta('meta[name="description"]', 'name', 'description', pageDescription);
    setMeta(
      'meta[property="og:description"]',
      'property',
      'og:description',
      pageDescription,
    );
    if (image) {
      setMeta(
        'meta[property="og:image"]',
        'property',
        'og:image',
        origin ? new URL(image, origin).href : image,
      );
    } else {
      document.head.querySelector('meta[property="og:image"]')?.remove();
    }
    setCanonical(origin ? new URL(window.location.pathname, origin).href : null);
  }, [title, description, image]);

  return null;
}
