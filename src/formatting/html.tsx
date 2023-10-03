// recognize HTML commands and try to parse them
// if they have no parser, just return the sanitized HTML

import { PS_context } from '../app/PS_context';
import manageURL from '../utils/manageURL';
import parse, { domToReact } from 'html-react-parser';
import { useContext } from 'react';
import sanitizeHtml from 'sanitize-html-react';
import { escape } from 'html-escaper';

export default function HTML(
    { message, raw }: { message: string; raw?: boolean },
) {
    // console.log("HTMLmessage", message);
    // console.log("HTMLsanitized", sanitizeHtml(message, sanitizeOptions));
    // console.log(
    //   "HTMLparsed",
    //   parse(sanitizeHtml(message, sanitizeOptions), parserOptions),
    // );
    const { client, selectedPage } = useContext(PS_context);
    const parserOptions = {
        replace: (domNode: any) => {
            const { attribs, children } = domNode;
            if (!attribs) {
                return;
            }
            if (attribs.href) {
                return (
                    <a
                        href={attribs.href}
                        target="_blank"
                        onClick={manageURL}
                        style={{ cursor: 'pointer' }}
                        className="novisited"
                    >
                        {domToReact(children, parserOptions)}
                    </a>
                );
            }
            if (domNode.name === 'button' && attribs.value) {
                return (
                    <button
                        onClick={() => {
                            client?.send(attribs.value, selectedPage || '');
                        }}
                        className="text-white border border-gray-border, font-bold p-1 m-1 rounded text-sm"
                        data-parsed="true"
                    >
                        {domToReact(children, parserOptions)}
                    </button>
                );
            }
            if (domNode.name === 'summary') {
                return (
                    <>
                        {domToReact(children, parserOptions)}
                    </>
                );
            }

            // if (domNode.name === 'psicon') {
            //     return (
            //         <>
            //             {domToReact(children, parserOptions)}
            //         </>
            //     );
            // }
        },
    };

    const colorRegex = [
        /^#(0x)?[0-9a-f]+$/i,
        /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/,
        /hsl\(\s*(\d+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)/,
    ];
    const sanitizeOptions = {
        allowedTags: [
            'img',
            'center',
            'table',
            'tbody',
            'tr',
            'td',
            'th',
            'strong',
            'p',
            'code',
            'br',
            'a',
            'div',
            'span',
            'button',
            'summary',
            'small',
            'details',
            'video',
            'marquee',
        ],
        allowedAttributes: {
            'img': ['src', 'height', 'width'],
            'video': ['src', 'height', 'width', 'controls'],
            'button': ['value'],
            'a': ['href'],
            '*': ['style'],
        },
        allowedStyles: {
            'p': {
                'letter-spacing': [/^(\d+)(\w+)$/],
            },
            'span': {
                'background': colorRegex,
                'padding-right': [/^(\d+)px$/],
            },
            '*': {
                'color': colorRegex,
                'background-image': [
                    /^url\((.*?)\)$/i,
                ],
                'max-height': [/^(\d+)px$/],
            },
        },
        disallowedTagsMode: 'escape',
    };
    // console.log("HTMLmessage", sanitizeHtml(message, sanitizeOptions));
    // console.log("testHTML", sanitizeHtml("<test>lol", sanitizeOptions));
    if (raw) {
        return (
            <>
                {parse(sanitizeHtml(message, sanitizeOptions), parserOptions)}
            </>
        );
    }
    return (
        <Box>
            {parse(
                sanitizeHtml(escape(message.replaceAll('\n', '<br>')), sanitizeOptions),
                parserOptions,
            )}
        </Box>
    );
}

export function Box(props: React.PropsWithChildren) {
    return (
        <div className="p-2 ml-10 mr-10 m-2 text-white border border-solid border-gray-border bg-gray-600 rounded">
            <span className="">
                {props.children}
            </span>
        </div>
    );
}
