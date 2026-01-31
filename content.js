"use strict";

const PLAYER_SELECTOR_C = 'persistent-player';
const PLAYER_C = 'based-twich-chat--player';
const PLAYER_STICK_TO_RIGHT_C = 'based-twich-chat--player_right';
const PLAYER_FULLSCREEN_C = 'persistent-player--theatre';

const CHAT_SELECTOR_C = 'right-column';
const CHAT_C = 'based-twich-chat--chat';
const CHAT_STICK_TO_LEFT_C = 'based-twich-chat--chat_left';
const CHAT_OPACITY_C = 'based-twich-chat--chat_opacity';
const CHAT_MINIMIZED_C = 'based-twich-chat--chat_minimized'

const DISPLAY_NONE_C = 'based-twich-chat--display_none'

const FULLSCREEN_CHANGE_EVENT = 'player-fullscreen';

const sonsole = {
    prefix: '[Based Twitch Chat]',
    log: (...args) => console.log(sonsole.prefix, ...args),
    debug: (...args) => console.debug(sonsole.prefix, ...args),
    info: (...args) => console.info(sonsole.prefix, ...args),
};

/** @type HTMLElement; */
let player;

/** @type HTMLElement; */
let chat;

const sheet = new CSSStyleSheet();

sheet.replaceSync(`
    .${PLAYER_C} {
        width: 100% !important;
    }

    .${PLAYER_STICK_TO_RIGHT_C} {
        right: 0 !important;
        inset-inline-start: unset !important;
    }

    .${CHAT_C} {
        max-height: 90%;
        
        position: absolute !important;
        top: 5% !important;
    }

    .${CHAT_STICK_TO_LEFT_C} {
        left: 0 !important;
    }

    .${CHAT_OPACITY_C} {
        opacity: 70%;
    }

    .${CHAT_MINIMIZED_C} {
        max-height: 35%;
        top: 20% !important;
    }

    .${DISPLAY_NONE_C} {
        display: none !important;
    }
`);

document.adoptedStyleSheets = [
    ...document.adoptedStyleSheets,
    sheet,
];

function injectPlayerStyles() {
    player.classList.add([PLAYER_C]);
    sonsole.debug('Player classList injected:', player.classList);
}

function injectChatStyles() {
    chat.classList.add([CHAT_C]);
    chat.classList.add([CHAT_OPACITY_C]);

    sonsole.debug('Chat classList injected:', chat.classList);
}

function removeStyles() {
    player.classList.remove([PLAYER_C]);
    chat.classList.remove([CHAT_C]);
    chat.classList.remove([CHAT_OPACITY_C]);

    sonsole.debug('styles removed');
}

function getIsFullscreen() {
    return !!player?.classList?.contains('persistent-player--theatre');
}

function getIsAnyInjected() {
    return !!player?.classList?.contains(PLAYER_C) || !!chat?.classList?.contains(CHAT_C);
}

function applyPlayerStyles() {
    const hasPlayerStyles = player.classList.contains(PLAYER_C);

    if (getIsFullscreen()) {
        if (!hasPlayerStyles) {
            injectPlayerStyles();
        }
    } else {
        if (hasPlayerStyles) {
            removeStyles();
        }
    }
}

const watchList = {};

/**
    * @param {string} className 
    * @param {HTMLElement} node 
    *
    * @returns {[boolean, boolean]}
    * [[currentValue, isChanged]]
*/
function watch(className, node) {
    const old = watchList[className];

    /** @type boolean */
    const current = node?.classList?.contains(className);

    watchList[className] = current;

    return [
        current,
        old !== current,
    ]
}

function applyChatStyles() {
    const hasChatStyles = document.getElementsByClassName(CHAT_SELECTOR_C)[0]?.classList?.contains(CHAT_C);
    
    if (getIsFullscreen() && chat.classList.contains('right-column--beside')) {
        if (!hasChatStyles) {
            injectChatStyles();
        }
    } else {
        if (hasChatStyles) {
            removeStyles();
        }
    }
}

/** @param {string} eventType */
function dispatchEvent(eventType) {
    document.dispatchEvent(new Event(eventType));
    sonsole.debug('Event: ', eventType);
}

const playerObserver = new MutationObserver(() => {
    sonsole.debug('playerObserver: applying styles');

    applyPlayerStyles();

    const fsWatcher = watch(PLAYER_FULLSCREEN_C, player);

    if (fsWatcher[1]) dispatchEvent(FULLSCREEN_CHANGE_EVENT);
});

const chatObserver = new MutationObserver(() => {
    sonsole.debug('chatObserver: applying styles');
    changeSafe(() => applyChatStyles());
});

const chatAndPlayerObserverConfig = {
    attributes: true,
    attributeFilter: ['class'],
}

function runObservers() {
    playerObserver.observe(player, chatAndPlayerObserverConfig);
    chatObserver.observe(chat, chatAndPlayerObserverConfig);
}

function stopObservers() {
    playerObserver.disconnect();
    chatObserver.disconnect();
}

const bodyObserver = new MutationObserver(() => {
    player = document.getElementsByClassName(PLAYER_SELECTOR_C)[0];
    chat = document.getElementsByClassName(CHAT_SELECTOR_C)[0];

    if (player && chat) {
        applyPlayerStyles();
        applyChatStyles();

        runObservers();

        bodyObserver.disconnect();

        sonsole.info('Extension initialized Pog Pog Pog');
        sonsole.debug('player: ', player, 'chat: ', chat);
    }
});

bodyObserver.observe(document.body, {
    childList: true,
    subtree: true,
});

function on() {
    runObservers();

    injectPlayerStyles();
    injectChatStyles();

    sonsole.debug('on');
}

function off() {
    stopObservers();
    removeStyles();

    sonsole.debug('off');
}

function changeSafe(cb) {
    stopObservers();
    cb();
    runObservers();
}

let isConstuctingCombo = false;

/** @param {KeyboardEvent} e */
function isTextInputFocused(e) {
    const el = e.target || document.activeElement;

    if (!el) return false;

    return (
        el.tagName === "INPUT"
        || el.tagName === "TEXTAREA"
        || el.isContentEditable
    );
}

function getIsVisible() {
    return chat.classList.contains('right-column--collapsed');
}

/** 
    * Native show/hide chat
    *
    * @param {boolean | undefined} value
    * if not provided toggles visibility, else sets it according to value
*/
function toggleVisibility(value) {
    const isVisible = getIsVisible();

    if (value === undefined || (value === false && !isVisible) || (value && isVisible)) {
        document.querySelector('.right-column__toggle-visibility > div > button').click();
    }
}

document.addEventListener('keydown', event => {
    if (event.code === 'KeyB') {
        isConstuctingCombo = true;
    } else {
        if (
            !isConstuctingCombo
            || isTextInputFocused(event)
        ) return;

        event.stopImmediatePropagation();

        switch (event.code) {
            case 'KeyT': {
                if (getIsAnyInjected()) {
                    off();
                } else {
                    on();
                }

                break;
            }
            case 'KeyH': {
                if (!getIsFullscreen()) break;

                changeSafe(() => {
                    chat.classList.add([CHAT_STICK_TO_LEFT_C]);
                    player.classList.add([PLAYER_STICK_TO_RIGHT_C]);
                });

                break;
            }
            case 'KeyL': {
                changeSafe(() => {
                    chat.classList.remove([CHAT_STICK_TO_LEFT_C]);
                    player.classList.remove([PLAYER_STICK_TO_RIGHT_C]);
                });

                break;
            }
            case 'KeyO': {
                if (!getIsAnyInjected()) break;

                changeSafe(() => {
                    if (chat.classList.contains(CHAT_OPACITY_C)) {
                        chat.classList.remove([CHAT_OPACITY_C]);
                    } else {
                        chat.classList.add([CHAT_OPACITY_C]);
                    }
                });

                break;
            }
            case 'KeyM': {
                if (!getIsAnyInjected()) break;

                changeSafe(() => {
                    if (chat.classList.contains(CHAT_MINIMIZED_C)) {
                        chat.classList.remove([CHAT_MINIMIZED_C]);
                        document.getElementsByClassName('marquee-animation')[0]?.classList?.remove([DISPLAY_NONE_C]);
                        document.getElementsByClassName('community-highlight')[0]?.classList?.remove([DISPLAY_NONE_C]);
                    } else {
                        chat.classList.add([CHAT_MINIMIZED_C]);
                        document.getElementsByClassName('marquee-animation')[0]?.classList?.add([DISPLAY_NONE_C]);
                        document.getElementsByClassName('community-highlight')[0]?.classList?.add([DISPLAY_NONE_C]);
                    }
                });

                break;
            }
            case 'KeyV': {
                changeSafe(() => toggleVisibility());

                break;
            }
        }
    }
});

document.addEventListener('keyup', event => {
    if (event.code === 'KeyB') {
        isConstuctingCombo = false;
    }
});

document.addEventListener(FULLSCREEN_CHANGE_EVENT, _event => {
    if (getIsFullscreen()) {
        toggleVisibility(true);
    }
})

sonsole.info('Extension loaded. Initializing...');
