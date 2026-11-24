// ==UserScript==
// @name         YouTube Shorts Quality Switcher
// @name:ru      Качество YouTube Shorts
// @namespace    local-development
// @version      0.3.3
// @description  Выбор качества в плеере YouTube Shorts
// @match        https://www.youtube.com/shorts/*
// @grant        none
// @noframes
// @run-at       document-idle
// ==/UserScript==

(() => {
    'use strict';

    const style = document.createElement('style');
    style.textContent = `
        .sq-row {
            box-sizing: border-box; display: flex; align-items: center; gap: 12px;
            width: 100%; min-width: 180px; height: 40px; padding: 0 16px;
            border: 0; background: transparent; color: var(--yt-sys-color-baseline--text-primary, CanvasText);
            font: 14px/20px Roboto, Arial, sans-serif; text-align: start; cursor: pointer;
        }
        .sq-row:is(:hover, :focus-visible) { background: color-mix(in srgb, currentColor 10%, transparent); }
        .sq-icon { width: 24px; text-align: center; font-size: 18px; }
        .sq-icon svg { display: block; width: 24px; height: 24px; fill: currentColor; }
        .sq-value { margin-inline-start: auto; color: var(--yt-sys-color-baseline--text-secondary, currentColor); }
        .sq-open > :not(.sq-panel) { display: none !important; }
        .sq-panel { min-width: min(256px, 80vw); max-height: 65vh; overflow-y: auto; }
    `;
    document.head.append(style);

    function row(label, icon, role) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'sq-row';
        button.setAttribute('role', role);
        const symbol = document.createElement('span');
        symbol.className = 'sq-icon';
        symbol.setAttribute('aria-hidden', 'true');
        symbol.append(icon);
        button.append(symbol, label);
        return button;
    }

    const labels = {
        en: {quality: 'Quality', auto: 'Auto'},
        ru: {quality: 'Качество', auto: 'Авто'}
    };
    const svgNS = 'http://www.w3.org/2000/svg';
    const icon = document.createElementNS(svgNS, 'svg');
    icon.setAttribute('viewBox', '0 0 24 24');
    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d', 'M 9 3 C 8.11 2.99 7.25 3.29 6.54 3.83 C 5.84 4.38 5.34 5.14 5.12 6 H 3 C 2.73 6 2.48 6.1 2.29 6.29 C 2.1 6.48 2 6.73 2 7 C 2 7.26 2.1 7.51 2.29 7.7 C 2.48 7.89 2.73 8 3 8 H 5.12 C 5.34 8.85 5.84 9.61 6.55 10.16 C 7.25 10.7 8.11 10.99 9 10.99 C 9.88 10.99 10.74 10.7 11.44 10.16 C 12.15 9.61 12.65 8.85 12.87 8 H 21 C 21.26 8 21.51 7.89 21.7 7.7 C 21.89 7.51 22 7.26 22 7 C 22 6.73 21.89 6.48 21.7 6.29 C 21.51 6.1 21.26 6 21 6 H 12.87 C 12.65 5.14 12.15 4.38 11.45 3.83 C 10.74 3.29 9.88 2.99 9 3 Z M 9 5 C 9.53 5 10.03 5.21 10.41 5.58 C 10.78 5.96 11 6.46 11 7 C 11 7.53 10.78 8.03 10.41 8.41 C 10.03 8.78 9.53 9 9 9 C 8.46 9 7.96 8.78 7.58 8.41 C 7.21 8.03 7 7.53 7 7 C 7 6.46 7.21 5.96 7.58 5.58 C 7.96 5.21 8.46 5 9 5 Z M 15 13 C 14.11 12.99 13.25 13.29 12.54 13.83 C 11.84 14.38 11.34 15.14 11.12 16 H 3 C 2.73 16 2.48 16.1 2.29 16.29 C 2.1 16.48 2 16.73 2 17 C 2 17.26 2.1 17.51 2.29 17.7 C 2.48 17.89 2.73 18 3 18 H 11.12 C 11.34 18.85 11.84 19.61 12.55 20.16 C 13.25 20.7 14.11 20.99 15 20.99 C 15.88 20.99 16.74 20.7 17.44 20.16 C 18.15 19.61 18.65 18.85 18.87 18 H 21 C 21.26 18 21.51 17.89 21.7 17.7 C 21.89 17.51 22 17.26 22 17 C 22 16.73 21.89 16.48 21.7 16.29 C 21.51 16.1 21.26 16 21 16 H 18.87 C 18.65 15.14 18.15 14.38 17.45 13.83 C 16.74 13.29 15.88 12.99 15 13 Z M 15 15 C 15.53 15 16.03 15.21 16.41 15.58 C 16.78 15.96 17 16.46 17 17 C 17 17.53 16.78 18.03 16.41 18.41 C 16.03 18.78 15.53 19 15 19 C 14.46 19 13.96 18.78 13.58 18.41 C 13.21 18.03 13 17.53 13 17 C 13 16.46 13.21 15.96 13.58 15.58 C 13.96 15.21 14.46 15 15 15 Z');
    icon.append(path);
    const title = document.createTextNode('');
    const entry = row(title, icon, 'menuitem');
    entry.setAttribute('aria-haspopup', 'menu');
    entry.setAttribute('aria-expanded', 'false');
    const valueLabel = document.createElement('span');
    valueLabel.className = 'sq-value';
    const arrow = document.createElement('span');
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '›';
    entry.append(valueLabel, arrow);

    const panel = document.createElement('div');
    panel.className = 'sq-panel';
    panel.setAttribute('role', 'menu');
    let timer;
    let optionsKey = '';
    let choice = null;
    let lastPlayer;
    let lastVideoId;
    let lastQuality;

    function qualityForVideo(qualities) {
        if (choice.value === 'auto' || qualities.some(item => item.quality === choice.value)) {
            return choice.value;
        }
        // Keep the original choice for later Shorts when this one has fewer levels.
        const byHeight = qualities.map(item => ({
            quality: item.quality,
            height: parseInt(item.qualityLabel, 10)
        })).filter(item => Number.isFinite(item.height)).sort((a, b) => b.height - a.height);
        return (byHeight.find(item => item.height <= choice.height) ?? byHeight.at(-1))?.quality ?? 'auto';
    }

    function getPlayer() {
        const videoId = location.pathname.match(/^\/shorts\/([^/]+)/)?.[1];
        if (!videoId) return null;
        const player = document.getElementById('shorts-player');
        return player?.getVideoData?.()?.video_id === videoId ? player : null;
    }

    function sync() {
        const player = getPlayer();
        const qualities = player?.getAvailableQualityData?.()
            ?.filter(item => item.isPlayable && item.quality !== 'auto') ?? [];
        if (!qualities.length || typeof player?.setPlaybackQualityRange !== 'function') {
            detachMenu();
            return;
        }

        let preferred = player.getPreferredQuality?.();
        if (choice) {
            const videoId = player.getVideoData().video_id;
            const target = qualityForVideo(qualities);
            if (player !== lastPlayer || videoId !== lastVideoId || target !== lastQuality ||
                (preferred != null && preferred !== target)) {
                try {
                    player.setPlaybackQualityRange(target, target);
                    lastPlayer = player;
                    lastVideoId = videoId;
                    lastQuality = target;
                    preferred = target;
                } catch (error) {
                    console.warn('[Shorts] Не удалось переключить качество', error);
                }
            }
        }
        const trigger = player.closest('ytd-reel-video-renderer')?.querySelector('#menu-button');
        const dropdown = trigger && [...document.querySelectorAll('ytd-popup-container tp-yt-iron-dropdown')]
            .find(node => node.opened && trigger.contains(node.positionTarget));
        const list = dropdown?.querySelector('yt-list-view-model[role="menu"]');
        // The root actions menu has a playback speed row with a trailing value.
        const speedRow = list?.querySelector('button[role="menuitem"] ~ .ytListItemViewModelTrailingSelectionText')
            ?.closest('yt-list-item-view-model');
        if (!speedRow) {
            detachMenu();
            return;
        }
        if (entry.parentElement !== list) {
            detachMenu();
            speedRow.after(entry);
            dropdown.refit?.();
        }

        const language = document.documentElement.lang.toLowerCase().split('-')[0];
        const strings = language === 'en' ? labels.en : labels.ru;
        if (title.data !== strings.quality) {
            title.data = strings.quality;
            panel.setAttribute('aria-label', strings.quality);
        }
        const options = [...qualities, {quality: 'auto', qualityLabel: strings.auto}];
        const selected = options.find(item => item.quality === preferred) ?? options.at(-1);
        if (valueLabel.textContent !== selected.qualityLabel) valueLabel.textContent = selected.qualityLabel;
        if (!panel.isConnected) return;

        const key = JSON.stringify([options.map(item => [item.quality, item.qualityLabel]), selected.quality]);
        if (key === optionsKey) return;
        optionsKey = key;
        const buttons = options.map(item => {
            const checked = item.quality === selected.quality;
            const button = row(item.qualityLabel, checked ? '✓' : '', 'menuitemradio');
            button.setAttribute('aria-checked', String(checked));
            button.onclick = () => {
                if (getPlayer() !== player || player.getVideoData().video_id !== menuVideoId) {
                    detachMenu();
                    return;
                }
                choice = {value: item.quality, height: parseInt(item.qualityLabel, 10)};
                dropdown.close();
                sync();
            };
            return button;
        });
        panel.replaceChildren(...buttons);
        panel.querySelector('[aria-checked="true"]').focus({preventScroll: true});
    }

    let menuVideoId;
    function detachMenu() {
        if (panel.parentElement) {
            panel.parentElement.classList.remove('sq-open');
            panel.remove();
            entry.setAttribute('aria-expanded', 'false');
            optionsKey = '';
        }
        entry.remove();
    }

    entry.onclick = event => {
        event.stopPropagation();
        const list = entry.parentElement;
        if (!list || !getPlayer()) return;
        menuVideoId = getPlayer().getVideoData().video_id;
        list.append(panel);
        list.classList.add('sq-open');
        entry.setAttribute('aria-expanded', 'true');
        sync();
    };

    panel.addEventListener('click', event => event.stopPropagation());
    panel.addEventListener('keydown', event => {
        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
        const buttons = [...panel.children];
        const index = buttons.indexOf(document.activeElement);
        const step = event.key === 'ArrowDown' ? 1 : -1;
        buttons[(index + step + buttons.length) % buttons.length].focus();
        event.preventDefault();
        event.stopPropagation();
    });

    document.addEventListener('iron-overlay-opened', () => requestAnimationFrame(sync));
    document.addEventListener('iron-overlay-closed', event => {
        if (event.target.contains(entry)) detachMenu();
    });
    function onNavigate() {
        clearInterval(timer);
        detachMenu();
        sync();
        if (location.pathname.startsWith('/shorts/')) {
            // YouTube can replace the toolbar or load the quality list after navigation.
            timer = setInterval(sync, 1000);
        }
    }

    document.addEventListener('yt-navigate-finish', onNavigate);
    document.addEventListener('loadedmetadata', event => {
        if (event.target.closest?.('#shorts-player')) sync();
    }, true);
    onNavigate();
})();
