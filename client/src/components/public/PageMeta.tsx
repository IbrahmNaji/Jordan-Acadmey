import { useEffect } from 'react';
import { site } from '../../content/site';

function setMeta(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attr, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
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
      title === site.name ? `${site.name} | ${site.descriptor}` : `${title} | ${site.name}`;
    document.title = fullTitle;
    setMeta('meta[property="og:title"]', 'property', 'og:title', fullTitle);

    if (description) {
      setMeta('meta[name="description"]', 'name', 'description', description);
      setMeta(
        'meta[property="og:description"]',
        'property',
        'og:description',
        description,
      );
    }
    if (image) {
      setMeta('meta[property="og:image"]', 'property', 'og:image', image);
    }
  }, [title, description, image]);

  return null;
}
