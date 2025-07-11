import Linkify from 'linkify-react';
import { Fragment, createElement } from 'react';
import { bold, fakeCommand, greentext, inlineCode, italic, link, spoiler, strikethrough, subscript, superscript, options } from './chat';
import { RoomLink } from './RoomLink';

const tokens = {
    '`': 'code',
    '|': 'spoiler',
    '*': 'bold',
    '_': 'italic',
    '~': 'strikethrough',
    '^': 'superscript',
    '\\': 'subscript',
    '[': 'link',
    '>': 'greentext',
    '<': 'roomlink',
    '/': 'fakeCommand',
} as const;

type Token = typeof tokens[keyof typeof tokens];
const elements: {
    [key in Token]: {
        pattern: RegExp;
        element: (props: any) => JSX.Element;
    };
} = {
    code: { pattern: /`+(.+?)`+/g, element: inlineCode },
    spoiler: { pattern: /\|\|(.+?)\|\|/g, element: spoiler },
    bold: { pattern: /\*\*(.+?)\*\*/g, element: bold },
    italic: { pattern: /__(.+?)__/g, element: italic },
    strikethrough: { pattern: /~~(.+?)~~/g, element: strikethrough },
    superscript: { pattern: /\^\^(.+?)\^\^/g, element: superscript },
    subscript: { pattern: /\\\\(.+?)\\\\/g, element: subscript },
    link: { pattern: /\[\[(.+?)?\]\]/g, element: link },
    greentext: { pattern: /^>.*/g, element: greentext },
    fakeCommand: { pattern: /^\/\/.*/g, element: fakeCommand },
    roomlink: { pattern: /<<(.+?)?>>/g, element: RoomLink },
} as const;

const cleanTag = (input: string, tag: keyof typeof elements) => {
    switch (tag) {
    case 'code':
        return input.replace(elements.code.pattern, '$1');
    case 'spoiler':
        return input.replace(elements.spoiler.pattern, '$1');
    case 'bold':
        return input.replace(elements.bold.pattern, '$1');
    case 'italic':
        return input.replace(elements.italic.pattern, '$1');
    case 'strikethrough':
        return input.replace(elements.strikethrough.pattern, '$1');
    case 'superscript':
        return input.replace(elements.superscript.pattern, '$1');
    case 'subscript':
        return input.replace(elements.subscript.pattern, '$1');
    case 'link':
        return input.replace(elements.link.pattern, '$1');
    case 'greentext':
    case 'fakeCommand': // e.g. //help should display as /help
        return input?.slice(1);
    case 'roomlink':
        return input.replace(elements.roomlink.pattern, '$1');
    default:
        tag satisfies never;
        console.error('Bug in chatFormatting/MessageParser, cleanTag: unknown tag', tag);
        return '';
    }
};
let deepKey = 0;
export const encloseInTag = (
    { input, tag }:
    {
        input: string,
        tag: keyof typeof elements,
    }
): null | { length: number; element: JSX.Element } => {
    // Find the closing tag if it exists
    elements[tag].pattern.lastIndex = 0;
    const matches = elements[tag].pattern.exec(input);
    if (matches) {
        return {
            length: matches[0].length,
            element: elements[tag].element({
                children: FormatMsgDisplay({
                    msg: cleanTag(matches[0], tag),
                    recursed: true,
                }),
                key: deepKey++,
            }),
        };
    }
    return null;
};

export function FormatMsgDisplay(
    { msg, recursed = false }: Readonly<{ msg: string; recursed?: boolean }>,
) {
    if (!msg) return null;
    const jsxElements = [];
    let currentString = '';
    for (let i = 0; i < msg.length; i++) {
        const char = msg[i];
        if (char in tokens) {
            const tag = tokens[char as keyof typeof tokens];
            if ((char === '>' || char === '/') && i !== 0) {
                currentString += char;
                continue;
            }
            const result = encloseInTag({ input: msg.slice(i), tag });
            if (result) {
                i += result.length - 1;
                if (currentString) {
                    if (recursed) {
                        jsxElements.push(
                            createElement(Fragment, { key: deepKey++ }, currentString),
                        );
                    } else {
                        jsxElements.push(
                            createElement(Linkify, { options, key: deepKey++ }, currentString),
                        );
                    }
                    currentString = '';
                }
                jsxElements.push(result.element);
            } else {
                currentString += msg[i];
            }
        } else {
            currentString += msg[i];
        }
    }
    if (currentString) {
        if (recursed) {
            jsxElements.push(
                createElement(Fragment, { key: deepKey++ }, currentString),
            );
        } else {
            jsxElements.push(
                createElement(Linkify, { options, key: deepKey++ }, currentString),
            );
        }
    }
    return createElement(Fragment, { key: deepKey++ }, ...jsxElements);
}

