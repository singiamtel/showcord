import { roboto_mono } from '@/app/usercomponents';
import {HTMLAttributes} from 'react';

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

export function inlineCode( props: HTMLAttributes<HTMLSpanElement> & { children: string, key: number } ) {
  return <code className={ "text-gray-300 font-mono bg-gray-600 rounded p-0.5 " + roboto_mono.className } {...props} />;
}

export function spoiler( props: HTMLAttributes<HTMLSpanElement> & { children: string, key: number } ) {
  return <span className="bg-gray-700 text-gray-700 p-0.5 rounded hover:text-white" {...props} />;
}

export function bold( props: HTMLAttributes<HTMLSpanElement> & { children: string, key: number } ) {
  return <strong {...props} />;
}

export function italic( props: HTMLAttributes<HTMLSpanElement> & { children: string, key: number } ) {
  return <em {...props} />;
}

export function strikethrough( props: HTMLAttributes<HTMLSpanElement> & { children: string, key: number } ) {
  return <s {...props} />;
}

export function superscript( props: HTMLAttributes<HTMLSpanElement> & { children: string, key: number } ) {
  return <sup {...props} />;
}

export function subscript( props: HTMLAttributes<HTMLSpanElement> & { children: string, key: number } ) {
  return <sub {...props} />;
}

export function link( props: HTMLAttributes<HTMLSpanElement> & { children: string, key: number } ) {
  return <a href={props.children} className="text-blue-400 hover:underline" {...props} />;
}

export function greentext( props: HTMLAttributes<HTMLSpanElement> & { children: string, key: number } ) {
  return <span className="text-green-400" {...props} />;
}
