// recognize HTML commands and try to parse them
// if they have no parser, just return the sanitized HTML

import { useClientContext } from '../components/single/ClientContext';
import manageURL from '../../utils/manageURL';
import parse, { domToReact } from 'html-react-parser';
import sanitizeHtml from 'sanitize-html-react';
import { escape } from 'html-escaper';
import { Icons } from '@pkmn/img';
import { Username } from '../components/Username';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { twMerge } from 'tailwind-merge';

export default function HTML(
    { message, raw }: Readonly<{ message: string; raw?: boolean }>,
) {
    const { client, currentRoom: room } = useClientContext();
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
                        onClick={(e) => {
                            manageURL(e, client);
                        }}
                        className="novisited cursor-pointer text-blue-500 underline"
                    >
                        {domToReact(children, parserOptions)}
                    </a>
                );
            }
            if (domNode.name === 'button' && attribs.value) {
                return (
                    <button
                        onClick={() => {
                            client.send(attribs.value, room?.ID || '');
                        }}
                        className="border border-gray-601 dark:border-gray-border font-bold p-1 m-1 rounded text-sm"
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
            if (domNode.name === 'psicon') {
                if (attribs.pokemon) {
                    const pokemon = Icons.getPokemon(attribs.pokemon, { protocol: 'https', domain: 'cdn.crob.at' });
                    return (
                        <span>
                            <span
                                style={{
                                    background:
                  `transparent url("${pokemon.url}") no-repeat scroll ${pokemon.left}px ${pokemon.top}px`,
                                    width: '40px',
                                    height: '30px',
                                    border: 0,
                                    display: 'inline-block',
                                    imageRendering: 'pixelated',
                                    verticalAlign: '-7px',
                                }}
                            >
                            </span>
                            {domToReact(children, parserOptions)}
                        </span>
                    );
                } else if (attribs.item) {
                    const item = Icons.getItem(attribs.item, { protocol: 'https', domain: 'cdn.crob.at' });
                    return (
                        <span>
                            <span
                                style={{
                                    background:
                            `transparent url("${item.url}") no-repeat scroll ${item.left}px ${item.top}px`,
                                    width: '24px',
                                    height: '24px',
                                    border: 0,
                                    display: 'inline-block',
                                    imageRendering: 'pixelated',
                                    verticalAlign: '-7px',
                                }}
                            >
                            </span>
                            {domToReact(children, parserOptions)}
                        </span>
                    );
                }
            }
            if (domNode.name === 'username') {
                return <Username bold user={' ' + domNode.children[0].data} />;
            }
            // Parse fa icons into react components
            if (domNode.name === 'i' && attribs.class) {
                const classes = attribs.class.split(' ');
                const fa = classes.find((e:string) => e.startsWith('fa-'));
                if (fa) {
                    return <FontAwesomeIcon icon={fa} style={{ padding: '0 0.25rem' }} />;
                }
            }
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
    if (raw) {
        return (
            <>
                {parse(
                    sanitizeHtml(escape(message.replaceAll('\n', '<br>')), sanitizeOptions),
                    parserOptions,
                )}
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

export function Box(props: Readonly<React.PropsWithChildren>) {
    const child = props.children as React.ReactElement;
    const classes = child?.props?.className || '';
    const blueStyle = classes?.includes('broadcast-blue') ? 'bg-blue-100 dark:bg-blue-600 text-white' : '';
    const redStyle = classes?.includes('broadcast-red') ? 'bg-red-400 dark:bg-red-600 text-white' : '';
    const greenStyle = classes?.includes('broadcast-green') ? 'bg-green-600 dark:bg-green-600 text-white' : '';
    return (
        <div className={twMerge('p-2 ml-10 mr-10 m-2 border border-solid border-gray-601 dark:border-gray-border bg-gray-sidebar-light dark:bg-gray-600 rounded', blueStyle, redStyle, greenStyle) }>
            {props.children}
        </div>
    );
}
