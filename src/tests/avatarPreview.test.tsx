import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import { AvatarRenderer } from '../components/avatar/AvatarRenderer';
import { AvatarPreview } from '../components/profile/AvatarPreview';
import { AVATAR_LAYER_ORDER } from '../data/avatarCatalog';
import { getVisibleAvatarLayers } from '../lib/avatarLayers';
import { emptyProgress } from '../lib/progressStore';

type ActGlobal = typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };

(globalThis as ActGlobal).IS_REACT_ACT_ENVIRONMENT = true;

const mountedRoots: Root[] = [];
const mountedContainers: HTMLElement[] = [];

function render(ui: ReactNode): HTMLElement {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  mountedRoots.push(root);
  mountedContainers.push(container);

  act(() => {
    root.render(ui);
  });

  return container;
}

afterEach(() => {
  for (const root of mountedRoots.splice(0)) {
    act(() => {
      root.unmount();
    });
  }
  for (const container of mountedContainers.splice(0)) {
    container.remove();
  }
});

describe('AvatarPreview layered rendering', () => {
  it('derives visible avatar layers in deterministic catalog order', () => {
    const avatar = emptyProgress().avatar;
    const slots = getVisibleAvatarLayers(avatar, []).map((layer) => layer.slot);
    const expected = AVATAR_LAYER_ORDER.filter((slot) => ['base', 'outfit', 'face', 'hair'].includes(slot));

    expect(slots).toEqual(expected);
    expect(slots.indexOf('face')).toBeGreaterThan(slots.indexOf('hair'));
  });

  it('renders missing production assets with placeholder fallback layers', () => {
    const avatar = emptyProgress().avatar;
    const container = render(<AvatarPreview avatarName="Lyra" avatar={avatar} regionProgress={[]} />);
    const assetLayers = Array.from(container.querySelectorAll('[data-avatar-asset-slot]')).map((node) => node.getAttribute('data-avatar-asset-slot'));
    const fallbackLayers = Array.from(container.querySelectorAll('[data-avatar-fallback-slot]')).map((node) => node.getAttribute('data-avatar-fallback-slot'));

    expect(assetLayers).toEqual(['base', 'outfit', 'hair', 'face']);
    expect(fallbackLayers).toEqual(['base', 'outfit', 'hair', 'face']);
    expect(container.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe('Lyra academy character');
  });

  it('keeps the fallback visible when a layer image fails to load', () => {
    const avatar = emptyProgress().avatar;
    const container = render(<AvatarPreview avatarName="Lyra" avatar={avatar} regionProgress={[]} />);
    const baseImage = container.querySelector<HTMLImageElement>('img[data-avatar-asset-slot="base"]');

    expect(baseImage).not.toBeNull();
    act(() => {
      baseImage?.dispatchEvent(new Event('error', { bubbles: true }));
    });

    expect(container.querySelector('[data-avatar-fallback-slot="base"]')).not.toBeNull();
  });

  it('renders map mode with a simplified layer set and mode-specific fallbacks', () => {
    const avatar = emptyProgress().avatar;
    const container = render(<AvatarRenderer avatarName="Lyra" avatar={avatar} regionProgress={[]} mode="map" />);
    const assetLayers = Array.from(container.querySelectorAll('[data-avatar-asset-mode="map"]')).map((node) => node.getAttribute('data-avatar-asset-slot'));
    const fallbackLayers = Array.from(container.querySelectorAll('[data-avatar-fallback-mode="map"]')).map((node) => node.getAttribute('data-avatar-fallback-slot'));

    expect(container.querySelector('[data-avatar-render-mode="map"]')).not.toBeNull();
    expect(assetLayers).toEqual(['base', 'outfit', 'hair']);
    expect(fallbackLayers).toEqual(['base', 'outfit', 'hair']);
    expect(container.querySelector('[data-avatar-slot="frame"]')).toBeNull();
  });
});
