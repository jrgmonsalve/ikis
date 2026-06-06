import { DOCUMENT } from '@angular/common';
import { Directive, effect, inject } from '@angular/core';

import { I18nService } from './i18n.service';

@Directive({
  selector: '[appTranslatePage]',
  standalone: true,
})
export class TranslatePageDirective {
  private readonly document = inject(DOCUMENT);
  private readonly i18n = inject(I18nService);
  private readonly originalText = new WeakMap<Text, string>();
  private readonly originalAttributes = new WeakMap<Element, Map<string, string>>();
  private readonly observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'characterData') {
        this.translateText(mutation.target as Text);
        continue;
      }

      if (mutation.type === 'attributes') {
        this.translateAttribute(mutation.target as Element, mutation.attributeName ?? '');
        continue;
      }

      mutation.addedNodes.forEach((node) => this.translateTree(node));
    }
  });

  constructor() {
    this.observer.observe(this.document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['placeholder', 'title', 'aria-label'],
    });

    effect(() => {
      this.i18n.language();
      queueMicrotask(() => this.translateTree(this.document.body));
    });
  }

  private translateTree(node: Node): void {
    if (node.nodeType === Node.TEXT_NODE) {
      this.translateText(node as Text);
      return;
    }

    if (!(node instanceof Element)) {
      return;
    }

    for (const attribute of ['placeholder', 'title', 'aria-label']) {
      this.translateAttribute(node, attribute);
    }
    node.childNodes.forEach((child) => this.translateTree(child));
  }

  private translateText(node: Text): void {
    const current = node.data;
    const trimmed = current.trim();
    if (!trimmed) {
      return;
    }

    const source = this.i18n.resolveSource(trimmed, this.originalText.get(node));
    this.originalText.set(node, source);

    const translated = this.i18n.translate(source);
    const next = current.replace(trimmed, translated);
    if (next !== current) {
      node.data = next;
    }
  }

  private translateAttribute(element: Element, attribute: string): void {
    const current = element.getAttribute(attribute);
    if (!current) {
      return;
    }

    const originals = this.originalAttributes.get(element) ?? new Map<string, string>();
    const source = this.i18n.resolveSource(current, originals.get(attribute));
    originals.set(attribute, source);
    this.originalAttributes.set(element, originals);

    const translated = this.i18n.translate(source);
    if (translated !== current) {
      element.setAttribute(attribute, translated);
    }
  }
}
