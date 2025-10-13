import Linkify from 'linkify-react';
import { type HTMLAttributes, type ReactElement, useState } from 'react';
import innerText from 'react-innertext';
import { twMerge } from 'tailwind-merge';
import { options } from './constants';

export interface ExtendedProps extends HTMLAttributes<HTMLSpanElement> {
    children: string | ReactElement;
    key?: number;
}

export function InlineCode(
    props: ExtendedProps,
) {
    const key = props.key;
    delete props.key;
    return (
        <code
            key={key}
            className={'font-mono bg-gray-601 dark:bg-gray-600 rounded p-1 '}
            {...props}
        />
    );
}

export function Spoiler(
    props: ExtendedProps,
) {
    const key = props.key;
    const [visible, setVisible] = useState(false);
    delete props.key;
    return (
        <Linkify
            key={key}
            as="span"
            className={twMerge(
                'dark:bg-gray-700 dark:text-gray-700 p-0.5 rounded bg-gray-spoiler-light text-gray-spoiler-light ',
                visible ? 'text-black dark:text-white' : 'hover:cursor-pointer',
            )}
            {...props}
            options={options}
            onClick={() => {
                //set spoiler to visible
                setVisible(true);
            }}
        />
    );
}

export function Bold(
    props: ExtendedProps,
): React.ReactElement {
    const key = props.key;
    delete props.key;
    return <Linkify key={key} as="strong" {...props} options={options} />;
}

export function Italic(
    props: ExtendedProps,
) {
    const key = props.key;
    delete props.key;
    return <Linkify key={key} as="em" {...props} options={options} />;
}

export function Strikethrough(
    props: ExtendedProps,
) {
    const key = props.key;
    delete props.key;
    return <Linkify key={key} as="s" {...props} options={options} />;
}

export function Superscript(
    props: ExtendedProps,
) {
    const key = props.key;
    delete props.key;
    return <Linkify key={key} as="sup" {...props} options={options} />;
}

export function Subscript(
    props: ExtendedProps,
) {
    const key = props.key;
    delete props.key;
    return <Linkify key={key} as="sub" {...props} options={options} />;
}

export function Link(
    props: ExtendedProps,
) {
    const key = props.key;
    delete props.key;
    return (
        <a
            key={key}
            href={`//www.google.com/search?ie=UTF-8&btnI&q=${
                innerText(props.children)
            }`}
            className="text-blue-500 underline"
            {...props}
            target="_blank"
        />
    );
}

type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

export function Greentext(
    props: Optional<ExtendedProps, 'children'>,
) {
    const key = props.key;
    const children = props.children;
    delete props.key;
    delete props.children;
    return (
        <Linkify
            key={key}
            as="span"
            className="text-green-400-light dark:text-green-400"
            {...props}
            options={options}
        >
      &gt;{children}
        </Linkify>
    );
}

export function FakeCommand(
    props: Optional<ExtendedProps, 'children'>,
) {
    const key = props.key;
    const children = props.children;
    delete props.key;
    delete props.children;
    return (
        <Linkify key={key} as="span" {...props} options={options}>
            {children}
        </Linkify>
    );
}

// ``code here`` marks inline code
// ||text|| are spoilers
// **text** is bold
// __text__ is italic
// ~~text~~ is strikethrough
// ^^text^^ is superscript
// \\text\\ is subscript
// [[text]] is a link
// >text is greentext
// /me is an emote
