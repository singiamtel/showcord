import Linkify from 'linkify-react';
import { HTMLAttributes, useState } from 'react';
import manageURL from '../../utils/manageURL';
import innerText from 'react-innertext';
import { twMerge } from 'tailwind-merge';

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

export interface ExtendedProps extends HTMLAttributes<HTMLSpanElement> {
    children: string | JSX.Element;
    key?: number;
}

const options = {
    defaultProtocol: 'https',
    target: '_blank',
    attributes: {
        onClick: manageURL,
        className: 'text-blue-500 underline cursor-pointer',
    },
};

export function inlineCode(
    props: ExtendedProps,
) {
    const key = props.key;
    delete props.key;
    return (
        <code
            className={'font-mono bg-gray-601 dark:bg-gray-600 rounded p-1 '}
            {...props}
            key={key}
        />
    );
}

export function spoiler(
    props: ExtendedProps,
) {
    const key = props.key;
    const [visible, setVisible] = useState(false);
    delete props.key;
    return (
        <Linkify
            as="span"
            className={twMerge(
                'dark:bg-gray-700 dark:text-gray-700 p-0.5 rounded bg-gray-spoiler-light text-gray-spoiler-light ',
                visible ? 'text-black dark:text-white' : 'hover:cursor-pointer',
            )}
            {...props}
            key={key}
            options={options}
            onClick={() => {
                //set spoiler to visible
                setVisible(true);
            }}
        />
    );
}

export function bold(
    props: ExtendedProps,
) {
    const key = props.key;
    delete props.key;
    return <Linkify as="strong" {...props} key={key} options={options} />;
}

export function italic(
    props: ExtendedProps,
) {
    const key = props.key;
    delete props.key;
    return <Linkify as="em" {...props} key={key} options={options} />;
}

export function strikethrough(
    props: ExtendedProps,
) {
    const key = props.key;
    delete props.key;
    return <Linkify as="s" {...props} key={key} options={options} />;
}

export function superscript(
    props: ExtendedProps,
) {
    const key = props.key;
    delete props.key;
    return <Linkify as="sup" {...props} key={key} options={options} />;
}

export function subscript(
    props: ExtendedProps,
) {
    const key = props.key;
    delete props.key;
    return <Linkify as="sub" {...props} key={key} options={options} />;
}

export function link(
    props: ExtendedProps,
) {
    const key = props.key;
    delete props.key;
    return (
        <a
            href={`//www.google.com/search?ie=UTF-8&btnI&q=${
                innerText(props.children)
            }`}
            className="text-blue-500 underline"
            {...props}
            key={key}
            target="_blank"
        />
    );
}

type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

export function greentext(
    props: Optional<ExtendedProps, 'children'>,
) {
    const key = props.key;
    const children = props.children;
    delete props.key;
    delete props.children;
    return (
        <Linkify
            as="span"
            className="text-green-400-light dark:text-green-400"
            {...props}
            key={key}
            options={options}
        >
      &gt;{children}
        </Linkify>
    );
}

export function fakeCommand(
    props: Optional<ExtendedProps, 'children'>,
) {
    const key = props.key;
    const children = props.children;
    delete props.key;
    delete props.children;
    return (
        <Linkify as="span" {...props} key={key} options={options}>
            {children}
        </Linkify>
    );
}
